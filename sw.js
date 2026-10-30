/* ========================================
   ODİS v3 — Service Worker
   Progressive Web App (PWA) Offline Engine
   ======================================== */

const CACHE_VERSION = 'odis-v3.5.0';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;

// All static shell assets required for 100% offline functionality
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/reset.css',
  './css/reset.css?v=3.5.0',
  './css/variables.css',
  './css/variables.css?v=3.5.0',
  './css/layout.css',
  './css/layout.css?v=3.5.0',
  './css/components.css',
  './css/components.css?v=3.5.0',
  './css/responsive.css',
  './css/responsive.css?v=3.5.0',
  './js/database.js',
  './js/seed-data.js',
  './js/ui.js',
  './js/status-engine.js',
  './js/auth.js',
  './js/schools.js',
  './js/students.js',
  './js/records.js',
  './js/admin-actions.js',
  './js/qr-scanner.js',
  './js/dashboard.js',
  './js/router.js',
  './js/counselor.view.js',
  './js/admin.view.js',
  './js/teacher.view.js',
  './js/student.view.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32x32.png',
  './icons/favicon-16x16.png',
  './icons/favicon.svg',
  './icons/icon-192.svg',
  './icons/icon-512.svg',
  './icons/logo.svg'
];

// Install: Cache all static shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      console.log('[ODİS SW] Statik dosyalar önbelleğe alınıyor...');
      // Use map to ensure one missing file doesn't fail the entire precache
      await Promise.all(
        PRECACHE_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn('[ODİS SW] Ön bellek uyarı:', asset, err);
          })
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean up old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[ODİS SW] Eski önbellek temizleniyor:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Hybrid Stale-While-Revalidate and Cache-First strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Skip non-http/https schemes (like chrome-extension://)
  if (!request.url.startsWith('http')) return;

  const url = new URL(request.url);

  // Strategy 1: External CDN assets (Google Fonts, SheetJS, QR code)
  // Cache First with Runtime Cache fallback
  const isCdn = url.hostname.includes('gstatic.com') ||
                url.hostname.includes('googleapis.com') ||
                url.hostname.includes('unpkg.com') ||
                url.hostname.includes('sheetjs.com');

  if (isCdn) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;

          return fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch(() => cachedResponse);
        });
      })
    );
    return;
  }

  // Strategy 2: Local Application Shell & Assets
  // Stale-While-Revalidate: Return cached immediately, fetch & update in background
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(STATIC_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network failed: if requesting an HTML page/navigation, fallback to index.html
          if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
            return caches.match('./index.html');
          }
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// Listen for message events (e.g. skipWaiting trigger from UI)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
