/* ========================================
   ODİS v3 — Admin View Module
   Yönetici Paneli (Admin Dashboard)
   Süreç ve Destek Göstergeleri, Personel Yönetimi,
   XLSX İçe Aktarım, Gelişmiş Raporlama & Analiz,
   Sistem Denetim Günlüğü ve İdari İşlemler.
   ======================================== */

/* ============================================================
   SCREEN 10 — ADMIN DASHBOARD (v2: Süreç ve Destek Göstergeleri)
   ============================================================ */

let adminActiveSection = 'home';

async function renderAdminDashboard(section) {
  adminActiveSection = section || 'home';
  const app = document.getElementById('app');
  const screen = document.createElement('div');
  screen.className = 'screen active';
  screen.id = 'screen-admin-dashboard';

  const user = Auth.getCurrentUser();
  if (!user || user.role !== 'admin') {
    UI.showToast('Yetkisiz erişim engellendi: Yönetici paneline yalnızca idareciler erişebilir.', 'error');
    Router.navigate(user?.role === 'counselor' ? Router.ROUTES.COUNSELOR_DASHBOARD : Router.ROUTES.TEACHER_HOME);
    return;
  }
  const activeSchool = await Schools.getActiveSchool();
  const allSchools = await Schools.getAll();
  const allAcademicYears = await AcademicYears.getAll(activeSchool.id);
  const activeYear = await AcademicYears.getActiveYear(activeSchool.id);

  screen.innerHTML = `
    <div class="admin-layout">
      <!-- Sidebar -->
      <aside class="admin-sidebar" id="admin-sidebar">
        <div class="sidebar-header">
          <img src="./icons/logo.svg" alt="${UI.escapeHtml(activeSchool.name)}" class="sidebar-logo-img">
          <div class="sidebar-brand">
            <span class="sidebar-brand-name">${UI.escapeHtml(activeSchool.name)}</span>
            <span class="sidebar-brand-desc">Okul Yönetim & İdare Paneli (${UI.escapeHtml(activeSchool.code)})</span>
          </div>
        </div>

        <div class="sidebar-user">
          <div class="sidebar-user-avatar">${user?.displayName?.[0] || 'A'}</div>
          <div class="sidebar-user-info">
            <span class="sidebar-user-name">${UI.escapeHtml(user?.displayName || '')}</span>
            <span class="sidebar-user-role">Yetkili Yönetici</span>
          </div>
        </div>

        <nav class="sidebar-nav">
          <div class="sidebar-nav-item ${adminActiveSection === 'home' ? 'active' : ''}" data-section="home">
            <span class="nav-icon">${UI.Icons.home}</span> Yönetim Özeti
          </div>
          <div class="sidebar-nav-item ${adminActiveSection === 'repeats' ? 'active' : ''}" data-section="repeats">
            <span class="nav-icon">${UI.Icons.alertTriangle}</span> Tekrar Takip Listesi (🟠 / 🔴)
          </div>
          <div class="sidebar-nav-item ${adminActiveSection === 'cancellations' ? 'active' : ''}" data-section="cancellations">
            <span class="nav-icon">${UI.Icons.checkCircle}</span> Hatalı Kayıt Talepleri
          </div>
          <div class="sidebar-nav-item ${adminActiveSection === 'records' ? 'active' : ''}" data-section="records">
            <span class="nav-icon">${UI.Icons.fileText}</span> Düzen Kayıtları
          </div>
          <div class="sidebar-nav-item ${adminActiveSection === 'observations' ? 'active' : ''}" data-section="observations">
            <span class="nav-icon">${UI.Icons.messageSquare}</span> Gözlemler
          </div>
          <div class="sidebar-nav-item ${adminActiveSection === 'students' ? 'active' : ''}" data-section="students">
            <span class="nav-icon">${UI.Icons.users}</span> Öğrenci Yönetimi
          </div>
          <div class="sidebar-nav-item ${adminActiveSection === 'staff' ? 'active' : ''}" data-section="staff">
            <span class="nav-icon">${UI.Icons.userCheck}</span> Personel Yönetimi
          </div>
          <div class="sidebar-nav-item ${adminActiveSection === 'importer' ? 'active' : ''}" data-section="importer">
            <span class="nav-icon">${UI.Icons.fileSpreadsheet}</span> XLSX İçe Aktarım
          </div>
          <div class="sidebar-nav-item ${adminActiveSection === 'reports' ? 'active' : ''}" data-section="reports">
            <span class="nav-icon">${UI.Icons.barChart}</span> Gelişmiş Raporlama
          </div>
          <div class="sidebar-nav-item ${adminActiveSection === 'thresholds' ? 'active' : ''}" data-section="thresholds">
            <span class="nav-icon">${UI.Icons.filter}</span> Eşik Ayarları
          </div>
          <div class="sidebar-nav-item ${adminActiveSection === 'audit' ? 'active' : ''}" data-section="audit">
            <span class="nav-icon">${UI.Icons.shield}</span> Denetim Günlüğü
          </div>
        </nav>

        <div class="sidebar-footer">
          <div class="sidebar-nav-item" data-action="logout">
            <span class="nav-icon">${UI.Icons.logOut}</span> Çıkış Yap
          </div>
        </div>
      </aside>

      <div class="sidebar-overlay" id="sidebar-overlay"></div>

      <main class="admin-main">
        <div class="admin-topbar">
          <div class="admin-topbar-left" style="display:flex;align-items:center;gap:var(--space-md);flex-wrap:wrap">
            <button class="hamburger-menu" id="admin-hamburger" aria-label="Menü">
              <span></span><span></span><span></span>
            </button>
            <span class="topbar-title" id="admin-page-title">Yönetim Özeti</span>
            <!-- Multi-School Active Context & Switcher -->
            <div style="display:flex;align-items:center;gap:6px;background:var(--bg-tertiary);padding:4px 10px;border-radius:var(--radius-lg);border:1px solid var(--border-color)">
              <span style="font-size:11px;font-weight:700;color:var(--text-muted)">🏫 AKTİF OKUL:</span>
              <select id="admin-school-select" class="form-select form-select-sm" style="padding:2px 8px;font-size:12px;font-weight:700;border:none;background:transparent;cursor:pointer">
                ${allSchools.map(s => `
                  <option value="${s.id}" ${s.id === activeSchool.id ? 'selected' : ''}>
                    ${UI.escapeHtml(s.name)}
                  </option>
                `).join('')}
              </select>
            </div>

            <!-- Academic Year Context & Switcher (Rapor Bölüm 1) -->
            <div style="display:flex;align-items:center;gap:6px;background:var(--bg-tertiary);padding:4px 10px;border-radius:var(--radius-lg);border:1px solid var(--border-color)">
              <span style="font-size:11px;font-weight:700;color:var(--text-muted)">📅 DÖNEM:</span>
              <select id="admin-year-select" class="form-select form-select-sm" style="padding:2px 8px;font-size:12px;font-weight:700;border:none;background:transparent;cursor:pointer">
                ${allAcademicYears.map(y => `
                  <option value="${y.id}" ${y.id === activeYear.id ? 'selected' : ''}>
                    ${UI.escapeHtml(y.code)} ${y.isCurrent ? '(Aktif)' : '(Arşiv)'}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
          <div class="admin-topbar-actions" style="display:flex;align-items:center;gap:var(--space-sm)">
            <button class="btn btn-outline btn-sm" onclick="exportRecordsToCsv()">
              ${UI.Icons.download} CSV İndir
            </button>
            <button class="btn btn-primary btn-sm" onclick="Router.navigate(Router.ROUTES.STUDENT_SEARCH)">
              ${UI.Icons.search} Öğrenci Sorgula
            </button>
          </div>
        </div>

        <div class="admin-body" id="admin-body">
        </div>
      </main>
    </div>
  `;

  app.innerHTML = '';
  app.appendChild(screen);

  setupAdminSidebarEvents();

  // School switcher change event
  document.getElementById('admin-school-select')?.addEventListener('change', async (e) => {
    const newSchoolId = e.target.value;
    await Schools.setActiveSchool(newSchoolId);
    const selectedSchool = allSchools.find(s => s.id === newSchoolId);
    UI.showToast(`Aktif okul değiştirildi: ${selectedSchool?.name || newSchoolId}`, 'info');
    await renderAdminDashboard(adminActiveSection);
  });

  // Academic year switcher change event
  document.getElementById('admin-year-select')?.addEventListener('change', async (e) => {
    const newYearId = e.target.value;
    await AcademicYears.setActiveYear(newYearId, activeSchool.id);
    const selectedYear = allAcademicYears.find(y => y.id === newYearId);
    UI.showToast(`Eğitim dönemi değiştirildi: ${selectedYear?.code || newYearId}`, 'info');
    await renderAdminDashboard(adminActiveSection);
  });

  await renderAdminSection(adminActiveSection);
}

function setupAdminSidebarEvents() {
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

  document.querySelectorAll('.sidebar-nav-item[data-section]').forEach(item => {
    item.addEventListener('click', async () => {
      const section = item.dataset.section;
      document.querySelectorAll('.sidebar-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      sidebar?.classList.remove('open');
      overlay?.classList.remove('active');
      await renderAdminSection(section);
    });
  });

  document.querySelectorAll('[data-action="logout"]').forEach(el => {
    el.addEventListener('click', () => {
      Auth.logout();
      Router.navigate(Router.ROUTES.LOGIN);
      UI.showToast('Çıkış yapıldı.', 'info');
    });
  });
}

async function renderAdminSection(section) {
  const body = document.getElementById('admin-body');
  const title = document.getElementById('admin-page-title');
  if (!body) return;

  const titles = {
    home: 'Yönetim Özeti',
    repeats: 'Tekrar Analizi ve Takip Listesi (🟠 / 🔴)',
    cancellations: 'Hatalı Kayıt İptal Talepleri',
    records: 'Okul Düzen Kayıtları',
    observations: 'Davranış Gözlem Bildirimleri',
    students: 'Öğrenci Yönetimi',
    staff: 'Personel Yönetimi',
    importer: 'XLSX / Excel İçe Aktarım',
    reports: 'Gelişmiş Raporlama & Analiz',
    thresholds: 'Tekrar Analiz Eşikleri ve Karar Destek Ayarları',
    audit: 'Sistem Denetim Günlüğü',
  };
  if (title) title.textContent = titles[section] || 'Yönetim Paneli';

  switch (section) {
    case 'home':
      await renderAdminHome(body);
      break;
    case 'repeats':
      await renderAdminRepeats(body);
      break;
    case 'cancellations':
      await renderAdminCancellations(body);
      break;
    case 'records':
      await renderAdminRecords(body);
      break;
    case 'observations':
      await renderAdminObservations(body);
      break;
    case 'students':
      await renderAdminStudents(body);
      break;
    case 'staff':
      await renderAdminStaff(body);
      break;
    case 'importer':
      await renderAdminImporter(body);
      break;
    case 'reports':
      await renderAdminReports(body);
      break;
    case 'thresholds':
      await renderAdminThresholds(body);
      break;
    case 'audit':
      await renderAdminAudit(body);
      break;
  }
}

async function renderAdminHome(container) {
  const activeSchoolId = Auth.getCurrentSchoolId();
  const activeYear = await AcademicYears.getActiveYear(activeSchoolId);
  const stats = await Dashboard.loadStats(activeSchoolId, activeYear.id);
  const recentRecords = await Records.getRecentWithStudents(8, { academicYearId: activeYear.id });
  const activeSupportCases = await SupportCases.getActiveWithStudents(activeSchoolId);

  // Status & Repeat metrics (PDF Sayfa 4 & 6)
  const allStudentsWithStatus = await Students.getWithCounts(activeSchoolId, activeYear.id);
  const greenCount = allStudentsWithStatus.filter(s => s.status?.level === 'green').length;
  const orangeCount = allStudentsWithStatus.filter(s => s.status?.level === 'orange').length;
  const redCount = allStudentsWithStatus.filter(s => s.status?.level === 'red').length;
  const postAdminCount = allStudentsWithStatus.filter(s => s.status?.isPostAdminRepeat).length;
  const pendingCancellations = (Records.getPendingCancellations ? await Records.getPendingCancellations(activeSchoolId) : []) || [];

  container.innerHTML = `
    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">${UI.Icons.fileText}</div>
        <div class="stat-info">
          <div class="stat-value">${stats.todayOrderCount}</div>
          <div class="stat-label">Bugünkü Düzen Kaydı</div>
          <div class="stat-subtext">Aktif dönem (${UI.escapeHtml(activeYear.code)})</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon orange">${UI.Icons.refreshCw}</div>
        <div class="stat-info">
          <div class="stat-value">${stats.repeatOrderCount}</div>
          <div class="stat-label">Tekrar Eden Düzen Kaydı</div>
          <div class="stat-subtext">Birden fazla kural bildirimi</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon green">${UI.Icons.lifeBuoy}</div>
        <div class="stat-info">
          <div class="stat-value" style="color:var(--success)">${stats.activeSupportCount}</div>
          <div class="stat-label">Açık Sevk & Destek</div>
          <div class="stat-subtext">Rehberlik yönlendirme takibi</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon purple" style="background:#f3e8ff;color:#7e22ce">${UI.Icons.messageSquare}</div>
        <div class="stat-info">
          <div class="stat-value" style="color:#7e22ce">${stats.totalObservations}</div>
          <div class="stat-label">Toplam Gözlem</div>
          <div class="stat-subtext">Bağlamlı davranış bildirimleri</div>
        </div>
      </div>
    </div>

    <!-- ODİS Tekrar Analizi & Karar Destek Göstergeleri (PDF Bölüm 3, 4, 5, 6) -->
    <div class="card" style="margin-bottom:var(--space-xl);border-left:4px solid var(--accent)">
      <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
        <div>
          <span class="card-header-title">📊 ODİS Tekrar Analizi ve Karar Destek Göstergeleri</span>
          <div style="font-size:var(--font-xs);color:var(--text-muted)">Aktif Eğitim Yılı (${UI.escapeHtml(activeYear.code)}) • Eşik Analizi</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="document.querySelector('.sidebar-nav-item[data-section=\\'repeats\\']')?.click()">
          Takip Listesini Aç ${UI.Icons.chevronRight}
        </button>
      </div>
      <div class="card-body" style="padding:var(--space-md)">
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(170px, 1fr));gap:var(--space-md)">
          <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:var(--radius-lg);padding:var(--space-md);cursor:pointer" onclick="document.querySelector('.sidebar-nav-item[data-section=\\'repeats\\']')?.click()">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <span style="font-size:24px">🟢</span>
              <span style="font-size:1.4rem;font-weight:800;color:#047857">${greenCount}</span>
            </div>
            <div style="font-weight:700;color:#047857;margin-top:4px">Normal Takip</div>
            <div style="font-size:11px;color:#065f46">Son 30 günde 0–2 kayıt</div>
          </div>

          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:var(--radius-lg);padding:var(--space-md);cursor:pointer" onclick="document.querySelector('.sidebar-nav-item[data-section=\\'repeats\\']')?.click()">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <span style="font-size:24px">🟠</span>
              <span style="font-size:1.4rem;font-weight:800;color:#c2410c">${orangeCount}</span>
            </div>
            <div style="font-weight:700;color:#c2410c;margin-top:4px">Tekrarlayan Durum</div>
            <div style="font-size:11px;color:#9a3412">3–5 kayıt / 14 günde 3 tekrar</div>
          </div>

          <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:var(--radius-lg);padding:var(--space-md);cursor:pointer" onclick="document.querySelector('.sidebar-nav-item[data-section=\\'repeats\\']')?.click()">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <span style="font-size:24px">🔴</span>
              <span style="font-size:1.4rem;font-weight:800;color:#b91c1c">${redCount}</span>
            </div>
            <div style="font-weight:700;color:#b91c1c;margin-top:4px">Yoğun Tekrar</div>
            <div style="font-size:11px;color:#991b1b">6+ kayıt / 30 günde 5 tekrar</div>
          </div>

          <div style="background:#fefce8;border:1px solid #fef08a;border-radius:var(--radius-lg);padding:var(--space-md);cursor:pointer" onclick="document.querySelector('.sidebar-nav-item[data-section=\\'repeats\\']')?.click()">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <span style="font-size:24px">⚡</span>
              <span style="font-size:1.4rem;font-weight:800;color:#854d0e">${postAdminCount}</span>
            </div>
            <div style="font-weight:700;color:#854d0e;margin-top:4px">İşlem Sonrası Tekrar</div>
            <div style="font-size:11px;color:#713f12">İdari görüşme sonrası yeni ihlal</div>
          </div>
        </div>

        ${pendingCancellations.length > 0 ? `
          <div style="margin-top:var(--space-md);padding:10px 14px;background:#fef2f2;border-radius:var(--radius-md);border:1px solid #fecaca;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
            <div style="display:flex;align-items:center;gap:8px">
              <span style="font-size:16px">⏳</span>
              <span style="font-size:var(--font-sm);color:#991b1b;font-weight:600">
                Öğretmenlerden gelen <strong>${pendingCancellations.length}</strong> adet hatalı kayıt iptal talebi onay bekliyor.
              </span>
            </div>
            <button class="btn btn-sm btn-danger" onclick="document.querySelector('.sidebar-nav-item[data-section=\\'cancellations\\']')?.click()">
              Talepleri İncele ${UI.Icons.chevronRight}
            </button>
          </div>
        ` : ''}
      </div>
    </div>

      <div class="stat-card">
        <div class="stat-icon green">${UI.Icons.lifeBuoy}</div>
        <div class="stat-info">
          <div class="stat-value" style="color:var(--success)">${stats.activeSupportCount}</div>
          <div class="stat-label">Açık Sevk & Destek</div>
          <div class="stat-subtext">Rehberlik yönlendirme takibi</div>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon purple" style="background:#f3e8ff;color:#7e22ce">${UI.Icons.messageSquare}</div>
        <div class="stat-info">
          <div class="stat-value" style="color:#7e22ce">${stats.totalObservations}</div>
          <div class="stat-label">Toplam Gözlem</div>
          <div class="stat-subtext">Bağlamlı davranış bildirimleri</div>
        </div>
      </div>
    </div>

    <div class="content-grid" style="grid-template-columns:1.2fr 1fr;gap:var(--space-xl)">
      <!-- Left: Recent Order Records -->
      <div class="card">
        <div class="card-header">
          <div>
            <span class="card-header-title">${UI.Icons.clock} Son Düzen Kayıtları (${UI.escapeHtml(activeYear.code)})</span>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="document.querySelector('.sidebar-nav-item[data-section=\\'records\\']')?.click()">
            Tümünü Gör ${UI.Icons.chevronRight}
          </button>
        </div>
        <div class="card-body" style="padding:0">
          <div class="table-container" style="border:none">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Tarih / Saat</th>
                  <th>Öğrenci</th>
                  <th>Sınıf</th>
                  <th>Kategori</th>
                  <th>Yetkili</th>
                </tr>
              </thead>
              <tbody>
                ${recentRecords.length > 0 ? recentRecords.map(r => `
                  <tr style="cursor:pointer" onclick="Router.navigate(Router.ROUTES.STUDENT_DETAIL, {id:'${r.studentId}'})">
                    <td style="white-space:nowrap;font-size:var(--font-xs)">${UI.formatDateTime(r.dateTime)}</td>
                    <td>
                      <div style="display:flex;align-items:center;gap:var(--space-xs)">
                        ${r.student ? UI.renderAvatar(r.student, 'avatar-sm') : ''}
                        <strong style="color:var(--text-primary)">${r.student ? UI.escapeHtml(r.student.firstName + ' ' + r.student.lastName) : '—'}</strong>
                      </div>
                    </td>
                    <td><span class="badge badge-neutral">${UI.escapeHtml(r.studentClass || (r.student ? r.student.class : '—'))}</span></td>
                    <td>${UI.getCategoryBadge(r.category)}</td>
                    <td style="font-size:var(--font-xs);color:var(--text-secondary)">${UI.escapeHtml(r.createdBy)}</td>
                  </tr>
                `).join('') : `
                  <tr><td colspan="5" style="text-align:center;padding:var(--space-xl);color:var(--text-muted)">Henüz kayıt bulunmuyor.</td></tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Right: Active Support & Guidance Processes -->
      <div class="card">
        <div class="card-header">
          <div>
            <span class="card-header-title">${UI.Icons.lifeBuoy} İdari Rehberlik Sevkleri</span>
          </div>
          <span class="badge badge-info">${activeSupportCases.length} Vaka</span>
        </div>
        <div class="card-body" style="padding:0">
          <div class="table-container" style="border:none">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Öğrenci</th>
                  <th>Süreç Durumu</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                ${activeSupportCases.length > 0 ? activeSupportCases.map(c => `
                  <tr>
                    <td>
                      <div style="display:flex;align-items:center;gap:var(--space-xs)">
                        ${c.student ? UI.renderAvatar(c.student, 'avatar-sm') : ''}
                        <div>
                          <div style="font-weight:700;color:var(--text-primary);font-size:var(--font-xs)">
                            ${c.student ? UI.escapeHtml(c.student.firstName + ' ' + c.student.lastName) : '—'}
                          </div>
                          <div style="font-size:10px;color:var(--text-muted)">${UI.escapeHtml(c.title)}</div>
                        </div>
                      </div>
                    </td>
                    <td>${UI.getSupportStatusBadge(c.status)}</td>
                    <td style="text-align:right">
                      <button class="btn btn-sm btn-outline" onclick="Router.navigate(Router.ROUTES.STUDENT_DETAIL, {id:'${c.studentId}'})">
                        İncele ${UI.Icons.chevronRight}
                      </button>
                    </td>
                  </tr>
                `).join('') : `
                  <tr><td colspan="3" style="text-align:center;padding:var(--space-xl);color:var(--text-muted)">Açık rehberlik süreci bulunmuyor.</td></tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function renderAdminRecords(container) {
  const schoolId = Auth.getCurrentSchoolId();
  const classes = await Students.getClasses(schoolId);
  const allYears = await AcademicYears.getAll(schoolId);
  const activeYear = await AcademicYears.getActiveYear(schoolId);

  container.innerHTML = `
    <div class="section">
      <div class="filters-bar" style="margin-bottom:var(--space-md);flex-wrap:wrap;gap:var(--space-sm)">
        <div class="search-box" style="flex:1;min-width:200px;max-width:320px">
          <span class="search-icon">${UI.Icons.search}</span>
          <input type="text" class="form-input" id="admin-record-search" placeholder="Öğrenci veya kural ara...">
        </div>
        <select class="form-select" id="admin-record-year-filter" style="width:auto;border-radius:var(--radius-full);font-size:var(--font-sm);font-weight:700">
          <option value="all">Tüm Yıllar (Arşiv)</option>
          ${allYears.map(y => `<option value="${y.id}" ${y.id === activeYear.id ? 'selected' : ''}>${UI.escapeHtml(y.code)} ${y.isCurrent ? '(Aktif)' : ''}</option>`).join('')}
        </select>
        <select class="form-select" id="admin-record-class-filter" style="width:auto;border-radius:var(--radius-full);font-size:var(--font-sm)">
          <option value="">Tüm Sınıflar</option>
          ${classes.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
        <select class="form-select" id="admin-record-cat-filter" style="width:auto;border-radius:var(--radius-full);font-size:var(--font-sm)">
          <option value="">Tüm Kategoriler</option>
          ${SeedData.CATEGORIES.map(c => `<option value="${c}">${SeedData.CATEGORY_LABELS[c]}</option>`).join('')}
        </select>
        <input type="date" class="form-input" id="admin-record-date-from" style="width:auto;border-radius:var(--radius-full);font-size:var(--font-sm)" placeholder="Başlangıç">
        <input type="date" class="form-input" id="admin-record-date-to" style="width:auto;border-radius:var(--radius-full);font-size:var(--font-sm)" placeholder="Bitiş">
      </div>

      <div id="admin-records-table-container">
        <div class="loading-spinner"></div>
      </div>
    </div>
  `;

  await refreshAdminRecordsTable();

  ['admin-record-search', 'admin-record-year-filter', 'admin-record-class-filter', 'admin-record-cat-filter', 'admin-record-date-from', 'admin-record-date-to'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', debounce(refreshAdminRecordsTable, 300));
    document.getElementById(id)?.addEventListener('change', refreshAdminRecordsTable);
  });
}

async function refreshAdminRecordsTable() {
  const container = document.getElementById('admin-records-table-container');
  if (!container) return;

  const query = document.getElementById('admin-record-search')?.value || '';
  const yearFilter = document.getElementById('admin-record-year-filter')?.value || '';
  const classFilter = document.getElementById('admin-record-class-filter')?.value || '';
  const catFilter = document.getElementById('admin-record-cat-filter')?.value || '';
  const dateFrom = document.getElementById('admin-record-date-from')?.value || '';
  const dateTo = document.getElementById('admin-record-date-to')?.value || '';

  let records = await Records.getRecentWithStudents(100, {
    query,
    category: catFilter,
    dateFrom,
    dateTo,
    academicYearId: yearFilter === 'all' ? undefined : yearFilter,
  });

  if (classFilter) {
    records = records.filter(r => (r.studentClass || (r.student && r.student.class)) === classFilter);
  }

  container.innerHTML = `
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>Tarih / Saat</th>
            <th>Öğrenci</th>
            <th>Olay Anındaki Sınıf</th>
            <th>Kural Kategorisi</th>
            <th>Açıklama</th>
            <th>Yetkili</th>
          </tr>
        </thead>
        <tbody>
          ${records.length > 0 ? records.map(r => `
            <tr style="cursor:pointer" onclick="Router.navigate(Router.ROUTES.STUDENT_DETAIL, {id:'${r.studentId}'})">
              <td style="white-space:nowrap;font-size:var(--font-sm)">${UI.formatDateTime(r.dateTime)}</td>
              <td>
                <div style="display:flex;align-items:center;gap:var(--space-xs)">
                  ${r.student ? UI.renderAvatar(r.student, 'avatar-sm') : ''}
                  <span>${r.student ? UI.escapeHtml(r.student.firstName + ' ' + r.student.lastName) : '—'}</span>
                </div>
              </td>
              <td>${UI.escapeHtml(r.studentClass || (r.student ? r.student.class : '—'))}</td>
              <td>${UI.getCategoryBadge(r.category)}</td>
              <td style="max-width:240px" class="truncate">${UI.escapeHtml(r.description || '—')}</td>
              <td style="font-size:var(--font-sm)">${UI.escapeHtml(r.createdBy)}</td>
            </tr>
          `).join('') : `
            <tr><td colspan="6" style="text-align:center;padding:var(--space-xl);color:var(--text-muted)">Sonuç bulunamadı.</td></tr>
          `}
        </tbody>
      </table>
    </div>
    <p style="font-size:var(--font-xs);color:var(--text-muted);margin-top:var(--space-sm)">${records.length} kayıt gösteriliyor</p>
  `;
}

async function renderAdminObservations(container) {
  const observations = await Observations.getRecentWithStudents(100);

  container.innerHTML = `
    <div class="section">
      <div class="card">
        <div class="card-header">
          <span class="card-header-title">${UI.Icons.messageSquare} Davranış Gözlem Bildirimleri</span>
          <span class="badge badge-purple">${observations.length} Toplam Bildirim</span>
        </div>
        <div class="card-body" style="padding:0">
          <div class="table-container" style="border:none">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Öğrenci</th>
                  <th>Konu</th>
                  <th>Kaynak Türü</th>
                  <th>Doğrulama</th>
                  <th>Açıklama</th>
                  <th>Bildiren</th>
                </tr>
              </thead>
              <tbody>
                ${observations.length > 0 ? observations.map(o => `
                  <tr>
                    <td style="white-space:nowrap;font-size:var(--font-xs)">${UI.formatDateTime(o.dateTime)}</td>
                    <td>
                      <strong style="color:var(--text-primary)">${o.student ? UI.escapeHtml(o.student.firstName + ' ' + o.student.lastName) : '—'}</strong>
                      <span style="font-size:11px;color:var(--text-muted)">(${o.student ? o.student.class : ''})</span>
                    </td>
                    <td><span class="badge badge-purple">${UI.escapeHtml(SeedData.OBSERVATION_CATEGORY_LABELS[o.category] || o.category)}</span></td>
                    <td>${UI.getObservationSourceBadge(o.source)}</td>
                    <td>${UI.getVerificationBadge(o.verificationStatus)}</td>
                    <td style="max-width:280px" class="truncate" title="${UI.escapeHtml(o.description)}">${UI.escapeHtml(o.description)}</td>
                    <td style="font-size:var(--font-xs)">${UI.escapeHtml(o.createdBy)}</td>
                  </tr>
                `).join('') : `
                  <tr><td colspan="7" style="text-align:center;padding:var(--space-xl);color:var(--text-muted)">Kayıtlı gözlem bildirimi yok.</td></tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function renderAdminStudents(container) {
  const schoolId = Auth.getCurrentSchoolId();
  const classes = await Students.getClasses(schoolId);
  const activeYear = window.AcademicYears ? await window.AcademicYears.getActiveYear(schoolId) : null;
  const studentsWithCounts = await Students.getWithCounts(schoolId, activeYear?.id);

  container.innerHTML = `
    <div class="section">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md);flex-wrap:wrap;gap:var(--space-sm)">
        <div>
          <h2 class="section-title">Kayıtlı Öğrenciler (${studentsWithCounts.length})</h2>
          <p style="font-size:var(--font-xs);color:var(--text-muted)">Aktif eğitim yılı: ${activeYear ? activeYear.code : ''}</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-add-student">
          ${UI.Icons.plus} Yeni Öğrenci Ekle
        </button>
      </div>

      <div class="filters-bar" style="margin-bottom:var(--space-md)">
        <div class="search-box" style="flex:1;min-width:200px;max-width:400px">
          <span class="search-icon">${UI.Icons.search}</span>
          <input type="text" class="form-input" id="admin-student-search" placeholder="Öğrenci ara...">
        </div>
        <select class="form-select" id="admin-student-class-filter" style="width:auto;border-radius:var(--radius-full);font-size:var(--font-sm)">
          <option value="">Tüm Sınıflar</option>
          ${classes.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>

      <div id="admin-students-list" style="display:flex;flex-direction:column;gap:var(--space-xs)">
        ${studentsWithCounts.map(s => `
          <div class="student-item" onclick="Router.navigate(Router.ROUTES.STUDENT_DETAIL, {id:'${s.id}'})">
            ${UI.renderAvatar(s)}
            <div class="student-info">
              <div class="student-name">${UI.escapeHtml(s.firstName)} ${UI.escapeHtml(s.lastName)}</div>
              <div class="student-meta">
                <span>${UI.escapeHtml(s.studentNo)} • ${UI.escapeHtml(s.class)}</span>
              </div>
            </div>
            <div class="student-actions" style="display:flex;align-items:center;gap:var(--space-xs)">
              ${UI.getRecordBadge(s.recordCount)}
              <span style="color:var(--text-muted)">${UI.Icons.chevronRight}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  const searchInput = document.getElementById('admin-student-search');
  const classFilter = document.getElementById('admin-student-class-filter');

  async function filterAdminStudents() {
    const query = searchInput?.value || '';
    const cls = classFilter?.value || '';
    const results = await Students.search(query, cls, schoolId);
    const allWithCounts = await Students.getWithCounts(schoolId, activeYear?.id);
    const countMap = {};
    allWithCounts.forEach(s => countMap[s.id] = s.recordCount);

    const list = document.getElementById('admin-students-list');
    if (!list) return;

    if (results.length === 0) {
      UI.showEmptyState(list, 'Sonuç bulunamadı', 'Arama kriterlerinizi değiştirin.');
      return;
    }

    list.innerHTML = results.map(s => `
      <div class="student-item" onclick="Router.navigate(Router.ROUTES.STUDENT_DETAIL, {id:'${s.id}'})">
        ${UI.renderAvatar(s)}
        <div class="student-info">
          <div class="student-name">${UI.escapeHtml(s.firstName)} ${UI.escapeHtml(s.lastName)}</div>
          <div class="student-meta">
            <span>${UI.escapeHtml(s.studentNo)} • ${UI.escapeHtml(s.class)}</span>
          </div>
        </div>
        <div class="student-actions">
          ${UI.getRecordBadge(countMap[s.id] || 0)}
          <span style="color:var(--text-muted)">${UI.Icons.chevronRight}</span>
        </div>
      </div>
    `).join('');
  }

  searchInput?.addEventListener('input', debounce(filterAdminStudents, 300));
  classFilter?.addEventListener('change', filterAdminStudents);

  document.getElementById('btn-add-student')?.addEventListener('click', () => showAddStudentModal(container));
}

async function showAddStudentModal(refreshContainer) {
  const schoolId = Auth.getCurrentSchoolId();
  const allYears = window.AcademicYears ? await window.AcademicYears.getAll(schoolId) : [];
  const activeYear = window.AcademicYears ? await window.AcademicYears.getActiveYear(schoolId) : null;

  const bodyHtml = `
    <form id="add-student-form">
      <div class="form-group">
        <label class="form-label" for="new-student-no">Öğrenci Numarası <span style="color:var(--danger)">*</span></label>
        <input type="text" id="new-student-no" class="form-input" placeholder="Örn: 202501" required>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md)">
        <div class="form-group">
          <label class="form-label" for="new-student-fname">Ad <span style="color:var(--danger)">*</span></label>
          <input type="text" id="new-student-fname" class="form-input" placeholder="Örn: Caner" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="new-student-lname">Soyad <span style="color:var(--danger)">*</span></label>
          <input type="text" id="new-student-lname" class="form-input" placeholder="Örn: Bulut" required>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md)">
        <div class="form-group">
          <label class="form-label" for="new-student-class">Sınıf / Şube <span style="color:var(--danger)">*</span></label>
          <input type="text" id="new-student-class" class="form-input" placeholder="Örn: 10-A" required>
        </div>
        <div class="form-group">
          <label class="form-label" for="new-student-year">Kayıtlı Eğitim Yılı</label>
          <select id="new-student-year" class="form-select">
            ${allYears.map(y => `
              <option value="${y.id}" ${y.id === activeYear?.id ? 'selected' : ''}>
                ${UI.escapeHtml(y.code)} ${y.isCurrent ? '(Aktif)' : '(Arşiv)'}
              </option>
            `).join('')}
          </select>
        </div>
      </div>
    </form>
  `;

  const footerHtml = `
    <button type="button" class="btn btn-outline" onclick="UI.closeModal()">İptal</button>
    <button type="button" class="btn btn-primary" id="btn-save-student">${UI.Icons.check} Öğrenciyi Kaydet</button>
  `;

  UI.showModal('Yeni Öğrenci Kaydı', bodyHtml, footerHtml);

  document.getElementById('btn-save-student')?.addEventListener('click', async () => {
    const studentNo = document.getElementById('new-student-no')?.value.trim();
    const firstName = document.getElementById('new-student-fname')?.value.trim();
    const lastName = document.getElementById('new-student-lname')?.value.trim();
    const studentClass = document.getElementById('new-student-class')?.value.trim();
    const academicYearId = document.getElementById('new-student-year')?.value;

    if (!studentNo || !firstName || !lastName || !studentClass) {
      UI.showToast('Lütfen tüm zorunlu alanları doldurun.', 'warning');
      return;
    }

    try {
      const student = await Students.create({
        studentNo,
        firstName,
        lastName,
        class: studentClass,
        academicYearId,
        schoolId,
      });

      UI.closeModal();
      UI.showToast(`${firstName} ${lastName} öğrencisi başarıyla eklendi.`, 'success');
      if (refreshContainer) {
        await renderAdminStudents(refreshContainer);
      }
    } catch (err) {
      console.error('Öğrenci ekleme hatası:', err);
      UI.showToast(err.message || 'Öğrenci kaydedilirken bir hata oluştu.', 'error');
    }
  });
}

/* ============================================================
   ADMIN SECTION: PERSONEL YÖNETİMİ (Rapor Bölüm 8.2)
   ============================================================ */

async function renderAdminStaff(container) {
  const staffList = await Staff.getAll();
  const activeSchool = await Schools.getActiveSchool();

  container.innerHTML = `
    <div class="section">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md);flex-wrap:wrap;gap:var(--space-sm)">
        <div>
          <h2 class="section-title">Kayıtlı Okul Personeli (${staffList.length})</h2>
          <p style="font-size:var(--font-xs);color:var(--text-muted)">${UI.escapeHtml(activeSchool.name)} bünyesindeki öğretmen, idareci ve okul çalışanları.</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-add-staff">
          ${UI.Icons.plus} Yeni Personel Ekle
        </button>
      </div>

      <div class="card">
        <div class="card-body" style="padding:0">
          <div class="table-container" style="border:none">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Personel Ad Soyad</th>
                  <th>Branş / Görev</th>
                  <th>Kurumsal Rol</th>
                  <th>Telefon</th>
                  <th>Nöbet Günü</th>
                  <th>Durum</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                ${staffList.length > 0 ? staffList.map(s => {
                  const roleBadges = {
                    teacher: '<span class="badge badge-primary">Öğretmen</span>',
                    admin: '<span class="badge badge-danger">İdareci</span>',
                    counselor: '<span class="badge badge-purple">Rehberlik</span>',
                  };
                  return `
                    <tr>
                      <td>
                        <div style="display:flex;align-items:center;gap:var(--space-xs)">
                          ${UI.renderAvatar({ firstName: s.fullName.split(' ')[0], lastName: s.fullName.split(' ')[1] || '', avatarColor: SeedData.getAvatarColor(s.fullName) }, 'avatar-sm')}
                          <strong>${UI.escapeHtml(s.fullName)}</strong>
                        </div>
                      </td>
                      <td style="font-size:var(--font-sm)">${UI.escapeHtml(s.branch)}</td>
                      <td>${roleBadges[s.role] || s.role}</td>
                      <td style="font-size:var(--font-xs);color:var(--text-secondary)">${UI.escapeHtml(s.phone || '—')}</td>
                      <td style="font-size:var(--font-xs)">${UI.escapeHtml(s.dutyDay || '—')}</td>
                      <td>
                        <span class="badge ${s.status === 'active' ? 'badge-success' : 'badge-neutral'}">
                          ${s.status === 'active' ? 'Aktif' : 'Pasif'}
                        </span>
                      </td>
                      <td>
                        <button class="btn btn-outline btn-sm" style="font-size:11px;padding:2px 8px" onclick="toggleStaffMemberStatus('${s.id}')">
                          ${s.status === 'active' ? 'Pasife Al' : 'Aktifleştir'}
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('') : `
                  <tr><td colspan="7" style="text-align:center;padding:var(--space-xl);color:var(--text-muted)">Kayıtlı personel bulunamadı.</td></tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btn-add-staff')?.addEventListener('click', showAddStaffModal);
}

window.toggleStaffMemberStatus = async function(id) {
  await Staff.toggleStatus(id);
  UI.showToast('Personel durumu güncellendi.', 'success');
  const body = document.getElementById('admin-body');
  if (body) await renderAdminStaff(body);
};

function showAddStaffModal() {
  const bodyHtml = `
    <form id="add-staff-form">
      <div class="form-group">
        <label class="form-label" for="staff-name">Personel Ad Soyad <span style="color:var(--danger)">*</span></label>
        <input type="text" id="staff-name" class="form-input" placeholder="Örn: Mehmet Öztürk" required>
      </div>
      <div class="form-group">
        <label class="form-label" for="staff-branch">Branş / Alan</label>
        <input type="text" id="staff-branch" class="form-input" placeholder="Örn: Türk Dili, Matematik, Tarih...">
      </div>
      <div class="form-group">
        <label class="form-label" for="staff-role">Kurumsal Rol <span style="color:var(--danger)">*</span></label>
        <select id="staff-role" class="form-select">
          <option value="teacher">Öğretmen</option>
          <option value="admin">İdareci / Müdür Yrd.</option>
          <option value="counselor">Rehberlik Servisi</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label" for="staff-phone">Telefon Numarası</label>
        <input type="tel" id="staff-phone" class="form-input" placeholder="Örn: 0532 123 45 67">
      </div>
      <div class="form-group">
        <label class="form-label" for="staff-duty">Nöbet Günü</label>
        <select id="staff-duty" class="form-select">
          <option value="Pazartesi">Pazartesi</option>
          <option value="Salı">Salı</option>
          <option value="Çarşamba">Çarşamba</option>
          <option value="Perşembe">Perşembe</option>
          <option value="Cuma">Cuma</option>
          <option value="Hafta İçi">Hafta İçi (Genel)</option>
        </select>
      </div>
    </form>
  `;

  const footerHtml = `
    <button type="button" class="btn btn-outline" onclick="UI.closeModal()">İptal</button>
    <button type="button" class="btn btn-primary" id="btn-save-staff">${UI.Icons.check} Personeli Kaydet</button>
  `;

  UI.showModal('Yeni Okul Personeli Ekle', bodyHtml, footerHtml);

  document.getElementById('btn-save-staff')?.addEventListener('click', async () => {
    const name = document.getElementById('staff-name')?.value.trim();
    if (!name) {
      UI.showToast('Lütfen personel adını girin.', 'warning');
      return;
    }
    const branch = document.getElementById('staff-branch')?.value.trim() || 'Genel';
    const role = document.getElementById('staff-role')?.value || 'teacher';
    const phone = document.getElementById('staff-phone')?.value.trim();
    const dutyDay = document.getElementById('staff-duty')?.value || 'Pazartesi';

    await Staff.create({
      fullName: name,
      branch,
      role,
      phone,
      dutyDay,
      status: 'active',
    });

    UI.closeModal();
    UI.showToast(`${name} personeli başarıyla kaydedildi.`, 'success');
    const body = document.getElementById('admin-body');
    if (body) await renderAdminStaff(body);
  });
}

/* ============================================================
   ADMIN SECTION: XLSX İÇE AKTARIM (Rapor Bölüm 3)
   ============================================================ */

let currentImportMode = 'students';
let currentValidationResult = null;

async function renderAdminImporter(container) {
  const activeSchool = await Schools.getActiveSchool();

  container.innerHTML = `
    <div class="section">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md);flex-wrap:wrap;gap:var(--space-sm)">
        <div>
          <h2 class="section-title">XLSX / Excel İçe Aktarım (7 Adımlı Güvenli İş Akışı)</h2>
          <p style="font-size:var(--font-xs);color:var(--text-muted)">
            ${UI.escapeHtml(activeSchool.name)} • Veriler doğrudan yazılmaz; zorunlu alanlar, mükerrer numaralar ve hatalar önizlemede denetlenir.
          </p>
        </div>
        <div style="display:flex;gap:var(--space-sm)">
          <button class="btn btn-outline btn-sm" id="btn-download-sample-student">
            ${UI.Icons.download} Öğrenci Şablonu (.csv)
          </button>
          <button class="btn btn-outline btn-sm" id="btn-download-sample-staff">
            ${UI.Icons.download} Personel Şablonu (.csv)
          </button>
        </div>
      </div>

      <!-- Mode Selector -->
      <div class="import-mode-tabs" style="margin-bottom:var(--space-lg)">
        <button type="button" class="import-mode-btn ${currentImportMode === 'students' ? 'active' : ''}" data-mode="students">
          🎓 Öğrenci Kütüğü Aktarımı
        </button>
        <button type="button" class="import-mode-btn ${currentImportMode === 'staff' ? 'active' : ''}" data-mode="staff">
          👥 Okul Personel Kadrosu Aktarımı
        </button>
      </div>

      <!-- Step 1: Dropzone -->
      <div class="card" style="margin-bottom:var(--space-xl)">
        <div class="card-body">
          <div class="import-dropzone" id="import-dropzone">
            <div class="import-dropzone-icon">
              ${UI.Icons.fileSpreadsheet}
            </div>
            <h3 style="font-size:1.1rem;font-weight:700;color:var(--text-primary);margin-bottom:var(--space-xxs)">
              ${currentImportMode === 'students' ? 'Öğrenci Excel / CSV Dosyasını Sürükleyin' : 'Personel Excel / CSV Dosyasını Sürükleyin'}
            </h3>
            <p style="font-size:var(--font-sm);color:var(--text-muted);margin-bottom:var(--space-md)">
              .xlsx, .xls veya .csv uzantılı listeyi buraya bırakın veya bilgisayarınızdan seçin.
            </p>
            <input type="file" id="import-file-input" accept=".xlsx, .xls, .csv, text/csv" style="display:none">
            <button type="button" class="btn btn-primary" onclick="document.getElementById('import-file-input').click()">
              ${UI.Icons.fileText} Dosya Seç
            </button>
          </div>
        </div>
      </div>

      <!-- Result Container -->
      <div id="import-preview-area" style="display:none"></div>
    </div>
  `;

  // Mode tab switching
  document.querySelectorAll('.import-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentImportMode = btn.dataset.mode;
      currentValidationResult = null;
      renderAdminImporter(container);
    });
  });

  // Template downloads
  document.getElementById('btn-download-sample-student')?.addEventListener('click', () => {
    Importer.downloadSampleTemplate('student');
    UI.showToast('Örnek öğrenci şablonu indirildi.', 'info');
  });

  document.getElementById('btn-download-sample-staff')?.addEventListener('click', () => {
    Importer.downloadSampleTemplate('staff');
    UI.showToast('Örnek personel şablonu indirildi.', 'info');
  });

  // Drag and Drop
  const dropzone = document.getElementById('import-dropzone');
  const fileInput = document.getElementById('import-file-input');

  dropzone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone?.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone?.addEventListener('drop', async (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processSelectedImportFile(e.dataTransfer.files[0]);
    }
  });

  fileInput?.addEventListener('change', async (e) => {
    if (e.target.files && e.target.files[0]) {
      await processSelectedImportFile(e.target.files[0]);
    }
  });
}

async function processSelectedImportFile(file) {
  const previewArea = document.getElementById('import-preview-area');
  if (!previewArea) return;

  previewArea.style.display = 'block';
  previewArea.innerHTML = '<div class="loading-spinner" style="margin:var(--space-2xl) auto"></div>';

  try {
    const parsed = await Importer.parseUploadedFile(file);
    if (!parsed.rows || parsed.rows.length === 0) {
      previewArea.innerHTML = '<div class="card p-lg"><p style="color:var(--danger)">Dosyada okunabilir kayıt bulunamadı.</p></div>';
      return;
    }

    if (currentImportMode === 'students') {
      const mapping = Importer.autoMapStudentColumns(parsed.headers);
      const validation = await Importer.validateStudentsImport(parsed.rows, mapping);
      currentValidationResult = validation;
      renderStudentImportPreview(previewArea, file.name, mapping, validation);
    } else {
      const mapping = Importer.autoMapStaffColumns(parsed.headers);
      const validation = await Importer.validateStaffImport(parsed.rows, mapping);
      currentValidationResult = validation;
      renderStaffImportPreview(previewArea, file.name, mapping, validation);
    }
  } catch (err) {
    console.error('Import parse error:', err);
    previewArea.innerHTML = `<div class="card p-lg"><p style="color:var(--danger)">Dosya incelenirken hata oluştu: ${UI.escapeHtml(err.message)}</p></div>`;
  }
}

function renderStudentImportPreview(container, filename, mapping, validation) {
  const allPreviewRows = [
    ...validation.validNew.map(r => ({ ...r, _badge: '<span class="pill-status new">Yeni Eklenecek</span>' })),
    ...validation.validUpdates.map(r => ({ ...r, _badge: '<span class="pill-status update">Güncellenecek</span>' })),
    ...validation.rejected.map(r => ({ ...r, _badge: '<span class="pill-status reject">Hatalı / Atlanacak</span>' })),
  ];

  container.innerHTML = `
    <!-- Summary Cards -->
    <div class="import-stats-grid" style="margin-bottom:var(--space-xl)">
      <div class="import-stat-card new">
        <div class="import-stat-value">${validation.validNew.length}</div>
        <div>
          <div class="import-stat-label">Yeni Öğrenci</div>
          <div style="font-size:11px">Okul kütüğüne eklenecek</div>
        </div>
      </div>
      <div class="import-stat-card update">
        <div class="import-stat-value">${validation.validUpdates.length}</div>
        <div>
          <div class="import-stat-label">Güncellenecek</div>
          <div style="font-size:11px">Mevcut numarayla eşleşti</div>
        </div>
      </div>
      <div class="import-stat-card reject">
        <div class="import-stat-value">${validation.rejected.length}</div>
        <div>
          <div class="import-stat-label">Hatalı / Atlanacak</div>
          <div style="font-size:11px">Eksik/hatalı veri satırları</div>
        </div>
      </div>
    </div>

    <!-- Column Mapping Info -->
    <div class="card" style="margin-bottom:var(--space-xl)">
      <div class="card-header">
        <span class="card-header-title">${UI.Icons.checkCircle} Eşleşen Dosya Sütunları (${UI.escapeHtml(filename)})</span>
      </div>
      <div class="card-body">
        <div style="display:flex;flex-wrap:wrap;gap:var(--space-sm);font-size:var(--font-xs)">
          <span class="badge badge-neutral">Öğrenci No: <strong>${UI.escapeHtml(mapping.studentNo || 'Eşleşmedi')}</strong></span>
          <span class="badge badge-neutral">Ad: <strong>${UI.escapeHtml(mapping.firstName || 'Eşleşmedi')}</strong></span>
          <span class="badge badge-neutral">Soyad: <strong>${UI.escapeHtml(mapping.lastName || 'Eşleşmedi')}</strong></span>
          <span class="badge badge-neutral">Sınıf: <strong>${UI.escapeHtml(mapping.class || 'Eşleşmedi')}</strong></span>
        </div>
      </div>
    </div>

    <!-- Preview Table -->
    <div class="card" style="margin-bottom:var(--space-xl)">
      <div class="card-header">
        <span class="card-header-title">${UI.Icons.eye} Önizleme Tablosu (İlk 15 Kayıt)</span>
      </div>
      <div class="card-body" style="padding:0">
        <div class="table-container" style="border:none">
          <table class="data-table">
            <thead>
              <tr>
                <th>Durum</th>
                <th>Öğrenci No</th>
                <th>Ad</th>
                <th>Soyad</th>
                <th>Sınıf</th>
                <th>Hata / Açıklama</th>
              </tr>
            </thead>
            <tbody>
              ${allPreviewRows.slice(0, 15).map(r => `
                <tr>
                  <td>${r._badge}</td>
                  <td><strong>${UI.escapeHtml(r.studentNo || '—')}</strong></td>
                  <td>${UI.escapeHtml(r.firstName || '—')}</td>
                  <td>${UI.escapeHtml(r.lastName || '—')}</td>
                  <td><span class="badge badge-neutral">${UI.escapeHtml(r.class || '—')}</span></td>
                  <td style="font-size:var(--font-xs);color:${r.errors && r.errors.length > 0 ? 'var(--danger)' : 'var(--text-muted)'}">
                    ${r.errors && r.errors.length > 0 ? r.errors.join(', ') : 'Uygun'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Action Confirmation -->
    <div style="display:flex;justify-content:flex-end;gap:var(--space-md)">
      <button type="button" class="btn btn-outline btn-lg" onclick="document.getElementById('import-preview-area').style.display='none'">
        İptal
      </button>
      <button type="button" class="btn btn-success btn-lg" id="btn-commit-import" ${validation.validNew.length + validation.validUpdates.length === 0 ? 'disabled' : ''}>
        ${UI.Icons.check} Onayla ve Aktar (${validation.validNew.length + validation.validUpdates.length} Öğrenci)
      </button>
    </div>
  `;

  document.getElementById('btn-commit-import')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-commit-import');
    if (btn) btn.disabled = true;

    try {
      const summary = await Importer.commitStudentImport(validation);
      UI.showToast(`Öğrenci aktarımı başarılı: ${summary.insertedCount} yeni eklendi, ${summary.updatedCount} güncellendi.`, 'success', 5000);
      document.querySelector('.sidebar-nav-item[data-section="students"]')?.click();
    } catch (err) {
      console.error('Import commit error:', err);
      UI.showToast('Aktarım sırasında hata: ' + err.message, 'error');
      if (btn) btn.disabled = false;
    }
  });
}

function renderStaffImportPreview(container, filename, mapping, validation) {
  const allPreviewRows = [
    ...validation.validNew.map(r => ({ ...r, _badge: '<span class="pill-status new">Yeni Eklenecek</span>' })),
    ...validation.validUpdates.map(r => ({ ...r, _badge: '<span class="pill-status update">Güncellenecek</span>' })),
    ...validation.rejected.map(r => ({ ...r, _badge: '<span class="pill-status reject">Hatalı / Atlanacak</span>' })),
  ];

  container.innerHTML = `
    <!-- Stats Cards -->
    <div class="import-stats-grid" style="margin-bottom:var(--space-xl)">
      <div class="import-stat-card new">
        <div class="import-stat-value">${validation.validNew.length}</div>
        <div>
          <div class="import-stat-label">Yeni Personel</div>
          <div style="font-size:11px">Okul kadrosuna eklenecek</div>
        </div>
      </div>
      <div class="import-stat-card update">
        <div class="import-stat-value">${validation.validUpdates.length}</div>
        <div>
          <div class="import-stat-label">Güncellenecek</div>
          <div style="font-size:11px">Mevcut personeller</div>
        </div>
      </div>
      <div class="import-stat-card reject">
        <div class="import-stat-value">${validation.rejected.length}</div>
        <div>
          <div class="import-stat-label">Hatalı Satır</div>
          <div style="font-size:11px">Atlanacak satırlar</div>
        </div>
      </div>
    </div>

    <!-- Preview Table -->
    <div class="card" style="margin-bottom:var(--space-xl)">
      <div class="card-header">
        <span class="card-header-title">${UI.Icons.eye} Personel Önizleme Tablosu</span>
      </div>
      <div class="card-body" style="padding:0">
        <div class="table-container" style="border:none">
          <table class="data-table">
            <thead>
              <tr>
                <th>Durum</th>
                <th>Ad Soyad</th>
                <th>Branş</th>
                <th>Rol</th>
                <th>Telefon</th>
                <th>Açıklama</th>
              </tr>
            </thead>
            <tbody>
              ${allPreviewRows.slice(0, 15).map(r => `
                <tr>
                  <td>${r._badge}</td>
                  <td><strong>${UI.escapeHtml(r.fullName || '—')}</strong></td>
                  <td>${UI.escapeHtml(r.branch || '—')}</td>
                  <td><span class="badge badge-neutral">${UI.escapeHtml(r.role || '—')}</span></td>
                  <td>${UI.escapeHtml(r.phone || '—')}</td>
                  <td style="font-size:var(--font-xs);color:${r.errors && r.errors.length > 0 ? 'var(--danger)' : 'var(--text-muted)'}">
                    ${r.errors && r.errors.length > 0 ? r.errors.join(', ') : 'Uygun'}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div style="display:flex;justify-content:flex-end;gap:var(--space-md)">
      <button type="button" class="btn btn-outline btn-lg" onclick="document.getElementById('import-preview-area').style.display='none'">
        İptal
      </button>
      <button type="button" class="btn btn-success btn-lg" id="btn-commit-staff-import" ${validation.validNew.length + validation.validUpdates.length === 0 ? 'disabled' : ''}>
        ${UI.Icons.check} Onayla ve Personelleri Aktar
      </button>
    </div>
  `;

  document.getElementById('btn-commit-staff-import')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-commit-staff-import');
    if (btn) btn.disabled = true;

    try {
      const summary = await Importer.commitStaffImport(validation);
      UI.showToast(`Personel aktarımı başarılı: ${summary.insertedCount} yeni eklendi, ${summary.updatedCount} güncellendi.`, 'success', 5000);
      document.querySelector('.sidebar-nav-item[data-section="staff"]')?.click();
    } catch (err) {
      console.error('Staff import error:', err);
      UI.showToast('Aktarım hatası: ' + err.message, 'error');
      if (btn) btn.disabled = false;
    }
  });
}

/* ============================================================
   ADMIN SECTION: GELİŞMİŞ RAPORLAMA VE ANALİZ (Rapor Bölüm 6)
   ============================================================ */

let reportFilters = {
  preset: 'all',
  academicYearId: undefined,
  class: 'all',
  category: 'all',
  createdBy: 'all',
  repeatCondition: 'all',
  dateFrom: '',
  dateTo: '',
};

async function renderAdminReports(container) {
  const activeSchool = await Schools.getActiveSchool();
  const [classes, staffList, allStudents, allYears, activeYear] = await Promise.all([
    Students.getClasses(),
    Staff.getAll(),
    Students.getAll(),
    AcademicYears.getAll(activeSchool.id),
    AcademicYears.getActiveYear(activeSchool.id),
  ]);

  if (reportFilters.academicYearId === undefined) {
    reportFilters.academicYearId = activeYear ? activeYear.id : 'all';
  }

  // Apply filters
  const filterParams = {
    academicYearId: reportFilters.academicYearId === 'all' ? undefined : reportFilters.academicYearId,
    class: reportFilters.class,
    category: reportFilters.category,
    createdBy: reportFilters.createdBy,
    repeatCondition: reportFilters.repeatCondition,
    dateFrom: reportFilters.dateFrom,
    dateTo: reportFilters.dateTo,
  };

  const filteredRecords = await Records.getAll(filterParams);
  const studentMap = {};
  allStudents.forEach(s => studentMap[s.id] = s);

  // Stats computation
  const uniqueStudentIds = new Set(filteredRecords.map(r => r.studentId));
  const duplicateRecords = filteredRecords.filter(r => r.isDuplicateConfirmed);
  const byClass = {};
  filteredRecords.forEach(r => {
    const s = studentMap[r.studentId];
    const cls = r.studentClass || (s && s.class);
    if (cls) {
      byClass[cls] = (byClass[cls] || 0) + 1;
    }
  });

  const catCounts = {};
  SeedData.CATEGORIES.forEach(c => catCounts[c] = 0);
  filteredRecords.forEach(r => {
    if (catCounts[r.category] !== undefined) catCounts[r.category]++;
  });
  const maxCatCount = Math.max(...Object.values(catCounts), 1);

  container.innerHTML = `
    <div class="section">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md);flex-wrap:wrap;gap:var(--space-sm)">
        <div>
          <h2 class="section-title">Gelişmiş Raporlama & Analitik (${filteredRecords.length} Kayıt)</h2>
          <p style="font-size:var(--font-xs);color:var(--text-muted)">
            ${UI.escapeHtml(activeSchool.name)} • Çoklu filtreler, analiz grafikleri ve dışa aktarım araçları.
          </p>
        </div>
        <div style="display:flex;gap:var(--space-sm);flex-wrap:wrap">
          <button class="btn btn-outline btn-sm" id="btn-export-excel" style="font-weight:700">
            ${UI.Icons.fileSpreadsheet} XLSX İndir
          </button>
          <button class="btn btn-outline btn-sm" id="btn-export-csv" style="font-weight:700">
            ${UI.Icons.download} CSV İndir
          </button>
          <button class="btn btn-ghost btn-sm" onclick="window.print()" style="font-weight:700">
            ${UI.Icons.printer} Yazdır / PDF
          </button>
        </div>
      </div>

      <!-- Multi-Filter Bar (Rapor Bölüm 6.1) -->
      <div class="reports-filter-bar">
        <div class="filter-item">
          <label class="filter-label">Eğitim Yılı</label>
          <select id="rf-year" class="form-select form-select-sm" style="font-weight:600">
            <option value="all" ${reportFilters.academicYearId === 'all' ? 'selected' : ''}>Tüm Yıllar (Arşiv Dahil)</option>
            ${allYears.map(y => `
              <option value="${y.id}" ${reportFilters.academicYearId === y.id ? 'selected' : ''}>
                ${UI.escapeHtml(y.name)} ${y.isCurrent ? '(Aktif)' : ''}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="filter-item">
          <label class="filter-label">Tarih Aralığı</label>
          <select id="rf-preset" class="form-select form-select-sm">
            <option value="all" ${reportFilters.preset === 'all' ? 'selected' : ''}>Tüm Zamanlar</option>
            <option value="today" ${reportFilters.preset === 'today' ? 'selected' : ''}>Bugün</option>
            <option value="week" ${reportFilters.preset === 'week' ? 'selected' : ''}>Son 7 Gün</option>
            <option value="month" ${reportFilters.preset === 'month' ? 'selected' : ''}>Bu Ay (30 Gün)</option>
            <option value="custom" ${reportFilters.preset === 'custom' ? 'selected' : ''}>Özel Tarih Aralığı</option>
          </select>
        </div>

        <div class="filter-item" id="rf-custom-date" style="${reportFilters.preset === 'custom' ? 'display:flex' : 'display:none'};flex-direction:row;gap:4px">
          <input type="date" id="rf-date-from" class="form-input form-input-sm" value="${reportFilters.dateFrom}">
          <input type="date" id="rf-date-to" class="form-input form-input-sm" value="${reportFilters.dateTo}">
        </div>

        <div class="filter-item">
          <label class="filter-label">Sınıf</label>
          <select id="rf-class" class="form-select form-select-sm">
            <option value="all">Tüm Sınıflar</option>
            ${classes.map(c => `<option value="${c}" ${reportFilters.class === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>

        <div class="filter-item">
          <label class="filter-label">Kural Kategorisi</label>
          <select id="rf-category" class="form-select form-select-sm">
            <option value="all">Tüm Kurallar</option>
            ${SeedData.CATEGORIES.map(cat => `
              <option value="${cat}" ${reportFilters.category === cat ? 'selected' : ''}>
                ${UI.escapeHtml(SeedData.CATEGORY_LABELS[cat])}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="filter-item">
          <label class="filter-label">Yetkili / Öğretmen</label>
          <select id="rf-staff" class="form-select form-select-sm">
            <option value="all">Tüm Personel</option>
            ${staffList.map(st => `
              <option value="${st.fullName} (${Staff.ROLE_LABELS[st.role] || st.role})" ${reportFilters.createdBy.includes(st.fullName) ? 'selected' : ''}>
                ${UI.escapeHtml(st.fullName)}
              </option>
            `).join('')}
          </select>
        </div>

        <div class="filter-item">
          <label class="filter-label">Tekrar Durumu</label>
          <select id="rf-repeat" class="form-select form-select-sm">
            <option value="all" ${reportFilters.repeatCondition === 'all' ? 'selected' : ''}>Tüm Kayıtlar</option>
            <option value="repeat_only" ${reportFilters.repeatCondition === 'repeat_only' ? 'selected' : ''}>Yalnızca Aynı Gün Tekrarlayanlar</option>
          </select>
        </div>

        <div class="filter-item">
          <button type="button" class="btn btn-outline btn-sm" id="btn-reset-filters">
            Filtreleri Sıfırla
          </button>
        </div>
      </div>

      <!-- 4 Executive Stat Cards -->
      <div class="stats-grid" style="margin-bottom:var(--space-xl)">
        <div class="stat-card">
          <div class="stat-icon blue">${UI.Icons.fileText}</div>
          <div class="stat-info">
            <div class="stat-value">${filteredRecords.length}</div>
            <div class="stat-label">Filtrelenen Düzen Kaydı</div>
            <div class="stat-subtext">Seçili kriterlerdeki kayıt</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon orange">${UI.Icons.refreshCw}</div>
          <div class="stat-info">
            <div class="stat-value">${duplicateRecords.length}</div>
            <div class="stat-label">Aynı Gün Tekrar Kaydı</div>
            <div class="stat-subtext">Uyarılı kaydedilen tekrarlar</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon green">${UI.Icons.users}</div>
          <div class="stat-info">
            <div class="stat-value" style="color:var(--success)">${uniqueStudentIds.size}</div>
            <div class="stat-label">Kayıt Alan Öğrenci</div>
            <div class="stat-subtext">Farklı öğrenci sayısı</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon purple" style="background:#f3e8ff;color:#7e22ce">${UI.Icons.barChart}</div>
          <div class="stat-info">
            <div class="stat-value" style="color:#7e22ce">${Object.keys(byClass).length}</div>
            <div class="stat-label">Kapsanan Sınıf</div>
            <div class="stat-subtext">Kayıt bildirilen şubeler</div>
          </div>
        </div>
      </div>

      <div class="content-grid" style="grid-template-columns:1fr 1fr;gap:var(--space-xl);margin-bottom:var(--space-xl)">
        <!-- Left: Category Distribution -->
        <div class="card">
          <div class="card-header">
            <span class="card-header-title">Kural Kategorisi Dağılımı</span>
          </div>
          <div class="card-body">
            ${SeedData.CATEGORIES.map(cat => {
              const count = catCounts[cat];
              const pct = Math.round((count / maxCatCount) * 100);
              return `
                <div style="margin-bottom:var(--space-md)">
                  <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                    <span style="font-size:var(--font-sm);font-weight:600">${UI.escapeHtml(SeedData.CATEGORY_LABELS[cat])}</span>
                    <span style="font-size:var(--font-sm);color:var(--text-muted)">${count} (%${filteredRecords.length ? Math.round(count / filteredRecords.length * 100) : 0})</span>
                  </div>
                  <div style="height:8px;background:var(--bg-input);border-radius:var(--radius-full);overflow:hidden">
                    <div style="height:100%;width:${pct}%;background:var(--accent);border-radius:var(--radius-full)"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Right: Class Distribution -->
        <div class="card">
          <div class="card-header">
            <span class="card-header-title">Sınıflara Göre Dağılım</span>
          </div>
          <div class="card-body">
            ${Object.keys(byClass).sort().length > 0 ? Object.entries(byClass).sort(([a],[b]) => a.localeCompare(b)).map(([cls, count]) => {
              const maxC = Math.max(...Object.values(byClass), 1);
              const pct = Math.round((count / maxC) * 100);
              return `
                <div style="margin-bottom:var(--space-md)">
                  <div style="display:flex;justify-content:space-between;margin-bottom:4px">
                    <span style="font-size:var(--font-sm);font-weight:600">${UI.escapeHtml(cls)}</span>
                    <span style="font-size:var(--font-sm);color:var(--text-muted)">${count} bildirim</span>
                  </div>
                  <div style="height:8px;background:var(--bg-input);border-radius:var(--radius-full);overflow:hidden">
                    <div style="height:100%;width:${pct}%;background:var(--success);border-radius:var(--radius-full)"></div>
                  </div>
                </div>
              `;
            }).join('') : '<p style="color:var(--text-muted);text-align:center;padding:var(--space-xl)">Kayıt bulunmuyor.</p>'}
          </div>
        </div>
      </div>

      <!-- Filtered Records Table -->
      <div class="card">
        <div class="card-header">
          <span class="card-header-title">${UI.Icons.fileText} Filtrelenmiş Düzen Kayıtları Listesi (${filteredRecords.length})</span>
        </div>
        <div class="card-body" style="padding:0">
          <div class="table-container" style="border:none">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Tarih / Saat</th>
                  <th>Öğrenci</th>
                  <th>Sınıf</th>
                  <th>Kural Konusu</th>
                  <th>Açıklama</th>
                  <th>Tekrar Durumu</th>
                  <th>Yetkili</th>
                </tr>
              </thead>
              <tbody>
                ${filteredRecords.length > 0 ? filteredRecords.slice(0, 50).map(r => {
                  const student = studentMap[r.studentId];
                  return `
                    <tr style="cursor:pointer" onclick="Router.navigate(Router.ROUTES.STUDENT_DETAIL, {id:'${r.studentId}'})">
                      <td style="white-space:nowrap;font-size:var(--font-xs)">${UI.formatDateTime(r.dateTime)}</td>
                      <td>
                        <div style="display:flex;align-items:center;gap:var(--space-xs)">
                          ${student ? UI.renderAvatar(student, 'avatar-sm') : ''}
                          <strong>${student ? UI.escapeHtml(student.firstName + ' ' + student.lastName) : '—'}</strong>
                        </div>
                      </td>
                      <td><span class="badge badge-neutral">${UI.escapeHtml(r.studentClass || (student ? student.class : '—'))}</span></td>
                      <td>${UI.getCategoryBadge(r.category)}</td>
                      <td style="font-size:var(--font-xs);max-width:250px">${UI.escapeHtml(r.description || '—')}</td>
                      <td>
                        ${r.isDuplicateConfirmed
                          ? `<span class="badge badge-warning" title="${UI.escapeHtml(r.duplicateReason || 'Aynı gün tekrarı')}">Aynı Gün Tekrarı</span>`
                          : `<span class="badge badge-neutral">İlk Kayıt</span>`
                        }
                      </td>
                      <td style="font-size:var(--font-xs);color:var(--text-secondary)">${UI.escapeHtml(r.createdBy)}</td>
                    </tr>
                  `;
                }).join('') : `
                  <tr><td colspan="7" style="text-align:center;padding:var(--space-xl);color:var(--text-muted)">Seçili filtrelerle eşleşen kayıt bulunamadı.</td></tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach filter change listeners
  document.getElementById('rf-year')?.addEventListener('change', async (e) => {
    reportFilters.academicYearId = e.target.value;
    await renderAdminReports(container);
  });

  document.getElementById('rf-preset')?.addEventListener('change', async (e) => {
    reportFilters.preset = e.target.value;
    const now = new Date();
    if (reportFilters.preset === 'today') {
      reportFilters.dateFrom = now.toISOString().slice(0, 10);
      reportFilters.dateTo = now.toISOString().slice(0, 10);
    } else if (reportFilters.preset === 'week') {
      const past = new Date(now.getTime() - 7 * 86400000);
      reportFilters.dateFrom = past.toISOString().slice(0, 10);
      reportFilters.dateTo = now.toISOString().slice(0, 10);
    } else if (reportFilters.preset === 'month') {
      const past = new Date(now.getTime() - 30 * 86400000);
      reportFilters.dateFrom = past.toISOString().slice(0, 10);
      reportFilters.dateTo = now.toISOString().slice(0, 10);
    } else if (reportFilters.preset === 'all') {
      reportFilters.dateFrom = '';
      reportFilters.dateTo = '';
    }
    await renderAdminReports(container);
  });

  document.getElementById('rf-date-from')?.addEventListener('change', async (e) => {
    reportFilters.dateFrom = e.target.value;
    await renderAdminReports(container);
  });

  document.getElementById('rf-date-to')?.addEventListener('change', async (e) => {
    reportFilters.dateTo = e.target.value;
    await renderAdminReports(container);
  });

  document.getElementById('rf-class')?.addEventListener('change', async (e) => {
    reportFilters.class = e.target.value;
    await renderAdminReports(container);
  });

  document.getElementById('rf-category')?.addEventListener('change', async (e) => {
    reportFilters.category = e.target.value;
    await renderAdminReports(container);
  });

  document.getElementById('rf-staff')?.addEventListener('change', async (e) => {
    reportFilters.createdBy = e.target.value;
    await renderAdminReports(container);
  });

  document.getElementById('rf-repeat')?.addEventListener('change', async (e) => {
    reportFilters.repeatCondition = e.target.value;
    await renderAdminReports(container);
  });

  document.getElementById('btn-reset-filters')?.addEventListener('click', async () => {
    reportFilters = {
      preset: 'all',
      academicYearId: activeYear ? activeYear.id : 'all',
      class: 'all',
      category: 'all',
      createdBy: 'all',
      repeatCondition: 'all',
      dateFrom: '',
      dateTo: '',
    };
    await renderAdminReports(container);
  });

  // Export handlers
  document.getElementById('btn-export-excel')?.addEventListener('click', async () => {
    const rows = filteredRecords.map(r => {
      const s = studentMap[r.studentId];
      const yr = allYears.find(y => y.id === r.academicYearId);
      const dt = new Date(r.dateTime);
      return {
        'Tarih': dt.toLocaleDateString('tr-TR'),
        'Saat': dt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        'Eğitim Yılı': yr ? yr.code : '',
        'Öğrenci No': s ? s.studentNo : '',
        'Ad Soyad': s ? `${s.firstName} ${s.lastName}` : '',
        'Sınıf': r.studentClass || (s ? s.class : ''),
        'Kural Konusu': SeedData.CATEGORY_LABELS[r.category] || r.category,
        'Açıklama': r.description || '',
        'Tekrar Durumu': r.isDuplicateConfirmed ? `Aynı Gün Tekrarı (${r.duplicateReason || ''})` : 'İlk Kayıt',
        'Kaydı Oluşturan': r.createdBy || '',
      };
    });

    const safeSchoolName = (activeSchool?.name || 'ODIS').replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ]+/g, '_');
    UI.exportToExcel(`${safeSchoolName}_Duzen_Raporu_${new Date().toISOString().slice(0, 10)}`, rows, 'DuzenRaporu');

    await Audit.log({
      action: 'EXPORT_REPORT_EXCEL',
      entityType: 'report',
      details: `${rows.length} kayıt içeren analiz raporu XLSX olarak indirildi.`,
    });
  });

  document.getElementById('btn-export-csv')?.addEventListener('click', async () => {
    await exportRecordsToCsv(filterParams);
  });
}

/* ============================================================
   ADMIN SECTION: SİSTEM DENETİM GÜNLÜĞÜ (Rapor Bölüm 7)
   ============================================================ */

async function renderAdminAudit(container) {
  const activeSchool = await Schools.getActiveSchool();
  const logs = await Audit.getAll();

  container.innerHTML = `
    <div class="section">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md);flex-wrap:wrap;gap:var(--space-sm)">
        <div>
          <h2 class="section-title">Sistem Denetim Günlüğü (Audit Trail)</h2>
          <p style="font-size:var(--font-xs);color:var(--text-muted)">
            ${UI.escapeHtml(activeSchool.name)} • KVKK, veri güvenliği ve işlem izlenebilirliği kayıtları.
          </p>
        </div>
        <span class="badge badge-purple">${logs.length} Denetim Kaydı</span>
      </div>

      <div class="card">
        <div class="card-body" style="padding:0">
          <div class="table-container" style="border:none">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Tarih / Saat</th>
                  <th>Kullanıcı / Yetkili</th>
                  <th>Rol</th>
                  <th>İşlem Kodu</th>
                  <th>İşlem Detayları</th>
                </tr>
              </thead>
              <tbody>
                ${logs.length > 0 ? logs.map(l => {
                  const actionBadges = {
                    USER_LOGIN: '<span class="badge badge-purple">Giriş Yapıldı</span>',
                    USER_LOGOUT: '<span class="badge badge-neutral">Çıkış Yapıldı</span>',
                    CREATE_ORDER_RECORD: '<span class="badge badge-info">Düzen Kaydı</span>',
                    CONFIRM_DUPLICATE_RECORD: '<span class="badge badge-warning">Tekrar Onayı</span>',
                    IMPORT_XLSX_STUDENTS: '<span class="badge badge-success">XLSX Öğrenci</span>',
                    IMPORT_XLSX_STAFF: '<span class="badge badge-success">XLSX Personel</span>',
                    CREATE_STUDENT: '<span class="badge badge-primary">Öğrenci Eklendi</span>',
                    UPDATE_STUDENT: '<span class="badge badge-neutral">Öğrenci Güncellendi</span>',
                    CREATE_STAFF: '<span class="badge badge-primary">Personel Eklendi</span>',
                    SWITCH_SCHOOL: '<span class="badge badge-warning">Okul Değişti</span>',
                    EXPORT_REPORT_EXCEL: '<span class="badge badge-neutral">Excel İndirildi</span>',
                  };
                  return `
                    <tr>
                      <td style="white-space:nowrap;font-size:var(--font-xs)">${UI.formatDateTime(l.timestamp)}</td>
                      <td><strong>${UI.escapeHtml(l.userName || l.userId)}</strong></td>
                      <td><span class="badge badge-neutral">${UI.escapeHtml(l.userRole || '—')}</span></td>
                      <td>${actionBadges[l.action] || `<span class="badge badge-neutral">${l.action}</span>`}</td>
                      <td style="font-size:var(--font-xs);color:var(--text-secondary);max-width:350px">
                        ${UI.escapeHtml(l.details || '—')}
                      </td>
                    </tr>
                  `;
                }).join('') : `
                  <tr><td colspan="5" style="text-align:center;padding:var(--space-xl);color:var(--text-muted)">Henüz denetim kaydı bulunmuyor.</td></tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Export records to CSV (Authorized & anonymized format).
 */
async function exportRecordsToCsv(filters = {}) {
  try {
    const activeSchool = await Schools.getActiveSchool();
    const schoolId = filters.schoolId || activeSchool.id;
    const records = await Records.getRecentWithStudents(2000, { ...filters, schoolId });
    if (!records || records.length === 0) {
      UI.showToast('Dışa aktarılacak düzen kaydı bulunmuyor.', 'warning');
      return;
    }

    const headers = ['Tarih', 'Saat', 'Öğrenci No', 'Sınıf', 'Kural Türü', 'Açıklama', 'Yetkili'];
    const rows = records.map(r => {
      const dt = new Date(r.dateTime);
      const dateStr = dt.toLocaleDateString('tr-TR');
      const timeStr = dt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      return [
        dateStr,
        timeStr,
        r.student ? r.student.studentNo : '',
        r.studentClass || (r.student ? r.student.class : ''),
        SeedData.CATEGORY_LABELS[r.category] || r.category,
        `"${(r.description || '').replace(/"/g, '""')}"`,
        r.createdBy || ''
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeSchoolName = (activeSchool?.name || 'ODIS').replace(/[^a-zA-Z0-9ğüşıöçĞÜŞİÖÇ]+/g, '_');
    a.download = `${safeSchoolName}_Duzen_Raporu_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    UI.showToast(`${activeSchool.name} düzen kayıtları CSV olarak indirildi.`, 'success');
  } catch (err) {
    console.error('CSV export hatası:', err);
    UI.showToast('CSV dışa aktarılırken bir hata oluştu.', 'error');
  }
}
window.exportRecordsToCsv = exportRecordsToCsv;


function showAddActionModal(studentId) {
  const now = new Date();
  const dateValue = now.toISOString().slice(0, 10);

  const bodyHtml = `
    <form id="action-form" novalidate>
      <div class="form-group">
        <label class="form-label">İdari İşlem Türü <span style="color:var(--danger)">*</span></label>
        <select class="form-select" id="action-type-select" required>
          ${SeedData.ACTION_TYPES.map(type => `
            <option value="${type}">${UI.escapeHtml(SeedData.ACTION_TYPE_LABELS[type])}</option>
          `).join('')}
        </select>
      </div>

      <div class="form-group">
        <label class="form-label" for="action-date">Tarih</label>
        <input type="date" class="form-input" id="action-date" value="${dateValue}">
      </div>

      <div class="form-group">
        <label class="form-label" for="action-description">İdari Not / Karar Özeti <span style="color:var(--danger)">*</span></label>
        <textarea class="form-textarea" id="action-description" placeholder="Örn: Veli ile görüşüldü, kurallar hatırlatıldı..." rows="3" required></textarea>
      </div>
    </form>
  `;

  const footerHtml = `
    <button class="btn btn-outline" onclick="UI.closeModal()">İptal</button>
    <button class="btn btn-success" id="save-action-btn">${UI.Icons.check} Kaydet</button>
  `;

  UI.showModal('İdari İşlem Ekle', bodyHtml, footerHtml);

  document.getElementById('save-action-btn')?.addEventListener('click', async () => {
    const actionType = document.getElementById('action-type-select').value;
    const desc = document.getElementById('action-description').value.trim();

    if (!desc) {
      UI.showToast('Lütfen idari not yazın.', 'warning');
      return;
    }

    try {
      await AdminActions.create({
        studentId,
        actionType,
        description: desc,
        date: document.getElementById('action-date').value || new Date().toISOString(),
        createdBy: Auth.getDisplayName(),
      });

      if (actionType === 'rehberlik' && window.SupportCases) {
        await SupportCases.create({
          studentId,
          title: `İdari Sevk: ${desc.slice(0, 50)}`,
          notes: `İdare tarafından yönlendirildi: ${desc}`,
          assignedTo: 'Rehberlik Servisi',
          schoolId: Auth.getCurrentSchoolId(),
        });
      }

      UI.closeModal();
      UI.showToast('İdari işlem kaydedildi (Değerlendirme noktası işlendi).', 'success');
      Router.navigate(Router.ROUTES.STUDENT_DETAIL, { id: studentId });
    } catch (err) {
      console.error(err);
      UI.showToast('İşlem kaydedilemedi.', 'error');
    }
  });
}

/* ============================================================
   ADMIN SECTION: TEKRAR ANALİZİ VE TAKİP LİSTESİ (PDF Sayfa 6)
   ============================================================ */
async function renderAdminRepeats(container) {
  const schoolId = Auth.getCurrentSchoolId();
  const activeYear = await AcademicYears.getActiveYear(schoolId);
  const studentsWithStatus = await Students.getWithCounts(schoolId, activeYear.id);
  const classes = await Students.getClasses(schoolId);

  container.innerHTML = `
    <div class="section">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-md);flex-wrap:wrap;gap:var(--space-sm)">
        <div>
          <h2 class="section-title">Tekrar Analizi ve Karar Destek Takip Listesi</h2>
          <p style="font-size:var(--font-xs);color:var(--text-muted)">
            ODİS v1 • Aktif Dönem (${UI.escapeHtml(activeYear.code)}) • 🟢 Normal, 🟠 Tekrarlayan ve 🔴 Yoğun Tekrar Durumları
          </p>
        </div>
        <div style="display:flex;gap:var(--space-xs);flex-wrap:wrap">
          <button class="btn btn-sm btn-outline repeat-filter-btn active" data-filter="all">Tümü</button>
          <button class="btn btn-sm btn-outline repeat-filter-btn" data-filter="red" style="color:#b91c1c">🔴 Yoğun Tekrar</button>
          <button class="btn btn-sm btn-outline repeat-filter-btn" data-filter="orange" style="color:#c2410c">🟠 Tekrarlayan Durum</button>
          <button class="btn btn-sm btn-outline repeat-filter-btn" data-filter="post_admin" style="color:#854d0e">⚡ İşlem Sonrası Tekrar</button>
        </div>
      </div>

      <div class="filters-bar" style="margin-bottom:var(--space-md);flex-wrap:wrap;gap:var(--space-sm)">
        <div class="search-box" style="flex:1;min-width:200px;max-width:320px">
          <span class="search-icon">${UI.Icons.search}</span>
          <input type="text" class="form-input" id="repeat-search-input" placeholder="Öğrenci no veya ad soyad...">
        </div>
        <select class="form-select" id="repeat-class-filter" style="width:auto;border-radius:var(--radius-full);font-size:var(--font-sm)">
          <option value="">Tüm Sınıflar</option>
          ${classes.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>

      <div class="card">
        <div class="card-body" style="padding:0">
          <div class="table-container" style="border:none">
            <table class="data-table" id="repeat-table">
              <thead>
                <tr>
                  <th>Öğrenci</th>
                  <th>Sınıf</th>
                  <th>Durum Göstergesi</th>
                  <th>30 Günlük Kayıt</th>
                  <th>Tekrar Tetikleme Gerekçesi</th>
                  <th style="text-align:right">İdari Aksiyon</th>
                </tr>
              </thead>
              <tbody id="repeat-tbody">
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;

  let currentLevelFilter = 'all';

  function updateTable() {
    const q = (document.getElementById('repeat-search-input')?.value || '').toLowerCase().trim();
    const classVal = document.getElementById('repeat-class-filter')?.value || '';
    const tbody = document.getElementById('repeat-tbody');
    if (!tbody) return;

    let filtered = studentsWithStatus.filter(s => {
      const name = `${s.firstName} ${s.lastName}`.toLowerCase();
      const matchQ = !q || name.includes(q) || s.studentNo.includes(q);
      const matchClass = !classVal || s.class === classVal;
      let matchLevel = true;
      if (currentLevelFilter === 'red') matchLevel = s.status?.level === 'red';
      else if (currentLevelFilter === 'orange') matchLevel = s.status?.level === 'orange';
      else if (currentLevelFilter === 'post_admin') matchLevel = Boolean(s.status?.isPostAdminRepeat);

      return matchQ && matchClass && matchLevel;
    });

    const priority = { red: 3, orange: 2, green: 1 };
    filtered.sort((a, b) => {
      if (a.status?.isPostAdminRepeat !== b.status?.isPostAdminRepeat) {
        return a.status?.isPostAdminRepeat ? -1 : 1;
      }
      return (priority[b.status?.level || 'green'] || 0) - (priority[a.status?.level || 'green'] || 0);
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:var(--space-xl);color:var(--text-muted)">Kriterlere uygun öğrenci bulunamadı.</td></tr>`;
      return;
    }

    tbody.innerHTML = filtered.map(s => {
      const st = s.status || { level: 'green', label: 'Normal Takip', reasons: [] };
      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:var(--space-xs);cursor:pointer" onclick="Router.navigate(Router.ROUTES.STUDENT_DETAIL, {id:'${s.id}'})">
              ${UI.renderAvatar(s, 'avatar-sm')}
              <div>
                <strong style="color:var(--text-primary)">${UI.escapeHtml(s.firstName + ' ' + s.lastName)}</strong>
                <div style="font-size:11px;color:var(--text-muted)">No: ${UI.escapeHtml(s.studentNo)}</div>
              </div>
            </div>
          </td>
          <td><span class="badge badge-neutral">${UI.escapeHtml(s.class)}</span></td>
          <td>${window.StatusEngine ? window.StatusEngine.renderStatusPill(st) : ''}</td>
          <td><strong>${s.recordCount}</strong></td>
          <td style="font-size:var(--font-xs);color:var(--text-secondary);max-width:320px">
            ${(st.reasons || []).join(' • ') || '—'}
          </td>
          <td style="text-align:right;white-space:nowrap">
            <div style="display:inline-flex;gap:4px">
              <button class="btn btn-sm btn-outline" onclick="showAddActionModal('${s.id}')" title="İdari İşlem Ekle">
                ${UI.Icons.shield} İşlem Ekle
              </button>
              <button class="btn btn-sm btn-primary" onclick="showAdminReferToCounselorModal('${s.id}')" title="Rehberliğe Yönlendir">
                ${UI.Icons.lifeBuoy} Sevk Et
              </button>
              <button class="btn btn-sm btn-ghost" onclick="Router.navigate(Router.ROUTES.STUDENT_DETAIL, {id:'${s.id}'})">
                ${UI.Icons.chevronRight}
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  updateTable();

  document.querySelectorAll('.repeat-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.repeat-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentLevelFilter = btn.dataset.filter;
      updateTable();
    });
  });

  document.getElementById('repeat-search-input')?.addEventListener('input', debounce(updateTable, 250));
  document.getElementById('repeat-class-filter')?.addEventListener('change', updateTable);
}

/* ============================================================
   ADMIN SECTION: HATALI KAYIT İPTAL TALEPLERİ (PDF Sayfa 6 & 10)
   ============================================================ */
async function renderAdminCancellations(container) {
  const schoolId = Auth.getCurrentSchoolId();
  const pendingRequests = await Records.getPendingCancellations(schoolId);
  const allRecords = await Records.getAll({ schoolId, includeCancelled: true });
  const cancelledHistory = allRecords.filter(r => r.status === 'cancelled').slice(0, 15);
  const students = await Students.getAll(schoolId);
  const studentMap = {};
  students.forEach(s => studentMap[s.id] = s);

  container.innerHTML = `
    <div class="section">
      <div style="margin-bottom:var(--space-md)">
        <h2 class="section-title">Hatalı Kayıt İptal Talepleri Yönetimi</h2>
        <p style="font-size:var(--font-xs);color:var(--text-muted)">
          Öğretmenler tarafından sehven oluşturulup bildirilen kayıtlar veritabanından fiziksel olarak silinmez; idare onayıyla iptal edilir ve denetim geçmişinde saklanır.
        </p>
      </div>

      <!-- Pending Requests Card -->
      <div class="card" style="margin-bottom:var(--space-xl)">
        <div class="card-header" style="display:flex;justify-content:space-between;align-items:center">
          <span class="card-header-title">⏳ Onay Bekleyen İptal Talepleri</span>
          <span class="badge ${pendingRequests.length > 0 ? 'badge-danger' : 'badge-neutral'}">${pendingRequests.length} Talep</span>
        </div>
        <div class="card-body" style="padding:0">
          <div class="table-container" style="border:none">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Öğrenci</th>
                  <th>Kategori</th>
                  <th>Kaydı Giren</th>
                  <th>Talep Eden & Gerekçe</th>
                  <th style="text-align:right">İdari Karar</th>
                </tr>
              </thead>
              <tbody>
                ${pendingRequests.length > 0 ? pendingRequests.map(r => {
                  const s = studentMap[r.studentId];
                  return `
                    <tr>
                      <td style="white-space:nowrap;font-size:var(--font-xs)">${UI.formatDateTime(r.dateTime)}</td>
                      <td>
                        <strong>${s ? UI.escapeHtml(s.firstName + ' ' + s.lastName) : 'Öğrenci'}</strong>
                        <div style="font-size:11px;color:var(--text-muted)">No: ${s ? s.studentNo : '—'} • ${s ? s.class : '—'}</div>
                      </td>
                      <td>${UI.getCategoryBadge(r.category)}</td>
                      <td style="font-size:var(--font-xs)">${UI.escapeHtml(r.createdBy)}</td>
                      <td style="max-width:320px;font-size:var(--font-xs)">
                        <strong style="color:#b45309">${UI.escapeHtml(r.cancellationRequest?.requestedBy || 'Öğretmen')}:</strong>
                        <div style="color:var(--text-primary);margin-top:2px">${UI.escapeHtml(r.cancellationRequest?.reason || 'Gerekçe belirtilmedi')}</div>
                      </td>
                      <td style="text-align:right;white-space:nowrap">
                        <button class="btn btn-sm btn-success" onclick="reviewCancellationAction('${r.id}', true)">
                          ✓ Onayla (İptal Et)
                        </button>
                        <button class="btn btn-sm btn-outline" onclick="reviewCancellationAction('${r.id}', false)">
                          ✗ Reddet
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('') : `
                  <tr><td colspan="6" style="text-align:center;padding:var(--space-xl);color:var(--text-muted)">Şu anda bekleyen hatalı kayıt iptal talebi bulunmuyor.</td></tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- History of Cancelled Records -->
      <div class="card">
        <div class="card-header">
          <span class="card-header-title">📜 Son İptal Edilen Kayıtlar Geçmişi (Soft Delete Arşivi)</span>
        </div>
        <div class="card-body" style="padding:0">
          <div class="table-container" style="border:none">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Kayıt Tarihi</th>
                  <th>Öğrenci</th>
                  <th>Kategori</th>
                  <th>İptal Onaylayan</th>
                  <th>İptal Nedeni & Not</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                ${cancelledHistory.length > 0 ? cancelledHistory.map(r => {
                  const s = studentMap[r.studentId];
                  return `
                    <tr style="opacity:0.8">
                      <td style="font-size:var(--font-xs)">${UI.formatDateTime(r.dateTime)}</td>
                      <td>${s ? UI.escapeHtml(s.firstName + ' ' + s.lastName) : 'Öğrenci'} (${s?.class || ''})</td>
                      <td>${UI.getCategoryBadge(r.category)}</td>
                      <td style="font-size:var(--font-xs)">${UI.escapeHtml(r.cancellationApproval?.approvedBy || 'İdare')}</td>
                      <td style="font-size:var(--font-xs);color:var(--text-secondary)">
                        ${UI.escapeHtml(r.cancellationRequest?.reason || r.cancellationApproval?.notes || '—')}
                      </td>
                      <td><span class="badge badge-cancelled">İptal Edilmiş</span></td>
                    </tr>
                  `;
                }).join('') : `
                  <tr><td colspan="6" style="text-align:center;padding:var(--space-md);color:var(--text-muted)">İptal edilmiş kayıt arşivi temiz.</td></tr>
                `}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `;
}

window.reviewCancellationAction = async function(recordId, approve) {
  const promptText = approve
    ? 'Hatalı kaydı iptal etmek istediğinizi onaylıyor musunuz? (İsteğe bağlı gerekçe notu):'
    : 'İptal talebini reddetme gerekçeniz:';

  const note = prompt(promptText, approve ? 'İdare onayıyla iptal edildi.' : 'Kayıt geçerlidir.');
  if (note === null) return;

  try {
    await Records.reviewCancellation(recordId, approve, note, Auth.getDisplayName());
    UI.showToast(approve ? 'Kayıt başarıyla iptal edildi (Arşivde izlenebilir).' : 'İptal talebi reddedildi.', 'success');
    await renderAdminSection('cancellations');
  } catch (err) {
    console.error(err);
    UI.showToast('İşlem sırasında hata oluştu.', 'error');
  }
};

/* ============================================================
   ADMIN SECTION: TEKRAR ANALİZ EŞİKLERİ VE AYARLAR (PDF Sayfa 4)
   ============================================================ */
async function renderAdminThresholds(container) {
  const schoolId = Auth.getCurrentSchoolId();
  const currentThresholds = window.StatusEngine ? window.StatusEngine.getThresholds(schoolId) : {};

  container.innerHTML = `
    <div class="section" style="max-width:850px">
      <div style="margin-bottom:var(--space-md)">
        <h2 class="section-title">Tekrar Analizi ve Karar Destek Eşikleri</h2>
        <p style="font-size:var(--font-xs);color:var(--text-muted)">
          PDF Sayfa 4 Kuralı: "Eşikler pilot kullanımda okulun gerçek verilerine göre değiştirilebilir; kod içine değişmez değerler olarak gömülmeyecektir."
        </p>
      </div>

      <div class="card" style="margin-bottom:var(--space-xl)">
        <div class="card-header">
          <span class="card-header-title">⚙️ Okul Eşik Değerleri Yapılandırması</span>
        </div>
        <div class="card-body">
          <form id="thresholds-form">
            <h4 style="font-size:var(--font-sm);color:#047857;margin-bottom:var(--space-sm);font-weight:700">
              🟢 Yeşil — Normal Takip Eşikleri
            </h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);margin-bottom:var(--space-lg)">
              <div class="form-group">
                <label class="form-label">Son 30 Günde Maksimum Kayıt Sayısı</label>
                <input type="number" id="th-green-max" class="form-input" min="0" max="10" value="${currentThresholds.greenMaxDays30 ?? 2}">
                <small style="font-size:11px;color:var(--text-muted)">Bu sayının altındaki kayıtlar olağan kabul edilir.</small>
              </div>
            </div>

            <h4 style="font-size:var(--font-sm);color:#c2410c;margin-bottom:var(--space-sm);font-weight:700">
              🟠 Turuncu — Tekrarlayan Durum Eşikleri
            </h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);margin-bottom:var(--space-lg)">
              <div class="form-group">
                <label class="form-label">Son 30 Günde Min – Maks Kayıt</label>
                <div style="display:flex;align-items:center;gap:6px">
                  <input type="number" id="th-orange-min" class="form-input" min="1" max="20" value="${currentThresholds.orangeMinDays30 ?? 3}">
                  <span>–</span>
                  <input type="number" id="th-orange-max" class="form-input" min="1" max="20" value="${currentThresholds.orangeMaxDays30 ?? 5}">
                </div>
              </div>
              <div class="form-group">
                <label class="form-label">Aynı Kategoride Tekrar Penceresi ve Sayısı</label>
                <div style="display:flex;align-items:center;gap:6px">
                  <input type="number" id="th-orange-cat-days" class="form-input" min="1" max="60" value="${currentThresholds.orangeSameCatDays ?? 14}">
                  <span>gün içinde</span>
                  <input type="number" id="th-orange-cat-count" class="form-input" min="1" max="10" value="${currentThresholds.orangeSameCatCount ?? 3}">
                  <span>tekrar</span>
                </div>
              </div>
            </div>

            <h4 style="font-size:var(--font-sm);color:#b91c1c;margin-bottom:var(--space-sm);font-weight:700">
              🔴 Kırmızı — Yoğun Tekrar Eşikleri
            </h4>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);margin-bottom:var(--space-lg)">
              <div class="form-group">
                <label class="form-label">Son 30 Günde Minimum Kayıt Sayısı</label>
                <input type="number" id="th-red-min" class="form-input" min="1" max="30" value="${currentThresholds.redMinDays30 ?? 6}">
              </div>
              <div class="form-group">
                <label class="form-label">Aynı Kategoride Tekrar Penceresi ve Sayısı</label>
                <div style="display:flex;align-items:center;gap:6px">
                  <input type="number" id="th-red-cat-days" class="form-input" min="1" max="90" value="${currentThresholds.redSameCatDays ?? 30}">
                  <span>gün içinde</span>
                  <input type="number" id="th-red-cat-count" class="form-input" min="1" max="20" value="${currentThresholds.redSameCatCount ?? 5}">
                  <span>tekrar</span>
                </div>
              </div>
            </div>

            <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-md)">
              <button type="submit" class="btn btn-primary btn-lg" id="btn-save-thresholds">
                ${UI.Icons.check} Eşikleri Kaydet ve Uygula
              </button>
              <button type="button" class="btn btn-outline btn-lg" id="btn-reset-thresholds">
                Varsayılanlara Sıfırla
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  document.getElementById('thresholds-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newT = {
      greenMaxDays30: parseInt(document.getElementById('th-green-max').value, 10) || 2,
      orangeMinDays30: parseInt(document.getElementById('th-orange-min').value, 10) || 3,
      orangeMaxDays30: parseInt(document.getElementById('th-orange-max').value, 10) || 5,
      orangeSameCatDays: parseInt(document.getElementById('th-orange-cat-days').value, 10) || 14,
      orangeSameCatCount: parseInt(document.getElementById('th-orange-cat-count').value, 10) || 3,
      redMinDays30: parseInt(document.getElementById('th-red-min').value, 10) || 6,
      redSameCatDays: parseInt(document.getElementById('th-red-cat-days').value, 10) || 30,
      redSameCatCount: parseInt(document.getElementById('th-red-cat-count').value, 10) || 5,
    };

    if (window.StatusEngine) {
      await window.StatusEngine.saveThresholds(schoolId, newT);
      UI.showToast('Tekrar analiz eşikleri başarıyla güncellendi.', 'success');
      await renderAdminThresholds(container);
    }
  });

  document.getElementById('btn-reset-thresholds')?.addEventListener('click', async () => {
    if (confirm('Eşik değerlerini fabrika başlangıç ayarlarına sıfırlamak istiyor musunuz?')) {
      if (window.StatusEngine) {
        window.StatusEngine.resetThresholds(schoolId);
        UI.showToast('Eşik değerleri varsayılana sıfırlandı.', 'info');
        await renderAdminThresholds(container);
      }
    }
  });
}

/**
 * MODAL: İdarecinin Öğrenciyi Rehberlik Servisine Yönlendirmesi (PDF Sayfa 6 & 7)
 */
function showAdminReferToCounselorModal(studentId) {
  const bodyHtml = `
    <form id="admin-refer-form">
      <div class="form-group">
        <label class="form-label">Yönlendirme / Sevk Gerekçesi <span style="color:var(--danger)">*</span></label>
        <textarea id="admin-refer-reason" class="form-textarea" rows="3" placeholder="Örn: Son iki haftada 4 kez kılık kıyafet tekrarı yaşandı; öğrenciyle bireysel görüşme yapılması ve motivasyonunun değerlendirilmesi rica olunur." required></textarea>
      </div>
    </form>
  `;

  const footerHtml = `
    <button class="btn btn-outline" onclick="UI.closeModal()">İptal</button>
    <button class="btn btn-primary" id="btn-submit-referral">${UI.Icons.check} Rehberlik Servisine Gönder</button>
  `;

  UI.showModal('Öğrenciyi Rehberlik Servisine Yönlendir', bodyHtml, footerHtml);

  document.getElementById('btn-submit-referral')?.addEventListener('click', async () => {
    const reason = document.getElementById('admin-refer-reason')?.value.trim();
    if (!reason) {
      UI.showToast('Lütfen sevk gerekçesi belirtin.', 'warning');
      return;
    }

    try {
      await SupportCases.create({
        studentId,
        title: 'İdari Yönlendirme (Düzen Takibi)',
        status: 'new',
        notes: `İdare Yönlendirme Gerekçesi: ${reason}`,
        assignedTo: 'Rehberlik Servisi',
        schoolId: Auth.getCurrentSchoolId(),
      });

      await AdminActions.create({
        studentId,
        actionType: 'rehberlik',
        description: reason,
        createdBy: Auth.getDisplayName(),
      });

      UI.closeModal();
      UI.showToast('Öğrenci Rehberlik Servisine yönlendirildi ve idari değerlendirme noktası işlendi.', 'success');
      await renderAdminSection(adminActiveSection);
    } catch (err) {
      console.error(err);
      UI.showToast('Yönlendirme sırasında hata oluştu.', 'error');
    }
  });
}
window.showAdminReferToCounselorModal = showAdminReferToCounselorModal;

/**
 * Utility: Debounce function for live search/filter inputs
 */
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}
window.debounce = debounce;


// Global Exports
window.renderAdminDashboard = renderAdminDashboard;
window.renderAdminSection = renderAdminSection;
window.showAddStaffModal = showAddStaffModal;
window.showAddStudentModal = showAddStudentModal;
window.showAddActionModal = showAddActionModal;
window.exportRecordsToCsv = exportRecordsToCsv;
