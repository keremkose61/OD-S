/* ========================================
   ODİS v3 — Seed Data Module
   Multi-school architecture with core discipline roles:
   - Schools registry (Kaşif Kalkavan, Atatürk Fen, Cumhuriyet MTAL)
   - Staff records (Öğretmen, Rehberlik Servisi, İdareci)
   - Scoped students, order records, observations, support cases, and audit logs.
   *(Güvenlik ve hizmetli personeli Okul Güvenliği sistemindedir)*
   ======================================== */

const SEED_KEY = 'odis_seed_v4_2_all_indexed';

/**
 * Generate a UUID v4
 */
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Random integer between min and max (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Random date within the last N days
 */
function randomDateWithinDays(days) {
  const now = new Date();
  const past = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const randomTime = past.getTime() + Math.random() * (now.getTime() - past.getTime());
  return new Date(randomTime);
}

/**
 * Avatar color based on name
 */
function getAvatarColor(name) {
  const colors = [
    '#2563eb', '#7c3aed', '#db2777', '#dc2626',
    '#ea580c', '#ca8a04', '#16a34a', '#0891b2',
    '#4f46e5', '#9333ea', '#c026d3', '#059669',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

/* === 1. Düzen Modülü Kategorileri (ODİS PDF Şartnamesi: 8 Kategori) === */
const CATEGORIES = ['kilik-kiyafet', 'sac', 'sakal', 'arma', 'makyaj', 'aksesuar', 'gec-gelme', 'diger'];
const CATEGORY_LABELS = {
  'kilik-kiyafet': 'Kılık-Kıyafet',
  'sac': 'Saç',
  'sakal': 'Sakal',
  'arma': 'Okul Arması',
  'makyaj': 'Makyaj',
  'aksesuar': 'Aksesuar',
  'gec-gelme': 'Geç Gelme',
  'diger': 'Diğer',
};

/* === 2. Gözlem Modülü Tanımları === */
const OBSERVATION_CATEGORIES = [
  'davranis-degisikligi',
  'ofke-kriz',
  'siddet-soz',
  'sosyal-geri-cekilme',
  'akran-catismasi',
  'zorbalik-iddiasi',
  'katilim-dususu',
  'diger',
];

const OBSERVATION_CATEGORY_LABELS = {
  'davranis-degisikligi': 'Belirgin Davranış Değişikliği',
  'ofke-kriz': 'Yoğun Öfke / Duygusal Kriz',
  'siddet-soz': 'Şiddet İçeren Söz / Tehdit',
  'sosyal-geri-cekilme': 'Sosyal İçe Çekilme / Yalnızlaşma',
  'akran-catismasi': 'Akran Çatışması / Anlaşmazlık',
  'zorbalik-iddiasi': 'Zorbalık / Dijital Tehdit İddiası',
  'katilim-dususu': 'Okul / Ders Katılımında Belirgin Düşüş',
  'diger': 'Diğer Somut Gözlem',
};

const OBSERVATION_SOURCES = {
  'direct_sight': 'Olayı doğrudan gördüm',
  'direct_hear': 'İfadeyi doğrudan duydum',
  'student_self': 'Öğrenci bana anlattı',
  'peer_report': 'Başka bir öğrenci bildirdi',
  'parent_report': 'Veli bildirdi',
  'digital_content': 'Dijital içeriği doğrudan gördüm',
  'other': 'Diğer',
};

const VERIFICATION_STATUSES = {
  'reported': 'Bildirildi (İddia / Duyum)',
  'observed': 'Doğrudan Gözlendi',
  'investigating': 'İnceleniyor',
  'verified': 'Doğrulandı',
};

/* === 3. Destek / Rehberlik Modülü Tanımları === */
const SUPPORT_STATUSES = {
  'new': 'Yeni Başvuru',
  'pending_evaluation': 'İlk Değerlendirme Bekliyor',
  'interview_done': 'Görüşme Yapıldı',
  'followup': 'Takip Edilecek',
  'parent_contact': 'Veli Görüşmesi Planlandı/Yapıldı',
  'plan_created': 'Destek Planı Oluşturuldu',
  'referred': 'Dış Kuruma / Uzmana Yönlendirildi',
  'unconfirmed': 'Endişe Doğrulanmadı / Ek İşlem Gerekmiyor',
  'closed': 'Süreç Kapatıldı',
};

/* === 4. İdari İşlemler === */
const ACTION_TYPES = ['disiplin', 'veli', 'rehberlik', 'diger'];
const ACTION_TYPE_LABELS = {
  'disiplin': 'Disiplin Kuruluna Sevk',
  'veli': 'Veli Bilgilendirme / Görüşme',
  'rehberlik': 'Rehberlik Servisine Yönlendirme',
  'diger': 'İdari Bilgilendirme / Uyarı',
};

/* === 5. Okullar (Multi-School Seed) === */
const SEED_SCHOOLS = [
  {
    id: 'school_kasif',
    code: 'KKAL-34',
    name: 'Kaşif Kalkavan Anadolu Lisesi',
    district: 'Pendik / İstanbul',
    principal: 'Mehmet Emin Kaya',
    phone: '0216 390 12 34',
    email: 'kasifkalkavan@meb.k12.tr',
    active: true,
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
  },
];

/* === 6. Personel (Staff Seed) === */
const SEED_STAFF = [
  // Kaşif Kalkavan Anadolu Lisesi Personeli
  {
    id: 'staff_1',
    schoolId: 'school_kasif',
    fullName: 'Ayşe Kaya',
    branch: 'Türk Dili ve Edebiyatı',
    role: 'teacher',
    phone: '0532 111 22 33',
    email: 'aysekaya@meb.k12.tr',
    status: 'active',
    dutyDay: 'Pazartesi',
  },
  {
    id: 'staff_2',
    schoolId: 'school_kasif',
    fullName: 'Selin Danışman',
    branch: 'Rehberlik ve Psikolojik Danışmanlık',
    role: 'counselor',
    phone: '0555 333 44 55',
    email: 'selindanisman@meb.k12.tr',
    status: 'active',
    dutyDay: 'Çarşamba',
  },
  {
    id: 'staff_3',
    schoolId: 'school_kasif',
    fullName: 'Ali Vural',
    branch: 'Matematik',
    role: 'admin',
    phone: '0542 222 33 44',
    email: 'alivural@meb.k12.tr',
    status: 'active',
    dutyDay: 'Cuma',
  },
  {
    id: 'staff_4',
    schoolId: 'school_kasif',
    fullName: 'Mehmet Yılmaz',
    branch: 'Beden Eğitimi',
    role: 'teacher',
    phone: '0533 555 66 77',
    email: 'mehmetyilmaz@meb.k12.tr',
    status: 'active',
    dutyDay: 'Salı',
  },

  // Atatürk Fen Lisesi Personeli
  {
    id: 'staff_afl_1',
    schoolId: 'school_ataturk',
    fullName: 'Zeynep Çelik',
    branch: 'Fizik',
    role: 'admin',
    phone: '0532 999 88 77',
    email: 'zeynepcelik@meb.k12.tr',
    status: 'active',
    dutyDay: 'Pazartesi',
  },
  {
    id: 'staff_afl_2',
    schoolId: 'school_ataturk',
    fullName: 'Barış Koç',
    branch: 'Kimya',
    role: 'teacher',
    phone: '0533 111 00 22',
    email: 'bariskoc@meb.k12.tr',
    status: 'active',
    dutyDay: 'Perşembe',
  },
  {
    id: 'staff_afl_3',
    schoolId: 'school_ataturk',
    fullName: 'Derya Demir',
    branch: 'Rehberlik ve Psikolojik Danışmanlık',
    role: 'counselor',
    phone: '0555 777 66 55',
    email: 'deryademir@meb.k12.tr',
    status: 'active',
    dutyDay: 'Salı',
  },
];

/* === 7. Kaşif Kalkavan Anadolu Lisesi Öğrencileri === */
const KASIF_STUDENTS = [
  { firstName: 'Ahmet', lastName: 'Yılmaz', studentNo: '1001', class: '9-A', schoolId: 'school_kasif' },
  { firstName: 'Zeynep', lastName: 'Kaya', studentNo: '1002', class: '9-A', schoolId: 'school_kasif' },
  { firstName: 'Mehmet', lastName: 'Demir', studentNo: '1003', class: '9-B', schoolId: 'school_kasif' },
  { firstName: 'Elif', lastName: 'Çelik', studentNo: '1004', class: '10-A', schoolId: 'school_kasif' },
  { firstName: 'Burak', lastName: 'Şahin', studentNo: '1005', class: '10-A', schoolId: 'school_kasif' },
  { firstName: 'Ayşe', lastName: 'Yıldız', studentNo: '1006', class: '10-B', schoolId: 'school_kasif' },
  { firstName: 'Emre', lastName: 'Aydın', studentNo: '1007', class: '11-A', schoolId: 'school_kasif' },
  { firstName: 'Fatma', lastName: 'Özdemir', studentNo: '1008', class: '11-A', schoolId: 'school_kasif' },
  { firstName: 'Can', lastName: 'Arslan', studentNo: '1009', class: '11-B', schoolId: 'school_kasif' },
  { firstName: 'Selin', lastName: 'Koç', studentNo: '1010', class: '12-A', schoolId: 'school_kasif' },
  { firstName: 'Oğuz', lastName: 'Kurt', studentNo: '1011', class: '12-A', schoolId: 'school_kasif' },
  { firstName: 'Deniz', lastName: 'Aksoy', studentNo: '1012', class: '12-B', schoolId: 'school_kasif' },
];

/* === 8. Atatürk Fen Lisesi Öğrencileri (İzolasyon Testi İçin) === */
const ATATURK_STUDENTS = [
  { firstName: 'Mert', lastName: 'Erdoğan', studentNo: '2001', class: '9-A', schoolId: 'school_ataturk' },
  { firstName: 'Ceren', lastName: 'Yavuz', studentNo: '2002', class: '9-A', schoolId: 'school_ataturk' },
  { firstName: 'Kaan', lastName: 'Öztürk', studentNo: '2003', class: '10-A', schoolId: 'school_ataturk' },
  { firstName: 'Begüm', lastName: 'Acar', studentNo: '2004', class: '11-A', schoolId: 'school_ataturk' },
  { firstName: 'Efe', lastName: 'Soydan', studentNo: '2005', class: '12-A', schoolId: 'school_ataturk' },
];

const ORDER_RECORD_DESCRIPTIONS = {
  'kilik-kiyafet': [
    'Okul forması yerine sivil tişörtle gelmiş.',
    'Forma yerine farklı renk eşofman altı giymiş.',
    'Kıyafet düzeni okul kurallarına uygun değil.',
  ],
  'arma': [
    'Okul arması formaya dikili değil.',
    'Forma üzerinde okul arması bulunmuyor.',
  ],
  'sac': [
    'Saç modeli okul kılık-kıyafet yönergesine uygun değil.',
    'Saç boyalı ve bakımsız görünümde.',
  ],
  'sakal': [
    'Tıraş olunmamış, sakal uzamış.',
    'Sakal ve bıyık düzeltilmemiş.',
  ],
  'makyaj': [
    'Aşırı makyaj ile okula gelinmiş.',
    'Oje ve abartılı göz makyajı tespit edildi.',
  ],
  'aksesuar': [
    'Yönergeye aykırı piercing, zincir veya uygunsuz takı kullanımı.',
    'Sınıfta ve kapalı alanda şapka/bere kullanımı.',
  ],
  'gec-gelme': [
    'İlk derse mazeretsiz olarak 15 dakika geç geldi.',
    'Sabah giriş saatine ve yoklamaya geç kalındı.',
  ],
  'diger': [
    'Okul kimlik kartı yanında bulunmuyor.',
    'Genel okul düzeni ve kural ihlali.',
  ],
};

/**
 * Seed the database with ODİS v2 / v3 demo data.
 */
async function seedDatabase() {
  if (localStorage.getItem(SEED_KEY) === 'true') {
    return false;
  }

  try {
    const db = await Database.open();

    // 1. Seed Schools
    await Database.bulkPut(Database.STORES.SCHOOLS, SEED_SCHOOLS);

    // 1b. Seed Academic Years (Eğitim-Öğretim Yılları)
    const SEED_ACADEMIC_YEARS = [
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
    await Database.clear(Database.STORES.ACADEMIC_YEARS);
    await Database.bulkPut(Database.STORES.ACADEMIC_YEARS, SEED_ACADEMIC_YEARS);

    // 2. Seed Staff (Öğretmen, Rehberlik ve İdare - Güvenlik/Hizmetli temizlenir)
    await Database.clear(Database.STORES.STAFF);
    await Database.bulkPut(Database.STORES.STAFF, SEED_STAFF);

    // 3. Seed Students (Both schools)
    const allStudentRaw = [...KASIF_STUDENTS, ...ATATURK_STUDENTS];
    const students = allStudentRaw.map(s => ({
      id: generateId(),
      studentNo: s.studentNo,
      firstName: s.firstName,
      lastName: s.lastName,
      class: s.class,
      schoolId: s.schoolId,
      avatarColor: getAvatarColor(s.firstName + s.lastName),
      createdAt: new Date(2025, 8, 1).toISOString(),
    }));

    await Database.bulkPut(Database.STORES.STUDENTS, students);

    // Filter students by school for record generation
    const kasifStudents = students.filter(s => s.schoolId === 'school_kasif');
    const ataturkStudents = students.filter(s => s.schoolId === 'school_ataturk');

    // 4. Order Records (Düzen kayıtları - Eğitim-Öğretim Yılı ve Kayıt Anındaki Sınıf ile)
    const orderRecords = [];
    const sampleRecordCounts = [2, 1, 3, 0, 1, 2, 0, 1, 4, 1, 2, 0];

    kasifStudents.forEach((student, index) => {
      const count = sampleRecordCounts[index] || 0;
      for (let i = 0; i < count; i++) {
        const category = CATEGORIES[randomInt(0, CATEGORIES.length - 1)];
        const descs = ORDER_RECORD_DESCRIPTIONS[category];
        const description = descs[randomInt(0, descs.length - 1)];
        // First record of first student represents a past academic year archive record
        const isPastYear = (index === 0 && i === 0);
        orderRecords.push({
          id: generateId(),
          schoolId: 'school_kasif',
          academicYearId: isPastYear ? 'ay_kasif_2526' : 'ay_kasif_2627',
          studentId: student.id,
          studentClass: student.class,
          category,
          description,
          dateTime: isPastYear ? new Date(2026, 2, 15, 9, 30).toISOString() : randomDateWithinDays(45).toISOString(),
          createdBy: i % 2 === 0 ? 'Ayşe Kaya (Öğretmen)' : 'Mehmet Yılmaz (Öğretmen)',
        });
      }
    });

    // Atatürk Fen Lisesi için de 3 düzen kaydı
    ataturkStudents.slice(0, 2).forEach(student => {
      orderRecords.push({
        id: generateId(),
        schoolId: 'school_ataturk',
        academicYearId: 'ay_ataturk_2627',
        studentId: student.id,
        studentClass: student.class,
        category: 'arma',
        description: 'Okul arması formaya dikili değil.',
        dateTime: randomDateWithinDays(10).toISOString(),
        createdBy: 'Barış Koç (Öğretmen)',
      });
    });

    if (orderRecords.length > 0) {
      await Database.bulkPut(Database.STORES.ORDER_RECORDS, orderRecords);
    }

    // 5. Observations (Gözlemler)
    const sampleObservations = [
      {
        studentIndex: 2, // Mehmet Demir
        category: 'davranis-degisikligi',
        description: 'Son iki haftadır derslerde aşırı dalgın, arkadaşlarıyla teneffüslerde iletişimi belirgin şekilde azalttı.',
        source: 'direct_sight',
        verificationStatus: 'observed',
        location: '9-B Sınıfı',
        daysAgo: 2,
        createdBy: 'Ayşe Kaya (Öğretmen)',
      },
      {
        studentIndex: 8, // Can Arslan
        category: 'akran-catismasi',
        description: 'Kantin sırasında sıra kavgası yaşandığı, başka bir öğrencinin sırasını gasp ettiği yönünde iddia iletildi.',
        source: 'peer_report',
        verificationStatus: 'investigating',
        location: 'Okul Kantini',
        daysAgo: 1,
        createdBy: 'Mehmet Yılmaz (Öğretmen)',
      },
      {
        studentIndex: 4, // Burak Şahin
        category: 'katilim-dususu',
        description: 'Öğrenci son 3 gündür ilk iki derse sürekli geç kalmakta, ailesiyle sabahları uyanma sorunu yaşadığını belirtti.',
        source: 'student_self',
        verificationStatus: 'verified',
        location: 'Nöbetçi Odası',
        daysAgo: 4,
        createdBy: 'Ayşe Kaya (Öğretmen)',
      },
      {
        studentIndex: 0, // Ahmet Yılmaz
        category: 'zorbalik-iddiasi',
        description: 'Sınıf grup sohbetinde alaycı paylaşımlara maruz kaldığı veli tarafından telefonla bildirildi.',
        source: 'parent_report',
        verificationStatus: 'reported',
        location: 'Sınıf WhatsApp Grubu',
        daysAgo: 3,
        createdBy: 'Ali Vural (İdare)',
      },
      {
        studentIndex: 5, // Ayşe Yıldız
        category: 'sosyal-geri-cekilme',
        description: 'Grup ödevlerine katılmak istemiyor, teneffüslerde sürekli yalnız oturuyor.',
        source: 'direct_sight',
        verificationStatus: 'observed',
        location: '10-B Dersliği',
        daysAgo: 6,
        createdBy: 'Ayşe Kaya (Öğretmen)',
      },
    ];

    const observations = sampleObservations.map(obs => ({
      id: generateId(),
      schoolId: 'school_kasif',
      studentId: kasifStudents[obs.studentIndex].id,
      category: obs.category,
      description: obs.description,
      source: obs.source,
      verificationStatus: obs.verificationStatus,
      location: obs.location,
      dateTime: randomDateWithinDays(obs.daysAgo).toISOString(),
      createdBy: obs.createdBy,
    }));

    await Database.bulkPut(Database.STORES.OBSERVATIONS, observations);

    // 6. Support Cases (Destek / Rehberlik)
    const sampleSupportCases = [
      {
        studentIndex: 0, // Ahmet Yılmaz
        observationId: observations[3].id,
        status: 'pending_evaluation',
        title: 'Akran iletişimi ve dijital ortam desteği',
        notes: 'Dijital içerik ekran görüntüleri inceleniyor, ilgili sınıf rehber öğretmeni ile eşgüdüm sağlandı.',
        assignedTo: 'Selin Danışman (Rehberlik)',
        updatedAt: randomDateWithinDays(2).toISOString(),
        createdAt: randomDateWithinDays(3).toISOString(),
      },
      {
        studentIndex: 5, // Ayşe Yıldız
        observationId: observations[4].id,
        status: 'parent_contact',
        title: 'Uyum süreci ve veli görüşmesi',
        notes: 'Velimiz okula davet edildi, öğrencinin arkadaş ilişkilerini desteklemek için kulüp faaliyetlerine katılımı önerildi.',
        assignedTo: 'Selin Danışman (Rehberlik)',
        updatedAt: randomDateWithinDays(4).toISOString(),
        createdAt: randomDateWithinDays(6).toISOString(),
      },
      {
        studentIndex: 7, // Fatma Özdemir
        observationId: null,
        status: 'closed',
        title: 'Sınav kaygısı ve rehberlik görüşmesi',
        notes: 'Sınav kaygısı ölçeği uygulandı, gevşeme egzersizleri aktarıldı. Süreç başarıyla sonlandırıldı.',
        assignedTo: 'Selin Danışman (Rehberlik)',
        updatedAt: randomDateWithinDays(15).toISOString(),
        createdAt: randomDateWithinDays(30).toISOString(),
      },
    ];

    const supportCases = sampleSupportCases.map(sc => ({
      id: generateId(),
      schoolId: 'school_kasif',
      academicYearId: 'ay_kasif_2627',
      studentId: kasifStudents[sc.studentIndex].id,
      observationId: sc.observationId,
      status: sc.status,
      title: sc.title,
      notes: sc.notes,
      assignedTo: sc.assignedTo,
      createdAt: sc.createdAt,
      updatedAt: sc.updatedAt,
    }));

    await Database.bulkPut(Database.STORES.SUPPORT_CASES, supportCases);

    // 7. Admin Actions
    const sampleAdminActions = [
      {
        id: generateId(),
        schoolId: 'school_kasif',
        academicYearId: 'ay_kasif_2627',
        studentId: kasifStudents[8].id,
        actionType: 'veli',
        description: 'Öğrencinin okul kurallarına uyumu ve rehberlik servisiyle ortak çalışma planı hakkında veli ile görüşüldü.',
        date: randomDateWithinDays(12).toISOString(),
        createdBy: 'Müdür Yrd. Ali Vural',
      },
    ];

    await Database.bulkPut(Database.STORES.ACTIONS, sampleAdminActions);

    // 9. Initial Audit Logs
    const sampleAuditLogs = [
      {
        id: 'audit_init_1',
        schoolId: 'school_kasif',
        userId: 'system',
        userName: 'Sistem Yöneticisi',
        userRole: 'system',
        action: 'SYSTEM_INITIALIZATION',
        entityType: 'school',
        entityId: 'school_kasif',
        details: 'Kaşif Kalkavan Anadolu Lisesi dijital okul portalı ve başlangıç veritabanı kuruldu.',
        timestamp: new Date(2025, 8, 1).toISOString(),
      },
      {
        id: 'audit_init_2',
        schoolId: 'school_kasif',
        userId: 'mudur',
        userName: 'Müdür Yrd. Ali Vural',
        userRole: 'admin',
        action: 'IMPORT_XLSX_STUDENTS',
        entityType: 'student',
        entityId: null,
        details: '2025-2026 Eğitim Öğretim Yılı 9, 10, 11 ve 12. sınıf öğrenci kütüğü sisteme aktarıldı.',
        timestamp: new Date(2025, 8, 2).toISOString(),
      },
    ];

    await Database.bulkPut(Database.STORES.AUDIT_LOGS, sampleAuditLogs);

    localStorage.setItem(SEED_KEY, 'true');
    console.log(`[ODİS v3] Çok okullu demo veriler yüklendi.`);
    return true;
  } catch (error) {
    console.error('[ODİS v3] Seed error:', error);
    return false;
  }
}

// Public API
window.SeedData = {
  seed: seedDatabase,
  generateId,
  getAvatarColor,
  CATEGORIES,
  CATEGORY_LABELS,
  OBSERVATION_CATEGORIES,
  OBSERVATION_CATEGORY_LABELS,
  OBSERVATION_SOURCES,
  VERIFICATION_STATUSES,
  SUPPORT_STATUSES,
  ACTION_TYPES,
  ACTION_TYPE_LABELS,
  ORDER_RECORD_DESCRIPTIONS,
};
