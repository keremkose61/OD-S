/* ========================================
   ODİS — Renk ve Tekrar Analiz Motoru (Status Engine)
   PDF Bölüm 3 & 4 Şartnamesi:
   - 🟢 YEŞİL: Normal Takip
   - 🟠 TURUNCU: Tekrarlayan Durum
   - 🔴 KIRMIZI: Yoğun Tekrar
   - İdari İşlem Sonrası Tekrar Kontrolü
   - Dinamik ve Özelleştirilebilir Eşikler
   ======================================== */

(function (window) {
  'use strict';

  // Varsayılan Eşik Değerleri (PDF Sayfa 4)
  const DEFAULT_THRESHOLDS = {
    greenMaxDays30: 2,         // Son 30 günde maks 2 kayıt
    orangeMinDays30: 3,        // Son 30 günde 3-5 kayıt
    orangeMaxDays30: 5,
    orangeSameCatDays: 14,     // Aynı kategorinin son 14 günde
    orangeSameCatCount: 3,     // 3 kez tekrarlanması
    redMinDays30: 6,           // Son 30 günde 6+ kayıt
    redSameCatDays: 30,        // Aynı kategorinin son 30 günde
    redSameCatCount: 5,        // 5+ tekrarı
    postAdminWindowDays: 30,   // İdari işlem sonrası izleme penceresi (gün)
  };

  const THRESHOLDS_STORAGE_KEY_PREFIX = 'odis_thresholds_';

  /**
   * Okula ait eşik ayarlarını getirir (Özelleştirilmemişse varsayılan döner)
   */
  function getThresholds(schoolId = (window.Auth && window.Auth.getCurrentSchoolId()) || 'default') {
    try {
      const raw = localStorage.getItem(`${THRESHOLDS_STORAGE_KEY_PREFIX}${schoolId}`);
      if (raw) {
        return { ...DEFAULT_THRESHOLDS, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('[StatusEngine] Eşik okuma hatası:', e);
    }
    return { ...DEFAULT_THRESHOLDS };
  }

  /**
   * Okula ait eşik ayarlarını günceller
   */
  async function saveThresholds(schoolId, newThresholds) {
    const sId = schoolId || (window.Auth && window.Auth.getCurrentSchoolId()) || 'default';
    const merged = { ...DEFAULT_THRESHOLDS, ...newThresholds };
    localStorage.setItem(`${THRESHOLDS_STORAGE_KEY_PREFIX}${sId}`, JSON.stringify(merged));

    if (window.Audit) {
      await window.Audit.log({
        action: 'UPDATE_THRESHOLDS',
        entityType: 'settings',
        entityId: sId,
        details: `ODİS tekrar analiz eşik değerleri güncellendi.`,
        schoolId: sId,
      });
    }

    return merged;
  }

  /**
   * Eşik ayarlarını fabrika ayarlarına sıfırlar
   */
  function resetThresholds(schoolId) {
    const sId = schoolId || (window.Auth && window.Auth.getCurrentSchoolId()) || 'default';
    localStorage.removeItem(`${THRESHOLDS_STORAGE_KEY_PREFIX}${sId}`);
    return { ...DEFAULT_THRESHOLDS };
  }

  /**
   * Verilen kayıtlar ve idari işlemler üzerinden öğrencinin durumunu hesaplar.
   * Yalnızca aktif eğitim yılının geçerli (iptal edilmemiş) kayıtlarını dikkate alır.
   * 
   * @param {Array} records - Öğrencinin aktif dönemdeki düzen kayıtları
   * @param {Array} adminActions - Öğrenciye ait idari işlemler
   * @param {Object} options - Özel eşikler veya referans tarihi
   * @returns {Object} Durum nesnesi (level, label, icon, reasons, isPostAdminRepeat vb.)
   */
  function calculateStatus(records = [], adminActions = [], options = {}) {
    const now = options.referenceDate ? new Date(options.referenceDate) : new Date();
    const thresholds = options.thresholds || getThresholds(options.schoolId);

    // Yalnızca geçerli (iptal edilmemiş) kayıtları dahil et
    const validRecords = records.filter(r => r && r.status !== 'cancelled');

    // Tarih filtreleri
    const msInDay = 86400000;
    const recordsWithAge = validRecords.map(r => {
      const rDate = new Date(r.dateTime);
      const daysAgo = Math.max(0, (now.getTime() - rDate.getTime()) / msInDay);
      return { ...r, _date: rDate, _daysAgo: daysAgo };
    });

    // Son 30 gün ve son 14 gün kayıtları
    const records30d = recordsWithAge.filter(r => r._daysAgo <= 30);
    const records14d = recordsWithAge.filter(r => r._daysAgo <= thresholds.orangeSameCatDays);

    // Kategori dağılımları
    const catCount30d = {};
    records30d.forEach(r => {
      catCount30d[r.category] = (catCount30d[r.category] || 0) + 1;
    });

    const catCount14d = {};
    records14d.forEach(r => {
      catCount14d[r.category] = (catCount14d[r.category] || 0) + 1;
    });

    // İdari değerlendirme noktası (Checkpoint) kontrolü
    let isPostAdminRepeat = false;
    let postAdminDetails = null;

    if (adminActions && adminActions.length > 0) {
      // En son idari işlemin tarihini bul
      const sortedActions = [...adminActions].sort((a, b) => new Date(b.date) - new Date(a.date));
      const latestAction = sortedActions[0];
      const latestActionDate = new Date(latestAction.date);

      // İdari işlemden sonra kaydedilen yeni düzen kayıtlarını bul
      const postActionRecords = recordsWithAge.filter(r => r._date > latestActionDate);

      if (postActionRecords.length > 0) {
        isPostAdminRepeat = true;
        const postCats = [...new Set(postActionRecords.map(r => {
          return (window.SeedData && window.SeedData.CATEGORY_LABELS[r.category]) || r.category;
        }))];
        postAdminDetails = `Son idari işlemden (${new Date(latestAction.date).toLocaleDateString('tr-TR')}) sonra ${postActionRecords.length} yeni kayıt girildi (${postCats.join(', ')}).`;
      }
    }

    const reasons = [];

    // 1. KIRMIZI KONTROLÜ (Yoğun Tekrar)
    let isRed = false;

    // Kural A: Son 30 günde 6+ kayıt
    if (records30d.length >= thresholds.redMinDays30) {
      isRed = true;
      reasons.push(`Son 30 günde toplam ${records30d.length} düzen kaydı (Eşik: ${thresholds.redMinDays30}+).`);
    }

    // Kural B: Aynı kategorinin son 30 günde 5+ tekrarı
    Object.entries(catCount30d).forEach(([cat, count]) => {
      if (count >= thresholds.redSameCatCount) {
        isRed = true;
        const catLabel = (window.SeedData && window.SeedData.CATEGORY_LABELS[cat]) || cat;
        reasons.push(`Son 30 günde "${catLabel}" kategorisinde ${count} tekrar (Eşik: ${thresholds.redSameCatCount}+).`);
      }
    });

    if (isRed) {
      if (isPostAdminRepeat && postAdminDetails) {
        reasons.push(`⚡ ${postAdminDetails}`);
      }
      return {
        level: 'red',
        label: 'Yoğun Tekrar',
        icon: '🔴',
        dotClass: 'status-dot-red',
        pillClass: 'status-pill-red',
        reasons,
        isPostAdminRepeat,
        postAdminDetails,
        counts: {
          last30Days: records30d.length,
          last14Days: records14d.length,
          byCategory30d: catCount30d,
          byCategory14d: catCount14d,
        },
      };
    }

    // 2. TURUNCU KONTROLÜ (Tekrarlayan Durum)
    let isOrange = false;

    // Kural A: Son 30 günde toplam 3–5 kayıt
    if (records30d.length >= thresholds.orangeMinDays30 && records30d.length <= thresholds.orangeMaxDays30) {
      isOrange = true;
      reasons.push(`Son 30 günde toplam ${records30d.length} kayıt (Eşik: ${thresholds.orangeMinDays30}–${thresholds.orangeMaxDays30}).`);
    }

    // Kural B: Aynı kategorinin son 14 günde 3 kez tekrarlanması
    Object.entries(catCount14d).forEach(([cat, count]) => {
      if (count >= thresholds.orangeSameCatCount) {
        isOrange = true;
        const catLabel = (window.SeedData && window.SeedData.CATEGORY_LABELS[cat]) || cat;
        reasons.push(`Son ${thresholds.orangeSameCatDays} günde "${catLabel}" kategorisinde ${count} tekrar (Eşik: ${thresholds.orangeSameCatCount}).`);
      }
    });

    if (isOrange) {
      if (isPostAdminRepeat && postAdminDetails) {
        reasons.push(`⚡ ${postAdminDetails}`);
      }
      return {
        level: 'orange',
        label: 'Tekrarlayan Durum',
        icon: '🟠',
        dotClass: 'status-dot-orange',
        pillClass: 'status-pill-orange',
        reasons,
        isPostAdminRepeat,
        postAdminDetails,
        counts: {
          last30Days: records30d.length,
          last14Days: records14d.length,
          byCategory30d: catCount30d,
          byCategory14d: catCount14d,
        },
      };
    }

    // 3. YEŞİL KONTROLÜ (Normal Takip)
    // Son 30 günde 0–2 kayıt ve kısa süreli yoğun tekrar olmaması
    if (records30d.length > 0) {
      reasons.push(`Son 30 günde ${records30d.length} kayıt (Normal takip aralığında).`);
    } else {
      reasons.push(`Aktif dönemde son 30 gün içinde düzen kaydı bulunmuyor.`);
    }

    if (isPostAdminRepeat && postAdminDetails) {
      reasons.push(`⚡ ${postAdminDetails}`);
    }

    return {
      level: 'green',
      label: 'Normal Takip',
      icon: '🟢',
      dotClass: 'status-dot-green',
      pillClass: 'status-pill-green',
      reasons,
      isPostAdminRepeat,
      postAdminDetails,
      counts: {
        last30Days: records30d.length,
        last14Days: records14d.length,
        byCategory30d: catCount30d,
        byCategory14d: catCount14d,
      },
    };
  }

  /**
   * HTML Durum Rozeti (Pill) Üretir
   */
  function renderStatusPill(statusObj, compact = false) {
    if (!statusObj) return '';
    const safeReasons = (statusObj.reasons || []).join(' • ');
    const postAdminTag = statusObj.isPostAdminRepeat
      ? `<span class="post-admin-badge" title="${window.UI ? window.UI.escapeHtml(statusObj.postAdminDetails || '') : ''}">⚡ İşlem Sonrası Tekrar</span>`
      : '';

    if (compact) {
      return `
        <span class="status-pill ${statusObj.pillClass}" title="${window.UI ? window.UI.escapeHtml(safeReasons) : ''}" onclick="window.StatusEngine && window.StatusEngine.showStatusModal && window.StatusEngine.showStatusModal('${statusObj.level}', '${(statusObj.reasons || []).map(r => encodeURIComponent(r)).join('||')}', ${Boolean(statusObj.isPostAdminRepeat)})">
          <span class="status-dot ${statusObj.dotClass}"></span>
          <span>${statusObj.label}</span>
        </span>
        ${postAdminTag}
      `;
    }

    return `
      <div style="display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap">
        <span class="status-pill ${statusObj.pillClass}" title="${window.UI ? window.UI.escapeHtml(safeReasons) : ''}" onclick="window.StatusEngine && window.StatusEngine.showStatusModal && window.StatusEngine.showStatusModal('${statusObj.level}', '${(statusObj.reasons || []).map(r => encodeURIComponent(r)).join('||')}', ${Boolean(statusObj.isPostAdminRepeat)})">
          <span class="status-dot ${statusObj.dotClass}"></span>
          <span>${statusObj.icon} ${statusObj.label}</span>
        </span>
        ${postAdminTag}
      </div>
    `;
  }

  /**
   * Durum Detay Modalı Gösterir
   */
  function showStatusModal(level, reasonsJoined, isPostAdmin) {
    const rawReasons = reasonsJoined ? reasonsJoined.split('||').map(r => decodeURIComponent(r)) : [];
    const colors = {
      green: { name: 'Normal Takip (Yeşil)', icon: '🟢', desc: 'Son 30 günde 0–2 kayıt ve kısa süreli yoğun tekrar bulunmaması.' },
      orange: { name: 'Tekrarlayan Durum (Turuncu)', icon: '🟠', desc: 'Son 30 günde 3–5 kayıt veya son 14 günde aynı kuralın 3 kez tekrarlanması.' },
      red: { name: 'Yoğun Tekrar (Kırmızı)', icon: '🔴', desc: 'Son 30 günde 6+ kayıt veya aynı kategorinin son 30 günde 5+ tekrarı.' },
    };
    const c = colors[level] || colors.green;

    const bodyHtml = `
      <div style="padding:var(--space-xs) 0">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:var(--space-md)">
          <span style="font-size:28px">${c.icon}</span>
          <div>
            <h4 style="font-size:1.1rem;font-weight:700;margin:0">${c.name}</h4>
            <p style="font-size:var(--font-xs);color:var(--text-secondary);margin:2px 0 0 0">${c.desc}</p>
          </div>
        </div>

        <div style="background:var(--bg-tertiary);border-radius:var(--radius-md);padding:var(--space-md);margin-bottom:var(--space-md)">
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;color:var(--text-muted);margin-bottom:6px">
            Tetkik ve Tetiklenme Nedenleri:
          </div>
          <ul style="margin:0;padding-left:18px;font-size:var(--font-sm);color:var(--text-primary);line-height:1.6">
            ${rawReasons.map(r => `<li>${window.UI ? window.UI.escapeHtml(r) : r}</li>`).join('')}
          </ul>
        </div>

        <div style="background:#eff6ff;border-left:4px solid #2563eb;padding:10px 14px;border-radius:0 var(--radius-md) var(--radius-md) 0;font-size:var(--font-xs);color:#1e40af">
          <strong>Önemli İlke (ODİS v1):</strong> Renk, öğrenciyi etiketlemez. Kırmızı renk otomatik disiplin veya sevk anlamına gelmez; yalnızca idareye karar desteği sağlar.
        </div>
      </div>
    `;

    if (window.UI && window.UI.showModal) {
      window.UI.showModal('ODİS Tekrar Analizi ve Durum İncelemesi', bodyHtml);
    }
  }

  // Public API
  window.StatusEngine = {
    DEFAULT_THRESHOLDS,
    getThresholds,
    saveThresholds,
    resetThresholds,
    calculateStatus,
    renderStatusPill,
    showStatusModal,
  };

})(typeof window !== 'undefined' ? window : globalThis);
