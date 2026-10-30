/* ========================================
   ODİS v3 — Dashboard Module
   Multi-school executive metrics across Discipline Order, Observations, and Guidance Referrals.
   ======================================== */

/**
 * Load all executive dashboard stats for current school and active academic year.
 */
async function loadDashboardStats(schoolId = Auth.getCurrentSchoolId(), academicYearId) {
  if (!academicYearId && window.AcademicYears) {
    academicYearId = await window.AcademicYears.getActiveYearId(schoolId);
  }

  const [todayOrderCount, repeatOrderCount, activeSupportCases, allObservations] = await Promise.all([
    Records.getTodayCount(schoolId),
    Records.getRepeatCount(schoolId),
    SupportCases.getActiveWithStudents(schoolId),
    Observations.getAll({ schoolId }),
  ]);

  return {
    todayOrderCount,
    repeatOrderCount,
    activeSupportCount: activeSupportCases.length,
    totalObservations: allObservations.length,
    academicYearId,
  };
}

/**
 * Get filtered records for the dashboard table.
 */
async function getFilteredRecords(filters = {}) {
  const schoolId = filters.schoolId || Auth.getCurrentSchoolId();
  return Records.getRecentWithStudents(50, { ...filters, schoolId });
}

/**
 * Get active guidance and support list with student data.
 */
async function getActiveSupportList(schoolId = Auth.getCurrentSchoolId()) {
  return SupportCases.getActiveWithStudents(schoolId);
}

// Public API
window.Dashboard = {
  loadStats: loadDashboardStats,
  getFilteredRecords,
  getActiveSupportList,
  getAttentionList: getActiveSupportList,
};
