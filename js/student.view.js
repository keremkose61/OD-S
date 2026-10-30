/* ========================================
   ODİS v3 — Student View Module
   Öğrenci Arama, Öğrenci Kartı ve
   Çok Sekmeli Öğrenci Detay İnceleme.
   ======================================== */

/* ============================================================
   SCREEN 3 — STUDENT SEARCH
   ============================================================ */

async function renderStudentSearch() {
  const app = document.getElementById('app');
  const screen = document.createElement('div');
  screen.className = 'screen active';
  screen.id = 'screen-student-search';

  const classes = await Students.getClasses();
  const classOptions = classes.map(c => `<option value="${c}">${c}</option>`).join('');

  screen.innerHTML = `
    <div class="teacher-layout">
      ${createTeacherLayout('Öğrenci Ara', `
        <div class="section">
          <div class="search-box" style="margin-bottom:var(--space-md)">
            <span class="search-icon">${UI.Icons.search}</span>
            <input type="text" class="form-input" id="student-search-input" placeholder="Ad, soyad veya öğrenci numarası...">
            <button class="search-clear" id="student-search-clear">${UI.Icons.x}</button>
          </div>

          <div class="filters-bar">
            <span style="font-size:var(--font-sm);color:var(--text-muted)">${UI.Icons.filter} Sınıf Filtresi:</span>
            <select class="form-select" id="class-filter" style="width:auto;padding:var(--space-xxs) var(--space-lg) var(--space-xxs) var(--space-sm);border-radius:var(--radius-full);font-size:var(--font-sm)">
              <option value="">Tüm Sınıflar</option>
              ${classOptions}
            </select>
          </div>

          <div id="student-search-results" style="display:flex;flex-direction:column;gap:var(--space-xs);margin-top:var(--space-md)">
          </div>
        </div>
      `, 'search')}
    </div>
  `;

  app.innerHTML = '';
  app.appendChild(screen);
  setupTeacherLayoutEvents();

  await loadStudentSearchResults();

  const searchInput = document.getElementById('student-search-input');
  const clearBtn = document.getElementById('student-search-clear');
  const classFilter = document.getElementById('class-filter');
  let searchTimeout;

  function triggerSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(loadStudentSearchResults, 300);
  }

  searchInput?.addEventListener('input', () => {
    clearBtn?.classList.toggle('visible', searchInput.value.length > 0);
    triggerSearch();
  });

  clearBtn?.addEventListener('click', () => {
    if (searchInput) searchInput.value = '';
    clearBtn.classList.remove('visible');
    triggerSearch();
  });

  classFilter?.addEventListener('change', triggerSearch);
}

async function loadStudentSearchResults() {
  const container = document.getElementById('student-search-results');
  if (!container) return;

  const query = document.getElementById('student-search-input')?.value || '';
  const classFilter = document.getElementById('class-filter')?.value || '';

  const results = await Students.search(query, classFilter);
  const allWithCounts = await Students.getWithCounts();
  const countMap = {};
  allWithCounts.forEach(s => countMap[s.id] = s.recordCount);

  if (results.length === 0) {
    UI.showEmptyState(container, 'Sonuç bulunamadı', 'Arama kriterlerinizi değiştirmeyi deneyin.');
    return;
  }

  container.innerHTML = results.map(s => {
    const sStatus = s.status || (window.StatusEngine ? window.StatusEngine.calculateStatus([], []) : null);
    const statusPillHtml = sStatus && window.StatusEngine ? window.StatusEngine.renderStatusPill(sStatus, true) : '';

    return `
      <div class="student-item" onclick="Router.navigate(Router.ROUTES.STUDENT_CARD, {id:'${s.id}'})">
        ${UI.renderAvatar(s)}
        <div class="student-info">
          <div class="student-name">${UI.escapeHtml(s.firstName)} ${UI.escapeHtml(s.lastName)}</div>
          <div class="student-meta">
            <span>${UI.escapeHtml(s.studentNo)}</span>
            <span>•</span>
            <span>${UI.escapeHtml(s.class)}</span>
          </div>
        </div>
        <div class="student-actions" style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          ${statusPillHtml}
          ${UI.getRecordBadge(countMap[s.id] || 0)}
          <span style="color:var(--text-muted)">${UI.Icons.chevronRight}</span>
        </div>
      </div>
    `;
  }).join('');
}

/* ============================================================

   SCREEN 4 — STUDENT CARD (v2: Düzen, Gözlemler ve Destek Durumu)
   ============================================================ */

async function renderStudentCard(studentId, selectedYearId = null) {
  const app = document.getElementById('app');
  const screen = document.createElement('div');
  screen.className = 'screen active';
  screen.id = 'screen-student-card';

  if (!studentId) {
    screen.innerHTML = '<div class="teacher-layout">' +
      createTeacherLayout('Öğrenci', '<div class="empty-state"><h3 class="empty-title">Öğrenci bulunamadı</h3></div>') +
      '</div>';
    app.innerHTML = '';
    app.appendChild(screen);
    return;
  }

  const activeSchoolId = Auth.getCurrentSchoolId();
  const allYears = window.AcademicYears ? await window.AcademicYears.getAll(activeSchoolId) : [];
  const activeYear = window.AcademicYears ? await window.AcademicYears.getActiveYear(activeSchoolId) : null;
  const currentYearId = selectedYearId !== null ? selectedYearId : (activeYear ? activeYear.id : null);

  const student = await Students.getWithStats(studentId, currentYearId);
  if (!student) {
    screen.innerHTML = '<div class="teacher-layout">' +
      createTeacherLayout('Öğrenci', '<div class="empty-state"><h3 class="empty-title">Öğrenci bulunamadı</h3></div>') +
      '</div>';
    app.innerHTML = '';
    app.appendChild(screen);
    return;
  }

  if (Students.addToRecentlyViewed) {
    Students.addToRecentlyViewed(student);
  }

  const selectedYearObj = allYears.find(y => y.id === currentYearId);
  const selectedYearName = currentYearId === 'all'
    ? 'Tüm Yıllar (Arşiv Dahil)'
    : (selectedYearObj ? selectedYearObj.code : (activeYear?.code || 'Aktif Dönem'));
  const isViewingActiveYear = (currentYearId === activeYear?.id);
  const hasPastRecords = Boolean(student.pastRecords && student.pastRecords.length > 0);

  // Category badges for order records
  const categoryBadges = Object.entries(student.stats?.categoryDist || {})
    .filter(([, count]) => count > 0)
    .map(([cat, count]) => `<span class="category-badge" data-cat="${cat}">${UI.escapeHtml((SeedData.CATEGORY_LABELS && SeedData.CATEGORY_LABELS[cat]) || cat)} (${count})</span>`)
    .join('');

  // Order records timeline
  const orderRecordsHtml = student.records.length > 0
    ? student.records.map(r => {
        const yr = allYears.find(y => y.id === r.academicYearId);
        const isFromOtherYear = (r.academicYearId !== activeYear?.id);
        const yrBadge = (currentYearId === 'all' || isFromOtherYear)
          ? `<span class="badge" style="background:#f1f5f9;color:#475569;font-size:11px;margin-left:4px">📅 ${yr ? yr.code : 'Arşiv'}</span>`
          : '';
        const isCancelled = (r.status === 'cancelled');
        const isCancellationRequested = (r.status === 'cancellation_requested');
        const statusBadge = isCancelled
          ? `<span class="badge badge-cancelled" title="İptal Gerekçesi: ${UI.escapeHtml(r.cancellationApproval?.notes || r.cancellationRequest?.reason || '')}">🚫 İPTAL EDİLDİ</span>`
          : (isCancellationRequested
            ? `<span class="badge badge-cancellation-requested" title="İptal Talebi Beklemede: ${UI.escapeHtml(r.cancellationRequest?.reason || '')}">⏳ İptal Talebi İnceleniyor</span>`
            : '');
        const reportBtn = (!isCancelled && !isCancellationRequested)
          ? `<button type="button" class="btn btn-ghost btn-sm" style="font-size:11px;padding:2px 8px;color:var(--text-muted)" onclick="window.showReportIncorrectRecordModal('${r.id}', '${student.id}')" title="Hatalı Kayıt Bildir">⚠ Hatalı Kayıt Bildir</button>`
          : '';
        return `
          <div class="timeline-item" style="${isCancelled ? 'opacity:0.6;background:#fafafa;' : ''}">
            <div class="timeline-date">${UI.formatDateTime(r.dateTime)}</div>
            <div class="timeline-content">
              <div class="timeline-category" style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
                ${UI.getCategoryBadge(r.category)}
                ${yrBadge}
                ${statusBadge}
                <div style="margin-left:auto">${reportBtn}</div>
              </div>
              <div class="timeline-desc" style="${isCancelled ? 'text-decoration:line-through;color:var(--text-muted);' : ''}">${UI.escapeHtml(r.description || 'Açıklama belirtilmedi.')}</div>
              ${isCancelled && r.cancellationRequest ? `
                <div style="font-size:11px;color:#b91c1c;margin-top:2px">
                  İptal Nedeni: ${UI.escapeHtml(r.cancellationRequest.reason)} (${UI.escapeHtml(r.cancellationApproval?.approvedBy || 'İdare')} tarafından onaylandı)
                </div>
              ` : ''}
              <div class="timeline-author">${UI.Icons.user} ${UI.escapeHtml(r.createdBy)}</div>
            </div>
          </div>
        `;
      }).join('')
    : `<div class="empty-state" style="padding:var(--space-lg);background:var(--bg-tertiary);border-radius:var(--radius-md);text-align:center">
        <div class="empty-icon" style="font-size:28px;margin-bottom:var(--space-xs)">✨</div>
        <h4 style="font-weight:700;color:var(--text-primary);margin-bottom:4px">
          ${selectedYearName} Döneminde Aktif Düzen Kaydı Yok
        </h4>
        <p class="empty-desc" style="color:var(--text-secondary);font-size:var(--font-sm);margin-bottom:${hasPastRecords && isViewingActiveYear ? 'var(--space-md)' : '0'}">
          ${isViewingActiveYear
            ? `Bu öğrencinin ${selectedYearName} aktif eğitim yılında henüz bir düzen kaydı bulunmamaktadır. Yeni yıl disiplin kayıtları boştur.`
            : `Seçilen dönemde (${selectedYearName}) kayıt bulunmuyor.`}
        </p>
        ${hasPastRecords && isViewingActiveYear ? `
          <button class="btn btn-outline btn-sm" id="btn-jump-to-archive" style="border-color:var(--accent);color:var(--accent);font-weight:600">
            📁 Geçmiş Yıl Kayıtlarına Eriş (${student.stats.pastRecordsCount} Kayıt)
          </button>
        ` : ''}
       </div>`;

  // Observations list
  const observationsHtml = student.observations.length > 0
    ? student.observations.map(obs => `
        <div class="card" style="margin-bottom:var(--space-sm);border-left:4px solid #7c3aed">
          <div class="card-body" style="padding:var(--space-md)">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:var(--space-xs);flex-wrap:wrap;gap:var(--space-xs)">
              <div style="font-weight:700;color:var(--text-primary);font-size:var(--font-sm)">
                ${UI.escapeHtml(SeedData.OBSERVATION_CATEGORY_LABELS[obs.category] || obs.category)}
              </div>
              <div style="display:flex;gap:4px">
                ${UI.getObservationSourceBadge(obs.source)}
                ${UI.getVerificationBadge(obs.verificationStatus)}
              </div>
            </div>
            <p style="font-size:var(--font-sm);color:var(--text-secondary);margin-bottom:var(--space-xs)">${UI.escapeHtml(obs.description)}</p>
            <div style="font-size:11px;color:var(--text-muted);display:flex;justify-content:space-between">
              <span>📍 ${UI.escapeHtml(obs.location || 'Okul')} • 🕒 ${UI.formatDateTime(obs.dateTime)}</span>
              <span>👤 ${UI.escapeHtml(obs.createdBy)}</span>
            </div>
          </div>
        </div>
      `).join('')
    : `<div class="empty-state" style="padding:var(--space-md);background:var(--bg-tertiary)">
        <p class="empty-desc">Öğrenciye ait kayıtlı gözlem bildirimi bulunmuyor.</p>
       </div>`;

  // Support cases overview (Section 4: Strict Privacy Boundaries)
  const isCounselor = Auth.canViewPrivateCounselingNotes();
  const supportHtml = student.supportCases.length > 0
    ? student.supportCases.map(sc => `
        <div class="card" style="margin-bottom:var(--space-sm);border-left:4px solid #0891b2">
          <div class="card-body" style="padding:var(--space-md)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xs)">
              <strong>${UI.escapeHtml(sc.title)}</strong>
              ${UI.getSupportStatusBadge(sc.status)}
            </div>
            ${isCounselor
              ? `<p style="font-size:var(--font-sm);color:var(--text-secondary);white-space:pre-line">${UI.escapeHtml(sc.notes)}</p>`
              : `<div style="background:var(--bg-tertiary);border-radius:var(--radius-md);padding:var(--space-sm) var(--space-md);font-size:var(--font-xs);color:var(--text-secondary);display:flex;align-items:center;gap:var(--space-xs);margin-top:var(--space-xs);border:1px dashed var(--border-color)">
                  <span style="font-size:14px">🔒</span>
                  <span>Özel rehberlik görüşme detayları ve değerlendirmeler KVKK ve mesleki gizlilik uyarınca yalnızca Rehberlik Servisi yetkililerine açıktır.</span>
                </div>`
            }
            <div style="font-size:11px;color:var(--text-muted);margin-top:var(--space-xs)">
              Sorumlu: ${UI.escapeHtml(sc.assignedTo)} • Son Güncelleme: ${UI.formatDate(sc.updatedAt)}
            </div>
          </div>
        </div>
      `).join('')
    : `<div class="empty-state" style="padding:var(--space-md);background:var(--bg-tertiary)">
        <p class="empty-desc">Aktif rehberlik süreci bulunmuyor.</p>
       </div>`;

  screen.innerHTML = `
    <div class="teacher-layout">
      ${createTeacherLayout('Öğrenci Kartı', `
        <div class="back-button" onclick="history.back()">
          ${UI.Icons.chevronLeft} Geri
        </div>

        <!-- Student Header -->
        <div class="student-header-card" style="margin-bottom:var(--space-md)">
          ${UI.renderAvatar(student, 'avatar-xl')}
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
              <h2 class="student-detail-name" style="margin:0">${UI.escapeHtml(student.firstName)} ${UI.escapeHtml(student.lastName)}</h2>
              ${student.status && window.StatusEngine ? window.StatusEngine.renderStatusPill(student.status) : ''}
            </div>
            <div class="student-detail-meta" style="margin-top:4px">
              <span>${UI.Icons.hash} ${UI.escapeHtml(student.studentNo)}</span>
              <span>${UI.Icons.users} ${UI.escapeHtml(student.class)}</span>
            </div>
          </div>
        </div>

        ${student.status && (student.status.level !== 'green' || student.status.isPostAdminRepeat) ? `
          <div class="card" style="margin-bottom:var(--space-md);border-left:4px solid ${student.status.level === 'red' ? '#ef4444' : '#f97316'};background:#ffffff">
            <div class="card-body" style="padding:var(--space-sm) var(--space-md);display:flex;align-items:flex-start;gap:10px">
              <span style="font-size:22px">${student.status.icon}</span>
              <div style="flex:1">
                <div style="font-weight:700;font-size:var(--font-sm);color:var(--text-primary)">
                  ${student.status.label} (${selectedYearName})
                </div>
                <div style="font-size:var(--font-xs);color:var(--text-secondary);margin-top:2px;line-height:1.5">
                  ${(student.status.reasons || []).join(' • ')}
                </div>
                ${student.status.isPostAdminRepeat && student.status.postAdminDetails ? `
                  <div style="font-size:var(--font-xs);color:#b45309;font-weight:600;margin-top:4px">
                    ⚡ ${UI.escapeHtml(student.status.postAdminDetails)}
                  </div>
                ` : ''}
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Academic Year Bar & Past Records Access -->
        <div class="card" style="margin-bottom:var(--space-md);background:var(--bg-secondary);border:1px solid var(--border-color)">
          <div class="card-body" style="padding:var(--space-sm) var(--space-md);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--space-sm)">
            <div style="display:flex;align-items:center;gap:var(--space-xs);font-size:var(--font-sm)">
              <span style="font-weight:700;color:var(--text-secondary)">📅 Eğitim Yılı:</span>
              <select id="student-card-year-select" class="form-select form-select-sm" style="font-weight:700;padding:4px 10px;width:auto">
                ${allYears.map(y => `
                  <option value="${y.id}" ${y.id === currentYearId ? 'selected' : ''}>
                    ${UI.escapeHtml(y.code)} ${y.isCurrent ? '(Aktif Yıl)' : '(Arşiv)'}
                  </option>
                `).join('')}
                <option value="all" ${currentYearId === 'all' ? 'selected' : ''}>Tüm Yıllar (Arşiv Dahil)</option>
              </select>
            </div>
            ${hasPastRecords && isViewingActiveYear ? `
              <button class="btn btn-ghost btn-sm" id="btn-quick-archive-badge" style="color:var(--accent);font-weight:600;font-size:var(--font-xs);padding:4px 8px;background:var(--bg-tertiary);border-radius:var(--radius-full)">
                📁 Geçmiş Dönem Kayıtları (${student.stats.pastRecordsCount} Kayıt)
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Objective Mini Stats (v2: No danger badges) -->
        <div class="mini-stats">
          <div class="mini-stat">
            <div class="mini-stat-value" style="color:var(--accent)">${student.stats.totalRecords}</div>
            <div class="mini-stat-label">Düzen Kaydı ${isViewingActiveYear ? `(Aktif: ${selectedYearName})` : `(${selectedYearName})`}</div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat-value" style="color:#7c3aed">${student.stats.totalObservations}</div>
            <div class="mini-stat-label">Gözlem Bildirimi</div>
          </div>
          <div class="mini-stat">
            <div class="mini-stat-value" style="color:#0891b2">${student.stats.activeSupportCount}</div>
            <div class="mini-stat-label">Aktif Destek Takibi</div>
          </div>
        </div>

        <!-- Actions Row -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-sm);margin-bottom:var(--space-xl)">
          <button class="btn btn-primary btn-lg" onclick="Router.navigate(Router.ROUTES.NEW_RECORD, {id:'${student.id}'})">
            ${UI.Icons.plus} Düzen Kaydı Ekle
          </button>
          <button class="btn btn-outline btn-lg" style="border-color:#7c3aed;color:#7c3aed" onclick="Router.navigate(Router.ROUTES.NEW_OBSERVATION, {id:'${student.id}'})">
            ${UI.Icons.messageSquare} Gözlem Bildir
          </button>
        </div>

        <!-- Sub Tabs for 3 Pillars -->
        <div class="tabs" id="student-card-tabs" style="margin-bottom:var(--space-md)">
          <div class="tab-item active" data-tab="tab-orders">Okul Düzeni (${student.records.length})</div>
          <div class="tab-item" data-tab="tab-obs">Gözlemler (${student.observations.length})</div>
          <div class="tab-item" data-tab="tab-support">Destek / Rehberlik (${student.supportCases.length})</div>
        </div>

        <div class="tab-panel active" id="panel-tab-orders">
          ${categoryBadges ? `
            <div style="margin-bottom:var(--space-md)">
              <div class="category-distribution">${categoryBadges}</div>
            </div>
          ` : ''}
          <div class="timeline">${orderRecordsHtml}</div>
        </div>

        <div class="tab-panel" id="panel-tab-obs">
          ${observationsHtml}
        </div>

        <div class="tab-panel" id="panel-tab-support">
          ${supportHtml}
        </div>
      `)}
    </div>
  `;

  app.innerHTML = '';
  app.appendChild(screen);
  setupTeacherLayoutEvents();

  // Academic year change & archive jump events
  document.getElementById('student-card-year-select')?.addEventListener('change', (e) => {
    renderStudentCard(studentId, e.target.value);
  });

  const goToArchive = () => {
    const pastYear = student.pastRecords[0]?.academicYearId || (allYears.find(y => y.id !== activeYear?.id)?.id) || 'all';
    renderStudentCard(studentId, pastYear);
  };
  document.getElementById('btn-jump-to-archive')?.addEventListener('click', goToArchive);
  document.getElementById('btn-quick-archive-badge')?.addEventListener('click', goToArchive);

  // Sub tabs switching
  document.querySelectorAll('#student-card-tabs .tab-item').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#student-card-tabs .tab-item').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('#panel-tab-orders, #panel-tab-obs, #panel-tab-support').forEach(p => p.classList.remove('active'));
      document.getElementById(`panel-${tab.dataset.tab}`)?.classList.add('active');
    });
  });
}

/* ============================================================

   SCREEN 11 — STUDENT DETAIL (Modüler ve Çok Sekmeli İnceleme)
   ============================================================ */

async function renderStudentDetail(studentId, selectedYearId = null) {
  const app = document.getElementById('app');
  const screen = document.createElement('div');
  screen.className = 'screen active';
  screen.id = 'screen-student-detail';

  const activeSchool = await Schools.getActiveSchool();
  const activeSchoolId = activeSchool?.id || Auth.getCurrentSchoolId();
  const allYears = window.AcademicYears ? await window.AcademicYears.getAll(activeSchoolId) : [];
  const activeYear = window.AcademicYears ? await window.AcademicYears.getActiveYear(activeSchoolId) : null;
  const currentYearId = selectedYearId !== null ? selectedYearId : (activeYear ? activeYear.id : null);

  const student = studentId ? await Students.getWithStats(studentId, currentYearId) : null;

  if (!student) {
    screen.innerHTML = '<div class="admin-layout"><main class="admin-main"><div class="empty-state"><h3>Öğrenci bulunamadı</h3></div></main></div>';
    app.innerHTML = '';
    app.appendChild(screen);
    return;
  }

  const selectedYearObj = allYears.find(y => y.id === currentYearId);
  const selectedYearName = currentYearId === 'all'
    ? 'Tüm Yıllar (Arşiv Dahil)'
    : (selectedYearObj ? selectedYearObj.code : (activeYear?.code || 'Aktif Dönem'));
  const isViewingActiveYear = (currentYearId === activeYear?.id);
  const hasPastRecords = Boolean(student.pastRecords && student.pastRecords.length > 0);

  const user = Auth.getCurrentUser();
  const isAdmin = user?.role === 'admin';
  const isCounselor = user?.role === 'counselor';

  const categoryBadges = Object.entries(student.stats.categoryDist)
    .filter(([, count]) => count > 0)
    .map(([cat, count]) => `<span class="category-badge" data-cat="${cat}">${UI.escapeHtml(SeedData.CATEGORY_LABELS[cat])} (${count})</span>`)
    .join('') || '<span style="color:var(--text-muted);font-size:var(--font-sm)">Kayıt yok</span>';

  const bodyContent = `
    <div class="back-button" onclick="history.back()">
      ${UI.Icons.chevronLeft} Geri
    </div>

    <!-- Student Header -->
    <div class="student-header-card" style="margin-bottom:var(--space-md)">
      ${UI.renderAvatar(student, 'avatar-xl')}
      <div>
        <h2 class="student-detail-name">${UI.escapeHtml(student.firstName)} ${UI.escapeHtml(student.lastName)}</h2>
        <div class="student-detail-meta">
          <span>${UI.Icons.hash} ${UI.escapeHtml(student.studentNo)}</span>
          <span>${UI.Icons.users} ${UI.escapeHtml(student.class)}</span>
        </div>
      </div>
    </div>

    <!-- Academic Year Selector & Archive Bar -->
    <div class="card" style="margin-bottom:var(--space-md);background:var(--bg-secondary);border:1px solid var(--border-color)">
      <div class="card-body" style="padding:var(--space-sm) var(--space-md);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:var(--space-sm)">
        <div style="display:flex;align-items:center;gap:var(--space-xs);font-size:var(--font-sm)">
          <span style="font-weight:700;color:var(--text-secondary)">📅 Eğitim-Öğretim Yılı:</span>
          <select id="student-detail-year-select" class="form-select form-select-sm" style="font-weight:700;padding:4px 10px;width:auto">
            ${allYears.map(y => `
              <option value="${y.id}" ${y.id === currentYearId ? 'selected' : ''}>
                ${UI.escapeHtml(y.code)} ${y.isCurrent ? '(Aktif Yıl)' : '(Arşiv)'}
              </option>
            `).join('')}
            <option value="all" ${currentYearId === 'all' ? 'selected' : ''}>Tüm Yıllar (Arşiv Dahil)</option>
          </select>
        </div>
        ${hasPastRecords && isViewingActiveYear ? `
          <button class="btn btn-ghost btn-sm" id="btn-detail-quick-archive" style="color:var(--accent);font-weight:600;font-size:var(--font-xs);padding:4px 8px;background:var(--bg-tertiary);border-radius:var(--radius-full)">
            📁 Geçmiş Dönem Kayıtları (${student.stats.pastRecordsCount} Kayıt)
          </button>
        ` : ''}
      </div>
    </div>

    <!-- 5 Modular Tabs -->
    <div class="tabs" id="detail-tabs">
      <div class="tab-item active" data-tab="general">Genel Özet</div>
      <div class="tab-item" data-tab="orders">Okul Düzeni (${student.records.length})</div>
      <div class="tab-item" data-tab="observations">Gözlemler (${student.observations.length})</div>
      <div class="tab-item" data-tab="support">Destek & Rehberlik (${student.supportCases.length})</div>
      <div class="tab-item" data-tab="actions">İdari İşlemler (${student.actions.length})</div>
    </div>

    <!-- Tab 1: General -->
    <div class="tab-panel active" id="panel-general">
      <div class="mini-stats" style="margin-bottom:var(--space-lg)">
        <div class="mini-stat">
          <div class="mini-stat-value" style="color:var(--accent)">${student.stats.totalRecords}</div>
          <div class="mini-stat-label">Düzen Kaydı ${isViewingActiveYear ? `(Aktif: ${selectedYearName})` : `(${selectedYearName})`}</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-value" style="color:#7c3aed">${student.stats.totalObservations}</div>
          <div class="mini-stat-label">Gözlem Bildirimi</div>
        </div>
        <div class="mini-stat">
          <div class="mini-stat-value" style="color:#0891b2">${student.stats.activeSupportCount}</div>
          <div class="mini-stat-label">Aktif Destek Takibi</div>
        </div>
      </div>

      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-header"><span class="card-header-title">Öğrenci Temel Bilgileri</span></div>
        <div class="card-body">
          <div class="info-grid">
            <div class="info-item"><span class="info-label">Ad</span><span class="info-value">${UI.escapeHtml(student.firstName)}</span></div>
            <div class="info-item"><span class="info-label">Soyad</span><span class="info-value">${UI.escapeHtml(student.lastName)}</span></div>
            <div class="info-item"><span class="info-label">Öğrenci No</span><span class="info-value">${UI.escapeHtml(student.studentNo)}</span></div>
            <div class="info-item"><span class="info-label">Sınıf</span><span class="info-value">${UI.escapeHtml(student.class)}</span></div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><span class="card-header-title">Kural Dağılımı (${selectedYearName})</span></div>
        <div class="card-body">
          <div class="category-distribution">${categoryBadges}</div>
        </div>
      </div>
    </div>

    <!-- Tab 2: Order Records -->
    <div class="tab-panel" id="panel-orders">
      ${student.records.length > 0 ? `
        <div class="table-container">
          <table class="data-table">
            <thead><tr><th>Tarih/Saat</th><th>Dönem</th><th>Kategori</th><th>Açıklama</th><th>Yetkili</th></tr></thead>
            <tbody>
              ${student.records.map(r => {
                const yr = allYears.find(y => y.id === r.academicYearId);
                const yrCode = yr ? yr.code : 'Geçmiş Yıl';
                return `
                  <tr>
                    <td style="white-space:nowrap;font-size:var(--font-sm)">${UI.formatDateTime(r.dateTime)}</td>
                    <td><span class="badge" style="background:#f1f5f9;color:#475569;font-size:11px">📅 ${UI.escapeHtml(yrCode)}</span></td>
                    <td>${UI.getCategoryBadge(r.category)}</td>
                    <td style="max-width:300px">${UI.escapeHtml(r.description || '—')}</td>
                    <td style="font-size:var(--font-sm)">${UI.escapeHtml(r.createdBy)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      ` : `
        <div class="empty-state" style="padding:var(--space-lg);background:var(--bg-tertiary);border-radius:var(--radius-md);text-align:center">
          <div class="empty-icon" style="font-size:28px;margin-bottom:var(--space-xs)">✨</div>
          <h4 style="font-weight:700;color:var(--text-primary);margin-bottom:4px">
            ${selectedYearName} Döneminde Aktif Düzen Kaydı Yok
          </h4>
          <p class="empty-desc" style="color:var(--text-secondary);font-size:var(--font-sm);margin-bottom:${hasPastRecords && isViewingActiveYear ? 'var(--space-md)' : '0'}">
            ${isViewingActiveYear
              ? `Bu öğrencinin ${selectedYearName} aktif eğitim yılında henüz bir düzen kaydı bulunmamaktadır. Yeni yıl disiplin kayıtları boştur.`
              : `Seçilen dönemde (${selectedYearName}) kayıt bulunmuyor.`}
          </p>
          ${hasPastRecords && isViewingActiveYear ? `
            <button class="btn btn-outline btn-sm" id="btn-jump-to-detail-archive" style="border-color:var(--accent);color:var(--accent);font-weight:600">
              📁 Geçmiş Yıl Kayıtlarına Eriş (${student.stats.pastRecordsCount} Kayıt)
            </button>
          ` : ''}
        </div>
      `}
      <button class="btn btn-primary btn-lg mt-lg" onclick="Router.navigate(Router.ROUTES.NEW_RECORD, {id:'${student.id}'})">
        ${UI.Icons.plus} Yeni Düzen Kaydı Ekle
      </button>
    </div>

    <!-- Tab 3: Observations -->
    <div class="tab-panel" id="panel-observations">
      ${student.observations.length > 0 ? `
        <div class="table-container">
          <table class="data-table">
            <thead><tr><th>Tarih</th><th>Konu</th><th>Kaynak</th><th>Doğrulama</th><th>Açıklama</th><th>Bildiren</th></tr></thead>
            <tbody>
              ${student.observations.map(o => `
                <tr>
                  <td style="white-space:nowrap;font-size:var(--font-xs)">${UI.formatDateTime(o.dateTime)}</td>
                  <td><span class="badge badge-purple">${UI.escapeHtml(SeedData.OBSERVATION_CATEGORY_LABELS[o.category] || o.category)}</span></td>
                  <td>${UI.getObservationSourceBadge(o.source)}</td>
                  <td>${UI.getVerificationBadge(o.verificationStatus)}</td>
                  <td style="max-width:280px">${UI.escapeHtml(o.description)}</td>
                  <td style="font-size:var(--font-xs)">${UI.escapeHtml(o.createdBy)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : `
        <div class="empty-state"><p class="empty-desc">Kayıtlı gözlem bildirimi bulunmuyor.</p></div>
      `}
      <button class="btn btn-outline btn-lg mt-lg" style="border-color:#7c3aed;color:#7c3aed" onclick="Router.navigate(Router.ROUTES.NEW_OBSERVATION, {id:'${student.id}'})">
        ${UI.Icons.messageSquare} Gözlem Bildir
      </button>
    </div>

    <!-- Tab 4: Support Cases -->
    <div class="tab-panel" id="panel-support">
      ${isCounselor || isAdmin ? `
      <button class="btn btn-primary mb-lg" onclick="showNewSupportCaseModal('${student.id}')">
        ${UI.Icons.plus} Yeni Destek Süreci Başlat
      </button>
      ` : ''}

      ${student.supportCases.length > 0 ? `
        <div style="display:flex;flex-direction:column;gap:var(--space-md)">
          ${student.supportCases.map(sc => `
            <div class="card" style="border-left:4px solid #0891b2">
              <div class="card-body">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xs)">
                  <strong style="font-size:var(--font-base)">${UI.escapeHtml(sc.title)}</strong>
                  ${UI.getSupportStatusBadge(sc.status)}
                </div>
                ${isCounselor || isAdmin ? `
                  <p style="font-size:var(--font-sm);color:var(--text-secondary);white-space:pre-line;background:var(--bg-tertiary);padding:var(--space-md);border-radius:var(--radius-md)">
                    ${UI.escapeHtml(sc.notes || 'Açıklama girilmedi.')}
                  </p>
                ` : `
                  <div style="background:var(--bg-tertiary);border-radius:var(--radius-md);padding:var(--space-sm) var(--space-md);font-size:var(--font-xs);color:var(--text-secondary);display:flex;align-items:center;gap:var(--space-xs);border:1px dashed var(--border-color);margin:var(--space-xs) 0">
                    <span style="font-size:14px">🔒</span>
                    <span>Rehberlik sevk takip detayları ve idari bildirimler İdare ve Rehberlik Servisi yetkisine açıktır.</span>
                  </div>
                `}
                <div style="display:flex;justify-content:space-between;align-items:center;margin-top:var(--space-sm);font-size:var(--font-xs);color:var(--text-muted)">
                  <span>Sorumlu: ${UI.escapeHtml(sc.assignedTo)} • Son Güncelleme: ${UI.formatDate(sc.updatedAt)}</span>
                  ${isCounselor || isAdmin ? `
                    <button class="btn btn-outline btn-sm" onclick="showUpdateSupportModal('${sc.id}', '${student.id}')">
                      Görüşme Notu / Güncelle
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="empty-state"><p class="empty-desc">Bu öğrenci için açık bir rehberlik süreci bulunmuyor.</p></div>
      `}
    </div>

    <!-- Tab 5: Admin Actions -->
    <div class="tab-panel" id="panel-actions">
      ${isAdmin ? `
      <button class="btn btn-primary mb-lg" id="add-action-btn">
        ${UI.Icons.plus} İdari İşlem Ekle
      </button>
      ` : ''}

      ${student.actions.length > 0 ? `
        <div class="table-container">
          <table class="data-table">
            <thead><tr><th>Tarih</th><th>İşlem Türü</th><th>Açıklama</th><th>Yetkili</th></tr></thead>
            <tbody>
              ${student.actions.map(a => `
                <tr>
                  <td style="white-space:nowrap;font-size:var(--font-sm)">${UI.formatDate(a.date)}</td>
                  <td><span class="badge badge-info">${UI.escapeHtml(SeedData.ACTION_TYPE_LABELS[a.actionType] || a.actionType)}</span></td>
                  <td style="max-width:300px">${UI.escapeHtml(a.description)}</td>
                  <td style="font-size:var(--font-sm)">${UI.escapeHtml(a.createdBy)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : `
        <div class="empty-state"><p class="empty-desc">Uygulanan idari işlem bulunmuyor.</p></div>
      `}
    </div>
  `;

  if (isAdmin) {
    screen.innerHTML = `
      <div class="admin-layout">
        <aside class="admin-sidebar" id="admin-sidebar">
          <div class="sidebar-header">
            <img src="./icons/logo.svg" alt="Kaşif Kalkavan AL" class="sidebar-logo-img">
            <div class="sidebar-brand"><span class="sidebar-brand-name">Kaşif Kalkavan Anadolu Lisesi</span></div>
          </div>
          <nav class="sidebar-nav">
            <div class="sidebar-nav-item" onclick="Router.navigate(Router.ROUTES.ADMIN_DASHBOARD)">
              <span class="nav-icon">${UI.Icons.home}</span> Ana Sayfa
            </div>
            <div class="sidebar-nav-item active" onclick="Router.navigate(Router.ROUTES.STUDENT_SEARCH)">
              <span class="nav-icon">${UI.Icons.users}</span> Öğrenciler
            </div>
          </nav>
        </aside>
        <div class="sidebar-overlay" id="sidebar-overlay"></div>
        <main class="admin-main">
          <div class="admin-topbar">
            <div><span class="topbar-title">Öğrenci Portalı & Dosyası</span></div>
          </div>
          <div class="admin-body">${bodyContent}</div>
        </main>
      </div>
    `;
  } else {
    screen.innerHTML = `
      <div class="teacher-layout">${createTeacherLayout('Öğrenci Dosyası', bodyContent)}</div>
    `;
  }

  app.innerHTML = '';
  app.appendChild(screen);

  if (isAdmin) {
    setupAdminDetailEvents();
  } else {
    setupTeacherLayoutEvents();
  }

  // Tab switching
  document.querySelectorAll('#detail-tabs .tab-item').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#detail-tabs .tab-item').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(`panel-${tab.dataset.tab}`)?.classList.add('active');
    });
  });

  document.getElementById('add-action-btn')?.addEventListener('click', () => {
    showAddActionModal(student.id);
  });

  // Academic year change & archive jump events for student detail
  document.getElementById('student-detail-year-select')?.addEventListener('change', (e) => {
    renderStudentDetail(studentId, e.target.value);
  });

  const goToDetailArchive = () => {
    const pastYear = student.pastRecords[0]?.academicYearId || (allYears.find(y => y.id !== activeYear?.id)?.id) || 'all';
    renderStudentDetail(studentId, pastYear);
  };
  document.getElementById('btn-jump-to-detail-archive')?.addEventListener('click', goToDetailArchive);
  document.getElementById('btn-detail-quick-archive')?.addEventListener('click', goToDetailArchive);
}

function setupAdminDetailEvents() {
  const sidebar = document.getElementById('admin-sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const hamburger = document.getElementById('admin-hamburger');

  hamburger?.addEventListener('click', () => {
    sidebar?.classList.toggle('open');
    overlay?.classList.toggle('active');
  });

  overlay?.addEventListener('click', () => {
    sidebar?.classList.remove('open');
    overlay?.classList.remove('active');
  });
}

/**
 * MODAL: Hatalı Kayıt Bildir (ODİS PDF Şartnamesi: Sayfa 5 & 10)
 */
window.showReportIncorrectRecordModal = function(recordId, studentId) {
  const bodyHtml = `
    <form id="report-incorrect-form">
      <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:10px 14px;border-radius:var(--radius-sm);margin-bottom:var(--space-md);font-size:var(--font-sm);color:#92400e">
        <strong>Hatalı Kayıt Bildirimi (ODİS v1 Güvenlik Akışı):</strong><br>
        Kayıtlar veritabanından iz bırakmadan silinmez. Gerekçeniz okul idaresine iletilir ve idare onayıyla kayıt "İptal Edilmiş" durumuna alınarak denetim kütüğüne işlenir.
      </div>
      <div class="form-group">
        <label class="form-label">Hata / İptal Gerekçesi <span style="color:var(--danger)">*</span></label>
        <textarea id="incorrect-reason-input" class="form-textarea" rows="3" placeholder="Örn: Yanlış öğrenci numarası seçildi, öğrencinin okul arması sonradan tespit edildi vb." required></textarea>
      </div>
    </form>
  `;

  const footerHtml = `
    <button class="btn btn-outline" onclick="UI.closeModal()">Vazgeç</button>
    <button class="btn btn-danger" id="btn-submit-incorrect-record">${UI.Icons.send} Talebi İdareye Gönder</button>
  `;

  UI.showModal('Hatalı Kayıt Bildir', bodyHtml, footerHtml);

  document.getElementById('btn-submit-incorrect-record')?.addEventListener('click', async () => {
    const reason = document.getElementById('incorrect-reason-input')?.value.trim();
    if (!reason) {
      UI.showToast('Lütfen iptal gerekçesini belirtin.', 'warning');
      return;
    }

    try {
      await Records.requestCancellation(recordId, reason, Auth.getDisplayName());
      UI.closeModal();
      UI.showToast('Hatalı kayıt bildirim talebiniz idareye iletildi.', 'success');
      if (studentId) {
        Router.navigate(Router.ROUTES.STUDENT_CARD, { id: studentId });
      }
    } catch (err) {
      console.error(err);
      UI.showToast('Talep iletilirken hata oluştu.', 'error');
    }
  });
};

// Global Exports
window.renderStudentSearch = renderStudentSearch;
window.renderStudentCard = renderStudentCard;
window.renderStudentDetail = renderStudentDetail;
