/* ========================================
   ODİS v2 — Router Module
   SPA client-side routing with role-based navigation.
   ======================================== */

const ROUTES = {
  LOGIN: 'login',
  TEACHER_HOME: 'teacher-home',
  STUDENT_SEARCH: 'student-search',
  STUDENT_CARD: 'student-card',
  QR_SCANNER: 'qr-scanner',
  NEW_RECORD: 'new-record',
  NEW_OBSERVATION: 'new-observation',
  COUNSELOR_DASHBOARD: 'counselor-dashboard',
  ADMIN_DASHBOARD: 'admin-dashboard',
  STUDENT_DETAIL: 'student-detail',
};

let currentRoute = null;
let routeParams = {};

/**
 * Navigate to a route.
 */
function navigate(route, params = {}) {
  // Stop QR scanner if navigating away
  if (currentRoute === ROUTES.QR_SCANNER && route !== ROUTES.QR_SCANNER && window.QrScanner) {
    QrScanner.stop();
  }

  // Role guards (RBAC)
  if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
    const user = Auth.getCurrentUser();
    if (route === ROUTES.ADMIN_DASHBOARD && user?.role !== 'admin') {
      if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast('Yetkisiz erişim engellendi: Yönetici paneline yalnızca idareciler erişebilir.', 'error');
      }
      route = (user?.role === 'counselor') ? ROUTES.COUNSELOR_DASHBOARD : ROUTES.TEACHER_HOME;
      params = {};
    } else if (route === ROUTES.COUNSELOR_DASHBOARD && user?.role !== 'counselor' && user?.role !== 'admin') {
      if (typeof UI !== 'undefined' && UI.showToast) {
        UI.showToast('Yetkisiz erişim engellendi: Rehberlik paneline yalnızca yetkili personel erişebilir.', 'error');
      }
      route = ROUTES.TEACHER_HOME;
      params = {};
    }
  }

  currentRoute = route;
  routeParams = params;

  // Update URL hash
  const hashParts = [route];
  if (params.id) hashParts.push(params.id);
  window.location.hash = hashParts.join('/');

  // Hide all screens
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));

  // Render and show the target screen
  renderScreen(route, params);
}

/**
 * Get current route parameters.
 */
function getParams() {
  return routeParams;
}

/**
 * Parse hash and navigate.
 */
function handleHashChange() {
  const hash = window.location.hash.replace('#', '') || '';
  const parts = hash.split('/');
  const route = parts[0] || '';
  const id = parts[1] || '';

  if (!route) {
    // Default routing based on auth role
    if (Auth.isLoggedIn()) {
      const user = Auth.getCurrentUser();
      if (user.role === 'admin') {
        navigate(ROUTES.ADMIN_DASHBOARD);
      } else if (user.role === 'counselor') {
        navigate(ROUTES.COUNSELOR_DASHBOARD);
      } else {
        navigate(ROUTES.TEACHER_HOME);
      }
    } else {
      navigate(ROUTES.LOGIN);
    }
    return;
  }

  // Auth guard
  if (route !== ROUTES.LOGIN && !Auth.isLoggedIn()) {
    navigate(ROUTES.LOGIN);
    return;
  }

  navigate(route, { id });
}

/**
 * Render a screen based on route.
 */
function renderScreen(route, params) {
  const app = document.getElementById('app');

  switch (route) {
    case ROUTES.LOGIN:
      renderLoginScreen();
      break;
    case ROUTES.TEACHER_HOME:
      renderTeacherHome();
      break;
    case ROUTES.STUDENT_SEARCH:
      renderStudentSearch();
      break;
    case ROUTES.STUDENT_CARD:
      renderStudentCard(params.id, params.year);
      break;
    case ROUTES.QR_SCANNER:
      renderQrScanner();
      break;
    case ROUTES.NEW_RECORD:
      renderNewRecord(params.id);
      break;
    case ROUTES.NEW_OBSERVATION:
      renderNewObservation(params.id);
      break;
    case ROUTES.COUNSELOR_DASHBOARD:
      renderCounselorDashboard();
      break;
    case ROUTES.ADMIN_DASHBOARD:
      renderAdminDashboard();
      break;
    case ROUTES.STUDENT_DETAIL:
      renderStudentDetail(params.id, params.year);
      break;
    default:
      if (typeof Auth !== 'undefined' && Auth.isLoggedIn()) {
        const u = Auth.getCurrentUser();
        navigate(u?.role === 'admin' ? ROUTES.ADMIN_DASHBOARD : u?.role === 'counselor' ? ROUTES.COUNSELOR_DASHBOARD : ROUTES.TEACHER_HOME);
      } else {
        navigate(ROUTES.LOGIN);
      }
  }
}

/**
 * Initialize router.
 */
function initRouter() {
  window.addEventListener('hashchange', handleHashChange);
  handleHashChange();
}

// Public API
window.Router = {
  navigate,
  getParams,
  init: initRouter,
  ROUTES,
};
