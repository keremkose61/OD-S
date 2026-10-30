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
  getElementById: (id) => {
    if (id === 'app') return appElement;
    const el = new MockElement('div');
    el.id = id;
    return el;
  },
  querySelectorAll: () => [],
  querySelector: () => new MockElement('div'),
  createElement: (tag) => new MockElement(tag),
  addEventListener: () => {},
  removeEventListener: () => {},
  body: new MockElement('body'),
};
global.window = global;
global.prompt = (msg, def) => def || 'Test Gerekçesi';
global.confirm = () => true;

// Mock In-Memory IndexedDB
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
global.Database = {
  STORES: {
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
  },
  open: async () => activeDb,
  get: async (storeName, id) => activeDb.getStore(storeName).get(id) || null,
  getAll: async (storeName) => Array.from(activeDb.getStore(storeName).values()),
  put: async (storeName, val) => {
    activeDb.getStore(storeName).set(val.id, JSON.parse(JSON.stringify(val)));
    return val;
  },
  bulkPut: async (storeName, arr) => {
    arr.forEach(val => activeDb.getStore(storeName).set(val.id, JSON.parse(JSON.stringify(val))));
    return arr;
  },
  delete: async (storeName, id) => activeDb.getStore(storeName).delete(id),
  clear: async (storeName) => activeDb.getStore(storeName).clear(),
  getByIndex: async (storeName, indexName, value) => {
    const all = Array.from(activeDb.getStore(storeName).values());
    return all.filter(item => item[indexName] === value);
  },
};

// Load All Application Code in Context
function loadScript(relPath) {
  const fullPath = path.join(__dirname, relPath);
  const code = fs.readFileSync(fullPath, 'utf8');
  vm.runInThisContext(code, { filename: relPath });
}

loadScript('js/seed-data.js');
loadScript('js/ui.js');
loadScript('js/status-engine.js');
loadScript('js/auth.js');
loadScript('js/schools.js');
loadScript('js/students.js');
loadScript('js/records.js');
loadScript('js/admin-actions.js');
loadScript('js/student.view.js');
loadScript('js/teacher.view.js');
loadScript('js/admin.view.js');
loadScript('js/counselor.view.js');

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (condition) {
    passedCount++;
    console.log(`   ✓ ${message}`);
  } else {
    console.error(`   ✗ BAŞARISIZ: ${message}`);
    throw new Error(`Test kriteri sağlanamadı: ${message}`);
  }
}

async function runPdfSpecTests() {
  console.log('======================================================================');
  console.log('       ODİS v1 — PDF ŞARTNAMESİ TAM UYUMLULUK VE KURAL DOĞRULAMA      ');
  console.log('======================================================================\n');

  await SeedData.seed();
  const schoolId = 'school_kasif';
  const activeYearId = 'ay_kasif_2627';
  const academicYearId = activeYearId;

  // ------------------------------------------------------------------
  // 1. KATEGORİ DOĞRULAMASI (PDF Sayfa 5: 8 Kategori)
  // ------------------------------------------------------------------
  console.log('👉 KONTROL 1: Kayıt kategorilerinin PDF şartnamesine (8 kategori) tam uyumu...');
  const expectedCats = ['kilik-kiyafet', 'sac', 'sakal', 'arma', 'makyaj', 'aksesuar', 'gec-gelme', 'diger'];
  expectedCats.forEach(c => {
    assert(SeedData.CATEGORIES.includes(c), `"${c}" kural kategorisi SeedData.CATEGORIES içinde mevcuttur.`);
    assert(Boolean(SeedData.CATEGORY_LABELS[c]), `"${c}" etiket başlığı mevcuttur: ${SeedData.CATEGORY_LABELS[c]}`);
  });

  // ------------------------------------------------------------------
  // 2. RENKLİ NOKTALAR VE EŞİK ALGORİTMASI (PDF Sayfa 4)
  // ------------------------------------------------------------------
  console.log('\n👉 KONTROL 2: Renk ve Tekrar Analiz Motoru (🟢 Yeşil, 🟠 Turuncu, 🔴 Kırmızı)...');
  const now = new Date('2026-10-20T10:00:00Z');

  // A. Yeşil: 0-2 kayıt
  const greenRecords = [
    { id: 'g1', category: 'sac', dateTime: '2026-10-18T08:00:00Z', status: 'active' },
    { id: 'g2', category: 'arma', dateTime: '2026-10-10T08:00:00Z', status: 'active' },
  ];
  const stGreen = StatusEngine.calculateStatus(greenRecords, [], { referenceDate: now, schoolId });
  assert(stGreen.level === 'green', '0-2 kayıtlı öğrencinin durumu 🟢 YEŞİL (Normal Takip) hesaplandı.');
  assert(stGreen.label === 'Normal Takip', 'Durum etiketi "Normal Takip" olarak üretildi.');

  // B. Turuncu Kural 1: Son 30 günde 3-5 kayıt
  const orangeRecordsTotal = [
    { id: 'o1', category: 'sac', dateTime: '2026-10-18T08:00:00Z', status: 'active' },
    { id: 'o2', category: 'kilik-kiyafet', dateTime: '2026-10-15T08:00:00Z', status: 'active' },
    { id: 'o3', category: 'arma', dateTime: '2026-10-10T08:00:00Z', status: 'active' },
  ];
  const stOrange1 = StatusEngine.calculateStatus(orangeRecordsTotal, [], { referenceDate: now, schoolId });
  assert(stOrange1.level === 'orange', 'Son 30 günde 3 kayıt -> 🟠 TURUNCU (Tekrarlayan Durum) hesaplandı.');

  // C. Turuncu Kural 2: Son 14 günde aynı kategoride 3 tekrar
  const orangeRecordsRepeat = [
    { id: 'o4', category: 'arma', dateTime: '2026-10-18T08:00:00Z', status: 'active' },
    { id: 'o5', category: 'arma', dateTime: '2026-10-14T08:00:00Z', status: 'active' },
    { id: 'o6', category: 'arma', dateTime: '2026-10-10T08:00:00Z', status: 'active' },
  ];
  const stOrange2 = StatusEngine.calculateStatus(orangeRecordsRepeat, [], { referenceDate: now, schoolId });
  assert(stOrange2.level === 'orange', 'Son 14 günde 3 kez "Okul Arması" tekrarı -> 🟠 TURUNCU hesaplandı.');
  assert(stOrange2.reasons.some(r => r.includes('Okul Arması')), 'Gerekçe açıklamasında Okul Arması tekrarı belirtildi.');

  // D. Kırmızı Kural 1: Son 30 günde 6+ kayıt
  const redRecordsTotal = [
    { id: 'r1', category: 'sac', dateTime: '2026-10-18T08:00:00Z', status: 'active' },
    { id: 'r2', category: 'kilik-kiyafet', dateTime: '2026-10-15T08:00:00Z', status: 'active' },
    { id: 'r3', category: 'arma', dateTime: '2026-10-12T08:00:00Z', status: 'active' },
    { id: 'r4', category: 'makyaj', dateTime: '2026-10-10T08:00:00Z', status: 'active' },
    { id: 'r5', category: 'aksesuar', dateTime: '2026-10-08T08:00:00Z', status: 'active' },
    { id: 'r6', category: 'gec-gelme', dateTime: '2026-10-05T08:00:00Z', status: 'active' },
  ];
  const stRed1 = StatusEngine.calculateStatus(redRecordsTotal, [], { referenceDate: now, schoolId });
  assert(stRed1.level === 'red', 'Son 30 günde 6+ kayıt -> 🔴 KIRMIZI (Yoğun Tekrar) hesaplandı.');

  // E. Kırmızı Kural 2: Aynı kategorinin son 30 günde 5+ tekrarı
  const redRecordsSameCat = [
    { id: 'rc1', category: 'kilik-kiyafet', dateTime: '2026-10-18T08:00:00Z', status: 'active' },
    { id: 'rc2', category: 'kilik-kiyafet', dateTime: '2026-10-15T08:00:00Z', status: 'active' },
    { id: 'rc3', category: 'kilik-kiyafet', dateTime: '2026-10-12T08:00:00Z', status: 'active' },
    { id: 'rc4', category: 'kilik-kiyafet', dateTime: '2026-10-05T08:00:00Z', status: 'active' },
    { id: 'rc5', category: 'kilik-kiyafet', dateTime: '2026-09-25T08:00:00Z', status: 'active' },
  ];
  const stRed2 = StatusEngine.calculateStatus(redRecordsSameCat, [], { referenceDate: now, schoolId });
  assert(stRed2.level === 'red', 'Son 30 günde 5 kez "Kılık-Kıyafet" tekrarı -> 🔴 KIRMIZI hesaplandı.');

  // ------------------------------------------------------------------
  // 3. DİNAMİK EŞİK YAPILANDIRMASI (PDF Sayfa 4: Eşikler kod içine gömülmeyecektir)
  // ------------------------------------------------------------------
  console.log('\n👉 KONTROL 3: Dinamik ve Özelleştirilebilir Eşik Ayarları...');
  await StatusEngine.saveThresholds(schoolId, { greenMaxDays30: 1, redMinDays30: 3 });
  const customT = StatusEngine.getThresholds(schoolId);
  assert(customT.greenMaxDays30 === 1, 'Yeşil eşiği 1 olarak güncellendi.');
  assert(customT.redMinDays30 === 3, 'Kırmızı eşiği 3 olarak güncellendi.');
  const stCustom = StatusEngine.calculateStatus(orangeRecordsTotal, [], { referenceDate: now, schoolId });
  assert(stCustom.level === 'red', 'Özelleştirilmiş eşiklerle 3 kayıt doğrudan 🔴 KIRMIZI olarak değerlendirildi.');
  StatusEngine.resetThresholds(schoolId);
  assert(StatusEngine.getThresholds(schoolId).redMinDays30 === 6, 'Eşikler fabrika ayarlarına (varsayılan: 6) sıfırlandı.');

  // ------------------------------------------------------------------
  // 4. ÇOKLU KATEGORİ VE KENDİ SON BİLDİRİMLERİ (PDF Sayfa 5)
  // ------------------------------------------------------------------
  console.log('\n👉 KONTROL 4: Öğretmen Çoklu Kategori Kaydı ve Son Bildirimler...');
  const testStudent = (await Students.getAll(schoolId))[0];
  const batchRecords = await Records.createBatch({
    studentId: testStudent.id,
    categories: ['arma', 'sac'],
    description: 'Sabah giriş kontrolü: Arma eksik ve saç traşı uygun değil.',
    createdBy: 'Ahmet Öğretmen',
    schoolId,
    academicYearId: activeYearId,
  });
  assert(batchRecords.length === 2, 'Tek bir işlemde birden fazla (2 adet) kategori kaydı başarıyla oluşturuldu.');
  assert(batchRecords.some(r => r.category === 'arma') && batchRecords.some(r => r.category === 'sac'), 'Oluşturulan kayıtlar hem arma hem saç kategorilerini içeriyor.');

  const myRecords = await Records.getMyRecords('Ahmet Öğretmen', schoolId);
  assert(myRecords.length >= 2, 'Öğretmen "Kendi Son Bildirimleri" listesinde kayıtlarını başarıyla görüntüledi.');

  // ------------------------------------------------------------------
  // 5. HATALI KAYIT İPTAL AKIŞI VE SOFT DELETE (PDF Sayfa 5 & 10)
  // ------------------------------------------------------------------
  console.log('\n👉 KONTROL 5: Hatalı Kayıt İptal Akışı, İdare Onayı ve Soft Delete...');
  const recToCancel = batchRecords[0];
  await Records.requestCancellation(recToCancel.id, 'Öğrenci numarası sehven yanlış girilmiştir.', 'Ahmet Öğretmen');
  const pendingCancel = await Records.getPendingCancellations(schoolId);
  assert(pendingCancel.some(r => r.id === recToCancel.id), 'Hatalı kayıt bildirim talebi idare onay listesine düştü.');

  // İdare onaylar
  await Records.reviewCancellation(recToCancel.id, true, 'İdarece sehven giriş doğrulandı, kayıt iptal edildi.', 'Müdür Ali Vural');
  const cancelledRecord = await Database.get(Database.STORES.ORDER_RECORDS, recToCancel.id);
  assert(cancelledRecord !== null, 'İptal edilen kayıt veritabanından FİZİKSEL OLARAK SİLİNMEDİ (Kayıt korunuyor).');
  assert(cancelledRecord.status === 'cancelled', 'Kayıt durumu "cancelled" (İptal Edilmiş) olarak işaretlendi.');
  assert(cancelledRecord.cancellationApproval.approvedBy === 'Müdür Ali Vural', 'İptali kimin onayladığı denetlenebilir kütükte saklandı.');

  const activeRecordsAfterCancel = await Records.getAll({ schoolId, studentId: testStudent.id });
  assert(!activeRecordsAfterCancel.some(r => r.id === recToCancel.id), 'İptal edilen kayıt varsayılan aktif kayıt listesinden çıkarıldı.');

  // ------------------------------------------------------------------
  // 6. İDARİ DEĞERLENDİRME NOKTASI & İŞLEM SONRASI TEKRAR (PDF Sayfa 6)
  // ------------------------------------------------------------------
  console.log('\n👉 KONTROL 6: İdari Değerlendirme Noktası (Checkpoint) ve İşlem Sonrası Tekrar...');
  const studentWithAction = (await Students.getAll(schoolId))[1];

  // 1. Önce öğrenciye 2 adet kayıt ekleyelim (15 Ekim)
  await Records.create({
    studentId: studentWithAction.id,
    category: 'kilik-kiyafet',
    dateTime: '2026-10-15T08:30:00Z',
    createdBy: 'Öğretmen',
    schoolId,
    academicYearId,
  });

  // 2. İdare 16 Ekim'de idari değerlendirme yapar (Milat / Checkpoint)
  await AdminActions.create({
    studentId: studentWithAction.id,
    actionType: 'veli',
    description: 'Veli ile görüşüldü, okul kılık kıyafet yönergesi tebliğ edildi.',
    date: '2026-10-16T10:00:00Z',
    createdBy: 'Müdür Yrd.',
    schoolId,
    academicYearId,
  });

  // 3. İdari işlemden sonra (19 Ekim) yeni bir kayıt eklenir
  await Records.create({
    studentId: studentWithAction.id,
    category: 'kilik-kiyafet',
    dateTime: '2026-10-19T08:30:00Z',
    createdBy: 'Nöbetçi Öğretmen',
    schoolId,
    academicYearId,
  });

  const studentStats = await Students.getWithStats(studentWithAction.id, activeYearId);
  assert(studentStats.status.isPostAdminRepeat === true, 'İdari değerlendirme noktasından sonra gelen yeni kayıt "isPostAdminRepeat: true" olarak tespit edildi.');
  assert(studentStats.status.postAdminDetails.includes('Son idari işlemden'), 'İşlem sonrası tekrar detay açıklaması başarıyla üretildi.');

  // ------------------------------------------------------------------
  // 7. REHBERLİK SERVİSİ: ÇİFT KATMANLI NOT VE İDAREYE SONUÇ NOTU (PDF Sayfa 7)
  // ------------------------------------------------------------------
  console.log('\n👉 KONTROL 7: Rehberlik Servisi Çift Katmanlı Not ve İdareye Sonuç Notu...');
  const secretPsychNote = 'Öğrencinin ailevi durumu ve özel psikolojik destek ihtiyaçları rehberlik odasında değerlendirildi.';
  const publicAdminResult = 'Öğrenciyle görüşüldü, takip edilmesi uygun görülmüştür.';

  const sCase = await SupportCases.create({
    studentId: studentWithAction.id,
    title: 'Disiplin Sevk İncelemesi',
    status: 'new',
    schoolId,
    academicYearId,
  });

  await SupportCases.updateStatus(sCase.id, 'closed', secretPsychNote, {
    adminResultNote: publicAdminResult,
    followUpDate: '2026-11-01',
    recommendation: 'Sınıf rehber öğretmeninin öğrenciyle yakın iletişimde kalması önerilir.',
  });

  const updatedCase = await Database.get(Database.STORES.SUPPORT_CASES, sCase.id);
  assert(updatedCase.adminResultNote === publicAdminResult, 'İdareye iletilecek kısa sonuç notu başarıyla kaydedildi.');
  assert(updatedCase.followUpDate === '2026-11-01', 'Takip tarihi (followUpDate) başarıyla belirlendi.');
  assert(updatedCase.privateNotes.includes(secretPsychNote), 'Özel rehberlik notu kaydedildi.');

  const auditLogs = await Database.getAll(Database.STORES.AUDIT_LOGS);
  const caseAudit = auditLogs.find(l => l.entityId === sCase.id && l.action === 'UPDATE_SUPPORT_STATUS');
  assert(caseAudit !== undefined, 'Destek süreci güncellemesi audit günlüğüne yazıldı.');
  assert(!caseAudit.details.includes(secretPsychNote), 'KVKK Güvencesi: Özel rehberlik notunun içeriği KESİNLİKLE audit kütüğüne yazılmadı.');
  assert(caseAudit.details.includes(publicAdminResult), 'İdarenin bilmesi gereken sonuç notu audit kütüğünde izlenebilir kaldı.');

  // ------------------------------------------------------------------
  // 8. BÖLÜM 11: PDF ÖRNEK SENARYO DOĞRULAMASI (3 Haftada 4 Okul Arması)
  // ------------------------------------------------------------------
  console.log('\n👉 KONTROL 8: PDF Sayfa 11 Kısa Örnek Senaryo Tam Doğrulaması...');
  const scenarioStudent = await Students.create({
    studentNo: '9999',
    firstName: 'Örnek',
    lastName: 'Senaryo',
    class: '10-C',
    schoolId,
    academicYearId,
  });

  // Adım 1: 1. hafta 1. kayıt
  await Records.create({
    studentId: scenarioStudent.id,
    category: 'arma',
    dateTime: '2026-10-01T08:15:00Z',
    createdBy: 'Öğretmen 1',
    schoolId,
    academicYearId,
  });
  let scStats = await Students.getWithStats(scenarioStudent.id, activeYearId);
  assert(scStats.status.level === 'green', '1. Kayıt: Durum 🟢 Normal Takip.');

  // Adım 2: 2. hafta 2. kayıt
  await Records.create({
    studentId: scenarioStudent.id,
    category: 'arma',
    dateTime: '2026-10-08T08:20:00Z',
    createdBy: 'Öğretmen 2',
    schoolId,
    academicYearId,
  });

  // Adım 3: 2. hafta 3. kayıt -> Eşiğe ulaşır (14 günde 3 tekrar veya toplam 3 kayıt)
  await Records.create({
    studentId: scenarioStudent.id,
    category: 'arma',
    dateTime: '2026-10-12T08:10:00Z',
    createdBy: 'Öğretmen 3',
    schoolId,
    academicYearId,
  });
  scStats = await Students.getWithStats(scenarioStudent.id, activeYearId);
  assert(scStats.status.level === 'orange', '3. Hafta: Tekrarlar eşiğe ulaştığında 🟠 TURUNCU (Tekrarlayan Durum) göstergesi üretildi.');

  // Adım 4: 4. kayıt ve devamında Yoğun Tekrar eşiği
  await Records.create({
    studentId: scenarioStudent.id,
    category: 'arma',
    dateTime: '2026-10-15T08:25:00Z',
    createdBy: 'Öğretmen 1',
    schoolId,
    academicYearId,
  });
  await Records.create({
    studentId: scenarioStudent.id,
    category: 'arma',
    dateTime: '2026-10-18T08:30:00Z',
    createdBy: 'Öğretmen 4',
    schoolId,
    academicYearId,
  });
  scStats = await Students.getWithStats(scenarioStudent.id, activeYearId);
  assert(scStats.status.level === 'red', 'Tekrar devam ettiğinde öğrenci 🔴 KIRMIZI (Yoğun Tekrar) olarak idarenin dikkatine çıktı.');

  console.log('\n======================================================================');
  console.log('                          TEST SONUÇLARI                              ');
  console.log('======================================================================');
  console.log(`Toplam Doğrulanan Kriter: ${passedCount} / ${totalCount}`);
  console.log('GENEL DURUM:              ✅ TÜM PDF ŞARTNAME KRİTERLERİ BAŞARIYLA GEÇTİ!');
  console.log('======================================================================\n');
}

runPdfSpecTests().catch(err => {
  console.error('\n❌ Test Başarısız Oldu:', err);
  process.exit(1);
});
