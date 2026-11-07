/* ========================================
   ODİS v2 / v3 — Students Module
   Multi-school scoped student operations and search.
   ======================================== */

/**
 * Get all students for the active school.
 */
async function getAllStudents(schoolId = Auth.getCurrentSchoolId()) {
  const all = await Database.getAll(Database.STORES.STUDENTS);
  return all.filter(s => !schoolId || s.schoolId === schoolId);
}

/**
 * Get a student by ID.
 */
async function getStudentById(id, schoolId = Auth.getCurrentSchoolId()) {
  const student = await Database.get(Database.STORES.STUDENTS, id);
  // Fail closed: a missing school context must never expose cross-school data.
  if (!student || !schoolId || student.schoolId !== schoolId) return null;
  return student;
}

/**
 * Get a student by student number within a school.
 */
async function getStudentByNo(studentNo, schoolId = Auth.getCurrentSchoolId()) {
  const all = await getAllStudents(schoolId);
  return all.find(s => s.studentNo === String(studentNo).trim()) || null;
}

/**
 * Search students by query (matches student number, first name, last name).
 */
async function searchStudents(query, classFilter = '', schoolId = Auth.getCurrentSchoolId()) {
  const all = await getAllStudents(schoolId);
  const q = (query || '').toLowerCase().trim();

  return all.filter(s => {
    const sNo = String(s.studentNo || '').toLowerCase();
    const fName = String(s.firstName || '').toLowerCase();
    const lName = String(s.lastName || '').toLowerCase();
    const fullName = `${fName} ${lName}`.trim();

    const matchesQuery = !q ||
      sNo.includes(q) ||
      fName.includes(q) ||
      lName.includes(q) ||
      fullName.includes(q);

    const matchesClass = !classFilter || s.class === classFilter;

    return matchesQuery && matchesClass;
  });
}

/**
 * Get all unique classes sorted for the current school.
 */
async function getClasses(schoolId = Auth.getCurrentSchoolId()) {
  const students = await getAllStudents(schoolId);
  const classes = [...new Set(students.map(s => s.class))];
  return classes.sort();
}

/**
 * Create a new student single-entry.
 */
async function createStudent(data) {
  const schoolId = data.schoolId || Auth.getCurrentSchoolId();
  let academicYearId = data.academicYearId;
  if (!academicYearId && window.AcademicYears) {
    academicYearId = await window.AcademicYears.getActiveYearId(schoolId);
  }

  // Check unique studentNo within this school
  const existing = await getStudentByNo(data.studentNo, schoolId);
  if (existing) {
    throw new Error(`Bu okulda ${data.studentNo} numaralı öğrenci zaten kayıtlı (${existing.firstName} ${existing.lastName}).`);
  }

  const student = {
    id: data.id || SeedData.generateId(),
    schoolId,
    academicYearId: academicYearId || 'current',
    studentNo: String(data.studentNo).trim(),
    firstName: data.firstName.trim(),
    lastName: data.lastName.trim(),
    class: data.class.trim().toUpperCase(),
    avatarColor: SeedData.getAvatarColor(`${data.firstName} ${data.lastName}`),
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await Database.put(Database.STORES.STUDENTS, student);

  if (window.Audit) {
    await window.Audit.log({
      action: 'CREATE_STUDENT',
      entityType: 'student',
      entityId: student.id,
      details: `${student.studentNo} — ${student.firstName} ${student.lastName} (${student.class}) öğrencisi eklendi.`,
      schoolId,
    });
  }

  return student;
}

/**
 * Update student info.
 */
async function updateStudent(id, updates) {
  const existing = await getStudentById(id);
  if (!existing) throw new Error('Öğrenci bulunamadı.');

  const updated = {
    ...existing,
    ...updates,
    // A client-side update must not be able to move a student to another school.
    id: existing.id,
    schoolId: existing.schoolId,
    updatedAt: new Date().toISOString(),
  };

  await Database.put(Database.STORES.STUDENTS, updated);

  if (window.Audit) {
    await window.Audit.log({
      action: 'UPDATE_STUDENT',
      entityType: 'student',
      entityId: id,
      details: `${updated.studentNo} — ${updated.firstName} ${updated.lastName} bilgileri güncellendi.`,
      schoolId: updated.schoolId,
    });
  }

  return updated;
}

/**
 * Get student with computed stats (records, observations, support cases, actions).
 * Filters records by academicYearId (defaults to school's active academic year).
 * Also preserves pastRecords and allRecords for historical lookup.
 */
async function getStudentWithStats(studentId, academicYearId = null) {
  const student = await getStudentById(studentId);
  if (!student) return null;

  const schoolId = student.schoolId || Auth.getCurrentSchoolId();
  let targetYearId = academicYearId;
  if (!targetYearId && window.AcademicYears) {
    targetYearId = await window.AcademicYears.getActiveYearId(schoolId);
  }

  const [allRecords, observations, supportCases, actions] = await Promise.all([
    Database.getByIndex(Database.STORES.ORDER_RECORDS, 'studentId', studentId),
    Database.getByIndex(Database.STORES.OBSERVATIONS, 'studentId', studentId),
    Database.getByIndex(Database.STORES.SUPPORT_CASES, 'studentId', studentId),
    Database.getByIndex(Database.STORES.ACTIONS, 'studentId', studentId),
  ]);

  // IndexedDB indexes are not authorization boundaries; verify school ownership.
  const scopedRecords = allRecords.filter(item => item.schoolId === schoolId);
  const scopedObservations = observations.filter(item => item.schoolId === schoolId);
  const scopedSupportCases = supportCases.filter(item => item.schoolId === schoolId);
  const scopedActions = actions.filter(item => item.schoolId === schoolId);

  // Sort descending by date
  scopedRecords.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  scopedObservations.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  scopedSupportCases.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  scopedActions.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Determine active vs past records based on targetYearId
  let filteredRecords = scopedRecords;
  let pastRecords = [];
  if (targetYearId && targetYearId !== 'all') {
    filteredRecords = scopedRecords.filter(r => r.academicYearId === targetYearId);
    pastRecords = scopedRecords.filter(r => r.academicYearId !== targetYearId);
  }

  // Stats for the active/selected academic year
  const totalRecords = filteredRecords.length;
  const totalObservations = scopedObservations.length;
  const activeSupportCases = scopedSupportCases.filter(sc => sc.status !== 'closed' && sc.status !== 'unconfirmed');
  const last30Days = filteredRecords.filter(r => UI.isWithinDays(r.dateTime, 30)).length;
  const lastRecordDate = filteredRecords.length > 0 ? filteredRecords[0].dateTime : null;

  // Category distribution for order records of selected/active year
  const categoryDist = {};
  SeedData.CATEGORIES.forEach(c => categoryDist[c] = 0);
  filteredRecords.forEach(r => {
    if (r.status !== 'cancelled' && categoryDist[r.category] !== undefined) {
      categoryDist[r.category]++;
    }
  });

  // Calculate Status via StatusEngine (PDF Section 3 & 4: 🟢 🟠 🔴)
  const status = window.StatusEngine
    ? window.StatusEngine.calculateStatus(filteredRecords, scopedActions, { schoolId })
    : { level: 'green', label: 'Normal Takip', icon: '🟢', reasons: [] };

  return {
    ...student,
    records: filteredRecords,
    allRecords: scopedRecords,
    pastRecords,
    activeYearId: targetYearId,
    status,
    observations: scopedObservations,
    supportCases: scopedSupportCases,
    actions: scopedActions,
    stats: {
      totalRecords: filteredRecords.filter(r => r.status !== 'cancelled').length,
      rawRecordsCount: filteredRecords.length,
      allTimeRecords: scopedRecords.filter(r => r.status !== 'cancelled').length,
      pastRecordsCount: pastRecords.filter(r => r.status !== 'cancelled').length,
      totalObservations,
      activeSupportCount: activeSupportCases.length,
      last30Days,
      lastRecordDate,
      categoryDist,
    },
  };
}

/**
 * Get students with order record counts for current school.
 * Optional academicYearId filters count to the specified academic year.
 */
async function getStudentsWithRecordCounts(schoolId = Auth.getCurrentSchoolId(), academicYearId) {
  if (!academicYearId && window.AcademicYears) {
    academicYearId = await window.AcademicYears.getActiveYearId(schoolId);
  }

  const [students, allRecords, allActions] = await Promise.all([
    getAllStudents(schoolId),
    Database.getAll(Database.STORES.ORDER_RECORDS),
    Database.getAll(Database.STORES.ACTIONS).catch(() => []),
  ]);

  let schoolRecords = allRecords.filter(r => r.schoolId === schoolId);

  if (academicYearId && academicYearId !== 'all') {
    schoolRecords = schoolRecords.filter(r => r.academicYearId === academicYearId);
  }

  const schoolActions = (allActions || []).filter(a => a.schoolId === schoolId);
  const actionMap = {};
  schoolActions.forEach(a => {
    if (!actionMap[a.studentId]) actionMap[a.studentId] = [];
    actionMap[a.studentId].push(a);
  });

  const recordMap = {};
  schoolRecords.forEach(r => {
    if (!recordMap[r.studentId]) recordMap[r.studentId] = [];
    recordMap[r.studentId].push(r);
  });

  return students.map(s => {
    const sRecords = recordMap[s.id] || [];
    const sActions = actionMap[s.id] || [];
    const validRecords = sRecords.filter(r => r.status !== 'cancelled');
    const status = window.StatusEngine
      ? window.StatusEngine.calculateStatus(validRecords, sActions, { schoolId })
      : { level: 'green', label: 'Normal Takip', icon: '🟢', reasons: [] };

    return {
      ...s,
      recordCount: validRecords.length,
      rawRecordCount: sRecords.length,
      status,
    };
  });
}

/**
 * Get students currently in an active counseling/support process.
 */
async function getActiveSupportStudents(schoolId = Auth.getCurrentSchoolId()) {
  const [allSupport, students] = await Promise.all([
    Database.getAll(Database.STORES.SUPPORT_CASES),
    getAllStudents(schoolId),
  ]);

  const activeCases = allSupport.filter(sc =>
    sc.schoolId === schoolId && sc.status !== 'closed' && sc.status !== 'unconfirmed'
  );

  const studentMap = {};
  students.forEach(s => studentMap[s.id] = s);

  const activeStudentIds = [...new Set(activeCases.map(sc => sc.studentId))];
  return activeStudentIds
    .map(id => studentMap[id])
    .filter(Boolean);
}

/**
 * Get recently viewed students for active school from session/local storage.
 */
const RECENT_KEY_PREFIX = 'odis_recent_students_';

function getRecentlyViewed(schoolId = Auth.getCurrentSchoolId()) {
  try {
    const key = `${RECENT_KEY_PREFIX}${schoolId || 'default'}`;
    const raw = sessionStorage.getItem(key) || localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Add a student to recently viewed list.
 */
function addToRecentlyViewed(student, schoolId = Auth.getCurrentSchoolId()) {
  if (!student || !student.id) return;
  try {
    const sId = schoolId || student.schoolId || 'default';
    const key = `${RECENT_KEY_PREFIX}${sId}`;
    let list = getRecentlyViewed(sId);
    list = list.filter(s => s.id !== student.id);
    list.unshift({
      id: student.id,
      schoolId: student.schoolId || sId,
      studentNo: student.studentNo,
      firstName: student.firstName,
      lastName: student.lastName,
      class: student.class,
      avatarColor: student.avatarColor,
    });
    list = list.slice(0, 8);
    const json = JSON.stringify(list);
    sessionStorage.setItem(key, json);
    localStorage.setItem(key, json);
  } catch (e) {
    console.error('Error saving recent student:', e);
  }
}

// Public API
window.Students = {
  getAll: getAllStudents,
  getById: getStudentById,
  getByNo: getStudentByNo,
  create: createStudent,
  update: updateStudent,
  search: searchStudents,
  getClasses,
  getWithStats: getStudentWithStats,
  getWithCounts: getStudentsWithRecordCounts,
  getActiveSupportStudents,
  getRecentlyViewed,
  addToRecentlyViewed,
};
