import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Setup Global Environment for Node.js
const storage = new Map();
global.localStorage = {
  getItem: (k) => (storage.has(k) ? storage.get(k) : null),
  setItem: (k, v) => storage.set(k, String(v)),
  removeItem: (k) => storage.delete(k),
  clear: () => storage.clear(),
};
global.sessionStorage = {
  getItem: (k) => (storage.has('sess_' + k) ? storage.get('sess_' + k) : null),
  setItem: (k, v) => storage.set('sess_' + k, String(v)),
  removeItem: (k) => storage.delete('sess_' + k),
  clear: () => storage.clear(),
};

class MockElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this._innerHTML = '';
    this._textContent = '';
    this.classList = {
      classes: new Set(),
      add: (c) => this.classList.classes.add(c),
      remove: (c) => this.classList.classes.delete(c),
      toggle: (c) => (this.classList.classes.has(c) ? this.classList.classes.delete(c) : this.classList.classes.add(c)),
    };
  }
  get textContent() { return this._textContent || this._innerHTML; }
  set textContent(val) {
    this._textContent = String(val);
    this._innerHTML = String(val).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  get innerHTML() { return this._innerHTML; }
  set innerHTML(val) { this._innerHTML = val; }
  appendChild(child) {
    this.children.push(child);
    if (child._innerHTML) {
      this._innerHTML += child._innerHTML;
    }
  }
  addEventListener() {}
  setAttribute() {}
}

const appElement = new MockElement('div');
global.document = {
  getElementById: (id) => (id === 'app' ? appElement : new MockElement('div')),
  querySelectorAll: () => [],
  createElement: (tag) => new MockElement(tag),
  addEventListener: () => {},
  removeEventListener: () => {},
  body: new MockElement('body'),
};

global.window = global;
global.CustomEvent = class CustomEvent {
  constructor(name, options = {}) {
    this.name = name;
    this.detail = options.detail;
  }
};
global.dispatchEvent = () => true;
global.addEventListener = () => {};

// 2. In-Memory Database adhering strictly to database.js STORES and API
const inMemoryData = {
  schools: [],
  academic_years: [],
  staff: [],
  classes: [],
  students: [],
  order_records: [],
  observations: [],
  support_cases: [],
  admin_actions: [],
  audit_logs: [],
};

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
  RECORDS: 'order_records',
};

global.Database = {
  STORES,
  open: async () => true,
  put: async (storeName, data) => {
    const list = inMemoryData[storeName] || (inMemoryData[storeName] = []);
    const idx = list.findIndex(item => item.id === data.id);
    if (idx >= 0) {
      list[idx] = { ...data };
    } else {
      list.push({ ...data });
    }
    return data;
  },
  get: async (storeName, key) => {
    const list = inMemoryData[storeName] || [];
    const item = list.find(x => x.id === key);
    return item ? { ...item } : null;
  },
  getAll: async (storeName) => {
    const list = inMemoryData[storeName] || [];
    return list.map(x => ({ ...x }));
  },
  getByIndex: async (storeName, indexName, value) => {
    const list = inMemoryData[storeName] || [];
    return list.filter(x => x[indexName] === value).map(x => ({ ...x }));
  },
  bulkPut: async (storeName, items) => {
    for (const item of items) {
      await global.Database.put(storeName, item);
    }
  },
  clear: async (storeName) => {
    inMemoryData[storeName] = [];
  },
  count: async (storeName) => {
    return (inMemoryData[storeName] || []).length;
  },
  delete: async (storeName, key) => {
    const list = inMemoryData[storeName] || [];
    const idx = list.findIndex(x => x.id === key);
    if (idx >= 0) list.splice(idx, 1);
  },
};

// 3. Load Project Modules in sequence
import vm from 'node:vm';

function loadScript(relPath) {
  const code = fs.readFileSync(path.join(__dirname, relPath), 'utf-8');
  vm.runInThisContext(code, { filename: relPath });
}

loadScript('js/seed-data.js');
loadScript('js/ui.js');
loadScript('js/auth.js');
loadScript('js/schools.js');
loadScript('js/students.js');
loadScript('js/records.js');
loadScript('js/admin-actions.js');
loadScript('js/dashboard.js');
loadScript('js/router.js');
loadScript('js/counselor.view.js');
loadScript('js/admin.view.js');
loadScript('js/teacher.view.js');
loadScript('js/student.view.js');
loadScript('js/app.js');

// 4. Execute the Test Scenario
async function runTest() {
  console.log('======================================================================');
  console.log('       ODİS v3 — AKADEMİK YIL YAŞAM DÖNGÜSÜ DOĞRULAMA TESTİ           ');
  console.log('======================================================================\n');

  // Seed baseline data
  await global.SeedData.seed();
  global.Auth.login('mudur', 'odis123');

  const schoolId = 'school_kasif';
  await global.Schools.setActiveSchool(schoolId);

  const year2526 = 'ay_kasif_2526';
  const year2627 = 'ay_kasif_2627';

  // -------------------------------------------------------------------------
  // ADIM 1: 2025-2026 yılına ait bir öğrenci kaydı oluşturulsun.
  // -------------------------------------------------------------------------
  console.log('👉 ADIM 1: 2025-2026 yılına ait öğrenci kaydı oluşturuluyor...');
  await global.AcademicYears.setActiveYear(year2526, schoolId);

  const student = await global.Students.create({
    studentNo: '202501',
    firstName: 'Caner',
    lastName: 'Bulut',
    class: '10-A',
    academicYearId: year2526,
    schoolId,
  });

  console.log(`   Öğrenci Kaydedildi: ${student.firstName} ${student.lastName} (No: ${student.studentNo}, Sınıf: ${student.class})`);
  console.log(`   Kayıtlı Olduğu Eğitim Yılı: ${student.academicYearId}`);

  const assert1 = Boolean(student && student.id && student.studentNo === '202501' && student.academicYearId === year2526);
  console.log(`   [KONTROL 1] Öğrenci 2025-2026 yılıyla başarıyla kaydedildi: ${assert1 ? '✓ GEÇTİ' : '✗ KALDI'}\n`);

  // -------------------------------------------------------------------------
  // ADIM 2: Öğrenci hakkında üç disiplin kaydı girilsin.
  // -------------------------------------------------------------------------
  console.log('👉 ADIM 2: Öğrenci hakkında 3 disiplin kaydı giriliyor...');

  const r1 = await global.Records.create({
    studentId: student.id,
    academicYearId: year2526,
    category: 'kilik-kiyafet',
    description: '1. İhlal: Okul forması yerine uygunsuz sivil kıyafet giyilmiş.',
    dateTime: '2025-10-14T08:15:00.000Z',
    createdBy: 'Ayşe Kaya (Öğretmen)',
  });
  console.log(`   Kayıt 1 eklendi: [${r1.category}] ${r1.description} (Dönem: ${r1.academicYearId})`);

  const r2 = await global.Records.create({
    studentId: student.id,
    academicYearId: year2526,
    category: 'arma',
    description: '2. İhlal: Formada okul arması ve kimlik kartı bulunmuyor.',
    dateTime: '2025-11-20T08:20:00.000Z',
    createdBy: 'Mehmet Yılmaz (Öğretmen)',
  });
  console.log(`   Kayıt 2 eklendi: [${r2.category}] ${r2.description} (Dönem: ${r2.academicYearId})`);

  const r3 = await global.Records.create({
    studentId: student.id,
    academicYearId: year2526,
    category: 'sac',
    description: '3. İhlal: Kılık kıyafet yönetmeliğine aykırı saç traşı.',
    dateTime: '2026-03-05T08:30:00.000Z',
    createdBy: 'Ayşe Kaya (Öğretmen)',
  });
  console.log(`   Kayıt 3 eklendi: [${r3.category}] ${r3.description} (Dönem: ${r3.academicYearId})`);

  const statsYear2526 = await global.Students.getWithStats(student.id, year2526);
  const assert2 = (statsYear2526.records.length === 3);
  console.log(`   [KONTROL 2] 2025-2026 yılı için öğrenciye ait kayıt sayısı: ${statsYear2526.records.length} (Beklenen: 3) -> ${assert2 ? '✓ GEÇTİ' : '✗ KALDI'}\n`);

  // -------------------------------------------------------------------------
  // ADIM 3: Aktif eğitim yılı 2026-2027 olarak değiştirilsin.
  // -------------------------------------------------------------------------
  console.log('👉 ADIM 3: Aktif eğitim yılı 2026-2027 olarak değiştiriliyor...');
  await global.AcademicYears.setActiveYear(year2627, schoolId);

  const activeYear = await global.AcademicYears.getActiveYear(schoolId);
  const activeYearId = await global.AcademicYears.getActiveYearId(schoolId);
  const assert3 = (activeYearId === year2627 && activeYear.code === '2026-2027');
  console.log(`   Aktif Dönem: ${activeYear.code} (${activeYear.id})`);
  console.log(`   [KONTROL 3] Aktif yıl 2026-2027 olarak değişti: ${assert3 ? '✓ GEÇTİ' : '✗ KALDI'}\n`);

  // -------------------------------------------------------------------------
  // ADIM 4: Öğrencinin yeni yıl ekranı kontrol edilsin.
  // Beklenen sonuç: Yeni yılın aktif kayıtları boş olmalı!
  // -------------------------------------------------------------------------
  console.log('👉 ADIM 4: Öğrencinin yeni yıl (2026-2027) ekranı kontrol ediliyor...');
  // Data-layer check
  const studentNewYear = await global.Students.getWithStats(student.id);

  console.log(`   Yeni Yıl (2026-2027) Aktif Kayıt Sayısı: ${studentNewYear.records.length}`);
  console.log(`   Yeni Yıl (2026-2027) İstatistik Toplamı: ${studentNewYear.stats.totalRecords}`);
  console.log(`   Geçmiş Yıllardan Korunan Arşiv Kaydı Sayısı: ${studentNewYear.stats.pastRecordsCount}`);
  console.log(`   Tüm Zamanlar Toplam Kayıt Sayısı: ${studentNewYear.stats.allTimeRecords}`);

  // UI-layer check (Teacher screen)
  appElement.innerHTML = '';
  await global.renderStudentCard(student.id, year2627);
  const teacherCardHtml = appElement.innerHTML;
  const teacherEmptyMessageFound = teacherCardHtml.includes('Döneminde Aktif Düzen Kaydı Yok') &&
                                   teacherCardHtml.includes('boştur');
  const teacherArchiveLinkFound = teacherCardHtml.includes('Geçmiş Yıl Kayıtlarına Eriş');

  // UI-layer check (Admin detail screen)
  appElement.innerHTML = '';
  await global.renderStudentDetail(student.id, year2627);
  const adminDetailHtml = appElement.innerHTML;
  const adminEmptyMessageFound = adminDetailHtml.includes('Döneminde Aktif Düzen Kaydı Yok');
  const adminOrderCountZero = adminDetailHtml.includes('Okul Düzeni (0)');

  const assert4_empty = (studentNewYear.records.length === 0);
  const assert4_statZero = (studentNewYear.stats.totalRecords === 0);
  const assert4_pastCount = (studentNewYear.stats.pastRecordsCount === 3);
  const assert4_ui = teacherEmptyMessageFound && teacherArchiveLinkFound && adminEmptyMessageFound && adminOrderCountZero;
  const assert4 = assert4_empty && assert4_statZero && assert4_pastCount && assert4_ui;

  console.log(`   [KONTROL 4a] Yeni yılın aktif kayıtları boş (0 kayıt): ${assert4_empty ? '✓ GEÇTİ' : '✗ KALDI'}`);
  console.log(`   [KONTROL 4b] Geçmiş 3 kayıt arka planda arşivlendi: ${assert4_pastCount ? '✓ GEÇTİ' : '✗ KALDI'}`);
  console.log(`   [KONTROL 4c] Öğrenci Kartı UI: Temiz sayfa ve boş durum mesajı görüntülendi: ${teacherEmptyMessageFound ? '✓ GEÇTİ' : '✗ KALDI'}`);
  console.log(`   [KONTROL 4d] Öğrenci Detayı UI: "Okul Düzeni (0)" ve arşiv geçiş butonu mevcut: ${adminOrderCountZero ? '✓ GEÇTİ' : '✗ KALDI'}\n`);

  // -------------------------------------------------------------------------
  // ADIM 5: Geçmiş yıl kayıtlarına tekrar erişilsin.
  // Beklenen sonuç: Geçmiş yılın üç kaydı ise korunmalı.
  // -------------------------------------------------------------------------
  console.log('👉 ADIM 5: Geçmiş yıl (2025-2026) arşiv kayıtlarına tekrar erişiliyor...');
  const studentPastYear = await global.Students.getWithStats(student.id, year2526);

  console.log(`   Geçmiş Yıl (2025-2026) Kayıt Sayısı: ${studentPastYear.records.length}`);
  studentPastYear.records.forEach((r, idx) => {
    console.log(`   ${idx + 1}. [${r.category}] ${r.description} | Tarih: ${r.dateTime} | Yetkili: ${r.createdBy}`);
  });

  // UI-layer verification for past year in Student Detail
  appElement.innerHTML = '';
  await global.renderStudentDetail(student.id, year2526);
  const pastDetailHtml = appElement.innerHTML;

  const pastUiShows3 = pastDetailHtml.includes('Okul Düzeni (3)');
  const pastUiShowsR1 = pastDetailHtml.includes('1. İhlal');
  const pastUiShowsR2 = pastDetailHtml.includes('2. İhlal');
  const pastUiShowsR3 = pastDetailHtml.includes('3. İhlal');

  const checkR1 = studentPastYear.records.some(r => r.category === 'kilik-kiyafet' && r.description.includes('sivil kıyafet'));
  const checkR2 = studentPastYear.records.some(r => r.category === 'arma' && r.description.includes('okul arması'));
  const checkR3 = studentPastYear.records.some(r => r.category === 'sac' && r.description.includes('saç traşı'));

  const assert5_data = (studentPastYear.records.length === 3 && checkR1 && checkR2 && checkR3);
  const assert5_ui = (pastUiShows3 && pastUiShowsR1 && pastUiShowsR2 && pastUiShowsR3);
  const assert5 = assert5_data && assert5_ui;

  console.log(`\n   [KONTROL 5a] Geçmiş yılın 3 disiplin kaydı eksiksiz korundu: ${assert5_data ? '✓ GEÇTİ' : '✗ KALDI'}`);
  console.log(`   [KONTROL 5b] Öğrenci Detayı UI: "Okul Düzeni (3)" ve tüm 3 kayıt listelendi: ${assert5_ui ? '✓ GEÇTİ' : '✗ KALDI'}\n`);

  // -------------------------------------------------------------------------
  // GENEL SONUÇ DEĞERLENDİRMESİ
  // -------------------------------------------------------------------------
  const allPassed = assert1 && assert2 && assert3 && assert4 && assert5;

  console.log('======================================================================');
  console.log('                          TEST RAPORU ÖZETİ                           ');
  console.log('======================================================================');
  console.log(`Adım 1: 2025-2026 Yılı Öğrenci Kaydı:                 ${assert1 ? '✓ BAŞARILI' : '✗ BAŞARISIZ'}`);
  console.log(`Adım 2: 3 Disiplin Kaydı Girişi:                     ${assert2 ? '✓ BAŞARILI' : '✗ BAŞARISIZ'}`);
  console.log(`Adım 3: Aktif Yılın 2026-2027 Olarak Değiştirilmesi:  ${assert3 ? '✓ BAŞARILI' : '✗ BAŞARISIZ'}`);
  console.log(`Adım 4: Yeni Yıl Ekranı (Aktif Kayıtlar Boş):        ${assert4 ? '✓ BAŞARILI' : '✗ BAŞARISIZ'}`);
  console.log(`Adım 5: Geçmiş Yıl Kayıtlarına Erişim (3 Korundu):   ${assert5 ? '✓ BAŞARILI' : '✗ BAŞARISIZ'}`);
  console.log('----------------------------------------------------------------------');
  console.log(`BEKLENEN SONUÇ: Yeni yılın aktif kayıtları boş olmalı, geçmiş yılın üç kaydı korunmalı.`);
  console.log(`GENEL DURUM:    ${allPassed ? '✅ TEST BAŞARIYLA TAMAMLANDI (TÜM KRİTERLER SAĞLANDI)' : '❌ TEST BAŞARISIZ'}`);
  console.log('======================================================================\n');

  if (!allPassed) {
    process.exit(1);
  }
}

runTest().catch(err => {
  console.error('Kritik test hatası:', err);
  process.exit(1);
});
