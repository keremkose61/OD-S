/* ========================================
   ODİS v3 — Modular Data Services
   - Records (Düzen Modülü + Aynı Gün Tekrar Kontrolü)
   - Observations (Gözlem Modülü)
   - SupportCases (Destek / Rehberlik Modülü)
   All services are multi-school scoped (schoolId)
   ======================================== */

/* ============================================================
   1. DÜZEN MODÜLÜ (Okul Kuralı & Kılık-Kıyafet Kayıtları)
   ============================================================ */

/**
 * Check if there is already an order record for the same student, same category, today.
 * Returns the matching duplicate record if found, or null.
 * Ignores cancelled records.
 */
async function checkSameDayDuplicate(studentId, category, schoolId = Auth.getCurrentSchoolId()) {
  const records = await Database.getByIndex(Database.STORES.ORDER_RECORDS, 'studentId', studentId);
  return records.find(r =>
    (!schoolId || r.schoolId === schoolId) &&
    r.status !== 'cancelled' &&
    r.category === category &&
    UI.isToday(r.dateTime)
  ) || null;
}

/**
 * Check multiple categories for same-day duplicates.
 * Returns array of { category, existingRecord }.
 */
async function checkMultiDuplicates(studentId, categories = [], schoolId = Auth.getCurrentSchoolId()) {
  const records = await Database.getByIndex(Database.STORES.ORDER_RECORDS, 'studentId', studentId);
  const duplicates = [];

  for (const cat of categories) {
    const existing = records.find(r =>
      (!schoolId || r.schoolId === schoolId) &&
      r.status !== 'cancelled' &&
      r.category === cat &&
      UI.isToday(r.dateTime)
    );
    if (existing) {
      duplicates.push({ category: cat, record: existing });
    }
  }

  return duplicates;
}

/**
 * Create a new order record.
 */
async function createOrderRecord(data) {
  const schoolId = data.schoolId || Auth.getCurrentSchoolId();
  let academicYearId = data.academicYearId;
  if (!academicYearId && window.AcademicYears) {
    academicYearId = await window.AcademicYears.getActiveYearId(schoolId);
  }
  let studentClass = data.studentClass || '';
  if (!studentClass && data.studentId && window.Students) {
    try {
      const s = await window.Students.getById(data.studentId);
      if (s) studentClass = s.class;
    } catch {
      // Ignore
    }
  }

  const record = {
    id: data.id || SeedData.generateId(),
    schoolId,
    academicYearId: academicYearId || 'current',
    studentId: data.studentId,
    studentClass: studentClass || '',
    category: data.category,
    description: data.description || '',
    dateTime: data.dateTime || new Date().toISOString(),
    createdBy: data.createdBy || Auth.getDisplayName(),
    isDuplicateConfirmed: Boolean(data.isDuplicateConfirmed),
    duplicateReason: data.duplicateReason || '',
    status: data.status || 'active', // 'active' | 'cancellation_requested' | 'cancelled'
    cancellationRequest: data.cancellationRequest || null,
    cancellationApproval: data.cancellationApproval || null,
  };

  await Database.put(Database.STORES.ORDER_RECORDS, record);

  if (window.Audit) {
    const action = record.isDuplicateConfirmed ? 'CONFIRM_DUPLICATE_RECORD' : 'CREATE_ORDER_RECORD';
    await window.Audit.log({
      action,
      entityType: 'order_record',
      entityId: record.id,
      details: `${record.createdBy} tarafından ${SeedData.CATEGORY_LABELS[record.category] || record.category} kaydı oluşturuldu.${record.isDuplicateConfirmed ? ' (Aynı gün tekrarı onaylandı)' : ''}`,
      schoolId,
    });
  }

  return record;
}

/**
 * Batch create order records for multi-category selection (PDF Sayfa 5: Bir işlemde birden fazla kategori seçebilir)
 */
async function createBatchOrderRecords(data) {
  const categories = Array.isArray(data.categories) ? data.categories : [data.category];
  const results = [];

  for (const cat of categories) {
    const rec = await createOrderRecord({
      ...data,
      category: cat,
    });
    results.push(rec);
  }

  return results;
}

/**
 * Request cancellation for an incorrect record (PDF Sayfa 5 & 10: Hatalı Kayıt Bildir)
 */
async function requestRecordCancellation(recordId, reason, requestedBy = Auth.getDisplayName()) {
  const record = await Database.get(Database.STORES.ORDER_RECORDS, recordId);
  if (!record || !Auth.getCurrentSchoolId() || record.schoolId !== Auth.getCurrentSchoolId()) {
    throw new Error('Kayıt bulunamadı veya bu okul için erişim yetkiniz yok.');
  }

  record.status = 'cancellation_requested';
  record.cancellationRequest = {
    requestedBy,
    requestedAt: new Date().toISOString(),
    reason: String(reason || '').trim(),
  };

  await Database.put(Database.STORES.ORDER_RECORDS, record);

  if (window.Audit) {
    await window.Audit.log({
      action: 'REQUEST_RECORD_CANCELLATION',
      entityType: 'order_record',
      entityId: recordId,
      details: `${requestedBy} tarafından hatalı kayıt bildirimi yapıldı. Gerekçe: ${reason}`,
      schoolId: record.schoolId,
    });
  }

  return record;
}

/**
 * Review cancellation request by Admin (PDF Sayfa 10: İdare değerlendirir -> İptal Edilmiş durumuna alınır)
 * Fiziksel silinmez, izlenebilir kalır.
 */
async function reviewRecordCancellation(recordId, approve, notes = '', adminName = Auth.getDisplayName()) {
  const record = await Database.get(Database.STORES.ORDER_RECORDS, recordId);
  if (!record || !Auth.getCurrentSchoolId() || record.schoolId !== Auth.getCurrentSchoolId()) {
    throw new Error('Kayıt bulunamadı veya bu okul için erişim yetkiniz yok.');
  }

  const decision = approve ? 'approved' : 'rejected';
  record.status = approve ? 'cancelled' : 'active';
  record.cancellationApproval = {
    approvedBy: adminName,
    approvedAt: new Date().toISOString(),
    decision,
    notes: String(notes || '').trim(),
  };

  await Database.put(Database.STORES.ORDER_RECORDS, record);

  if (window.Audit) {
    await window.Audit.log({
      action: approve ? 'APPROVE_RECORD_CANCELLATION' : 'REJECT_RECORD_CANCELLATION',
      entityType: 'order_record',
      entityId: recordId,
      details: `${adminName} tarafından hatalı kayıt talebi ${approve ? 'ONAYLANDI (Kayıt iptal edildi)' : 'REDDEDİLDİ'}. Gerekçe: ${notes}`,
      schoolId: record.schoolId,
    });
  }

  return record;
}

/**
 * Get all pending cancellation requests for a school
 */
async function getPendingCancellationRequests(schoolId = Auth.getCurrentSchoolId()) {
  const all = await Database.getAll(Database.STORES.ORDER_RECORDS);
  return all
    .filter(r => (!schoolId || r.schoolId === schoolId) && r.status === 'cancellation_requested')
    .sort((a, b) => new Date(b.cancellationRequest?.requestedAt || b.dateTime) - new Date(a.cancellationRequest?.requestedAt || a.dateTime));
}

/**
 * Get records created by a specific teacher / user (PDF Sayfa 5: Kendi son bildirimlerini görebilir)
 */
async function getMyOrderRecords(userName = Auth.getDisplayName(), schoolId = Auth.getCurrentSchoolId(), limit = 20) {
  const all = await Database.getAll(Database.STORES.ORDER_RECORDS);
  const my = all.filter(r =>
    (!schoolId || r.schoolId === schoolId) &&
    (r.createdBy === userName || (Auth.getCurrentUser() && r.createdBy === Auth.getCurrentUser().username))
  );
  my.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  return my.slice(0, limit);
}

/**
 * Get all order records with multi-criteria filtering for current school.
 */
async function getAllOrderRecords(filters = {}) {
  const schoolId = filters.schoolId || Auth.getCurrentSchoolId();
  let records = await Database.getAll(Database.STORES.ORDER_RECORDS);

  // 1. School isolation
  records = records.filter(r => !schoolId || r.schoolId === schoolId);

  // Status filtering (soft-deleted / cancelled filter)
  if (!filters.includeCancelled) {
    records = records.filter(r => r.status !== 'cancelled');
  }
  if (filters.status) {
    records = records.filter(r => r.status === filters.status);
  }
  if (filters.cancellationPendingOnly) {
    records = records.filter(r => r.status === 'cancellation_requested');
  }

  // 1b. Academic Year filter
  if (filters.academicYearId && filters.academicYearId !== 'all') {
    records = records.filter(r => r.academicYearId === filters.academicYearId);
  }

  // 2. Student ID filter
  if (filters.studentId) {
    records = records.filter(r => r.studentId === filters.studentId);
  }

  // 3. Category filter
  if (filters.category && filters.category !== 'all') {
    records = records.filter(r => r.category === filters.category);
  }

  // 4. Staff / Teacher filter
  if (filters.createdBy && filters.createdBy !== 'all') {
    records = records.filter(r => r.createdBy === filters.createdBy);
  }

  // 5. Date filters
  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom);
    from.setHours(0, 0, 0, 0);
    records = records.filter(r => new Date(r.dateTime) >= from);
  }

  if (filters.dateTo) {
    const to = new Date(filters.dateTo);
    to.setHours(23, 59, 59, 999);
    records = records.filter(r => new Date(r.dateTime) <= to);
  }

  // 6. Repeat condition filter
  if (filters.repeatCondition === 'repeat_only') {
    records = records.filter(r => r.isDuplicateConfirmed);
  }

  // 7. Student details / Class / Search query
  if (filters.query || (filters.class && filters.class !== 'all')) {
    const students = await Students.getAll(schoolId);
    const studentMap = {};
    students.forEach(s => studentMap[s.id] = s);

    if (filters.class && filters.class !== 'all') {
      records = records.filter(r => {
        const s = studentMap[r.studentId];
        return s && s.class === filters.class;
      });
    }

    if (filters.query) {
      const q = filters.query.toLowerCase().trim();
      records = records.filter(r => {
        const s = studentMap[r.studentId];
        if (!s) return false;
        return s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q) ||
          s.studentNo.includes(q) ||
          (r.description && r.description.toLowerCase().includes(q));
      });
    }
  }

  records.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  return records;
}

async function getStudentOrderRecords(studentId, schoolId = Auth.getCurrentSchoolId()) {
  if (!schoolId) return [];
  const records = await Database.getByIndex(Database.STORES.ORDER_RECORDS, 'studentId', studentId);
  const scopedRecords = records.filter(record => record.schoolId === schoolId);
  scopedRecords.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  return scopedRecords;
}

async function getTodayOrderCount(schoolId = Auth.getCurrentSchoolId()) {
  const all = await Database.getAll(Database.STORES.ORDER_RECORDS);
  return all.filter(r => (!schoolId || r.schoolId === schoolId) && UI.isToday(r.dateTime)).length;
}

async function getRepeatOrderStudentCount(schoolId = Auth.getCurrentSchoolId()) {
  const all = await Database.getAll(Database.STORES.ORDER_RECORDS);
  const schoolRecords = all.filter(r => !schoolId || r.schoolId === schoolId);
  const countMap = {};
  schoolRecords.forEach(r => {
    countMap[r.studentId] = (countMap[r.studentId] || 0) + 1;
  });
  return Object.values(countMap).filter(c => c > 1).length;
}

async function getRecentOrderRecordsWithStudents(limit = 10, filters = {}) {
  const schoolId = filters.schoolId || Auth.getCurrentSchoolId();
  const records = await getAllOrderRecords({ ...filters, schoolId });
  const students = await Students.getAll(schoolId);
  const studentMap = {};
  students.forEach(s => studentMap[s.id] = s);

  return records.slice(0, limit).map(r => ({
    ...r,
    student: studentMap[r.studentId] || null,
  }));
}

async function getRecordsByClass(schoolId = Auth.getCurrentSchoolId()) {
  const records = await Database.getAll(Database.STORES.ORDER_RECORDS);
  const schoolRecords = records.filter(r => !schoolId || r.schoolId === schoolId);
  const students = await Students.getAll(schoolId);
  const studentMap = {};
  students.forEach(s => studentMap[s.id] = s);

  const byClass = {};
  schoolRecords.forEach(r => {
    const student = studentMap[r.studentId];
    if (student) {
      byClass[student.class] = (byClass[student.class] || 0) + 1;
    }
  });

  return byClass;
}

async function getRecordsByCategory(schoolId = Auth.getCurrentSchoolId()) {
  const records = await Database.getAll(Database.STORES.ORDER_RECORDS);
  const schoolRecords = records.filter(r => !schoolId || r.schoolId === schoolId);
  const byCategory = {};
  SeedData.CATEGORIES.forEach(c => byCategory[c] = 0);
  schoolRecords.forEach(r => {
    if (byCategory[r.category] !== undefined) {
      byCategory[r.category]++;
    }
  });
  return byCategory;
}

// Düzen Modülü Export
window.Records = {
  create: createOrderRecord,
  createBatch: createBatchOrderRecords,
  checkSameDayDuplicate,
  checkMultiDuplicates,
  requestCancellation: requestRecordCancellation,
  reviewCancellation: reviewRecordCancellation,
  getPendingCancellations: getPendingCancellationRequests,
  getMyRecords: getMyOrderRecords,
  getAll: getAllOrderRecords,
  getByStudent: getStudentOrderRecords,
  getTodayCount: getTodayOrderCount,
  getRepeatCount: getRepeatOrderStudentCount,
  getRecentWithStudents: getRecentOrderRecordsWithStudents,
  getByClass: getRecordsByClass,
  getByCategory: getRecordsByCategory,
};

/* ============================================================
   2. GÖZLEM MODÜLÜ (Bağlamlı Davranış Bildirimleri)
   ============================================================ */

async function createObservation(data) {
  const schoolId = data.schoolId || Auth.getCurrentSchoolId();
  const academicYearId = data.academicYearId || (window.AcademicYears ? await window.AcademicYears.getActiveYearId(schoolId) : 'ay_kasif_2627');
  const observation = {
    id: SeedData.generateId(),
    schoolId,
    academicYearId,
    studentId: data.studentId,
    category: data.category,
    description: data.description || '',
    source: data.source,
    verificationStatus: data.verificationStatus || 'reported',
    location: data.location || '',
    dateTime: data.dateTime || new Date().toISOString(),
    createdBy: data.createdBy || Auth.getDisplayName(),
  };

  await Database.put(Database.STORES.OBSERVATIONS, observation);

  if (window.Audit) {
    await window.Audit.log({
      action: 'CREATE_OBSERVATION',
      entityType: 'observation',
      entityId: observation.id,
      details: `${observation.createdBy} tarafından gözlem bildirimi yapıldı. Durum: ${observation.verificationStatus}`,
      schoolId,
    });
  }

  return observation;
}

async function getAllObservations(filters = {}) {
  const schoolId = filters.schoolId || Auth.getCurrentSchoolId();
  let observations = await Database.getAll(Database.STORES.OBSERVATIONS);

  observations = observations.filter(o => !schoolId || o.schoolId === schoolId);

  if (filters.academicYearId && filters.academicYearId !== 'all') {
    observations = observations.filter(o => o.academicYearId === filters.academicYearId);
  }

  if (filters.studentId) {
    observations = observations.filter(o => o.studentId === filters.studentId);
  }

  if (filters.category) {
    observations = observations.filter(o => o.category === filters.category);
  }

  if (filters.verificationStatus) {
    observations = observations.filter(o => o.verificationStatus === filters.verificationStatus);
  }

  observations.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
  return observations;
}

async function getRecentObservationsWithStudents(limit = 10, schoolId = Auth.getCurrentSchoolId()) {
  const observations = await getAllObservations({ schoolId });
  const students = await Students.getAll(schoolId);
  const studentMap = {};
  students.forEach(s => studentMap[s.id] = s);

  return observations.slice(0, limit).map(o => ({
    ...o,
    student: studentMap[o.studentId] || null,
  }));
}

async function updateObservationStatus(id, newStatus) {
  const obs = await Database.get(Database.STORES.OBSERVATIONS, id);
  if (!obs) throw new Error('Gözlem kaydı bulunamadı.');

  obs.verificationStatus = newStatus;
  await Database.put(Database.STORES.OBSERVATIONS, obs);

  if (window.Audit) {
    await window.Audit.log({
      action: 'UPDATE_OBSERVATION_STATUS',
      entityType: 'observation',
      entityId: id,
      details: `Gözlem doğrulama durumu '${newStatus}' olarak güncellendi.`,
      schoolId: obs.schoolId,
    });
  }

  return obs;
}

window.Observations = {
  create: createObservation,
  getAll: getAllObservations,
  getRecentWithStudents: getRecentObservationsWithStudents,
  updateStatus: updateObservationStatus,
  updateVerification: updateObservationStatus,
};

/* ============================================================
   3. DESTEK / REHBERLİK MODÜLÜ (Disiplin Sevk Takip & İdari Bildirim)
   ============================================================ */

async function createSupportCase(data) {
  const schoolId = data.schoolId || Auth.getCurrentSchoolId();
  const academicYearId = data.academicYearId || (window.AcademicYears ? await window.AcademicYears.getActiveYearId(schoolId) : 'ay_kasif_2627');
  const supportCase = {
    id: SeedData.generateId(),
    schoolId,
    academicYearId,
    studentId: data.studentId,
    observationId: data.observationId || null,
    status: data.status || 'new',
    title: data.title || 'Rehberlik Değerlendirmesi',
    notes: data.notes || '',
    assignedTo: data.assignedTo || Auth.getDisplayName(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await Database.put(Database.STORES.SUPPORT_CASES, supportCase);

  if (window.Audit) {
    await window.Audit.log({
      action: 'CREATE_SUPPORT_CASE',
      entityType: 'support_case',
      entityId: supportCase.id,
      details: `Rehberlik destek süreci başlatıldı: ${supportCase.title}`,
      schoolId,
    });
  }

  return supportCase;
}

async function getAllSupportCases(filters = {}) {
  const schoolId = typeof filters === 'string' ? filters : (filters.schoolId || Auth.getCurrentSchoolId());
  const academicYearId = typeof filters === 'object' ? filters.academicYearId : undefined;
  let cases = await Database.getAll(Database.STORES.SUPPORT_CASES);
  cases = cases.filter(c => !schoolId || c.schoolId === schoolId);
  if (academicYearId && academicYearId !== 'all') {
    cases = cases.filter(c => c.academicYearId === academicYearId);
  }
  cases.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  // Private counseling notes are only included in counselor-facing results.
  if (!Auth.canViewPrivateCounselingNotes()) {
    cases = cases.map(({ privateNotes, ...safeCase }) => safeCase);
  }
  return cases;
}

async function getActiveSupportCasesWithStudents(schoolId = Auth.getCurrentSchoolId()) {
  const cases = await getAllSupportCases(schoolId);
  const activeCases = cases.filter(c => c.status !== 'closed' && c.status !== 'unconfirmed');
  const students = await Students.getAll(schoolId);
  const studentMap = {};
  students.forEach(s => studentMap[s.id] = s);

  return activeCases.map(c => ({
    ...c,
    student: studentMap[c.studentId] || null,
  }));
}

async function updateSupportCaseStatus(id, newStatus, newNotes = '', options = {}) {
  const sc = await Database.get(Database.STORES.SUPPORT_CASES, id);
  if (!sc || !Auth.getCurrentSchoolId() || sc.schoolId !== Auth.getCurrentSchoolId()) {
    throw new Error('Destek vakası bulunamadı veya bu okul için erişim yetkiniz yok.');
  }

  sc.status = newStatus;
  if (typeof newNotes === 'string' && newNotes) {
    // Administrative feedback belongs in the administrative notes only.
    // Never duplicate it into the counselor-only privateNotes field.
    sc.notes = (sc.notes ? sc.notes + '\n\n' : '') + `[${new Date().toLocaleDateString('tr-TR')} - İdari Geri Bildirim]: ${newNotes}`;
  }
  if (options.adminResultNote) {
    sc.adminResultNote = options.adminResultNote;
  }
  if (options.followUpDate) {
    sc.followUpDate = options.followUpDate;
  }
  if (options.recommendation) {
    sc.counselorRecommendation = options.recommendation;
  }
  sc.updatedAt = new Date().toISOString();

  await Database.put(Database.STORES.SUPPORT_CASES, sc);

  if (!Auth.canViewPrivateCounselingNotes()) {
    const { privateNotes, ...safeCase } = sc;
    sc = safeCase;
  }

  if (window.Audit) {
    // PDF Sayfa 10: Rehberlik özel notunun içeriği audit kaydına kopyalanmaz.
    const auditDetails = `Rehberlik sevk süreci durumu güncellendi: ${newStatus}.${options.adminResultNote ? ` İdareye Sonuç Notu: ${options.adminResultNote}` : ''}`;
    await window.Audit.log({
      action: 'UPDATE_SUPPORT_STATUS',
      entityType: 'support_case',
      entityId: id,
      details: auditDetails,
      schoolId: sc.schoolId,
    });
  }

  return sc;
}

window.SupportCases = {
  create: createSupportCase,
  getAll: getAllSupportCases,
  getActiveWithStudents: getActiveSupportCasesWithStudents,
  updateStatus: updateSupportCaseStatus,
};
