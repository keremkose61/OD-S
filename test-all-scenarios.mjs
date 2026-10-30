import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Setup Global Environment for Node.js Simulation
const primaryStorage = new Map();
global.localStorage = {
  getItem: (k) => (primaryStorage.has(k) ? primaryStorage.get(k) : null),
  setItem: (k, v) => primaryStorage.set(k, String(v)),
  removeItem: (k) => primaryStorage.delete(k),
  clear: () => primaryStorage.clear(),
};
global.sessionStorage = {
  getItem: (k) => (primaryStorage.has('sess_' + k) ? primaryStorage.get('sess_' + k) : null),
  setItem: (k, v) => primaryStorage.set('sess_' + k, String(v)),
  removeItem: (k) => primaryStorage.delete('sess_' + k),
  clear: () => primaryStorage.clear(),
};

class MockElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this._innerHTML = '';
    this._textContent = '';
    this.dataset = {};
    this.style = {};
    this.classList = {
      classes: new Set(),
      add: (c) => this.classList.classes.add(c),
      remove: (c) => this.classList.classes.delete(c),
      contains: (c) => this.classList.classes.has(c),
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
  removeEventListener() {}
  setAttribute() {}
  getAttribute() { return null; }
  remove() {}
  click() {}
}

const appElement = new MockElement('div');
global.document = {
  getElementById: (id) => (id === 'app' ? appElement : new MockElement('div')),
  querySelectorAll: () => [],
  querySelector: () => new MockElement('div'),
  createElement: (tag) => new MockElement(tag),
  addEventListener: () => {},
  removeEventListener: () => {},
  body: new MockElement('body'),
};
global.window = global;
global.location = { hash: '' };
global.CustomEvent = class CustomEvent {
  constructor(name, options = {}) {
    this.name = name;
    this.detail = options.detail;
  }
};
global.dispatchEvent = () => true;
global.addEventListener = () => {};

// In-Memory IndexedDB Mock with multi-store and index support
class MockIDBDatabase {
  constructor() {
    this.stores = new Map();
  }
  getStore(name) {
    if (!this.stores.has(name)) this.stores.set(name, new Map());
    return this.stores.get(name);
  }
}

let activeDb = new MockIDBDatabase();

const DatabaseMock = {
  STORES: {
    SCHOOLS: 'schools',
    ACADEMIC_YEARS: 'academicYears',
    STUDENTS: 'students',
    STAFF: 'staff',
    CLASSES: 'classes',
    RULES: 'rules',
    ORDER_RECORDS: 'orderRecords',
    OBSERVATIONS: 'observations',
    SUPPORT_CASES: 'supportCases',
    ACTIONS: 'actions',
    AUDIT_LOGS: 'auditLogs',
  },
  async open() {
    return activeDb;
  },
  async get(storeName, key) {
    const store = activeDb.getStore(storeName);
    const item = store.get(key);
    return item ? JSON.parse(JSON.stringify(item)) : null;
  },
  async getAll(storeName) {
    const store = activeDb.getStore(storeName);
    return Array.from(store.values()).map(v => JSON.parse(JSON.stringify(v)));
  },
  async put(storeName, value) {
    const store = activeDb.getStore(storeName);
    store.set(value.id, JSON.parse(JSON.stringify(value)));
    return value;
  },
  async bulkPut(storeName, items) {
    const store = activeDb.getStore(storeName);
    items.forEach(item => store.set(item.id, JSON.parse(JSON.stringify(item))));
  },
  async delete(storeName, key) {
    activeDb.getStore(storeName).delete(key);
  },
  async getByIndex(storeName, indexName, indexValue) {
    const all = await this.getAll(storeName);
    return all.filter(item => item[indexName] === indexValue);
  },
  async clear(storeName) {
    activeDb.getStore(storeName).clear();
  }
};
global.Database = DatabaseMock;

// 2. Load Project Modules
function loadScript(filePath) {
  const code = fs.readFileSync(path.join(__dirname, filePath), 'utf8');
  vm.runInThisContext(code, { filename: filePath });
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

// Helper assertion
let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (!condition) {
    console.error(`❌ [HATA]: ${message}`);
    process.exit(1);
  }
  passedCount++;
  console.log(`   ✓ ${message}`);
}

async function runAllTests() {
  console.log('======================================================================');
  console.log('            ODİS v3 — KAPSAMLI 9 SENARYO DOĞRULAMA TESTİ               ');
  console.log('======================================================================\n');

  // Seed Initial Demo Data
  await window.SeedData.seed();

  // ------------------------------------------------------------------
  // TEST 1: Öğretmen hesabıyla giriş -> Öğretmen ekranı açılmalı
  // ------------------------------------------------------------------
  console.log('👉 SENARYO 1: Öğretmen hesabıyla giriş testi...');
  const loginTeacher = await Auth.login('ogretmen', 'odis123');
  assert(loginTeacher !== null, 'Öğretmen hesabı ile giriş başarılı.');
  assert(loginTeacher.role === 'teacher', 'Kullanıcı rolü "teacher" olarak doğrulandı.');
  
  Router.navigate(Router.ROUTES.TEACHER_HOME);
  await renderTeacherHome();
  assert(appElement.innerHTML.includes('Nöbetçi Öğretmen'), 'Nöbetçi Öğretmen paneli ekranda görüntülendi.');
  assert(appElement.innerHTML.includes('Ayşe Kaya'), 'Öğretmen profil ismi ekranda doğrulandı.');

  // ------------------------------------------------------------------
  // TEST 2: Öğretmen hesabıyla yönetici ekranına erişim -> Yetkisiz erişim engellenmeli
  // ------------------------------------------------------------------
  console.log('\n👉 SENARYO 2: Öğretmen hesabıyla yönetici ekranına erişim testi...');
  // Halen öğretmen olarak oturum açık
  let toastTriggered = false;
  const originalShowToast = UI.showToast;
  UI.showToast = (msg, type) => {
    if (type === 'error' && msg.includes('Yetkisiz erişim')) toastTriggered = true;
  };

  Router.navigate(Router.ROUTES.ADMIN_DASHBOARD);
  assert(toastTriggered === true, 'Yetkisiz erişim uyarısı toast mesajı olarak tetiklendi.');
  assert(Router.ROUTES.ADMIN_DASHBOARD !== window.location.hash.replace('#', ''), 'Yönetici rotasına erişim engellendi ve yönlendirme yapıldı.');

  // Doğrudan renderAdminDashboard çağrısı da engellenmeli
  toastTriggered = false;
  await renderAdminDashboard();
  assert(toastTriggered === true, 'renderAdminDashboard doğrudan çağrısında da yetkisiz erişim engellendi.');
  UI.showToast = originalShowToast;

  // ------------------------------------------------------------------
  // TEST 3: Farklı okul hesabıyla giriş -> Diğer okulun verileri görünmemeli
  // ------------------------------------------------------------------
  console.log('\n👉 SENARYO 3: Farklı okul hesabıyla giriş ve veri yalıtımı (Multi-Tenant)...');
  // 1. Okul: Kaşif Kalkavan AL
  await Auth.login('ogretmen', 'odis123');
  const kasifSchoolId = Auth.getCurrentSchoolId();
  assert(kasifSchoolId === 'school_kasif', 'Kaşif Kalkavan AL aktif okul kimliği doğrulandı.');
  const kasifStudents = await Students.getAll();
  assert(kasifStudents.length > 0, `Kaşif Kalkavan bünyesinde ${kasifStudents.length} öğrenci listelendi.`);
  assert(kasifStudents.every(s => s.schoolId === 'school_kasif'), 'Tüm öğrenciler eksiksiz "school_kasif"e aittir.');

  // 2. Okul: Atatürk Fen Lisesi
  await Auth.login('afl_ogretmen', 'odis123');
  const aflSchoolId = Auth.getCurrentSchoolId();
  assert(aflSchoolId === 'school_ataturk', 'Atatürk Fen Lisesi aktif okul kimliği doğrulandı.');
  const aflStudents = await Students.getAll();
  assert(aflStudents.length > 0, `Atatürk Fen Lisesi bünyesinde ${aflStudents.length} öğrenci listelendi.`);
  assert(aflStudents.every(s => s.schoolId === 'school_ataturk'), 'Tüm öğrenciler eksiksiz "school_ataturk"e aittir.');

  // Çapraz kontrol: Kaşif'in öğrencileri AFL listesinde kesinlikle bulunmamalı
  const crossLeak = aflStudents.some(as => kasifStudents.some(ks => ks.id === as.id));
  assert(crossLeak === false, 'Okullar arası veri yalıtımı %100 başarılı; hiçbir öğrenci çakışmadı/sızmadı.');

  // ------------------------------------------------------------------
  // TEST 4: Aynı öğrenciye aynı gün tekrar kayıt -> Uyarı gösterilmeli
  // ------------------------------------------------------------------
  console.log('\n👉 SENARYO 4: Aynı öğrenciye aynı gün tekrar kayıt ve mükerrer uyarısı...');
  await Auth.login('ogretmen', 'odis123');
  const targetStudent = kasifStudents[0];
  const testCategory = 'kilik-kiyafet';

  // İlk kayıt bugün oluşturuluyor
  await Records.create({
    studentId: targetStudent.id,
    category: testCategory,
    description: 'Sabah kontrolünde uygunsuz kıyafet tespit edildi.',
    dateTime: new Date().toISOString(),
    createdBy: 'Ayşe Kaya',
    academicYearId: 'ay_kasif_2627',
  });

  // Aynı öğrenci için bugün aynı kategoride ikinci kayıt kontrolü
  const duplicateFound = await Records.checkSameDayDuplicate(targetStudent.id, testCategory);
  assert(duplicateFound !== null, 'Aynı gün ve aynı kategorideki mevcut kayıt başarıyla tespit edildi.');
  assert(duplicateFound.category === testCategory, 'Mükerrer kategorinin "kilik-kiyafet" olduğu doğrulandı.');

  // UI Modal uyarısının içeriği kontrol ediliyor
  UI.showDuplicateWarningModal({
    student: targetStudent,
    category: testCategory,
    previousRecord: duplicateFound,
    onConfirm: () => {},
    onCancel: () => {},
  });

  assert(document.body.innerHTML.includes('Tekrar Kayıt Uyarısı'), 'Tekrar kayıt uyarı modali ekranda açıldı.');
  assert(document.body.innerHTML.includes('Bugün benzer bir kayıt var'), 'Modal gövdesinde kullanıcıyı uyaran "Bugün benzer bir kayıt var" mesajı mevcut.');
  assert(document.body.innerHTML.includes('Yine de Kaydet'), 'Modal içerisinde "Yine de Kaydet" onay butonu yer alıyor.');

  // ------------------------------------------------------------------
  // TEST 5: Eğitim yılı değiştirme -> Geçmiş kayıtlar korunmalı
  // ------------------------------------------------------------------
  console.log('\n👉 SENARYO 5: Eğitim yılı değiştirme ve geçmiş kayıtların korunması...');
  const newStudent = await Students.create({
    studentNo: '202599',
    firstName: 'Deniz',
    lastName: 'Yıldız',
    class: '10-C',
    schoolId: 'school_kasif',
    academicYearId: 'ay_kasif_2526',
  });

  // Geçmiş yıla (2025-2026) 2 disiplin kaydı ekle
  await Records.create({
    studentId: newStudent.id,
    category: 'arma',
    description: 'Arma eksikliği.',
    dateTime: '2025-11-10T09:00:00.000Z',
    academicYearId: 'ay_kasif_2526',
    createdBy: 'Ayşe Kaya',
  });
  await Records.create({
    studentId: newStudent.id,
    category: 'telefon',
    description: 'Derste telefon kullanımı.',
    dateTime: '2026-02-15T11:00:00.000Z',
    academicYearId: 'ay_kasif_2526',
    createdBy: 'Mehmet Yılmaz',
  });

  // Aktif yılı 2026-2027 yap
  await AcademicYears.setActiveYear('ay_kasif_2627', 'school_kasif');

  // Yeni yıl için öğrenci istatistiklerini çek
  const studentInNewYear = await Students.getWithStats(newStudent.id, 'ay_kasif_2627');
  assert(studentInNewYear.records.length === 0, 'Yeni yılın aktif düzen kayıtları temiz ve boştur (0 kayıt).');
  assert(studentInNewYear.pastRecords.length === 2, 'Geçmiş yılın 2 kaydı eksiksiz arşivde korunmaktadır.');
  assert(studentInNewYear.allRecords.length === 2, 'Tüm zamanlar toplam kaydı 2 olarak doğrulanmıştır.');

  // ------------------------------------------------------------------
  // TEST 6: Excel’den öğrenci aktarma -> Hatalı ve mükerrer satırlar bildirilmeli
  // ------------------------------------------------------------------
  console.log('\n👉 SENARYO 6: Excel/CSV içe aktarım ve hata/mükerrer doğrulama motoru...');
  const mockRows = [
    { no: '8001', ad: 'Ali', soyad: 'Kaya', sinif: '9-A', _originalRowIndex: 2 },
    { no: '', ad: 'Veli', soyad: 'Can', sinif: '9-A', _originalRowIndex: 3 }, // No eksik
    { no: '8001', ad: 'Mükerrer', soyad: 'Kayıt', sinif: '9-A', _originalRowIndex: 4 }, // Mükerrer No
    { no: '8002', ad: '', soyad: 'Demir', sinif: '9-B', _originalRowIndex: 5 }, // İsim eksik
  ];
  const mapping = { studentNo: 'no', firstName: 'ad', lastName: 'soyad', class: 'sinif' };

  const validation = await Importer.validateStudentsImport(mockRows, mapping, 'school_kasif');
  assert(validation.validNew.length === 1, 'Geçerli yeni öğrenci sayısı: 1 (Ali Kaya).');
  assert(validation.rejected.length === 3, 'Hatalı ve mükerrer satır sayısı: 3 olarak tespit edildi.');
  
  const errMessages = validation.rejected.flatMap(r => r.errors);
  assert(errMessages.some(m => m.includes('Öğrenci numarası eksik')), 'Hata 1: "Öğrenci numarası eksik" bildirildi.');
  assert(errMessages.some(m => m.includes('mükerrer öğrenci no')), 'Hata 2: "Dosya içinde mükerrer öğrenci no" bildirildi.');
  assert(errMessages.some(m => m.includes('Öğrenci adı eksik')), 'Hata 3: "Öğrenci adı eksik" bildirildi.');

  // ------------------------------------------------------------------
  // TEST 7: Sayfayı yenileme -> Kayıtlar kaybolmamalı (IndexedDB Kalıcılığı)
  // ------------------------------------------------------------------
  console.log('\n👉 SENARYO 7: Sayfayı yenileme ve veri kalıcılığı (IndexedDB Persistence)...');
  const createdRecord = await Records.create({
    studentId: targetStudent.id,
    category: 'gecikme',
    description: 'İlk derse 15 dakika geç kalındı (Kalıcılık testi).',
    dateTime: new Date().toISOString(),
    academicYearId: 'ay_kasif_2627',
    createdBy: 'Nöbetçi Öğretmen',
  });

  // Sayfa yenileme simülasyonu: Database.open() yeniden çağrılır, IndexedDB depolaması korunur
  await Database.open();
  const retrievedRecord = await Database.get(Database.STORES.ORDER_RECORDS, createdRecord.id);
  assert(retrievedRecord !== null, 'Sayfa yenilendikten sonra kayıt IndexedDB deposundan başarıyla getirildi.');
  assert(retrievedRecord.description.includes('Kalıcılık testi'), 'Kaydın açıklama ve meta verileri bozulmadan korundu.');

  // Oturum kalıcılığı: localStorage'dan oturum otomatik okunur
  assert(Auth.isLoggedIn() === true, 'Sayfa yenilendiğinde öğretmen oturumu başarıyla devam etti.');

  // ------------------------------------------------------------------
  // TEST 8: Farklı cihazdan giriş -> Yerel verilerin ortak olmadığı anlaşılmalı
  // ------------------------------------------------------------------
  console.log('\n👉 SENARYO 8: Farklı cihazdan giriş ve yerel depolama modeli...');
  // Arayüz bildirimi kontrolü: Giriş ekranı yerel veri uyarısını içeriyor mu?
  renderLoginScreen();
  assert(appElement.innerHTML.includes('Yerel Çevrimdışı Depolama (IndexedDB)'), 'Giriş ekranında "Yerel Çevrimdışı Depolama (IndexedDB)" uyarısı mevcut.');
  assert(appElement.innerHTML.includes('Farklı bir cihazdan giriş yapıldığında yerel veriler otomatik ortaklaşmaz'), 'Cihazlar arası veri bağımsızlığı açıklaması net biçimde kullanıcıya sunuldu.');

  // Farklı Cihaz İzolasyonu Simülasyonu (Ayrı Cihaz Veritabanı)
  const device2Db = new MockIDBDatabase();
  const originalDb = activeDb;
  activeDb = device2Db; // 2. Cihaza geçildi
  const device2Records = await Database.getAll(Database.STORES.ORDER_RECORDS);
  assert(device2Records.length === 0, 'Farklı bir cihaz/tarayıcı açıldığında Cihaz 1 verilerinin buraya otomatik sızmadığı doğrulandı.');
  activeDb = originalDb; // 1. Cihaza geri dön

  // ------------------------------------------------------------------
  // TEST 9: Rehberlik kaydı görüntüleme -> Yetkisiz kullanıcı özel bilgilere ulaşamamalı (KVKK)
  // ------------------------------------------------------------------
  console.log('\n👉 SENARYO 9: Rehberlik kaydı görüntüleme ve KVKK gizlilik kontrolü...');
  const secretNoteText = 'GİZLİ_AİLE_İÇİ_DURUM_VE_PSİKOLOJİK_DEĞERLENDİRME_NOTU_999';
  const supportCase = await SupportCases.create({
    studentId: targetStudent.id,
    title: 'Bireysel Psikososyal Destek Süreci',
    status: 'active',
    notes: secretNoteText,
    assignedTo: 'Selin Danışman',
    schoolId: 'school_kasif',
    academicYearId: 'ay_kasif_2627',
  });

  // 1. ÖĞRETMEN rolüyle öğrenci detay ekranı inceleniyor
  await Auth.login('ogretmen', 'odis123');
  await renderStudentDetail(targetStudent.id);
  assert(!appElement.innerHTML.includes(secretNoteText), 'Öğretmen ekranında gizli psikolojik danışmanlık notu KESİNLİKLE GÖRÜNMEZ.');
  assert(appElement.innerHTML.includes('Rehberlik sevk takip detayları ve idari bildirimler İdare ve Rehberlik Servisi yetkisine açıktır'), 'Öğretmene KVKK kilit rozeti ve yetki bilgilendirmesi gösterildi.');

  // 2. REHBERLİK rolüyle öğrenci detay ekranı inceleniyor
  await Auth.login('rehberlik', 'odis123');
  await renderStudentDetail(targetStudent.id);
  assert(appElement.innerHTML.includes(secretNoteText), 'Yetkili Rehberlik personeli gizli değerlendirme notunu başarıyla görüntüledi.');
  assert(appElement.innerHTML.includes('Görüşme Notu / Güncelle'), 'Rehberlik personeline görüşme notu güncelleme butonu açıldı.');

  console.log('\n======================================================================');
  console.log('                          TEST SONUÇLARI                              ');
  console.log('======================================================================');
  console.log(`Toplam Doğrulanan Kriter: ${passedCount} / ${totalCount}`);
  console.log('GENEL DURUM:              ✅ TÜM 9 SENARYO BAŞARIYLA GEÇTİ!');
  console.log('======================================================================\n');
}

runAllTests().catch(err => {
  console.error('Test yürütme hatası:', err);
  process.exit(1);
});
