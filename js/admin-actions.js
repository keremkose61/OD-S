/* ========================================
   ODİS — Admin Actions Module
   Administrative action CRUD with school isolation and academic year context.
   ======================================== */

/**
 * Create a new admin action.
 */
async function createAction(data) {
  const schoolId = data.schoolId || Auth.getCurrentSchoolId();
  let academicYearId = data.academicYearId;
  if (!academicYearId && window.AcademicYears) {
    academicYearId = await window.AcademicYears.getActiveYearId(schoolId);
  }

  const action = {
    id: SeedData.generateId(),
    schoolId,
    academicYearId: academicYearId || 'current',
    studentId: data.studentId,
    actionType: data.actionType,
    description: data.description || '',
    date: data.date || new Date().toISOString(),
    createdBy: data.createdBy || Auth.getDisplayName(),
  };

  await Database.put(Database.STORES.ACTIONS, action);

  if (window.Audit) {
    await window.Audit.log({
      action: 'CREATE_ADMIN_ACTION',
      entityType: 'action',
      entityId: action.id,
      details: `${action.createdBy} tarafından idari işlem uygulandı: ${SeedData.ACTION_TYPE_LABELS[action.actionType] || action.actionType}`,
      schoolId,
    });
  }

  return action;
}

/**
 * Get all admin actions scoped to school.
 */
async function getAllActions(schoolId = Auth.getCurrentSchoolId()) {
  let actions = await Database.getAll(Database.STORES.ACTIONS);
  actions = actions.filter(a => !schoolId || a.schoolId === schoolId);
  actions.sort((a, b) => new Date(b.date) - new Date(a.date));
  return actions;
}

/**
 * Get actions for a specific student.
 */
async function getStudentActions(studentId, schoolId = Auth.getCurrentSchoolId()) {
  if (!schoolId) return [];
  const actions = await Database.getByIndex(Database.STORES.ACTIONS, 'studentId', studentId);
  const scopedActions = actions.filter(action => action.schoolId === schoolId);
  scopedActions.sort((a, b) => new Date(b.date) - new Date(a.date));
  return scopedActions;
}

/**
 * Get pending action count (actions in the last 7 days).
 */
async function getPendingCount(schoolId = Auth.getCurrentSchoolId()) {
  const all = await getAllActions(schoolId);
  return all.filter(a => UI.isWithinDays(a.date, 7)).length;
}

// Public API
window.AdminActions = {
  create: createAction,
  getAll: getAllActions,
  getStudentActions,
  getPendingCount,
};
