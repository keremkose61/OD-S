/* ========================================
   ODİS v4 — Main Application Orchestrator
   Modular School Order, Behavioral Observations,
   and Counseling Support Portal.
   ======================================== */

/* ============================================================
   APP INITIALIZATION
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Initialize IndexedDB database (v4)
    await Database.open();

    // 2. Seed demo data (first run or v4 upgrade)
    //    NOTE: SeedData.seed() checks an internal flag and runs only once.
    //    Disable this call after full MySQL migration is complete.
    await SeedData.seed();

    // 3. Initialize toast notification container
    UI.initToasts();

    // 4. Check server-side session (PHP backend).
    //    Auth.initSession() calls /backend/api/auth/me.php.
    //    If the backend is unreachable, the app continues in offline (IndexedDB) mode.
    await Auth.initSession();

    // 5. Initialize client-side router (uses Auth.isLoggedIn() for routing)
    Router.init();

    // 6. Connectivity detection
    setupConnectivityDetection();

    // 7. Service worker registration & update management
    registerServiceWorker();

    // 8. PWA install prompt & lifecycle handlers
    setupPwaInstall();

    console.log('[ODİS v4] Uygulama başarıyla başlatıldı.');
  } catch (error) {
    console.error('[ODİS v4] Başlatma hatası:', error);
    document.getElementById('app').innerHTML = `
      <div class="login-layout">
        <div class="login-card" style="text-align:center;padding:var(--space-2xl)">
          <div style="font-size:48px;margin-bottom:var(--space-md)">⚠️</div>
          <h1 style="font-size:var(--font-xl);margin-bottom:var(--space-sm);color:var(--text-primary)">Sistem Başlatılamadı</h1>
          <p style="color:var(--text-secondary);margin-bottom:var(--space-lg)">Veritabanı bağlantısı kurulurken bir sorun oluştu. Lütfen tarayıcıyı yenileyin.</p>
          <button class="btn btn-primary btn-lg" onclick="location.reload()">Sayfayı Yenile</button>
        </div>
      </div>
    `;
  }
});

/* ============================================================
   CONNECTIVITY DETECTION
   ============================================================ */

function setupConnectivityDetection() {
  const offlineBanner = document.getElementById('offline-banner');
  const onlineBanner = document.getElementById('online-banner');

  function updateStatus() {
    if (!navigator.onLine) {
      offlineBanner?.classList.add('visible');
      onlineBanner?.classList.remove('visible');
    } else {
      offlineBanner?.classList.remove('visible');
    }
  }

  window.addEventListener('online', () => {
    offlineBanner?.classList.remove('visible');
    onlineBanner?.classList.add('visible');
    setTimeout(() => onlineBanner?.classList.remove('visible'), 3000);
  });

  window.addEventListener('offline', () => {
    offlineBanner?.classList.add('visible');
    onlineBanner?.classList.remove('visible');
  });

  updateStatus();
}

/* ============================================================
   SERVICE WORKER REGISTRATION & UPDATES
   ============================================================ */

let swRegistration = null;

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        swRegistration = reg;
        console.log('[ODİS PWA] Service Worker aktif:', reg.scope);

        // Check if an update is already waiting - activate immediately
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          showUpdateBanner(reg);
        }

        // Listen for new service worker installation
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Activate new version immediately to flush cache
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              showUpdateBanner(reg);
            }
          });
        });
      })
      .catch((err) => {
        console.warn('[ODİS PWA] Service Worker kaydedilemedi:', err);
      });

    // Handle seamless reload on update
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

function showUpdateBanner(reg) {
  const updateBanner = document.getElementById('sw-update-banner');
  const updateBtn = document.getElementById('sw-update-btn');
  if (!updateBanner) return;

  updateBanner.style.display = 'flex';
  updateBtn?.addEventListener('click', () => {
    if (reg.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  });
}

/* ============================================================
   PWA INSTALLATION (A2HS - Add to Home Screen)
   ============================================================ */

let deferredInstallPrompt = null;

function setupPwaInstall() {
  const installBanner = document.getElementById('pwa-install-banner');
  const installBtn = document.getElementById('pwa-install-btn');
  const dismissBtn = document.getElementById('pwa-dismiss-btn');

  // Detect if already installed or running as standalone app
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       window.navigator.standalone === true ||
                       document.referrer.includes('android-app://');

  const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  // Listen for beforeinstallprompt event (Chromium browsers)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;

    const dismissed = sessionStorage.getItem('odis_pwa_dismissed');
    if (!dismissed && !isStandalone && installBanner) {
      // Show subtle install prompt banner
      setTimeout(() => {
        installBanner.style.display = 'flex';
      }, 1500);
    }
  });

  // Handle install button click
  installBtn?.addEventListener('click', async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        UI.showToast('ODİS başarıyla cihazınıza yüklendi!', 'success');
      }
      deferredInstallPrompt = null;
      if (installBanner) installBanner.style.display = 'none';
    } else if (isIos) {
      showIosInstallInstructions();
    } else {
      UI.showToast('Tarayıcınızın menüsünden (⋮) "Uygulamayı Yükle" veya "Ana Ekrana Ekle" seçeneğini kullanabilirsiniz.', 'info', 5000);
    }
  });

  // Dismiss button
  dismissBtn?.addEventListener('click', () => {
    if (installBanner) installBanner.style.display = 'none';
    sessionStorage.setItem('odis_pwa_dismissed', 'true');
  });

  // App installed event
  window.addEventListener('appinstalled', () => {
    console.log('[ODİS PWA] Uygulama başarıyla kuruldu.');
    if (installBanner) installBanner.style.display = 'none';
    deferredInstallPrompt = null;
    UI.showToast('ODİS artık cihazınızda kurulu! Uygulama listenizden açabilirsiniz.', 'success', 5000);
  });

  // Global PWA interface for menus / views
  window.ODIS_PWA = {
    isStandalone: () => isStandalone,
    canInstall: () => !!deferredInstallPrompt || (isIos && !isStandalone),
    promptInstall: async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        const choice = await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
        if (installBanner) installBanner.style.display = 'none';
        return choice.outcome === 'accepted';
      }
      if (isIos && !isStandalone) {
        showIosInstallInstructions();
        return false;
      }
      UI.showToast('Uygulama zaten yüklü veya tarayıcınız otomatik kurulumu desteklemiyor.', 'info');
      return false;
    }
  };
}

function showIosInstallInstructions() {
  const bodyHtml = `
    <div style="padding:var(--space-sm) 0;line-height:1.6">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:var(--space-md)">
        <img src="./icons/apple-touch-icon.png" alt="ODİS" style="width:52px;height:52px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.2)">
        <div>
          <div style="font-weight:700;font-size:16px;color:var(--text-primary)">ODİS'i iPhone / iPad'e Kurun</div>
          <div style="font-size:13px;color:var(--text-secondary)">Safari üzerinden tam ekran ve çevrimdışı kullanım</div>
        </div>
      </div>
      <ol style="padding-left:20px;font-size:14px;color:var(--text-primary);display:flex;flex-direction:column;gap:10px">
        <li>Safari tarayıcısının alt kısmındaki <strong>Paylaş</strong> simgesine (<span style="font-size:16px">📤</span>) dokunun.</li>
        <li>Açılan menüde aşağı kaydırarak <strong>"Ana Ekrana Ekle"</strong> (Add to Home Screen) seçeneğini seçin.</li>
        <li>Sağ üst köşedeki <strong>"Ekle"</strong> butonuna dokunun.</li>
      </ol>
      <div style="margin-top:var(--space-md);background:var(--bg-tertiary);padding:10px 14px;border-radius:var(--radius-sm);font-size:12px;color:var(--text-secondary)">
        💡 Bu işlem sonrasında ODİS, telefonunuzda yerel bir mobil uygulama gibi tam ekran çalışır.
      </div>
    </div>
  `;
  UI.showModal('iOS Kurulum Rehberi', bodyHtml, `<button type="button" class="btn btn-primary" onclick="UI.closeModal()">Anladım</button>`);
}
