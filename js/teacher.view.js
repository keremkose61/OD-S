/* ========================================
   ODİS v3 — Teacher View Module
   Giriş Ekranı, Öğretmen Düzeni & Menüsü,
   Nöbetçi Öğretmen Paneli, QR Tarayıcı,
   Yeni Düzen Kaydı ve Davranış Gözlem Bildirimi.
   ======================================== */

/* ============================================================
   SCREEN 1 — LOGIN (Çoklu Rol Desteği: Öğretmen, Rehberlik, İdare)
   ============================================================ */

function renderLoginScreen() {
  const app = document.getElementById('app');
  const screen = document.createElement('div');
  screen.className = 'screen active';
  screen.id = 'screen-login';

  screen.innerHTML = `
    <div class="login-layout">
      <div class="login-portal-wrapper">
        <!-- Left Showcase Side -->
        <div class="login-hero-side">
          <div>
            <div style="display:flex;align-items:center;gap:14px;margin-bottom:var(--space-md)">
              <img src="./icons/logo.svg" alt="Kaşif Kalkavan AL" style="width:56px;height:56px;border-radius:12px;background:#ffffff;padding:4px;box-shadow:0 8px 24px rgba(0,0,0,0.3);object-fit:contain;flex-shrink:0;">
              <div>
                <div style="font-size:11px;letter-spacing:1px;font-weight:700;color:var(--accent);text-transform:uppercase">T.C. MİLLİ EĞİTİM BAKANLIĞI</div>
                <div style="font-size:16px;font-weight:800;color:#ffffff;letter-spacing:-0.2px">Kaşif Kalkavan Anadolu Lisesi</div>
              </div>
            </div>
            <div class="login-hero-logo">
              <span class="badge-dot"></span>
              <span>DİJİTAL OKUL DESTEK VE İZLEME PORTALI</span>
            </div>
            <h1 class="login-hero-title">Kaşif Kalkavan Anadolu Lisesi<br><span>Okul Düzen, Gözlem &</span><br>Rehberlik Sistemi.</h1>
            <p class="login-hero-desc">Öğrencileri etiketlemeyen, kural düzeni, nesnel davranış gözlemleri ve disiplin destek süreçlerini yöneten modern okul yönetim platformu.</p>
          </div>

          <div class="login-features-list">
            <div class="login-feature-item">
              <div class="feature-icon">${UI.Icons.checkCircle}</div>
              <div>
                <strong>Okul Düzeni:</strong> Kılık-kıyafet, arma ve okul kuralları takip arşivi.
              </div>
            </div>
            <div class="login-feature-item">
              <div class="feature-icon">${UI.Icons.messageSquare}</div>
              <div>
                <strong>Bağlamlı Gözlem:</strong> Kaynağı ve doğrulama durumuyla somut davranış kayıtları.
              </div>
            </div>
            <div class="login-feature-item">
              <div class="feature-icon">${UI.Icons.lifeBuoy}</div>
              <div>
                <strong>Rehberlik & Destek:</strong> Bireysel görüşme ve vaka takip iş akışları.
              </div>
            </div>
            <div class="login-feature-item">
              <div class="feature-icon">${UI.Icons.shield}</div>
              <div>
                <strong>İdari Yönetim & Sevk:</strong> Disiplin kurulu ve resmi yönlendirme kararları.
              </div>
            </div>
          </div>

          <div class="login-hero-footer">
            Kaşif Kalkavan Anadolu Lisesi • Okul Düzen, Gözlem ve Rehberlik Portalı
          </div>
        </div>

        <!-- Right Form Side -->
        <div class="login-form-side">
          <div class="login-form-header" style="text-align:center">
            <div style="display:inline-flex;align-items:center;justify-content:center;margin-bottom:var(--space-sm)">
              <img src="./icons/logo.svg" alt="Kaşif Kalkavan Anadolu Lisesi" style="width:68px;height:68px;border-radius:14px;background:#ffffff;padding:4px;box-shadow:0 10px 25px -5px rgba(0,0,0,0.12);object-fit:contain">
            </div>
            <h2 style="font-size:var(--font-xl)">Kaşif Kalkavan Anadolu Lisesi</h2>
            <p>Okul Düzen, Gözlem & Rehberlik Sistemi • Yetkili Girişi</p>
          </div>

          <!-- Role Switcher -->
          <div class="role-tabs" id="login-role-tabs">
            <button type="button" class="role-tab-btn active" data-role="teacher">
              ${UI.Icons.user} Öğretmen
            </button>
            <button type="button" class="role-tab-btn" data-role="counselor">
              ${UI.Icons.lifeBuoy} Rehberlik
            </button>
            <button type="button" class="role-tab-btn" data-role="admin">
              ${UI.Icons.shield} İdare
            </button>
          </div>

          <form id="login-form" autocomplete="off" novalidate>
            <div class="form-group">
              <label class="form-label" for="login-username">Kullanıcı Adı</label>
              <div class="input-group">
                <span class="input-icon">${UI.Icons.user}</span>
                <input type="text" id="login-username" class="form-input" placeholder="Kullanıcı adınızı girin" value="ogretmen" autocomplete="username" required>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="login-password">Şifre</label>
              <div class="input-group">
                <span class="input-icon">${UI.Icons.shield}</span>
                <input type="password" id="login-password" class="form-input" placeholder="Şifrenizi girin" value="odis123" autocomplete="current-password" required>
                <button type="button" class="input-action password-toggle" id="toggle-password" aria-label="Şifreyi göster/gizle">
                  ${UI.Icons.eye}
                </button>
              </div>
            </div>

            <div id="login-error" class="form-error" role="alert"></div>

            <button type="submit" class="btn btn-primary btn-block btn-lg mt-md" id="login-btn">
              ${UI.Icons.logIn} Sisteme Giriş Yap
            </button>
          </form>

          <!-- Quick 1-Click Demo Fillers -->
          <div class="demo-quick-section">
            <div class="demo-quick-title">Hızlı Demo Rol & Okul Seçimleri</div>
            <div class="demo-chips">
              <button type="button" class="demo-chip" id="demo-teacher-1" title="Kaşif Kalkavan AL - Öğretmen">
                👨‍🏫 Ayşe Kaya (KKAL - Öğretmen)
              </button>
              <button type="button" class="demo-chip" id="demo-counselor" title="Kaşif Kalkavan AL - Rehberlik">
                🧠 Selin Danışman (KKAL - Rehberlik)
              </button>
              <button type="button" class="demo-chip" id="demo-admin" title="Kaşif Kalkavan AL - İdare">
                🏢 Ali Vural (KKAL - İdare)
              </button>
              <button type="button" class="demo-chip" id="demo-afl-admin" title="Atatürk Fen Lisesi - Müdür">
                🔬 Zeynep Çelik (AFL - Fen Lisesi)
              </button>
              <button type="button" class="demo-chip" id="demo-afl-teacher" title="Atatürk Fen Lisesi - Öğretmen">
                🧪 Barış Koç (AFL - Öğretmen)
              </button>
            </div>
            <div style="margin-top:var(--space-md);padding:var(--space-sm) var(--space-md);background:var(--bg-tertiary);border-radius:var(--radius-md);font-size:11px;color:var(--text-secondary);display:flex;align-items:center;gap:var(--space-xs);border:1px dashed var(--border-color);line-height:1.4">
              <span>💾</span>
              <span><strong>Yerel Çevrimdışı Depolama (IndexedDB):</strong> Veriler bu cihaza ve tarayıcıya özel olarak yerel saklanır. Farklı bir cihazdan giriş yapıldığında yerel veriler otomatik ortaklaşmaz; cihazlar arası veri aktarımı XLSX / Excel İçe/Dışa Aktarım aracıyla yürütülür.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  app.innerHTML = '';
  app.appendChild(screen);

  // Setup form & events
  const form = document.getElementById('login-form');
  const toggleBtn = document.getElementById('toggle-password');
  const passwordInput = document.getElementById('login-password');
  const usernameInput = document.getElementById('login-username');
  const errorDiv = document.getElementById('login-error');

  // Role buttons
  document.querySelectorAll('#login-role-tabs .role-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#login-role-tabs .role-tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const role = btn.dataset.role;
      if (role === 'teacher') {
        usernameInput.value = 'ogretmen';
      } else if (role === 'counselor') {
        usernameInput.value = 'rehberlik';
      } else {
        usernameInput.value = 'mudur';
      }
      passwordInput.value = 'odis123';
    });
  });

  // Demo chips
  document.getElementById('demo-teacher-1')?.addEventListener('click', () => {
    usernameInput.value = 'ogretmen';
    passwordInput.value = 'odis123';
    form.dispatchEvent(new Event('submit'));
  });

  document.getElementById('demo-counselor')?.addEventListener('click', () => {
    usernameInput.value = 'rehberlik';
    passwordInput.value = 'odis123';
    form.dispatchEvent(new Event('submit'));
  });

  document.getElementById('demo-admin')?.addEventListener('click', () => {
    usernameInput.value = 'mudur';
    passwordInput.value = 'odis123';
    form.dispatchEvent(new Event('submit'));
  });

  document.getElementById('demo-afl-admin')?.addEventListener('click', () => {
    usernameInput.value = 'afl_mudur';
    passwordInput.value = 'odis123';
    form.dispatchEvent(new Event('submit'));
  });

  document.getElementById('demo-afl-teacher')?.addEventListener('click', () => {
    usernameInput.value = 'afl_ogretmen';
    passwordInput.value = 'odis123';
    form.dispatchEvent(new Event('submit'));
  });

  // Password toggle
  toggleBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    toggleBtn.innerHTML = isPassword ? UI.Icons.eyeOff : UI.Icons.eye;
  });

  // Form submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      errorDiv.textContent = 'Lütfen kullanıcı adı ve şifre girin.';
      errorDiv.classList.add('visible');
      return;
    }

    const user = Auth.login(username, password);
    if (user) {
      UI.showToast(`Hoş geldiniz, ${user.displayName}!`, 'success');
      if (user.role === 'admin') {
        Router.navigate(Router.ROUTES.ADMIN_DASHBOARD);
      } else if (user.role === 'counselor') {
        Router.navigate(Router.ROUTES.COUNSELOR_DASHBOARD);
      } else {
        Router.navigate(Router.ROUTES.TEACHER_HOME);
      }
    } else {
      errorDiv.textContent = 'Kullanıcı adı veya şifre hatalı.';
      errorDiv.classList.add('visible');
      passwordInput.value = '';
      passwordInput.focus();
    }
  });
}

/* ============================================================

   TEACHER LAYOUT WRAPPER
   ============================================================ */

function createTeacherLayout(title, bodyContent, activeNav = '') {
  const user = Auth.getCurrentUser();
  const activeSchoolId = Auth.getCurrentSchoolId();
  const activeSchool = (window.Schools && window.Schools.DEFAULT_SCHOOLS)
    ? (window.Schools.DEFAULT_SCHOOLS.find(s => s.id === activeSchoolId) || window.Schools.DEFAULT_SCHOOLS[0])
    : { name: 'Kaşif Kalkavan Anadolu Lisesi', code: 'KKAL-34' };

  return `
    <div class="teacher-header">
      <div class="header-left">
        <button class="hamburger-menu" id="hamburger-btn" aria-label="Menü">
          <span></span><span></span><span></span>
        </button>
        <div class="brand-badge" onclick="Router.navigate(Router.ROUTES.TEACHER_HOME)">
          <img src="./icons/logo.svg" alt="${UI.escapeHtml(activeSchool.name)}" class="brand-logo-img">
          <div class="brand-text-block">
            <div class="brand-title">${UI.escapeHtml(activeSchool.name)}</div>
            <div class="brand-subtitle">Okul Düzen, Gözlem ve Rehberlik Portalı</div>
          </div>
        </div>

        <!-- Desktop Navigation Links -->
        <nav class="desktop-only-nav">
          <button class="btn btn-ghost btn-sm" style="color:white;opacity:${activeNav === 'home' ? '1' : '0.8'};font-weight:${activeNav === 'home' ? '700' : '500'}" onclick="Router.navigate(Router.ROUTES.TEACHER_HOME)">
            ${UI.Icons.home} Ana Sayfa
          </button>
          <button class="btn btn-ghost btn-sm" style="color:white;opacity:${activeNav === 'search' ? '1' : '0.8'};font-weight:${activeNav === 'search' ? '700' : '500'}" onclick="Router.navigate(Router.ROUTES.STUDENT_SEARCH)">
            ${UI.Icons.search} Öğrenci Ara
          </button>
          <button class="btn btn-ghost btn-sm" style="color:white;opacity:${activeNav === 'qr' ? '1' : '0.8'};font-weight:${activeNav === 'qr' ? '700' : '500'}" onclick="Router.navigate(Router.ROUTES.QR_SCANNER)">
            ${UI.Icons.qrCode} QR Kod Okut
          </button>
          <button class="btn btn-ghost btn-sm" style="color:white;opacity:${activeNav === 'observation' ? '1' : '0.8'};font-weight:${activeNav === 'observation' ? '700' : '500'}" onclick="Router.navigate(Router.ROUTES.NEW_OBSERVATION)">
            ${UI.Icons.messageSquare} Gözlem Bildir
          </button>
        </nav>
      </div>

      <div class="header-right">
        <div class="header-duty-badge">
          <span class="header-duty-dot"></span>
          <span>${user?.role === 'admin' ? 'İdareci' : user?.role === 'counselor' ? 'Rehberlik' : 'Nöbetçi Öğretmen'}</span>
        </div>

        <div class="user-profile-chip">
          ${UI.renderAvatar({ firstName: user?.displayName?.split(' ')[0] || 'U', lastName: user?.displayName?.split(' ')[1] || '', avatarColor: '#2563eb' }, 'avatar-sm')}
          <span>${UI.escapeHtml(user?.displayName || 'Kullanıcı')}</span>
          <button class="btn btn-ghost btn-sm" style="color:#94a3b8;padding:4px" data-action="logout" title="Çıkış Yap">
            ${UI.Icons.logOut}
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div class="mobile-menu-overlay" id="mobile-menu-overlay"></div>
    <div class="mobile-menu" id="mobile-menu">
      <div class="mobile-menu-header">
        <div style="display:flex;align-items:center;gap:var(--space-sm)">
          <img src="./icons/logo.svg" alt="${UI.escapeHtml(activeSchool.name)}" style="width:36px;height:36px;border-radius:8px;background:#ffffff;padding:2px;object-fit:contain">
          <div>
            <div style="font-weight:700;font-size:var(--font-sm);color:var(--text-primary)">${UI.escapeHtml(activeSchool.name)}</div>
            <div style="font-size:11px;color:var(--text-muted)">Okul Düzen, Gözlem ve Rehberlik Portalı</div>
          </div>
        </div>
        <button id="close-mobile-menu" aria-label="Menüyü kapat">${UI.Icons.x}</button>
      </div>
      <nav class="mobile-menu-nav">
        <div class="mobile-menu-item ${activeNav === 'home' ? 'active' : ''}" data-route="${Router.ROUTES.TEACHER_HOME}">
          <span class="nav-icon">${UI.Icons.home}</span> Ana Sayfa
        </div>
        <div class="mobile-menu-item ${activeNav === 'search' ? 'active' : ''}" data-route="${Router.ROUTES.STUDENT_SEARCH}">
          <span class="nav-icon">${UI.Icons.search}</span> Öğrenci Ara
        </div>
        <div class="mobile-menu-item ${activeNav === 'qr' ? 'active' : ''}" data-route="${Router.ROUTES.QR_SCANNER}">
          <span class="nav-icon">${UI.Icons.qrCode}</span> QR Okut
        </div>
        <div class="mobile-menu-item ${activeNav === 'observation' ? 'active' : ''}" data-route="${Router.ROUTES.NEW_OBSERVATION}">
          <span class="nav-icon">${UI.Icons.messageSquare}</span> Gözlem Bildir
        </div>
        <div class="mobile-menu-item" data-action="logout">
          <span class="nav-icon">${UI.Icons.logOut}</span> Çıkış Yap
        </div>
      </nav>
    </div>

    <div class="teacher-content">
      ${bodyContent}
    </div>

    <!-- Bottom Nav (Mobile) -->
    <nav class="bottom-nav">
      <div class="bottom-nav-items">
        <div class="bottom-nav-item ${activeNav === 'home' ? 'active' : ''}" data-route="${Router.ROUTES.TEACHER_HOME}">
          <span class="nav-icon">${UI.Icons.home}</span>
          <span>Ana Sayfa</span>
        </div>
        <div class="bottom-nav-item ${activeNav === 'search' ? 'active' : ''}" data-route="${Router.ROUTES.STUDENT_SEARCH}">
          <span class="nav-icon">${UI.Icons.search}</span>
          <span>Öğrenci</span>
        </div>
        <div class="bottom-nav-item ${activeNav === 'qr' ? 'active' : ''}" data-route="${Router.ROUTES.QR_SCANNER}">
          <span class="nav-icon">${UI.Icons.qrCode}</span>
          <span>QR Okut</span>
        </div>
        <div class="bottom-nav-item ${activeNav === 'observation' ? 'active' : ''}" data-route="${Router.ROUTES.NEW_OBSERVATION}">
          <span class="nav-icon">${UI.Icons.messageSquare}</span>
          <span>Gözlem</span>
        </div>
      </div>
    </nav>
  `;
}

function setupTeacherLayoutEvents() {
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileOverlay = document.getElementById('mobile-menu-overlay');
  const closeBtn = document.getElementById('close-mobile-menu');

  function openMenu() {
    mobileMenu?.classList.add('open');
    mobileOverlay?.classList.add('active');
  }

  function closeMenu() {
    mobileMenu?.classList.remove('open');
    mobileOverlay?.classList.remove('active');
  }

  hamburgerBtn?.addEventListener('click', openMenu);
  closeBtn?.addEventListener('click', closeMenu);
  mobileOverlay?.addEventListener('click', closeMenu);

  document.querySelectorAll('[data-route]').forEach(el => {
    el.addEventListener('click', () => {
      const route = el.getAttribute('data-route');
      closeMenu();
      Router.navigate(route);
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

/* ============================================================

   SCREEN 2 — TEACHER HOME (v2: Etiketsiz, 5 Temel Hızlı Aksiyon)
   ============================================================ */

async function renderTeacherHome() {
  const app = document.getElementById('app');
  const screen = document.createElement('div');
  screen.className = 'screen active';
  screen.id = 'screen-teacher-home';

  const user = Auth.getCurrentUser();
  const activeSchoolId = Auth.getCurrentSchoolId();
  const activeSchool = (window.Schools && window.Schools.DEFAULT_SCHOOLS)
    ? (window.Schools.DEFAULT_SCHOOLS.find(s => s.id === activeSchoolId) || window.Schools.DEFAULT_SCHOOLS[0])
    : { name: 'Kaşif Kalkavan Anadolu Lisesi', code: 'KKAL-34' };

  try {
    // Load live statistics (NO risk score!)
    const [todayOrderCount, allStudents, allObservations] = await Promise.all([
      Records.getTodayCount().catch(err => { console.warn('getTodayCount err:', err); return 0; }),
      Students.getAll().catch(err => { console.warn('Students.getAll err:', err); return []; }),
      Observations.getAll().catch(err => { console.warn('Observations.getAll err:', err); return []; }),
    ]);

    const recentStudents = (Students.getRecentlyViewed ? Students.getRecentlyViewed() : []) || [];
    const studentsWithCounts = (await Students.getWithCounts().catch(err => { console.warn('getWithCounts err:', err); return []; })) || [];
    const countMap = {};
    const statusMap = {};
    studentsWithCounts.forEach(s => {
      if (s && s.id) {
        countMap[s.id] = s.recordCount || 0;
        statusMap[s.id] = s.status || null;
      }
    });

    // PDF Sayfa 5: Kendi son bildirimlerini görebilir
    const mySubmissions = (Records.getMyRecords ? await Records.getMyRecords(user?.displayName || 'Öğretmen', activeSchoolId, 8) : []) || [];
    const mySubmissionsHtml = mySubmissions.length > 0
      ? mySubmissions.map(r => {
          const s = allStudents.find(std => std.id === r.studentId);
          const isCancelled = (r.status === 'cancelled');
          const isPending = (r.status === 'cancellation_requested');
          const statusBadge = isCancelled
            ? '<span class="badge badge-cancelled" style="font-size:10px">🚫 İptal</span>'
            : (isPending ? '<span class="badge badge-cancellation-requested" style="font-size:10px">⏳ İptal Talebi</span>' : '');
          return `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:#f8fafc;border-radius:var(--radius-lg);border:1px solid var(--border-color);gap:10px;flex-wrap:wrap">
              <div style="display:flex;align-items:center;gap:10px">
                ${UI.renderAvatar(s, 'avatar-sm')}
                <div>
                  <div style="font-weight:700;font-size:var(--font-sm);color:var(--text-primary)">
                    ${s ? `${UI.escapeHtml(s.firstName)} ${UI.escapeHtml(s.lastName)}` : 'Öğrenci'} 
                    <span style="font-weight:normal;color:var(--text-muted);font-size:11px">(${s?.class || ''})</span>
                  </div>
                  <div style="font-size:11px;color:var(--text-muted)">
                    ${UI.formatDateTime(r.dateTime)}
                  </div>
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:6px">
                ${UI.getCategoryBadge(r.category)}
                ${statusBadge}
                ${!isCancelled && !isPending ? `
                  <button type="button" class="btn btn-ghost btn-sm" style="font-size:11px;padding:2px 8px;color:var(--text-muted)" onclick="window.showReportIncorrectRecordModal('${r.id}', '${r.studentId}')">
                    ⚠ Hatalı Kayıt
                  </button>
                ` : ''}
              </div>
            </div>
          `;
        }).join('')
      : `<div style="text-align:center;padding:var(--space-md);color:var(--text-muted);font-size:var(--font-sm)">Henüz bu dönemde oluşturduğunuz bir düzen kaydı bulunmuyor.</div>`;

  const recentHtml = recentStudents.length > 0
    ? recentStudents.map(s => {
        const sStatus = statusMap[s.id];
        const statusPillHtml = sStatus && window.StatusEngine ? window.StatusEngine.renderStatusPill(sStatus, true) : '';
        return `
        <div class="student-item" data-student-id="${s.id}" onclick="Router.navigate(Router.ROUTES.STUDENT_CARD, {id:'${s.id}'})">
          ${UI.renderAvatar(s)}
          <div class="student-info">
            <div class="student-name">${UI.escapeHtml(s.firstName)} ${UI.escapeHtml(s.lastName)}</div>
            <div class="student-meta">
              <span>No: ${UI.escapeHtml(s.studentNo)}</span>
              <span>•</span>
              <span>Sınıf: ${UI.escapeHtml(s.class)}</span>
            </div>
          </div>
          <div class="student-actions" style="display:flex;align-items:center;gap:var(--space-sm)">
            ${statusPillHtml}
            ${UI.getRecordBadge(countMap[s.id] || 0)}
            <span style="color:var(--text-muted)">${UI.Icons.chevronRight}</span>
          </div>
        </div>
      `;
      }).join('')
    : `<div class="empty-state" style="background:#ffffff;padding:var(--space-xl)">
        <div class="empty-icon">${UI.Icons.clock}</div>
        <h3 class="empty-title">Henüz Öğrenci Görüntülemediniz</h3>
        <p class="empty-desc">Öğrenci aradığınızda veya QR kod okuttuğunuzda son işlemleriniz burada listelenir.</p>
        <button class="btn btn-primary btn-sm" onclick="Router.navigate(Router.ROUTES.STUDENT_SEARCH)">
          ${UI.Icons.search} Öğrenci Arama Ekranına Git
        </button>
       </div>`;

  screen.innerHTML = `
    <div class="teacher-layout">
      ${createTeacherLayout('Nöbetçi Öğretmen Paneli', `
        <!-- Hero Welcome Card -->
        <div class="hero-welcome-card">
          <div class="hero-welcome-content">
            <div class="hero-welcome-text">
              <h1>İyi Çalışmalar, ${UI.escapeHtml(user?.displayName || 'Öğretmen')} 👋</h1>
              <p>${UI.escapeHtml(activeSchool.name)} nöbet ve çalışma alanınızda okul düzeni kayıtlarını ve somut davranış gözlemlerini anında oluşturabilirsiniz.</p>
            </div>
            <div class="hero-stats-row">
              <div class="hero-stat-pill">
                <span class="pill-num">${todayOrderCount}</span>
                <span class="pill-label">Bugün Eklenen Düzen</span>
              </div>
              <div class="hero-stat-pill">
                <span class="pill-num">${allStudents.length}</span>
                <span class="pill-label">Kayıtlı Öğrenci</span>
              </div>
              <div class="hero-stat-pill">
                <span class="pill-num" style="color:var(--info)">${allObservations.length}</span>
                <span class="pill-label">Gözlem Bildirimi</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 4 Temel Hızlı Aksiyon Kartı -->
        <div class="quick-actions-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr))">
          <div class="action-card card-blue" onclick="Router.navigate(Router.ROUTES.QR_SCANNER)">
            <div class="action-icon-wrapper">${UI.Icons.camera}</div>
            <div class="action-card-title">Hızlı QR Kod Okut</div>
            <div class="action-card-desc">Öğrenci kimliğindeki QR kodu kamera ile tara.</div>
          </div>

          <div class="action-card card-indigo" onclick="focusSearchTab('no-search')">
            <div class="action-icon-wrapper">${UI.Icons.hash}</div>
            <div class="action-card-title">Numara ile Sorgula</div>
            <div class="action-card-desc">Okul numarası girerek anında kartını aç.</div>
          </div>

          <div class="action-card card-emerald" onclick="Router.navigate(Router.ROUTES.STUDENT_SEARCH)">
            <div class="action-icon-wrapper">${UI.Icons.users}</div>
            <div class="action-card-title">Öğrenci Rehberi</div>
            <div class="action-card-desc">Sınıf bazlı filtreleme ve detaylı isim araması.</div>
          </div>

          <div class="action-card card-purple" onclick="Router.navigate(Router.ROUTES.NEW_OBSERVATION)">
            <div class="action-icon-wrapper" style="background:#f3e8ff;color:#7e22ce">${UI.Icons.messageSquare}</div>
            <div class="action-card-title">Gözlem Bildir</div>
            <div class="action-card-desc">Kaynak ve doğrulama durumuyla davranış notu ilet.</div>
          </div>
        </div>

        <!-- Search Container Card -->
        <div class="card" style="margin-bottom:var(--space-2xl);box-shadow:var(--shadow-card)">
          <div class="card-header">
            <span class="card-header-title">
              ${UI.Icons.search} Hızlı Öğrenci Arama ve İşlem
            </span>
            <span class="badge badge-neutral">Anlık Filtreleme</span>
          </div>

          <div class="card-body">
            <div class="tabs" id="search-tabs">
              <div class="tab-item active" data-tab="no-search">🔢 Öğrenci Numarası</div>
              <div class="tab-item" data-tab="name-search">👤 İsim / Soyisim</div>
              <div class="tab-item" data-tab="qr-tab">📷 Kamera ile QR</div>
            </div>

            <div class="tab-panel active" id="panel-no-search">
              <div class="search-box">
                <span class="search-icon">${UI.Icons.hash}</span>
                <input type="text" class="form-input" id="search-by-no" placeholder="Okul numarası girin (Örn: 1001, 1002...)" inputmode="numeric">
                <button class="search-clear" id="clear-no-search">${UI.Icons.x}</button>
              </div>
              <div id="no-search-results" style="margin-top:var(--space-md)"></div>
            </div>

            <div class="tab-panel" id="panel-name-search">
              <div class="search-box">
                <span class="search-icon">${UI.Icons.search}</span>
                <input type="text" class="form-input" id="search-by-name" placeholder="Öğrenci adı veya soyadı yazın...">
                <button class="search-clear" id="clear-name-search">${UI.Icons.x}</button>
              </div>
              <div id="name-search-results" style="margin-top:var(--space-md)"></div>
            </div>

            <div class="tab-panel" id="panel-qr-tab">
              <div style="text-align:center;padding:var(--space-xl);background:var(--bg-tertiary);border-radius:var(--radius-xl)">
                <div style="color:var(--accent);margin-bottom:var(--space-md);display:inline-flex;padding:16px;background:white;border-radius:var(--radius-xl);box-shadow:var(--shadow-md)">
                  ${UI.Icons.qrCode.replace('width="20"', 'width="48"').replace('height="20"', 'height="48"')}
                </div>
                <h3 style="font-size:var(--font-md);margin-bottom:var(--space-xs);font-weight:700">QR Kod Tarayıcı</h3>
                <p style="font-size:var(--font-sm);color:var(--text-muted);margin-bottom:var(--space-lg);max-width:400px;margin-left:auto;margin-right:auto">Kamera ile öğrenci kimlik kartındaki QR kodu okutarak kayıtlarına anında ulaşın.</p>
                <button class="btn btn-primary btn-lg" onclick="Router.navigate(Router.ROUTES.QR_SCANNER)">
                  ${UI.Icons.camera} Kamerayı Başlat
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Students Section -->
        <div class="card" style="margin-bottom:var(--space-xl)">
          <div class="card-header">
            <div>
              <span class="card-header-title">${UI.Icons.clock} Son İşlem Yapılan / Görüntülenen Öğrenciler</span>
            </div>
            <span class="badge badge-info">${recentStudents.length} Kayıt</span>
          </div>
          <div class="card-body" style="padding:var(--space-lg)">
            <div id="recent-students-list" style="display:flex;flex-direction:column;gap:var(--space-sm)">
              ${recentHtml}
            </div>
          </div>
        </div>

        <!-- My Recent Submissions (PDF Sayfa 5: Kendi Son Bildirimleri) -->
        <div class="card">
          <div class="card-header">
            <div>
              <span class="card-header-title">${UI.Icons.fileText} Kendi Son Düzen Bildirimlerim</span>
            </div>
            <span class="badge badge-neutral">${mySubmissions.length} Bildirim</span>
          </div>
          <div class="card-body" style="padding:var(--space-lg)">
            <div style="display:flex;flex-direction:column;gap:var(--space-xs)">
              ${mySubmissionsHtml}
            </div>
          </div>
        </div>
      `, 'home')}
    </div>
  `;

  app.innerHTML = '';
  app.appendChild(screen);
  setupTeacherLayoutEvents();

  // Tab switching
  const tabs = document.querySelectorAll('#search-tabs .tab-item');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      document.getElementById(`panel-${tab.dataset.tab}`)?.classList.add('active');
    });
  });

  // Search by number
  const searchNoInput = document.getElementById('search-by-no');
  const clearNoBtn = document.getElementById('clear-no-search');
  let searchNoTimeout;

  searchNoInput?.addEventListener('input', () => {
    clearTimeout(searchNoTimeout);
    const val = searchNoInput.value.trim();
    clearNoBtn?.classList.toggle('visible', val.length > 0);
    searchNoTimeout = setTimeout(() => performSearch(val, 'no-search-results'), 300);
  });

  clearNoBtn?.addEventListener('click', () => {
    if (searchNoInput) searchNoInput.value = '';
    clearNoBtn.classList.remove('visible');
    document.getElementById('no-search-results').innerHTML = '';
  });

  // Search by name
  const searchNameInput = document.getElementById('search-by-name');
  const clearNameBtn = document.getElementById('clear-name-search');
  let searchNameTimeout;

  searchNameInput?.addEventListener('input', () => {
    clearTimeout(searchNameTimeout);
    const val = searchNameInput.value.trim();
    clearNameBtn?.classList.toggle('visible', val.length > 0);
    searchNameTimeout = setTimeout(() => performSearch(val, 'name-search-results'), 300);
  });

  clearNameBtn?.addEventListener('click', () => {
    if (searchNameInput) searchNameInput.value = '';
    clearNameBtn.classList.remove('visible');
    document.getElementById('name-search-results').innerHTML = '';
  });

  window.focusSearchTab = function(tabName) {
    const targetTab = document.querySelector(`#search-tabs .tab-item[data-tab="${tabName}"]`);
    targetTab?.click();
    const input = document.getElementById(tabName === 'no-search' ? 'search-by-no' : 'search-by-name');
    input?.focus();
    input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  } catch (error) {
    console.error('Error rendering teacher home:', error);
    screen.innerHTML = `
      <div class="teacher-layout">
        ${createTeacherLayout('Nöbetçi Öğretmen Paneli', `
          <div class="empty-state" style="padding:var(--space-2xl);background:white;border-radius:var(--radius-lg);margin:var(--space-xl) auto;max-width:600px">
            <div class="empty-icon" style="color:var(--danger)">${UI.Icons.alertTriangle}</div>
            <h3 class="empty-title">Öğretmen Paneli Yüklenemedi</h3>
            <p class="empty-desc">${UI.escapeHtml(error.message || 'Panel verileri alınırken bir hata oluştu.')}</p>
            <button class="btn btn-primary" onclick="location.reload()">Sayfayı Yenile</button>
          </div>
        `, 'home')}
      </div>
    `;
    app.innerHTML = '';
    app.appendChild(screen);
    setupTeacherLayoutEvents();
  }
}

async function performSearch(query, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!query) {
    container.innerHTML = '';
    return;
  }

  const results = await Students.search(query);
  const allWithCounts = await Students.getWithCounts();
  const countMap = {};
  allWithCounts.forEach(s => countMap[s.id] = s.recordCount);

  if (results.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding:var(--space-lg)">
        <div class="empty-icon">${UI.Icons.search}</div>
        <h3 class="empty-title">Sonuç bulunamadı</h3>
        <p class="empty-desc">"${UI.escapeHtml(query)}" ile eşleşen öğrenci bulunamadı.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = results.map(s => `
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
      <div class="student-actions">
        ${UI.getRecordBadge(countMap[s.id] || 0)}
        <span style="color:var(--text-muted)">${UI.Icons.chevronRight}</span>
      </div>
    </div>
  `).join('');
}

/* ============================================================

   SCREEN 5 — QR SCANNER
   ============================================================ */

async function renderQrScanner() {
  const app = document.getElementById('app');
  const screen = document.createElement('div');
  screen.className = 'screen active';
  screen.id = 'screen-qr-scanner';

  const students = await Students.getAll();
  const simOptions = students.slice(0, 6).map(s =>
    `<button class="btn btn-outline btn-sm" onclick="simulateQrScan('${s.studentNo}')">${s.studentNo} — ${UI.escapeHtml(s.firstName)} ${UI.escapeHtml(s.lastName)}</button>`
  ).join('');

  screen.innerHTML = `
    <div class="teacher-layout">
      ${createTeacherLayout('QR Kod Okut', `
        <div class="back-button" onclick="Router.navigate(Router.ROUTES.TEACHER_HOME)">
          ${UI.Icons.chevronLeft} Geri
        </div>

        <div class="qr-scanner-container">
          <div class="card">
            <div class="card-body">
              <div id="qr-reader" class="qr-scanner-viewport" style="min-height:300px"></div>

              <div id="qr-status" style="text-align:center;margin-top:var(--space-md);font-size:var(--font-sm);color:var(--text-muted)">
                Kamerayı başlatmak için butona tıklayın.
              </div>

              <div class="qr-scanner-controls" id="qr-controls">
                <button class="btn btn-primary" id="start-scanner-btn">
                  ${UI.Icons.camera} Kamerayı Başlat
                </button>
                <button class="btn btn-danger hidden" id="stop-scanner-btn">
                  ${UI.Icons.x} Durdur
                </button>
              </div>
            </div>
          </div>

          <!-- Simulation Section -->
          <div class="qr-sim-section">
            <h3 style="font-size:var(--font-base);font-weight:var(--weight-semibold);margin-bottom:var(--space-xs)">
              ${UI.Icons.qrCode} Kamera Olmayan Durumlar İçin Simülasyon
            </h3>
            <p style="font-size:var(--font-sm);color:var(--text-muted);margin-bottom:var(--space-md)">
              Kamera erişimi yoksa aşağıdaki hızlı öğrenci butonlarına tıklayabilir veya manuel numara girebilirsiniz:
            </p>
            <div style="display:flex;flex-wrap:wrap;gap:var(--space-xs)">
              ${simOptions}
            </div>

            <div style="margin-top:var(--space-md)">
              <label class="form-label">Manuel Numara Girişi:</label>
              <div style="display:flex;gap:var(--space-xs)">
                <input type="text" class="form-input" id="manual-qr-input" placeholder="Öğrenci numarası girin">
                <button class="btn btn-primary" onclick="simulateQrScan(document.getElementById('manual-qr-input').value)">Sorgula</button>
              </div>
            </div>
          </div>
        </div>
      `, 'qr')}
    </div>
  `;

  app.innerHTML = '';
  app.appendChild(screen);
  setupTeacherLayoutEvents();

  const startBtn = document.getElementById('start-scanner-btn');
  const stopBtn = document.getElementById('stop-scanner-btn');
  const statusDiv = document.getElementById('qr-status');

  startBtn?.addEventListener('click', async () => {
    statusDiv.innerHTML = '<div style="color:var(--warning)">Kamera başlatılıyor...</div>';
    startBtn.classList.add('hidden');

    const success = await QrScanner.start('qr-reader',
      async (decodedText) => {
        await QrScanner.stop();
        stopBtn.classList.add('hidden');
        startBtn.classList.remove('hidden');

        const student = await QrScanner.processQrCode(decodedText);
        if (student) {
          UI.showToast(`${student.firstName} ${student.lastName} bulundu!`, 'success');
          Router.navigate(Router.ROUTES.STUDENT_CARD, { id: student.id });
        } else {
          statusDiv.innerHTML = `<div style="color:var(--danger)">⚠ "${UI.escapeHtml(decodedText)}" ile eşleşen öğrenci bulunamadı.</div>`;
          UI.showToast('Öğrenci bulunamadı.', 'error');
        }
      },
      (errorMsg) => {
        statusDiv.innerHTML = `<div style="color:var(--danger)">⚠ ${UI.escapeHtml(errorMsg)}</div>`;
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
      }
    );

    if (success) {
      statusDiv.innerHTML = '<div style="color:var(--success)">Kamera aktif — QR kodu çerçeveye getirin.</div>';
      stopBtn.classList.remove('hidden');
    }
  });

  stopBtn?.addEventListener('click', async () => {
    await QrScanner.stop();
    stopBtn.classList.add('hidden');
    startBtn.classList.remove('hidden');
    statusDiv.innerHTML = 'Kamera durduruldu.';
  });
}

window.simulateQrScan = async function(value) {
  if (!value || !value.trim()) {
    UI.showToast('Lütfen bir numara girin.', 'warning');
    return;
  }

  const student = await QrScanner.processQrCode(value.trim());
  if (student) {
    UI.showToast(`${student.firstName} ${student.lastName} bulundu!`, 'success');
    Router.navigate(Router.ROUTES.STUDENT_CARD, { id: student.id });
  } else {
    UI.showToast(`"${value}" ile eşleşen öğrenci bulunamadı.`, 'error');
  }
};

/* ============================================================

   SCREEN 6 — NEW ORDER RECORD (Düzen Modülü)
   ============================================================ */

async function renderNewRecord(studentId) {
  const app = document.getElementById('app');
  const screen = document.createElement('div');
  screen.className = 'screen active';
  screen.id = 'screen-new-record';

  const student = studentId ? await Students.getById(studentId) : null;

  if (!student) {
    screen.innerHTML = '<div class="teacher-layout">' +
      createTeacherLayout('Yeni Kayıt', '<div class="empty-state"><h3 class="empty-title">Öğrenci bulunamadı</h3></div>') +
      '</div>';
    app.innerHTML = '';
    app.appendChild(screen);
    setupTeacherLayoutEvents();
    return;
  }

  const schoolId = student.schoolId || Auth.getCurrentSchoolId();
  const allYears = window.AcademicYears ? await window.AcademicYears.getAll(schoolId) : [];
  const activeYear = window.AcademicYears ? await window.AcademicYears.getActiveYear(schoolId) : null;

  const now = new Date();
  const dateValue = now.toISOString().slice(0, 10);
  const timeValue = now.toTimeString().slice(0, 5);

  screen.innerHTML = `
    <div class="teacher-layout">
      ${createTeacherLayout('Yeni Düzen Kaydı', `
        <div class="back-button" onclick="Router.navigate(Router.ROUTES.STUDENT_CARD, {id:'${student.id}'})">
          ${UI.Icons.chevronLeft} Geri
        </div>

        <!-- Student Info -->
        <div class="student-header-card" style="margin-bottom:var(--space-lg)">
          ${UI.renderAvatar(student, 'avatar-lg')}
          <div>
            <h2 class="student-detail-name">${UI.escapeHtml(student.firstName)} ${UI.escapeHtml(student.lastName)}</h2>
            <div class="student-detail-meta">
              <span>${UI.escapeHtml(student.studentNo)} • ${UI.escapeHtml(student.class)}</span>
            </div>
          </div>
        </div>

        <!-- Record Form -->
        <div class="card">
          <div class="card-header">
            <span class="card-header-title">${UI.Icons.checkCircle} Okul Kuralı & Düzen İhlal Kaydı</span>
          </div>
          <div class="card-body">
            <form id="new-record-form" novalidate>
              <div class="form-group">
                <label class="form-label" for="record-academic-year">Eğitim-Öğretim Yılı</label>
                <select id="record-academic-year" class="form-select">
                  ${allYears.map(y => `
                    <option value="${y.id}" ${y.id === activeYear?.id ? 'selected' : ''}>
                      ${UI.escapeHtml(y.code)} ${y.isCurrent ? '(Aktif Yıl)' : '(Arşiv)'}
                    </option>
                  `).join('')}
                </select>
              </div>

              <div class="form-group">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-xs)">
                  <label class="form-label" style="margin:0">Düzen Kuralı Kategorileri <span style="color:var(--danger)">*</span></label>
                  <span style="font-size:11px;color:var(--text-muted)">Birden fazla seçilebilir</span>
                </div>
                <div class="category-selector" id="category-selector">
                  ${SeedData.CATEGORIES.map(cat => `
                    <div class="category-option" data-value="${cat}">
                      <span class="cat-radio"></span>
                      ${UI.escapeHtml(SeedData.CATEGORY_LABELS[cat])}
                    </div>
                  `).join('')}
                </div>
                <input type="hidden" id="record-category" value="">
                <div class="form-error" id="category-error">Lütfen en az bir kural kategorisi seçin.</div>
              </div>

              <div class="form-group">
                <label class="form-label" for="record-description">Açıklama (İsteğe bağlı)</label>
                <textarea class="form-textarea" id="record-description" placeholder="Örn: Kravat takılmamış, uygunsuz pantolon..." rows="3"></textarea>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md)">
                <div class="form-group">
                  <label class="form-label" for="record-date">Tarih</label>
                  <input type="date" class="form-input" id="record-date" value="${dateValue}">
                </div>
                <div class="form-group">
                  <label class="form-label" for="record-time">Saat</label>
                  <input type="time" class="form-input" id="record-time" value="${timeValue}">
                </div>
              </div>

              <div class="form-group">
                <label class="form-label" for="record-teacher">Kaydı Oluşturan Yetkili</label>
                <input type="text" class="form-input" id="record-teacher" value="${UI.escapeHtml(Auth.getDisplayName())}" readonly style="background:var(--bg-tertiary)">
              </div>

              <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-lg)">
                <button type="submit" class="btn btn-success btn-lg" style="flex:1" id="save-record-btn">
                  ${UI.Icons.check} Kaydet
                </button>
                <button type="button" class="btn btn-outline btn-lg" onclick="Router.navigate(Router.ROUTES.STUDENT_CARD, {id:'${student.id}'})">
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      `)}
    </div>
  `;

  app.innerHTML = '';
  app.appendChild(screen);
  setupTeacherLayoutEvents();

  let selectedCategories = [];
  let selectedCategory = '';

  document.querySelectorAll('.category-option').forEach(opt => {
    opt.addEventListener('click', () => {
      opt.classList.toggle('selected');
      const selectedEls = Array.from(document.querySelectorAll('.category-option.selected'));
      selectedCategories = selectedEls.map(o => o.dataset.value);
      selectedCategory = selectedCategories[0] || '';
      document.getElementById('record-category').value = selectedCategory;
      if (selectedCategories.length > 0) {
        document.getElementById('category-error')?.classList.remove('visible');
      }
    });
  });

  document.getElementById('new-record-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (selectedCategories.length === 0) {
      document.getElementById('category-error')?.classList.add('visible');
      return;
    }

    const academicYearId = document.getElementById('record-academic-year')?.value || activeYear?.id;
    const dateVal = document.getElementById('record-date').value;
    const timeVal = document.getElementById('record-time').value;
    const dateTime = new Date(`${dateVal}T${timeVal}`).toISOString();
    const description = document.getElementById('record-description').value.trim();

    // Section 5 & PDF Sayfa 5: Check same-day duplicates for all selected categories
    const duplicates = await Records.checkMultiDuplicates(student.id, selectedCategories);
    const existingDuplicate = duplicates.length > 0 ? duplicates[0].record : null;
    const duplicateCat = duplicates.length > 0 ? duplicates[0].category : selectedCategory;

    const executeSave = async (isDuplicate = false, reason = '') => {
      try {
        if (selectedCategories.length > 1 && Records.createBatch) {
          await Records.createBatch({
            studentId: student.id,
            academicYearId,
            categories: selectedCategories,
            description: reason ? (description ? `${description} [Tekrar Gerekçesi: ${reason}]` : `Tekrar Gerekçesi: ${reason}`) : description,
            dateTime,
            createdBy: Auth.getDisplayName(),
            isDuplicateConfirmed: isDuplicate,
            duplicateReason: reason,
          });
          UI.showToast(`${selectedCategories.length} adet düzen kaydı başarıyla eklendi.`, 'success');
        } else {
          await Records.create({
            studentId: student.id,
            academicYearId,
            category: selectedCategory,
            description: reason ? (description ? `${description} [Tekrar Gerekçesi: ${reason}]` : `Tekrar Gerekçesi: ${reason}`) : description,
            dateTime,
            createdBy: Auth.getDisplayName(),
            isDuplicateConfirmed: isDuplicate,
            duplicateReason: reason,
          });
          UI.showToast(isDuplicate ? 'Tekrar eden kural bildirimi sisteme kaydedildi.' : 'Düzen kaydı başarıyla eklendi.', 'success');
        }

        Router.navigate(Router.ROUTES.STUDENT_CARD, { id: student.id });
      } catch (err) {
        console.error('Kayıt hatası:', err);
        UI.showToast('Kayıt eklenirken bir hata oluştu.', 'error');
      }
    };

    if (existingDuplicate) {
      UI.showDuplicateWarningModal({
        student,
        category: duplicateCat,
        previousRecord: existingDuplicate,
        onConfirm: (reason) => executeSave(true, reason),
        onCancel: () => {
          // User canceled, stay on form
        },
      });
    } else {
      await executeSave(false, '');
    }
  });
}

/* ============================================================

   SCREEN 7 (NEW) — NEW OBSERVATION (Gözlem Modülü)
   Kaynak Türü ve Doğrulama Durumu Zorunlu Alanlar!
   ============================================================ */

async function renderNewObservation(preselectedStudentId) {
  const app = document.getElementById('app');
  const screen = document.createElement('div');
  screen.className = 'screen active';
  screen.id = 'screen-new-observation';

  const students = await Students.getAll();
  const preselected = preselectedStudentId ? await Students.getById(preselectedStudentId) : null;

  const now = new Date();
  const dateValue = now.toISOString().slice(0, 10);
  const timeValue = now.toTimeString().slice(0, 5);

  screen.innerHTML = `
    <div class="teacher-layout">
      ${createTeacherLayout('Gözlem Bildir', `
        <div class="back-button" onclick="history.back()">
          ${UI.Icons.chevronLeft} Geri
        </div>

        <div class="card" style="max-width:800px;margin:0 auto">
          <div class="card-header" style="background:linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)">
            <div>
              <span class="card-header-title" style="color:#6b21a8">
                ${UI.Icons.messageSquare} Somut Davranış / Durum Gözlemi Bildirimi
              </span>
              <p style="font-size:var(--font-xs);color:var(--text-muted);margin-top:4px">
                Gözlemler nesnel, teşhis içermeyen ve somut ifadelere dayanmalıdır. Kaynak türü ve doğrulama durumu zorunludur.
              </p>
            </div>
          </div>

          <div class="card-body">
            <form id="new-obs-form" novalidate>
              <!-- Student Selection -->
              <div class="form-group">
                <label class="form-label" for="obs-student">Öğrenci Seçimi <span style="color:var(--danger)">*</span></label>
                <select class="form-select" id="obs-student" required>
                  <option value="">Lütfen öğrenci seçin...</option>
                  ${students.map(s => `
                    <option value="${s.id}" ${preselected && preselected.id === s.id ? 'selected' : ''}>
                      ${s.studentNo} — ${UI.escapeHtml(s.firstName)} ${UI.escapeHtml(s.lastName)} (${s.class})
                    </option>
                  `).join('')}
                </select>
                <div class="form-error" id="obs-student-error">Lütfen bir öğrenci seçin.</div>
              </div>

              <!-- Observation Category -->
              <div class="form-group">
                <label class="form-label" for="obs-category">Gözlem Konusu / Kategorisi <span style="color:var(--danger)">*</span></label>
                <select class="form-select" id="obs-category" required>
                  ${SeedData.OBSERVATION_CATEGORIES.map(cat => `
                    <option value="${cat}">${UI.escapeHtml(SeedData.OBSERVATION_CATEGORY_LABELS[cat])}</option>
                  `).join('')}
                </select>
              </div>

              <!-- Two Critical v2 Fields: SOURCE & VERIFICATION -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);background:var(--bg-tertiary);padding:var(--space-md);border-radius:var(--radius-lg);margin-bottom:var(--space-md)">
                <div class="form-group" style="margin-bottom:0">
                  <label class="form-label" for="obs-source">
                    Bilginin Kaynağı <span style="color:var(--danger)">*</span>
                  </label>
                  <select class="form-select" id="obs-source" required>
                    ${Object.entries(SeedData.OBSERVATION_SOURCES).map(([key, label]) => `
                      <option value="${key}">${UI.escapeHtml(label)}</option>
                    `).join('')}
                  </select>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
                    Bilginin duyum mu, doğrudan gözlem mi olduğunu belirtir.
                  </div>
                </div>

                <div class="form-group" style="margin-bottom:0">
                  <label class="form-label" for="obs-status">
                    Doğrulama Durumu <span style="color:var(--danger)">*</span>
                  </label>
                  <select class="form-select" id="obs-status" required>
                    ${Object.entries(SeedData.VERIFICATION_STATUSES).map(([key, label]) => `
                      <option value="${key}">${UI.escapeHtml(label)}</option>
                    `).join('')}
                  </select>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
                    İnceleme aşamasını gösterir; doğrudan suçlama oluşturmaz.
                  </div>
                </div>
              </div>

              <!-- Location, Date & Time -->
              <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:var(--space-md)">
                <div class="form-group">
                  <label class="form-label" for="obs-location">Olay Yeri / Konum</label>
                  <input type="text" class="form-input" id="obs-location" placeholder="Örn: 10-A Sınıfı, Bahçe, Kantin...">
                </div>
                <div class="form-group">
                  <label class="form-label" for="obs-date">Tarih</label>
                  <input type="date" class="form-input" id="obs-date" value="${dateValue}">
                </div>
                <div class="form-group">
                  <label class="form-label" for="obs-time">Saat</label>
                  <input type="time" class="form-input" id="obs-time" value="${timeValue}">
                </div>
              </div>

              <!-- Objective Observation Description -->
              <div class="form-group">
                <label class="form-label" for="obs-desc">Somut ve Nesnel Açıklama <span style="color:var(--danger)">*</span></label>
                <textarea class="form-textarea" id="obs-desc" rows="4" placeholder="Teşhis veya etiketleme yapmaksızın, doğrudan gördüğünüz veya aktarılan somut durumu yazın..." required></textarea>
                <div class="form-error" id="obs-desc-error">Lütfen somut bir gözlem açıklaması yazın.</div>
              </div>

              <!-- Guidance Route Option -->
              <div class="form-group">
                <label style="display:flex;align-items:center;gap:var(--space-sm);cursor:pointer">
                  <input type="checkbox" id="obs-needs-counseling" checked style="width:18px;height:18px">
                  <span style="font-size:var(--font-sm);font-weight:600;color:var(--text-primary)">
                    Rehberlik Servisine Takip Başvurusu Oluştur (Önerilen)
                  </span>
                </label>
              </div>

              <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-xl)">
                <button type="submit" class="btn btn-primary btn-lg" style="flex:1" id="save-obs-btn">
                  ${UI.Icons.check} Gözlem Bildirimini Kaydet
                </button>
                <button type="button" class="btn btn-outline btn-lg" onclick="history.back()">
                  İptal
                </button>
              </div>
            </form>
          </div>
        </div>
      `, 'observation')}
    </div>
  `;

  app.innerHTML = '';
  app.appendChild(screen);
  setupTeacherLayoutEvents();

  document.getElementById('new-obs-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const studentSelect = document.getElementById('obs-student');
    const descInput = document.getElementById('obs-desc');

    let hasError = false;
    if (!studentSelect.value) {
      document.getElementById('obs-student-error')?.classList.add('visible');
      hasError = true;
    } else {
      document.getElementById('obs-student-error')?.classList.remove('visible');
    }

    if (!descInput.value.trim()) {
      document.getElementById('obs-desc-error')?.classList.add('visible');
      hasError = true;
    } else {
      document.getElementById('obs-desc-error')?.classList.remove('visible');
    }

    if (hasError) return;

    const dateVal = document.getElementById('obs-date').value;
    const timeVal = document.getElementById('obs-time').value;
    const dateTime = new Date(`${dateVal}T${timeVal}`).toISOString();

    try {
      await Observations.create({
        studentId: studentSelect.value,
        category: document.getElementById('obs-category').value,
        source: document.getElementById('obs-source').value,
        verificationStatus: document.getElementById('obs-status').value,
        location: document.getElementById('obs-location').value.trim() || 'Okul İçi',
        description: descInput.value.trim(),
        dateTime,
        createdBy: Auth.getDisplayName(),
        needsCounseling: document.getElementById('obs-needs-counseling').checked,
      });

      UI.showToast('Gözlem bildirimi başarıyla kaydedildi.', 'success');
      Router.navigate(Router.ROUTES.STUDENT_CARD, { id: studentSelect.value });
    } catch (err) {
      console.error('Gözlem kaydı hatası:', err);
      UI.showToast('Gözlem kaydedilirken bir hata oluştu.', 'error');
    }
  });
}

// Global Exports
window.renderLoginScreen = renderLoginScreen;
window.createTeacherLayout = createTeacherLayout;
window.setupTeacherLayoutEvents = setupTeacherLayoutEvents;
window.renderTeacherHome = renderTeacherHome;
window.renderQrScanner = renderQrScanner;
window.renderNewRecord = renderNewRecord;
window.renderNewObservation = renderNewObservation;
