/* ========================================
   ODİS — IndexedDB Database Module
   ======================================== */

const DB_NAME = 'odis_db';
const DB_VERSION = 4;

const STORES = {
  SCHOOLS: 'schools',
  ACADEMIC_YEARS: 'academic_years',
  STAFF: 'staff',
  CLASSES: 'classes',
  STUDENTS: 'students',
  ORDER_RECORDS: 'order_records',
  OBSERVATIONS: 'observations',
  SUPPORT_CASES: 'support_cases',
  ACTIONS: 'admin_actions',
  AUDIT_LOGS: 'audit_logs',
  RECORDS: 'order_records', // Compatibility alias
};

let db = null;

/**
 * Open (or create) the IndexedDB database.
 * @returns {Promise<IDBDatabase>}
 */
function openDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // 1. Schools store (Çok Okullu Mimari: school_id ayrımı)
      if (!database.objectStoreNames.contains(STORES.SCHOOLS)) {
        const schoolStore = database.createObjectStore(STORES.SCHOOLS, { keyPath: 'id' });
        schoolStore.createIndex('code', 'code', { unique: true });
        schoolStore.createIndex('name', 'name', { unique: false });
      }

      // 1b. Academic Years store (Eğitim-Öğretim Yılı Yönetimi)
      let ayStore;
      if (!database.objectStoreNames.contains(STORES.ACADEMIC_YEARS)) {
        ayStore = database.createObjectStore(STORES.ACADEMIC_YEARS, { keyPath: 'id' });
        ayStore.createIndex('schoolId', 'schoolId', { unique: false });
        ayStore.createIndex('code', 'code', { unique: false });
        ayStore.createIndex('isCurrent', 'isCurrent', { unique: false });
      } else {
        ayStore = event.target.transaction.objectStore(STORES.ACADEMIC_YEARS);
        if (!ayStore.indexNames.contains('schoolId')) ayStore.createIndex('schoolId', 'schoolId', { unique: false });
        if (!ayStore.indexNames.contains('code')) ayStore.createIndex('code', 'code', { unique: false });
        if (!ayStore.indexNames.contains('isCurrent')) ayStore.createIndex('isCurrent', 'isCurrent', { unique: false });
      }

      // 2. Staff store (Personel Yönetimi)
      if (!database.objectStoreNames.contains(STORES.STAFF)) {
        const staffStore = database.createObjectStore(STORES.STAFF, { keyPath: 'id' });
        staffStore.createIndex('schoolId', 'schoolId', { unique: false });
        staffStore.createIndex('role', 'role', { unique: false });
        staffStore.createIndex('username', 'username', { unique: false });
      } else {
        const staffStore = event.target.transaction.objectStore(STORES.STAFF);
        if (!staffStore.indexNames.contains('schoolId')) staffStore.createIndex('schoolId', 'schoolId', { unique: false });
      }

      // 3. Classes store (Sınıf ve Şubeler)
      if (!database.objectStoreNames.contains(STORES.CLASSES)) {
        const classStore = database.createObjectStore(STORES.CLASSES, { keyPath: 'id' });
        classStore.createIndex('schoolId', 'schoolId', { unique: false });
        classStore.createIndex('name', 'name', { unique: false });
      }

      // 4. Students store
      let studentStore;
      if (!database.objectStoreNames.contains(STORES.STUDENTS)) {
        studentStore = database.createObjectStore(STORES.STUDENTS, { keyPath: 'id' });
        studentStore.createIndex('studentNo', 'studentNo', { unique: false });
        studentStore.createIndex('schoolId', 'schoolId', { unique: false });
        studentStore.createIndex('firstName', 'firstName', { unique: false });
        studentStore.createIndex('lastName', 'lastName', { unique: false });
        studentStore.createIndex('class', 'class', { unique: false });
      } else {
        studentStore = event.target.transaction.objectStore(STORES.STUDENTS);
        if (!studentStore.indexNames.contains('schoolId')) studentStore.createIndex('schoolId', 'schoolId', { unique: false });
      }

      // 5. Order Records store (Okul Düzeni: Kılık-Kıyafet, Arma vb.)
      let orderStore;
      if (!database.objectStoreNames.contains(STORES.ORDER_RECORDS)) {
        orderStore = database.createObjectStore(STORES.ORDER_RECORDS, { keyPath: 'id' });
        orderStore.createIndex('studentId', 'studentId', { unique: false });
        orderStore.createIndex('schoolId', 'schoolId', { unique: false });
        orderStore.createIndex('academicYearId', 'academicYearId', { unique: false });
        orderStore.createIndex('category', 'category', { unique: false });
        orderStore.createIndex('dateTime', 'dateTime', { unique: false });
      } else {
        orderStore = event.target.transaction.objectStore(STORES.ORDER_RECORDS);
        if (!orderStore.indexNames.contains('schoolId')) orderStore.createIndex('schoolId', 'schoolId', { unique: false });
        if (!orderStore.indexNames.contains('academicYearId')) orderStore.createIndex('academicYearId', 'academicYearId', { unique: false });
      }

      // 6. Observations store (Gözlem: Davranış değişikliği vb.)
      let obsStore;
      if (!database.objectStoreNames.contains(STORES.OBSERVATIONS)) {
        obsStore = database.createObjectStore(STORES.OBSERVATIONS, { keyPath: 'id' });
        obsStore.createIndex('studentId', 'studentId', { unique: false });
        obsStore.createIndex('schoolId', 'schoolId', { unique: false });
        obsStore.createIndex('academicYearId', 'academicYearId', { unique: false });
        obsStore.createIndex('source', 'source', { unique: false });
        obsStore.createIndex('verificationStatus', 'verificationStatus', { unique: false });
        obsStore.createIndex('dateTime', 'dateTime', { unique: false });
      } else {
        obsStore = event.target.transaction.objectStore(STORES.OBSERVATIONS);
        if (!obsStore.indexNames.contains('schoolId')) obsStore.createIndex('schoolId', 'schoolId', { unique: false });
        if (!obsStore.indexNames.contains('academicYearId')) obsStore.createIndex('academicYearId', 'academicYearId', { unique: false });
      }

      // 7. Support Cases store (Rehberlik / Destek süreçleri)
      let supportStore;
      if (!database.objectStoreNames.contains(STORES.SUPPORT_CASES)) {
        supportStore = database.createObjectStore(STORES.SUPPORT_CASES, { keyPath: 'id' });
        supportStore.createIndex('studentId', 'studentId', { unique: false });
        supportStore.createIndex('schoolId', 'schoolId', { unique: false });
        supportStore.createIndex('academicYearId', 'academicYearId', { unique: false });
        supportStore.createIndex('status', 'status', { unique: false });
        supportStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      } else {
        supportStore = event.target.transaction.objectStore(STORES.SUPPORT_CASES);
        if (!supportStore.indexNames.contains('schoolId')) supportStore.createIndex('schoolId', 'schoolId', { unique: false });
        if (!supportStore.indexNames.contains('academicYearId')) supportStore.createIndex('academicYearId', 'academicYearId', { unique: false });
      }

      // 8. Admin actions store (İdari İşlemler)
      let actionStore;
      if (!database.objectStoreNames.contains(STORES.ACTIONS)) {
        actionStore = database.createObjectStore(STORES.ACTIONS, { keyPath: 'id' });
        actionStore.createIndex('studentId', 'studentId', { unique: false });
        actionStore.createIndex('schoolId', 'schoolId', { unique: false });
        actionStore.createIndex('academicYearId', 'academicYearId', { unique: false });
        actionStore.createIndex('actionType', 'actionType', { unique: false });
        actionStore.createIndex('date', 'date', { unique: false });
      } else {
        actionStore = event.target.transaction.objectStore(STORES.ACTIONS);
        if (!actionStore.indexNames.contains('schoolId')) actionStore.createIndex('schoolId', 'schoolId', { unique: false });
        if (!actionStore.indexNames.contains('academicYearId')) actionStore.createIndex('academicYearId', 'academicYearId', { unique: false });
      }

      // 10. Audit Logs store (Denetim İzi & Güvenlik Günlüğü)
      if (!database.objectStoreNames.contains(STORES.AUDIT_LOGS)) {
        const auditStore = database.createObjectStore(STORES.AUDIT_LOGS, { keyPath: 'id' });
        auditStore.createIndex('schoolId', 'schoolId', { unique: false });
        auditStore.createIndex('timestamp', 'timestamp', { unique: false });
        auditStore.createIndex('action', 'action', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Generic: get a transaction for one or more stores.
 */
function getTransaction(storeNames, mode = 'readonly') {
  if (!db) throw new Error('Database not initialized');
  return db.transaction(storeNames, mode);
}

/**
 * Add or put a record into a store.
 */
function putRecord(storeName, data) {
  return new Promise((resolve, reject) => {
    const tx = getTransaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(data);
    request.onsuccess = () => resolve(data);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get a single record by key.
 */
function getRecord(storeName, key) {
  return new Promise((resolve, reject) => {
    const tx = getTransaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get all records from a store.
 */
function getAllRecords(storeName) {
  return new Promise((resolve, reject) => {
    const tx = getTransaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Get records by index value.
 */
function getRecordsByIndex(storeName, indexName, value) {
  return new Promise((resolve, reject) => {
    const tx = getTransaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Delete a record by key.
 */
function deleteRecord(storeName, key) {
  return new Promise((resolve, reject) => {
    const tx = getTransaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Count records in a store.
 */
function countRecords(storeName) {
  return new Promise((resolve, reject) => {
    const tx = getTransaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Bulk insert records.
 */
function bulkPut(storeName, items) {
  return new Promise((resolve, reject) => {
    const tx = getTransaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    items.forEach(item => store.put(item));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Clear all records from a store.
 */
function clearStore(storeName) {
  return new Promise((resolve, reject) => {
    const tx = getTransaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Check if the store is empty.
 */
function isStoreEmpty(storeName) {
  return countRecords(storeName).then(count => count === 0);
}

// Public API
window.Database = {
  open: openDatabase,
  put: putRecord,
  get: getRecord,
  getAll: getAllRecords,
  getByIndex: getRecordsByIndex,
  delete: deleteRecord,
  clear: clearStore,
  count: countRecords,
  bulkPut,
  isEmpty: isStoreEmpty,
  STORES,
};
