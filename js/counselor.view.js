/* ========================================
   ODİS v3 — Counselor View Module
   Rehberlik & Öğrenci Destek Portalı
   Gözlem bildirimleri, destek süreçleri,
   vaka takibi ve görüşme modalleri.
   ======================================== */

/**
 * SCREEN 8 — COUNSELOR DASHBOARD (Rehberlik Portalı)
 */
async function renderCounselorDashboard() {
  const app = document.getElementById('app');
  const screen = document.createElement('div');
  screen.className = 'screen active';
  screen.id = 'screen-counselor-dashboard';

  const user = Auth.getCurrentUser();
  if (!user || (user.role !== 'counselor' && user.role !== 'admin')) {
    UI.showToast('Yetkisiz erişim engellendi: Rehberlik paneline yalnızca yetkili personel erişebilir.', 'error');
    Router.navigate(Router.ROUTES.TEACHER_HOME);
    return;
  }
  const activeSchoolId = Auth.getCurrentSchoolId();
  const activeSchool = (window.Schools && window.Schools.DEFAULT_SCHOOLS)
    ? (window.Schools.DEFAULT_SCHOOLS.find(s => s.id === activeSchoolId) || window.Schools.DEFAULT_SCHOOLS[0])
    : { name: 'Kaşif Kalkavan Anadolu Lisesi', code: 'KKAL-34' };

  const [allObservations, activeSupportCases, allStudents] = await Promise.all([
    Observations.getRecentWithStudents(50),
    SupportCases.getActiveWithStudents(),
    Students.getAll(),
  ]);

  const studentMap = {};
  allStudents.forEach(s => studentMap[s.id] = s);

  // Unverified observations count
  const pendingObsCount = allObservations.filter(o => o.verificationStatus === 'reported' || o.verificationStatus === 'investigating').length;

  screen.innerHTML = `
    <div class="teacher-layout">
      <!-- Custom Counselor Header -->
      <div class="teacher-header" style="background:#4c1d95">
        <div class="header-left">
          <div class="brand-badge" onclick="Router.navigate(Router.ROUTES.COUNSELOR_DASHBOARD)">
            <img src="./icons/logo.svg" alt="${UI.escapeHtml(activeSchool.name)}" class="brand-logo-img">
            <div class="brand-text-block">
              <div class="brand-title">${UI.escapeHtml(activeSchool.name)}</div>
              <div class="brand-subtitle" style="color:#d8b4fe">Okul Psikolojik Danışmanlık ve Rehberlik Servisi</div>
            </div>
          </div>
        </div>

        <div class="header-right">
          <div class="user-profile-chip" style="background:rgba(255,255,255,0.15)">
            ${UI.renderAvatar({ firstName: 'Selin', lastName: 'Danışman', avatarColor: '#7c3aed' }, 'avatar-sm')}
            <span>${UI.escapeHtml(user?.displayName || 'Psikolojik Danışman')}</span>
            <button class="btn btn-ghost btn-sm" style="color:#ffffff;padding:4px" data-action="logout" title="Çıkış Yap">
              ${UI.Icons.logOut}
            </button>
          </div>
        </div>
      </div>

      <div class="teacher-content">
        <!-- Counselor Welcome Card -->
        <div class="hero-welcome-card" style="background:linear-gradient(135deg, #581c87 0%, #7c3aed 100%)">
          <div class="hero-welcome-content">
            <div class="hero-welcome-text">
              <h1>Rehberlik & Öğrenci Destek Portalı 📋</h1>
              <p>Öğretmenlerden ve idareden yönlendirilen disiplin ve davranış gözlemlerini inceleyin, öğrenci destek ve sevk süreçlerini yöneterek idari geri bildirimleri sağlayın.</p>
            </div>
            <div class="hero-stats-row">
              <div class="hero-stat-pill" style="background:rgba(255,255,255,0.18)">
                <span class="pill-num">${pendingObsCount}</span>
                <span class="pill-label">İncelenen Gözlem</span>
              </div>
              <div class="hero-stat-pill" style="background:rgba(255,255,255,0.18)">
                <span class="pill-num">${activeSupportCases.length}</span>
                <span class="pill-label">Aktif Destek Vakası</span>
              </div>
              <div class="hero-stat-pill" style="background:rgba(255,255,255,0.18)">
                <span class="pill-num">${allStudents.length}</span>
                <span class="pill-label">Öğrenci Havuzu</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Counselor Tabs -->
        <div class="tabs" id="counselor-tabs" style="margin-bottom:var(--space-xl)">
          <div class="tab-item active" data-tab="c-obs">📥 Gözlem Bildirimleri (${allObservations.length})</div>
          <div class="tab-item" data-tab="c-cases">📋 Açık Destek Süreçleri (${activeSupportCases.length})</div>
          <div class="tab-item" data-tab="c-students">👥 Öğrenci Listesi</div>
        </div>

        <!-- Tab 1: Observations -->
        <div class="tab-panel active" id="panel-c-obs">
          <div class="card">
            <div class="card-header">
              <span class="card-header-title">Öğretmen ve Veli Gözlem Bildirimleri</span>
              <span class="badge badge-purple">${pendingObsCount} İnceleme Bekliyor</span>
            </div>
            <div class="card-body" style="padding:0">
              <div class="table-container" style="border:none">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Tarih / Saat</th>
                      <th>Öğrenci</th>
                      <th>Sınıf</th>
                      <th>Konu</th>
                      <th>Bilgi Kaynağı</th>
                      <th>Doğrulama Durumu</th>
                      <th>Açıklama</th>
                      <th>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${allObservations.length > 0 ? allObservations.map(o => `
                      <tr>
                        <td style="white-space:nowrap;font-size:var(--font-xs)">${UI.formatDateTime(o.dateTime)}</td>
                        <td>
                          <strong style="color:var(--text-primary)">
                            ${o.student ? UI.escapeHtml(o.student.firstName + ' ' + o.student.lastName) : '—'}
                          </strong>
                        </td>
                        <td><span class="badge badge-neutral">${o.student ? UI.escapeHtml(o.student.class) : '—'}</span></td>
                        <td><span class="badge badge-purple">${UI.escapeHtml(SeedData.OBSERVATION_CATEGORY_LABELS[o.category] || o.category)}</span></td>
                        <td>${UI.getObservationSourceBadge(o.source)}</td>
                        <td>${UI.getVerificationBadge(o.verificationStatus)}</td>
                        <td style="max-width:260px" class="truncate" title="${UI.escapeHtml(o.description)}">${UI.escapeHtml(o.description)}</td>
                        <td>
                          <button class="btn btn-outline btn-sm" onclick="showUpdateObservationModal('${o.id}')">
                            İncele / Güncelle
                          </button>
                        </td>
                      </tr>
                    `).join('') : `
                      <tr><td colspan="8" style="text-align:center;padding:var(--space-xl);color:var(--text-muted)">Henüz gözlem bildirimi bulunmuyor.</td></tr>
                    `}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: Support Cases -->
        <div class="tab-panel" id="panel-c-cases">
          <div class="card">
            <div class="card-header">
              <span class="card-header-title">Aktif Destek ve Takip Süreçleri</span>
              <span class="badge badge-info">${activeSupportCases.length} Aktif Vaka</span>
            </div>
            <div class="card-body" style="padding:0">
              <div class="table-container" style="border:none">
                <table class="data-table">
                  <thead>
                    <tr>
                      <th>Öğrenci</th>
                      <th>Sınıf</th>
                      <th>Süreç Başlığı</th>
                      <th>Mevcut Durum</th>
                      <th>Son Güncelleme</th>
                      <th>Sorumlu</th>
                      <th>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${activeSupportCases.length > 0 ? activeSupportCases.map(c => `
                      <tr>
                        <td>
                          <div style="display:flex;align-items:center;gap:var(--space-xs)">
                            ${c.student ? UI.renderAvatar(c.student, 'avatar-sm') : ''}
                            <strong style="color:var(--text-primary)">${c.student ? UI.escapeHtml(c.student.firstName + ' ' + c.student.lastName) : '—'}</strong>
                          </div>
                        </td>
                        <td><span class="badge badge-neutral">${c.student ? UI.escapeHtml(c.student.class) : '—'}</span></td>
                        <td><strong>${UI.escapeHtml(c.title)}</strong></td>
                        <td>${UI.getSupportStatusBadge(c.status)}</td>
                        <td style="white-space:nowrap;font-size:var(--font-xs)">${UI.formatDate(c.updatedAt)}</td>
                        <td style="font-size:var(--font-xs)">${UI.escapeHtml(c.assignedTo)}</td>
                        <td>
                          <button class="btn btn-primary btn-sm" onclick="showUpdateSupportModal('${c.id}', '${c.studentId}')">
                            Görüşme Notu / Güncelle
                          </button>
                        </td>
                      </tr>
                    `).join('') : `
                      <tr><td colspan="7" style="text-align:center;padding:var(--space-xl);color:var(--text-muted)">Aktif destek süreci bulunmuyor.</td></tr>
                    `}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 3: Students -->
        <div class="tab-panel" id="panel-c-students">
          <div class="card">
            <div class="card-body">
              <div style="display:flex;flex-direction:column;gap:var(--space-xs)">
                ${allStudents.map(s => `
                  <div class="student-item" onclick="Router.navigate(Router.ROUTES.STUDENT_DETAIL, {id:'${s.id}'})">
                    ${UI.renderAvatar(s)}
                    <div class="student-info">
                      <div class="student-name">${UI.escapeHtml(s.firstName)} ${UI.escapeHtml(s.lastName)}</div>
                      <div class="student-meta">
                        <span>No: ${UI.escapeHtml(s.studentNo)}</span>
                        <span>•</span>
                        <span>Sınıf: ${UI.escapeHtml(s.class)}</span>
                      </div>
                    </div>
                    <div class="student-actions">
                      <button class="btn btn-outline btn-sm">Detay Gör ${UI.Icons.chevronRight}</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  app.innerHTML = '';
  app.appendChild(screen);

  document.querySelectorAll('[data-action="logout"]').forEach(el => {
    el.addEventListener('click', () => {
      Auth.logout();
      Router.navigate(Router.ROUTES.LOGIN);
      UI.showToast('Çıkış yapıldı.', 'info');
    });
  });

  // Tab switching
  document.querySelectorAll('#counselor-tabs .tab-item').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#counselor-tabs .tab-item').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('#panel-c-obs, #panel-c-cases, #panel-c-students').forEach(p => p.classList.remove('active'));
      document.getElementById(`panel-${tab.dataset.tab}`)?.classList.add('active');
    });
  });
}

/**
 * MODAL: Destek Sürecini Güncelle & Görüşme Notu Ekle (PDF Sayfa 7: İki Katmanlı Not ve Sonuçlandırma)
 */
function showUpdateSupportModal(caseId, studentId) {
  const bodyHtml = `
    <form id="support-modal-form">
      <div class="form-group">
        <label class="form-label">Süreç Durumu Güncelle</label>
        <select class="form-select" id="sup-status-select">
          ${Object.entries(SeedData.SUPPORT_STATUSES).map(([key, label]) => `
            <option value="${key}">${UI.escapeHtml(label)}</option>
          `).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Takip Tarihi (Planlanan Sonraki Görüşme)</label>
        <input type="date" class="form-input" id="sup-followup-date">
      </div>

      <div class="form-group">
        <label class="form-label" style="display:flex;align-items:center;gap:6px">
          <span>🔒 Özel Rehberlik Notu</span>
          <span class="badge badge-purple" style="font-size:10px">Yalnızca Rehberlik Görür</span>
        </label>
        <textarea class="form-textarea" id="sup-note-text" rows="3" placeholder="Öğrenci/veli görüşme detayları, psikolojik değerlendirme, ailevi durum (İdareye veya öğretmenlere gösterilmez, audit kütüğüne yazılmaz)..."></textarea>
      </div>

      <div class="form-group">
        <label class="form-label" style="display:flex;align-items:center;gap:6px">
          <span>📤 İdareye Sonuç Notu</span>
          <span class="badge badge-info" style="font-size:10px">İdare Tarafından Görülebilir</span>
        </label>
        <input type="text" class="form-input" id="sup-admin-result-note" placeholder="Örn: Öğrenciyle görüşüldü, takip edilmesi uygun görülmüştür.">
      </div>

      <div class="form-group">
        <label class="form-label">İdari Değerlendirme Önerisi (İsteğe bağlı)</label>
        <input type="text" class="form-input" id="sup-recommendation" placeholder="Örn: Veli ile okul idaresinin iletişime geçmesi faydalı olacaktır.">
      </div>
    </form>
  `;

  const footerHtml = `
    <button class="btn btn-outline" onclick="UI.closeModal()">İptal</button>
    <button class="btn btn-primary" id="btn-save-support-case">${UI.Icons.check} Güncelle ve Kaydet</button>
  `;

  UI.showModal('Rehberlik Sürecini Güncelle & Sonuçlandır', bodyHtml, footerHtml);

  document.getElementById('btn-save-support-case')?.addEventListener('click', async () => {
    const status = document.getElementById('sup-status-select').value;
    const note = document.getElementById('sup-note-text').value.trim();
    const adminResultNote = document.getElementById('sup-admin-result-note')?.value.trim();
    const followUpDate = document.getElementById('sup-followup-date')?.value;
    const recommendation = document.getElementById('sup-recommendation')?.value.trim();

    try {
      await SupportCases.updateStatus(caseId, status, note, {
        adminResultNote,
        followUpDate,
        recommendation,
      });
      UI.closeModal();
      UI.showToast('Rehberlik süreci başarıyla güncellendi.', 'success');
      if (Auth.getCurrentUser()?.role === 'counselor') {
        renderCounselorDashboard();
      } else {
        Router.navigate(Router.ROUTES.STUDENT_DETAIL, { id: studentId });
      }
    } catch (err) {
      console.error(err);
      UI.showToast('Güncellenirken hata oluştu.', 'error');
    }
  });
}

/**
 * MODAL: Yeni Rehberlik Süreci Başlat
 */
function showNewSupportCaseModal(studentId) {
  const bodyHtml = `
    <form id="new-case-form">
      <div class="form-group">
        <label class="form-label">Süreç Başlığı <span style="color:var(--danger)">*</span></label>
        <input type="text" class="form-input" id="case-title" placeholder="Örn: Akran iletişimi ve sosyal uyum takibi" required>
      </div>
      <div class="form-group">
        <label class="form-label">Başlangıç Durumu</label>
        <select class="form-select" id="case-status">
          ${Object.entries(SeedData.SUPPORT_STATUSES).map(([key, label]) => `
            <option value="${key}">${UI.escapeHtml(label)}</option>
          `).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">İlk Değerlendirme Notu</label>
        <textarea class="form-textarea" id="case-notes" rows="3" placeholder="Sürecin başlatılma gerekçesi ve planlanan adımlar..."></textarea>
      </div>
    </form>
  `;

  const footerHtml = `
    <button class="btn btn-outline" onclick="UI.closeModal()">İptal</button>
    <button class="btn btn-primary" id="btn-create-case">${UI.Icons.check} Süreci Başlat</button>
  `;

  UI.showModal('Yeni Rehberlik Süreci Başlat', bodyHtml, footerHtml);

  document.getElementById('btn-create-case')?.addEventListener('click', async () => {
    const title = document.getElementById('case-title').value.trim();
    if (!title) {
      UI.showToast('Lütfen süreç başlığı girin.', 'warning');
      return;
    }

    try {
      await SupportCases.create({
        studentId,
        title,
        status: document.getElementById('case-status').value,
        notes: document.getElementById('case-notes').value.trim(),
        assignedTo: Auth.getDisplayName(),
      });

      UI.closeModal();
      UI.showToast('Rehberlik süreci başlatıldı.', 'success');
      Router.navigate(Router.ROUTES.STUDENT_DETAIL, { id: studentId });
    } catch (err) {
      console.error(err);
      UI.showToast('Süreç başlatılamadı.', 'error');
    }
  });
}

/**
 * MODAL: Gözlem Doğrulama Durumu Güncelle
 */
function showUpdateObservationModal(observationId) {
  const bodyHtml = `
    <form id="obs-modal-form">
      <div class="form-group">
        <label class="form-label">Doğrulama Durumu</label>
        <select class="form-select" id="obs-ver-select">
          ${Object.entries(SeedData.VERIFICATION_STATUSES).map(([key, label]) => `
            <option value="${key}">${UI.escapeHtml(label)}</option>
          `).join('')}
        </select>
        <p style="font-size:var(--font-xs);color:var(--text-muted);margin-top:4px">
          Bildirilen durum incelendiğinde doğrudan gözleme dönüştürülebilir ya da doğrulandı olarak işaretlenebilir.
        </p>
      </div>
    </form>
  `;

  const footerHtml = `
    <button class="btn btn-outline" onclick="UI.closeModal()">İptal</button>
    <button class="btn btn-primary" id="btn-save-obs-ver">${UI.Icons.check} Durumu Kaydet</button>
  `;

  UI.showModal('Gözlem Doğrulama Durumu', bodyHtml, footerHtml);

  document.getElementById('btn-save-obs-ver')?.addEventListener('click', async () => {
    const newStatus = document.getElementById('obs-ver-select').value;
    try {
      await Observations.updateVerification(observationId, newStatus);
      UI.closeModal();
      if (Auth.getCurrentUser()?.role === 'counselor') {
        renderCounselorDashboard();
      } else {
        const body = document.getElementById('admin-body');
        if (body && typeof adminActiveSection !== 'undefined') await renderAdminSection(adminActiveSection);
      }
    } catch (err) {
      console.error(err);
      UI.showToast('Güncelleme yapılamadı.', 'error');
    }
  });
}

// Global Exports
window.renderCounselorDashboard = renderCounselorDashboard;
window.showUpdateSupportModal = showUpdateSupportModal;
window.showNewSupportCaseModal = showNewSupportCaseModal;
window.showUpdateObservationModal = showUpdateObservationModal;
