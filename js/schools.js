/* ========================================
   ODİS v2 — Schools, Staff, Audit & Importer Module
   - Multi-school (school_id scoping & isolation)
   - Staff Management (Roles, Branches, Status)
   - Audit Trail (Security & Compliance)
   - XLSX / CSV 7-Step Import Engine
   ======================================== */

(function () {
  'use strict';

  const ACTIVE_SCHOOL_KEY = 'odis_active_school_id';

  /* ============================================================
     1. SCHOOLS SERVICE (Çok Okullu Mimari)
     ============================================================ */

  const DEFAULT_SCHOOLS = [
    {
      id: 'school_kasif',
      code: 'KKAL-34',
      name: 'Kaşif Kalkavan Anadolu Lisesi',
      district: 'Pendik / İstanbul',
      principal: 'Mehmet Emin Kaya',
      phone: '0216 390 12 34',
      email: 'kasifkalkavan@meb.k12.tr',
      active: true,
      stats: { totalStudents: 680, totalStaff: 48, activeClasses: 22 },
    },
    {
      id: 'school_ataturk',
      code: 'AFL-34',
      name: 'Atatürk Fen Lisesi',
      district: 'Kadıköy / İstanbul',
      principal: 'Zeynep Çelik',
      phone: '0216 345 67 89',
      email: 'ataturkfen@meb.k12.tr',
      active: true,
      stats: { totalStudents: 520, totalStaff: 42, activeClasses: 18 },
    },
    {
      id: 'school_cumhuriyet',
      code: 'CMTAL-34',
      name: 'Cumhuriyet Mesleki ve Teknik Anadolu Lisesi',
      district: 'Üsküdar / İstanbul',
      principal: 'Hasan Yıldız',
      phone: '0216 456 78 90',
      email: 'cumhuriyetmtal@meb.k12.tr',
      active: true,
      stats: { totalStudents: 850, totalStaff: 64, activeClasses: 28 },
    },
  ];

  function getActiveSchoolId() {
    return localStorage.getItem(ACTIVE_SCHOOL_KEY) || 'school_kasif';
  }

  async function getActiveSchool() {
    const schoolId = getActiveSchoolId();
    try {
      const school = await Database.get(Database.STORES.SCHOOLS, schoolId);
      if (school) return school;
    } catch (e) {
      console.warn('Database not ready, using fallback school:', e);
    }
    return DEFAULT_SCHOOLS.find(s => s.id === schoolId) || DEFAULT_SCHOOLS[0];
  }

  async function setActiveSchool(schoolId) {
    localStorage.setItem(ACTIVE_SCHOOL_KEY, schoolId);
    // Log school switch
    await Audit.log({
      action: 'SWITCH_SCHOOL',
      entityType: 'school',
      entityId: schoolId,
      details: `Aktif okul değiştirildi: ${schoolId}`,
    });
    // Trigger window event
    window.dispatchEvent(new CustomEvent('schoolChanged', { detail: { schoolId } }));
  }

  async function getAllSchools() {
    try {
      const schools = await Database.getAll(Database.STORES.SCHOOLS);
      if (schools && schools.length > 0) return schools;
    } catch (e) {
      console.warn('Error reading schools store:', e);
    }
    return DEFAULT_SCHOOLS;
  }

  async function initSchoolsStore() {
    try {
      const count = await Database.count(Database.STORES.SCHOOLS);
      if (count === 0) {
        await Database.bulkPut(Database.STORES.SCHOOLS, DEFAULT_SCHOOLS);
      }
    } catch (e) {
      console.warn('Error initializing schools store:', e);
    }
  }

  window.Schools = {
    getActiveSchoolId,
    getActiveSchool,
    setActiveSchool,
    getAll: getAllSchools,
    init: initSchoolsStore,
    DEFAULT_SCHOOLS,
  };

  /* ============================================================
     1b. ACADEMIC YEARS SERVICE (Eğitim-Öğretim Yılı Yönetimi)
     ============================================================ */

  const DEFAULT_ACADEMIC_YEARS = [
    {
      id: 'ay_kasif_2526',
      schoolId: 'school_kasif',
      code: '2025-2026',
      name: '2025–2026 Eğitim-Öğretim Yılı',
      isCurrent: false,
      startDate: '2025-09-08',
      endDate: '2026-06-19',
    },
    {
      id: 'ay_kasif_2627',
      schoolId: 'school_kasif',
      code: '2026-2027',
      name: '2026–2027 Eğitim-Öğretim Yılı',
      isCurrent: true,
      startDate: '2026-09-07',
      endDate: '2027-06-18',
    },
    {
      id: 'ay_ataturk_2627',
      schoolId: 'school_ataturk',
      code: '2026-2027',
      name: '2026–2027 Eğitim-Öğretim Yılı',
      isCurrent: true,
      startDate: '2026-09-07',
      endDate: '2027-06-18',
    },
  ];

  function getAcademicYearStorageKey(schoolId = getActiveSchoolId()) {
    return `odis_active_academic_year_${schoolId}`;
  }

  async function getAllAcademicYears(schoolId = getActiveSchoolId()) {
    try {
      const all = await Database.getAll(Database.STORES.ACADEMIC_YEARS);
      const schoolYears = all.filter(y => y.schoolId === schoolId);
      if (schoolYears.length > 0) {
        return schoolYears.sort((a, b) => b.code.localeCompare(a.code));
      }
    } catch (e) {
      console.warn('Error reading academic_years store:', e);
    }
    return DEFAULT_ACADEMIC_YEARS.filter(y => y.schoolId === schoolId);
  }

  async function getActiveAcademicYear(schoolId = getActiveSchoolId()) {
    const years = await getAllAcademicYears(schoolId);
    if (!years || years.length === 0) {
      return {
        id: `ay_${schoolId}_current`,
        schoolId,
        code: '2026-2027',
        name: '2026–2027 Eğitim-Öğretim Yılı',
        isCurrent: true,
      };
    }

    const savedId = localStorage.getItem(getAcademicYearStorageKey(schoolId));
    if (savedId) {
      const match = years.find(y => y.id === savedId);
      if (match) return match;
    }

    const currentYear = years.find(y => y.isCurrent);
    return currentYear || years[0];
  }

  async function getActiveAcademicYearId(schoolId = getActiveSchoolId()) {
    const year = await getActiveAcademicYear(schoolId);
    return year.id;
  }

  async function setActiveAcademicYear(yearId, schoolId = getActiveSchoolId()) {
    localStorage.setItem(getAcademicYearStorageKey(schoolId), yearId);
    const years = await getAllAcademicYears(schoolId);
    const selected = years.find(y => y.id === yearId);

    try {
      for (const y of years) {
        const shouldBeCurrent = (y.id === yearId);
        if (y.isCurrent !== shouldBeCurrent) {
          y.isCurrent = shouldBeCurrent;
          await Database.put(Database.STORES.ACADEMIC_YEARS, y);
        }
      }
    } catch (e) {
      console.warn('Error updating academic years store isCurrent:', e);
    }

    if (window.Audit) {
      await window.Audit.log({
        action: 'SWITCH_ACADEMIC_YEAR',
        entityType: 'academic_year',
        entityId: yearId,
        details: `Aktif eğitim-öğretim yılı değiştirildi: ${selected?.name || yearId}`,
        schoolId,
      });
    }

    window.dispatchEvent(new CustomEvent('academicYearChanged', { detail: { yearId, schoolId } }));
  }

  async function createAcademicYear(data, schoolId = getActiveSchoolId()) {
    const year = {
      id: data.id || 'ay_' + SeedData.generateId(),
      schoolId,
      code: data.code.trim(),
      name: data.name ? data.name.trim() : `${data.code.trim()} Eğitim-Öğretim Yılı`,
      isCurrent: Boolean(data.isCurrent),
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      createdAt: new Date().toISOString(),
    };

    if (year.isCurrent) {
      // Mark others as not current
      const all = await getAllAcademicYears(schoolId);
      for (const y of all) {
        if (y.isCurrent) {
          y.isCurrent = false;
          await Database.put(Database.STORES.ACADEMIC_YEARS, y);
        }
      }
    }

    await Database.put(Database.STORES.ACADEMIC_YEARS, year);

    if (year.isCurrent) {
      localStorage.setItem(getAcademicYearStorageKey(schoolId), year.id);
    }

    if (window.Audit) {
      await window.Audit.log({
        action: 'CREATE_ACADEMIC_YEAR',
        entityType: 'academic_year',
        entityId: year.id,
        details: `Yeni eğitim-öğretim yılı oluşturuldu: ${year.name}`,
        schoolId,
      });
    }

    return year;
  }

  window.AcademicYears = {
    getAll: getAllAcademicYears,
    getActiveYear: getActiveAcademicYear,
    getActiveYearId: getActiveAcademicYearId,
    setActiveYear: setActiveAcademicYear,
    create: createAcademicYear,
    DEFAULT_ACADEMIC_YEARS,
  };

  /* ============================================================
     2. STAFF SERVICE (Personel Yönetimi)
     ============================================================ */

  const ROLE_LABELS = {
    teacher: 'Öğretmen',
    admin: 'İdareci / Müdür Yrd.',
    counselor: 'Rehberlik Servisi',
  };

  async function getAllStaff(schoolId = getActiveSchoolId()) {
    try {
      const all = await Database.getAll(Database.STORES.STAFF);
      return all.filter(s => s.schoolId === schoolId);
    } catch (e) {
      console.warn('Error reading staff store:', e);
      return [];
    }
  }

  async function getStaffById(id) {
    return Database.get(Database.STORES.STAFF, id);
  }

  async function createStaff(data) {
    const schoolId = data.schoolId || getActiveSchoolId();
    const staff = {
      id: data.id || 'staff_' + SeedData.generateId(),
      schoolId,
      fullName: data.fullName.trim(),
      branch: data.branch ? data.branch.trim() : 'Genel',
      role: data.role || 'teacher',
      phone: data.phone ? data.phone.trim() : '',
      email: data.email ? data.email.trim() : '',
      status: data.status || 'active',
      dutyDay: data.dutyDay || 'Pazartesi',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await Database.put(Database.STORES.STAFF, staff);

    await Audit.log({
      action: 'CREATE_STAFF',
      entityType: 'staff',
      entityId: staff.id,
      details: `${staff.fullName} (${ROLE_LABELS[staff.role] || staff.role}) personeli eklendi.`,
      schoolId,
    });

    return staff;
  }

  async function updateStaff(id, updates) {
    const existing = await getStaffById(id);
    if (!existing) throw new Error('Personel bulunamadı.');

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    await Database.put(Database.STORES.STAFF, updated);

    await Audit.log({
      action: 'UPDATE_STAFF',
      entityType: 'staff',
      entityId: id,
      details: `${updated.fullName} personel bilgileri güncellendi.`,
      schoolId: updated.schoolId,
    });

    return updated;
  }

  async function toggleStaffStatus(id) {
    const staff = await getStaffById(id);
    if (!staff) return null;
    const newStatus = staff.status === 'active' ? 'passive' : 'active';
    return updateStaff(id, { status: newStatus });
  }

  window.Staff = {
    getAll: getAllStaff,
    getById: getStaffById,
    create: createStaff,
    update: updateStaff,
    toggleStatus: toggleStaffStatus,
    ROLE_LABELS,
  };

  /* ============================================================
     3. AUDIT TRAIL SERVICE (Denetim İzi & Güvenlik Günlüğü)
     ============================================================ */

  async function logAudit(entry) {
    try {
      const user = Auth.getCurrentUser();
      const schoolId = entry.schoolId || getActiveSchoolId();
      const log = {
        id: 'audit_' + SeedData.generateId(),
        schoolId,
        userId: user?.username || 'system',
        userName: user?.displayName || 'Sistem',
        userRole: user?.role || 'system',
        action: entry.action || 'GENERAL_ACTION',
        entityType: entry.entityType || 'general',
        entityId: entry.entityId || null,
        details: entry.details || '',
        timestamp: new Date().toISOString(),
      };
      await Database.put(Database.STORES.AUDIT_LOGS, log);
      return log;
    } catch (e) {
      console.warn('Audit logging failed:', e);
      return null;
    }
  }

  async function getAuditLogs(schoolId = getActiveSchoolId(), limit = 100) {
    try {
      const all = await Database.getAll(Database.STORES.AUDIT_LOGS);
      const filtered = all.filter(l => !schoolId || l.schoolId === schoolId);
      filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return filtered.slice(0, limit);
    } catch (e) {
      console.warn('Error reading audit logs:', e);
      return [];
    }
  }

  window.Audit = {
    log: logAudit,
    getAll: getAuditLogs,
  };

  /* ============================================================
     4. XLSX / CSV IMPORTER ENGINE (7 Adımlı Kontrollü Aktarım)
     ============================================================ */

  /**
   * Helper: Parse CSV/TSV text into array of object rows
   */
  function parseCSVText(text) {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return { headers: [], rows: [] };

    // Detect delimiter: semicolon, comma, or tab
    const firstLine = lines[0];
    let delimiter = ';';
    if (firstLine.includes(';') && (firstLine.split(';').length >= firstLine.split(',').length)) {
      delimiter = ';';
    } else if (firstLine.includes('\t')) {
      delimiter = '\t';
    } else if (firstLine.includes(',')) {
      delimiter = ',';
    }

    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = line.split(delimiter).map(v => v.trim().replace(/^["']|["']$/g, ''));
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      row._originalRowIndex = i + 1;
      rows.push(row);
    }

    return { headers, rows };
  }

  /**
   * Helper: Read a File object (XLSX via SheetJS if loaded, or CSV text)
   */
  async function parseUploadedFile(file) {
    return new Promise((resolve, reject) => {
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

      if (isExcel && window.XLSX) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target.result);
            const workbook = window.XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const jsonData = window.XLSX.utils.sheet_to_json(sheet, { header: 1 });

            if (!jsonData || jsonData.length < 2) {
              resolve({ headers: [], rows: [] });
              return;
            }

            const headers = jsonData[0].map(h => String(h || '').trim());
            const rows = [];
            for (let i = 1; i < jsonData.length; i++) {
              const rowArr = jsonData[i];
              if (!rowArr || rowArr.length === 0 || rowArr.every(c => c === '' || c === undefined)) continue;
              const rowObj = {};
              headers.forEach((h, colIdx) => {
                rowObj[h] = rowArr[colIdx] !== undefined ? String(rowArr[colIdx]).trim() : '';
              });
              rowObj._originalRowIndex = i + 1;
              rows.push(rowObj);
            }
            resolve({ headers, rows, sheetName });
          } catch (err) {
            reject(new Error('Excel dosyası çözümlenemedi: ' + err.message));
          }
        };
        reader.onerror = () => reject(new Error('Dosya okunamadı.'));
        reader.readAsArrayBuffer(file);
      } else {
        // Read as text (CSV / TSV)
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target.result;
            const parsed = parseCSVText(text);
            resolve(parsed);
          } catch (err) {
            reject(new Error('CSV dosyası çözümlenemedi: ' + err.message));
          }
        };
        reader.onerror = () => reject(new Error('Dosya okunamadı.'));
        reader.readAsText(file, 'UTF-8');
      }
    });
  }

  /**
   * Auto-detect column mappings for Students
   */
  function autoMapStudentColumns(headers) {
    const mapping = {
      studentNo: '',
      firstName: '',
      lastName: '',
      class: '',
      section: '',
    };

    const clean = s => s.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '');

    headers.forEach(h => {
      const c = clean(h);
      if (!mapping.studentNo && (c.includes('numara') || c.includes('ogrencino') || c === 'no' || c === 'okulno')) {
        mapping.studentNo = h;
      } else if (!mapping.firstName && (c === 'ad' || c === 'adi' || c === 'isim' || c === 'ogrenciadi')) {
        mapping.firstName = h;
      } else if (!mapping.lastName && (c === 'soyad' || c === 'soyadi' || c === 'ogrencisoyadi')) {
        mapping.lastName = h;
      } else if (!mapping.class && (c === 'sinif' || c === 'sinifi' || c === 'seviye')) {
        mapping.class = h;
      } else if (!mapping.section && (c === 'sube' || c === 'subesi')) {
        mapping.section = h;
      }
    });

    return mapping;
  }

  /**
   * Auto-detect column mappings for Staff
   */
  function autoMapStaffColumns(headers) {
    const mapping = {
      fullName: '',
      branch: '',
      role: '',
      phone: '',
      status: '',
    };

    const clean = s => s.toLowerCase().replace(/[^a-z0-9ğüşıöç]/g, '');

    headers.forEach(h => {
      const c = clean(h);
      if (!mapping.fullName && (c.includes('adsoyad') || c.includes('isim') || c === 'personel')) {
        mapping.fullName = h;
      } else if (!mapping.branch && (c.includes('brans') || c.includes('alan') || c.includes('gorev'))) {
        mapping.branch = h;
      } else if (!mapping.role && (c.includes('rol') || c.includes('unvan') || c.includes('yetki'))) {
        mapping.role = h;
      } else if (!mapping.phone && (c.includes('telefon') || c.includes('gsm') || c.includes('cep'))) {
        mapping.phone = h;
      } else if (!mapping.status && (c.includes('durum') || c.includes('aktif'))) {
        mapping.status = h;
      }
    });

    return mapping;
  }

  /**
   * Step 3: Validate and categorize Student rows against current school
   */
  async function validateStudentsImport(rows, mapping, schoolId = getActiveSchoolId()) {
    const existingStudents = await Database.getAll(Database.STORES.STUDENTS);
    const schoolExisting = existingStudents.filter(s => s.schoolId === schoolId);
    const existingNoMap = {};
    schoolExisting.forEach(s => existingNoMap[s.studentNo] = s);

    const validNew = [];
    const validUpdates = [];
    const rejected = [];
    const seenNosInFile = new Set();

    rows.forEach(r => {
      const rawNo = (r[mapping.studentNo] || '').trim();
      const rawFirst = (r[mapping.firstName] || '').trim();
      const rawLast = (r[mapping.lastName] || '').trim();
      let rawClass = (r[mapping.class] || '').trim();
      const rawSection = mapping.section ? (r[mapping.section] || '').trim() : '';

      if (rawSection && !rawClass.includes('-')) {
        rawClass = `${rawClass}-${rawSection.toUpperCase()}`;
      }

      const errors = [];

      if (!rawNo) errors.push('Öğrenci numarası eksik.');
      if (!rawFirst) errors.push('Öğrenci adı eksik.');
      if (!rawLast) errors.push('Öğrenci soyadı eksik.');
      if (!rawClass) errors.push('Sınıf bilgisi eksik.');

      if (rawNo) {
        if (seenNosInFile.has(rawNo)) {
          errors.push(`Dosya içinde mükerrer öğrenci no (${rawNo}).`);
        } else {
          seenNosInFile.add(rawNo);
        }
      }

      const item = {
        _rowIndex: r._originalRowIndex,
        studentNo: rawNo,
        firstName: rawFirst,
        lastName: rawLast,
        class: rawClass.toUpperCase(),
        schoolId,
        avatarColor: SeedData.getAvatarColor(`${rawFirst} ${rawLast}`),
        errors,
      };

      if (errors.length > 0) {
        rejected.push(item);
      } else if (existingNoMap[rawNo]) {
        // Will update existing
        item.id = existingNoMap[rawNo].id;
        item.isUpdate = true;
        validUpdates.push(item);
      } else {
        // Brand new
        item.id = SeedData.generateId();
        item.isUpdate = false;
        validNew.push(item);
      }
    });

    return {
      totalRows: rows.length,
      validNew,
      validUpdates,
      rejected,
      schoolId,
    };
  }

  /**
   * Step 3 (Staff): Validate and categorize Staff rows
   */
  async function validateStaffImport(rows, mapping, schoolId = getActiveSchoolId()) {
    const existingStaff = await Database.getAll(Database.STORES.STAFF);
    const schoolExisting = existingStaff.filter(s => s.schoolId === schoolId);
    const existingNameMap = {};
    schoolExisting.forEach(s => existingNameMap[s.fullName.toLowerCase()] = s);

    const validNew = [];
    const validUpdates = [];
    const rejected = [];
    const seenNames = new Set();

    rows.forEach(r => {
      const rawName = (r[mapping.fullName] || '').trim();
      const rawBranch = (r[mapping.branch] || '').trim() || 'Genel';
      let rawRole = (r[mapping.role] || '').trim().toLowerCase();
      const rawPhone = (r[mapping.phone] || '').trim();
      const rawStatus = (r[mapping.status] || 'aktif').trim().toLowerCase().includes('pasif') ? 'passive' : 'active';

      // Normalize role string (ODİS: Öğretmen, Rehberlik, İdareci)
      if (rawRole.includes('müdür') || rawRole.includes('idare') || rawRole.includes('yonetim')) rawRole = 'admin';
      else if (rawRole.includes('rehber') || rawRole.includes('danışman') || rawRole.includes('psikolog')) rawRole = 'counselor';
      else rawRole = 'teacher';

      const errors = [];
      if (!rawName) errors.push('Personel ad soyad eksik.');

      if (rawName) {
        if (seenNames.has(rawName.toLowerCase())) {
          errors.push(`Dosya içinde aynı isimli mükerrer personel (${rawName}).`);
        } else {
          seenNames.add(rawName.toLowerCase());
        }
      }

      const item = {
        _rowIndex: r._originalRowIndex,
        fullName: rawName,
        branch: rawBranch,
        role: rawRole,
        phone: rawPhone,
        status: rawStatus,
        schoolId,
        errors,
      };

      if (errors.length > 0) {
        rejected.push(item);
      } else if (existingNameMap[rawName.toLowerCase()]) {
        item.id = existingNameMap[rawName.toLowerCase()].id;
        item.isUpdate = true;
        validUpdates.push(item);
      } else {
        item.id = 'staff_' + SeedData.generateId();
        item.isUpdate = false;
        validNew.push(item);
      }
    });

    return {
      totalRows: rows.length,
      validNew,
      validUpdates,
      rejected,
      schoolId,
    };
  }

  /**
   * Step 6: Commit Student Import with Audit Trail
   */
  async function commitStudentImport(validationResult) {
    const { validNew, validUpdates, rejected, schoolId } = validationResult;
    const toInsert = [...validNew, ...validUpdates].map(item => ({
      id: item.id,
      studentNo: item.studentNo,
      firstName: item.firstName,
      lastName: item.lastName,
      class: item.class,
      schoolId: item.schoolId || schoolId,
      avatarColor: item.avatarColor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    if (toInsert.length > 0) {
      await Database.bulkPut(Database.STORES.STUDENTS, toInsert);
    }

    await Audit.log({
      action: 'IMPORT_XLSX_STUDENTS',
      entityType: 'student',
      schoolId,
      details: `Öğrenci XLSX aktarımı tamamlandı. ${validNew.length} yeni eklendi, ${validUpdates.length} güncellendi, ${rejected.length} hatalı satır atlandı.`,
    });

    return {
      success: true,
      insertedCount: validNew.length,
      updatedCount: validUpdates.length,
      rejectedCount: rejected.length,
      totalProcessed: toInsert.length,
    };
  }

  /**
   * Step 6 (Staff): Commit Staff Import with Audit Trail
   */
  async function commitStaffImport(validationResult) {
    const { validNew, validUpdates, rejected, schoolId } = validationResult;
    const toInsert = [...validNew, ...validUpdates].map(item => ({
      id: item.id,
      fullName: item.fullName,
      branch: item.branch,
      role: item.role,
      phone: item.phone,
      status: item.status,
      schoolId: item.schoolId || schoolId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    if (toInsert.length > 0) {
      await Database.bulkPut(Database.STORES.STAFF, toInsert);
    }

    await Audit.log({
      action: 'IMPORT_XLSX_STAFF',
      entityType: 'staff',
      schoolId,
      details: `Personel XLSX aktarımı tamamlandı. ${validNew.length} yeni eklendi, ${validUpdates.length} güncellendi, ${rejected.length} satır atlandı.`,
    });

    return {
      success: true,
      insertedCount: validNew.length,
      updatedCount: validUpdates.length,
      rejectedCount: rejected.length,
      totalProcessed: toInsert.length,
    };
  }

  /**
   * Helper: Download Sample CSV template
   */
  function downloadSampleTemplate(type = 'student') {
    let filename, content;
    if (type === 'student') {
      filename = 'ODIS_Ogrenci_Aktarim_Sablonu.csv';
      content = '\uFEFF' + [
        'Öğrenci No;Adı;Soyadı;Sınıf;Şube',
        '101;Ahmet;Yılmaz;9;A',
        '102;Zeynep;Kaya;9;B',
        '205;Mustafa;Demir;10;A',
        '310;Elif;Çelik;11;C',
        '415;Burak;Öztürk;12;B',
      ].join('\r\n');
    } else {
      filename = 'ODIS_Personel_Aktarim_Sablonu.csv';
      content = '\uFEFF' + [
        'Ad Soyad;Branş;Rol;Telefon;Durum',
        'Ayşe Kaya;Türk Dili ve Edebiyatı;Öğretmen;0532 111 22 33;Aktif',
        'Ali Vural;Matematik;İdareci;0542 222 33 44;Aktif',
        'Selin Danışman;Rehberlik;Rehberlik;0555 333 44 55;Aktif',
        'Mehmet Yılmaz;Beden Eğitimi;Öğretmen;0533 555 66 77;Aktif',
      ].join('\r\n');
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  window.Importer = {
    parseUploadedFile,
    autoMapStudentColumns,
    autoMapStaffColumns,
    validateStudentsImport,
    validateStaffImport,
    commitStudentImport,
    commitStaffImport,
    downloadSampleTemplate,
  };

})();
