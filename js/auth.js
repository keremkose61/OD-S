/* ========================================
   ODİS v4 — Authentication & RBAC Module
   Hybrid Architecture:
   1. Production / Online: PHP 8 + MySQL backend API with HttpOnly session cookies & CSRF
   2. Offline / PWA Fallback: Local session preservation & demo user simulation for tests
   ======================================== */

const AUTH_KEY = 'odis_auth';
const BACKEND_BASE = './backend/api';

const isNodeEnv = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

// Demo accounts for offline resilience and local automated test environments
const DEMO_USERS = [
  {
    id: 1,
    username: 'ogretmen',
    password: 'odis123',
    role: 'teacher',
    schoolId: 'school_kasif',
    displayName: 'Ayşe Kaya (Öğretmen)',
  },
  {
    id: 2,
    username: 'rehberlik',
    password: 'odis123',
    role: 'counselor',
    schoolId: 'school_kasif',
    displayName: 'Selin Danışman (Rehberlik)',
  },
  {
    id: 3,
    username: 'mudur',
    password: 'odis123',
    role: 'admin',
    schoolId: 'school_kasif',
    displayName: 'Müdür Yrd. Ali Vural',
  },
  {
    id: 4,
    username: 'afl_mudur',
    password: 'odis123',
    role: 'admin',
    schoolId: 'school_ataturk',
    displayName: 'Zeynep Çelik (Müdür - AFL)',
  },
  {
    id: 5,
    username: 'afl_ogretmen',
    password: 'odis123',
    role: 'teacher',
    schoolId: 'school_ataturk',
    displayName: 'Barış Koç (Öğretmen - AFL)',
  },
  {
    id: 6,
    username: 'afl_rehberlik',
    password: 'odis123',
    role: 'counselor',
    schoolId: 'school_ataturk',
    displayName: 'Derya Demir (Rehberlik - AFL)',
  },
];

let _currentUser = null;
let _csrfToken = null;

// Initialize session from localStorage cache if available
try {
  const cached = localStorage.getItem(AUTH_KEY);
  if (cached) {
    _currentUser = JSON.parse(cached);
  }
} catch {
  _currentUser = null;
}

/**
 * Fetch and cache CSRF token from PHP backend.
 */
async function fetchCsrfToken() {
  if (isNodeEnv) return 'mock_node_csrf_token';
  try {
    const res = await fetch(`${BACKEND_BASE}/auth/csrf.php`, {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    _csrfToken = data.csrfToken || null;
    return _csrfToken;
  } catch {
    return null;
  }
}

async function getCsrfToken() {
  if (_csrfToken) return _csrfToken;
  return fetchCsrfToken();
}

/**
 * Perform JSON POST to PHP backend API with CSRF token.
 */
async function apiPost(endpoint, body) {
  const csrfToken = await getCsrfToken();
  const headers = { 'Content-Type': 'application/json' };
  if (csrfToken) headers['X-CSRF-Token'] = csrfToken;

  return fetch(`${BACKEND_BASE}/${endpoint}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers,
    body: JSON.stringify(body),
  });
}

/**
 * Internal helper for offline/demo login.
 */
function loginLocalDemo(username, password) {
  const user = DEMO_USERS.find(
    u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );
  if (user) {
    const session = {
      id: user.id,
      username: user.username,
      role: user.role,
      schoolId: user.schoolId || 'school_kasif',
      displayName: user.displayName,
      loggedInAt: new Date().toISOString(),
    };
    _currentUser = session;
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
    } catch {}

    if (typeof window !== 'undefined' && window.Schools) {
      window.Schools.setActiveSchool(session.schoolId);
    }
    return session;
  }
  return null;
}

/**
 * Login user via PHP backend API, with offline/demo fallback.
 * Works seamlessly in both browser and Node.js test environments.
 *
 * @param {string} username
 * @param {string} password
 * @returns {Promise<object>|object}
 */
function login(username, password) {
  // In Node.js testing environment, execute synchronously with demo data
  if (isNodeEnv) {
    const session = loginLocalDemo(username, password);
    if (!session) return { error: 'Kullanıcı adı veya şifre hatalı.' };
    return session;
  }

  // In browser, attempt server-side PHP authentication first
  return (async () => {
    try {
      const res = await apiPost('auth/login.php', { username, password });
      const data = await res.json();

      if (res.ok && data.user) {
        _currentUser = data.user;
        if (data.csrfToken) _csrfToken = data.csrfToken;
        try {
          localStorage.setItem(AUTH_KEY, JSON.stringify(_currentUser));
        } catch {}

        if (window.Schools) {
          window.Schools.setActiveSchool(_currentUser.schoolId);
        }
        return _currentUser;
      }

      // If backend explicitly rejected credentials (401, 422, 429)
      if (res.status === 401 || res.status === 429 || res.status === 422) {
        return { error: data.error || 'Kullanıcı adı veya şifre hatalı.' };
      }
    } catch {
      // Backend server unreachable (offline or PHP not started)
      console.warn('[ODİS Auth] Backend sunucusuna ulaşılamadı. Çevrimdışı demo modunda deneniyor...');
    }

    // Offline / Demo fallback
    const localUser = loginLocalDemo(username, password);
    if (localUser) {
      if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast('Çevrimdışı / Demo modunda giriş yapıldı.', 'info');
      }
      return localUser;
    }

    return { error: 'Kullanıcı adı veya şifre hatalı.' };
  })();
}

/**
 * Check active server-side session.
 */
async function initSession() {
  if (isNodeEnv) return _currentUser;

  try {
    const res = await fetch(`${BACKEND_BASE}/auth/me.php`, {
      credentials: 'same-origin',
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        _currentUser = data.user;
        if (data.csrfToken) _csrfToken = data.csrfToken;
        try {
          localStorage.setItem(AUTH_KEY, JSON.stringify(_currentUser));
        } catch {}
        return _currentUser;
      }
    }
  } catch {
    // Network error / offline mode
  }

  // Restore cached session if present
  try {
    const cached = localStorage.getItem(AUTH_KEY);
    if (cached) {
      _currentUser = JSON.parse(cached);
      return _currentUser;
    }
  } catch {}

  _currentUser = null;
  return null;
}

/**
 * Logout from both PHP backend and local session cache.
 */
async function logout() {
  if (!isNodeEnv) {
    try {
      await apiPost('auth/logout.php', {});
    } catch {}
  }
  _currentUser = null;
  _csrfToken = null;
  try {
    localStorage.removeItem(AUTH_KEY);
  } catch {}
}

function getCurrentUser() {
  return _currentUser;
}

function isLoggedIn() {
  return _currentUser !== null;
}

function hasRole(role) {
  return _currentUser !== null && _currentUser.role === role;
}

function canViewPrivateCounselingNotes() {
  return _currentUser !== null && _currentUser.role === 'counselor';
}

function canManageSystem() {
  return _currentUser !== null && _currentUser.role === 'admin';
}

function getDisplayName() {
  return _currentUser ? _currentUser.displayName : 'Bilinmeyen Kullanıcı';
}

function getCurrentSchoolId() {
  if (_currentUser && _currentUser.schoolId) return _currentUser.schoolId;
  return (typeof window !== 'undefined' && window.Schools) ? window.Schools.getActiveSchoolId() : 'school_kasif';
}

// Public API
if (typeof window !== 'undefined') {
  window.Auth = {
    initSession,
    login,
    logout,
    getCurrentUser,
    isLoggedIn,
    hasRole,
    canViewPrivateCounselingNotes,
    canManageSystem,
    getDisplayName,
    getCurrentSchoolId,
    getCsrfToken,
    DEMO_USERS,
  };
}

if (typeof global !== 'undefined') {
  global.Auth = {
    initSession,
    login,
    logout,
    getCurrentUser,
    isLoggedIn,
    hasRole,
    canViewPrivateCounselingNotes,
    canManageSystem,
    getDisplayName,
    getCurrentSchoolId,
    getCsrfToken,
    DEMO_USERS,
  };
}
