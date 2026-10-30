/* ========================================
   ODİS v3 — Authentication & RBAC Module
   Rol tabanlı yetkilendirme ve çok okullu oturum yönetimi:
   - teacher: Öğretmen (Okul düzeni kural kaydı, öğrenci arama, geçmişi görme)
   - counselor: Rehberlik Servisi (İdarenin yönlendirdiği disiplin vakaları & destek takibi)
   - admin: İdareci (Yönetim, akademik dönem, personel, XLSX aktarım, denetim günlüğü, raporlama)
   *(Not: Güvenlik görevlisi ve hizmetli personeli ayrı Okul Güvenliği sisteminde yer alır)*
   ======================================== */

const AUTH_KEY = 'odis_auth';

// Demo accounts across schools (Yalnızca Öğretmen, Rehberlik ve İdare)
const DEMO_USERS = [
  // Kaşif Kalkavan Anadolu Lisesi (Varsayılan Okul)
  {
    username: 'ogretmen',
    password: 'odis123',
    role: 'teacher',
    schoolId: 'school_kasif',
    displayName: 'Ayşe Kaya (Öğretmen)',
  },
  {
    username: 'rehberlik',
    password: 'odis123',
    role: 'counselor',
    schoolId: 'school_kasif',
    displayName: 'Selin Danışman (Rehberlik)',
  },
  {
    username: 'mudur',
    password: 'odis123',
    role: 'admin',
    schoolId: 'school_kasif',
    displayName: 'Müdür Yrd. Ali Vural',
  },

  // Atatürk Fen Lisesi (Çok Okullu İzolasyon Testi İçin)
  {
    username: 'afl_mudur',
    password: 'odis123',
    role: 'admin',
    schoolId: 'school_ataturk',
    displayName: 'Zeynep Çelik (Müdür - AFL)',
  },
  {
    username: 'afl_ogretmen',
    password: 'odis123',
    role: 'teacher',
    schoolId: 'school_ataturk',
    displayName: 'Barış Koç (Öğretmen - AFL)',
  },
  {
    username: 'afl_rehberlik',
    password: 'odis123',
    role: 'counselor',
    schoolId: 'school_ataturk',
    displayName: 'Derya Demir (Rehberlik - AFL)',
  },
];

/**
 * Attempt login with username and password.
 * Returns user session object or null.
 */
function login(username, password) {
  const user = DEMO_USERS.find(
    u => u.username.toLowerCase() === username.toLowerCase() && u.password === password
  );

  if (user) {
    const session = {
      username: user.username,
      role: user.role,
      schoolId: user.schoolId || 'school_kasif',
      displayName: user.displayName,
      loggedInAt: new Date().toISOString(),
    };
    localStorage.setItem(AUTH_KEY, JSON.stringify(session));

    // Align active school with user's assigned school
    if (window.Schools) {
      window.Schools.setActiveSchool(session.schoolId);
    }

    if (window.Audit) {
      window.Audit.log({
        action: 'USER_LOGIN',
        entityType: 'auth',
        details: `${session.displayName} başarıyla giriş yaptı.`,
        schoolId: session.schoolId,
      });
    }

    return session;
  }

  return null;
}

/**
 * Get current user session.
 */
function getCurrentUser() {
  try {
    const data = localStorage.getItem(AUTH_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

/**
 * Check if user is logged in.
 */
function isLoggedIn() {
  return getCurrentUser() !== null;
}

/**
 * Check if current user has a specific role.
 */
function hasRole(role) {
  const user = getCurrentUser();
  return user && user.role === role;
}

/**
 * Check if user has permission to view confidential counseling session notes.
 * ONLY counselors can view raw clinical session notes!
 */
function canViewPrivateCounselingNotes() {
  const user = getCurrentUser();
  return user && user.role === 'counselor';
}

/**
 * Check if user can manage staff, import XLSX, and access audit logs.
 */
function canManageSystem() {
  const user = getCurrentUser();
  return user && user.role === 'admin';
}

/**
 * Logout.
 */
function logout() {
  const user = getCurrentUser();
  if (user && window.Audit) {
    window.Audit.log({
      action: 'USER_LOGOUT',
      entityType: 'auth',
      details: `${user.displayName} sistemden çıkış yaptı.`,
      schoolId: user.schoolId,
    });
  }
  localStorage.removeItem(AUTH_KEY);
}

/**
 * Get display name for current user.
 */
function getDisplayName() {
  const user = getCurrentUser();
  return user ? user.displayName : 'Bilinmeyen Kullanıcı';
}

/**
 * Get active school ID from current user or localStorage.
 */
function getCurrentSchoolId() {
  const user = getCurrentUser();
  if (user && user.schoolId) return user.schoolId;
  return window.Schools ? window.Schools.getActiveSchoolId() : 'school_kasif';
}

// Public API
window.Auth = {
  login,
  logout,
  getCurrentUser,
  isLoggedIn,
  hasRole,
  canViewPrivateCounselingNotes,
  canManageSystem,
  getDisplayName,
  getCurrentSchoolId,
  DEMO_USERS,
};
