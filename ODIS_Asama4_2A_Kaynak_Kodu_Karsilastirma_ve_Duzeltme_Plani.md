# ODİS — AŞAMA 4.2-A: KAYNAK KODLARININ KARŞILAŞTIRILMASI VE GÜVENLİ DÜZELTME PLANI RAPORU

**Tarih:** 14 Kasım 2026  
**Denetlenen Proje:** ODİS — Okul Disiplin ve İzleme Sistemi  
**Aktif Çalışma Dizini:** `C:\Users\Kose\.gemini\antigravity-ide\scratch\odis\odis-analysis`  
**WAMP Çalışma Dizini:** `C:\wamp64\www\odis`  
**Git Dalı (Branch):** `feature/phase2-security-and-schema`  
**HEAD Commit:** `8bc954d75def57bf818e7ca6b1872245b8b11fda`  
**Denetçi:** Antigravity — Statik Kod Denetim ve Mimari Güvenlik Ajanı  

---

## 1. Yönetici Özeti

ODİS projesinin Aşama 4.1 denetiminde tespit edilen kaynak tutarsızlıkları ve eksikleri üzerine; **Antigravity aktif çalışma dizini (`odis-analysis`)**, **WAMP canlı sunucu dizini (`C:\wamp64\www\odis`)** ve **Git/GitHub yerel/uzak deposu** arasında kapsamlı, bayt ve SHA-256 seviyesinde salt okunur bir karşılaştırma yürütülmüştür.

### Temel Keşifler ve Mimari Gerçekler:
1. **Kaynaklar Arasındaki Derin Ayrışma:**
   - `odis-analysis`: Aşama 2 ve Aşama 3 geliştirmelerinin tamamını (13 tabloluk güncel şema, 18 adet yeni API endpoint'i, migration ve seed scriptleri, oturum ve KVKK gizlilik korumaları) içermektedir. Ancak bu dosyaların 15'i değiştirilmiş (modified), 13 dizin/dosyası ise Git'te izlenmeyen (`??` untracked) durumdadır.
   - `WAMP` (`C:\wamp64\www\odis`): Yalnızca ilk kimlik doğrulama aşamasına ait 4 tablolu eski şemayı ve sadece `auth/` ile `health.php` endpointlerini barındırmaktadır. Ayrıca kök dizinde 28 adet eski mimariden kalma dosya (`admin.php`, `counselor.php`, `data/odis.sqlite`, `includes/`, vb.) bulunmaktadır.
   - `Git/GitHub`: `origin/feature/php-mysql-backend` ve yerel HEAD `8bc954d` commitindedir. 18 yeni endpoint Git'e hiç eklenmemiştir.
2. **Kritik Frontend/Backend Entegrasyon Tespiti:**
   - Frontend katmanında (`js/`) backend PHP API'lerine HTTP isteği (`fetch`) atan **TEK** dosya `js/auth.js`'dir (oturum açma/kapatma/CSRF).
   - `js/students.js`, `js/records.js`, `js/teacher.view.js`, `js/admin.view.js` ve `js/counselor.view.js` dosyaları hiçbir backend PHP endpoint'ini çağırmamaktadır. Tüm öğrenci ekleme, kural ihlali ve destek süreci kayıtları doğrudan tarayıcı içi **IndexedDB (`Database.js`)** veritabanına yazılmaktadır.
   - Backend'de yazılan `students/`, `records/`, `observations/`, `support-cases/` endpointleri henüz istemciye bağlanmamıştır.
3. **Esas Alınacak Kaynak:**
   - Düzeltmeler ve geliştirmeler için kesinlikle **`odis-analysis`** dizini esas alınmalıdır. WAMP dizini eski ve eksik bir durumdadır; WAMP üzerinde çalışmak Aşama 2/3 kazanımlarını yok etme riski taşır.
4. **Son Karar:**
   - **`KOŞULLU ONAY`** — Kaynak ayrışması netleşmiş ve güvenli düzeltme planı oluşturulmuştur. Ancak Aşama 4.2-B kod düzeltmelerine geçilmeden önce kullanıcının bu planı ve entegrasyon kapsamını onaylaması gerekmektedir.

---

## 2. Denetim Kapsamı ve Yasaklar

Denetim süresince Aşama 4.2-A şartnamesinde belirtilen tüm kesin yasaklara istisnasız uyulmuştur:

- ❌ Hiçbir dosyada değişiklik yapılmamıştır.
- ❌ Hiçbir dosya oluşturulmamış, silinmemiş, kopyalanmamış veya taşınmamıştır (bu rapor hariç).
- ❌ Hiçbir veritabanına (`odis`, `odis_test` veya SQLite) bağlanılmamıştır.
- ❌ Hiçbir SQL sorgusu çalıştırılmamıştır.
- ❌ Hiçbir PHP veya API dosyası çalıştırılmamıştır.
- ❌ Hiçbir migration veya seed scripti tetiklenmemiştir.
- ❌ Hiçbir Git yazma işlemi (`add`, `commit`, `push`, `pull`, `checkout`, `reset`, `branch`) yapılmamıştır.
- ❌ WAMP projesi veya GitHub deposu güncellenmemiştir.
- ❌ Gizli yapılandırma değerleri veya parolalar rapora kesinlikle yazılmamıştır.
- ℹ️ GitHub uzak deposuna doğrudan ağ erişimi ilke gereği korumalı/erişilemez olduğundan durum `Doğrulanamadı (Ağ Kısıtı)` olarak işaretlenmiştir.

---

## 3. Kaynak Dizinlerinin Genel Durumu

| Özellik | 1. odis-analysis | 2. WAMP (`C:\wamp64\www\odis`) | 3. Git Yerel Depo |
|---|---|---|---|
| **Konum** | `...\scratch\odis\odis-analysis` | `C:\wamp64\www\odis` | `odis-analysis\.git` |
| **Toplam Dosya (.git hariç)** | 91 dosya | 97 dosya | 68 izlenen dosya (HEAD) |
| **Aktif Dal** | `feature/phase2-security-and-schema` | HEAD `refs/heads/main` (ayrık) | `feature/phase2-security-and-schema` |
| **HEAD Commit** | `8bc954d` | `d87f496` (Initial commit) | `8bc954d` |
| **Veritabanı Şeması** | 13 Tablo (300 satır) | 4 Tablo (71 satır) | 4 Tablo (HEAD commitinde) |
| **API Endpoint Sayısı** | 22 dosya | 5 dosya | 5 dosya (HEAD commitinde) |
| **Eski SQLite/PHP Dosyaları** | Yok (Temizlenmiş) | 28 dosya (Kök dizinde dağınık) | Yok |
| **Git Durumu** | 15 Modified, 13 Untracked | Git work-tree uyumsuz / eski | 15 Modified, 13 Untracked |

---

## 4. Dosya ve Hash Karşılaştırması

İki dizin arasında yapılan bayt ve SHA-256 kriptografik özet karşılaştırması sonucunda:
- **Ortak ve Birebir Aynı (SHA-256 Eşleşen):** 19 dosya
- **Aynı İsimli Fakat İçeriği Farklı:** 50 dosya
- **Yalnızca `odis-analysis` İçinde Bulunan:** 22 dosya
- **Yalnızca WAMP İçinde Bulunan (Eski/Geçici):** 28 dosya

### 4.1 Kritik Backend Dosyaları SHA-256 Tablosu

| Dosya Yolu | odis-analysis Boyut | odis-analysis SHA-256 | WAMP Boyut | WAMP SHA-256 | Durum |
|---|---|---|---|---|---|
| `backend/api/health.php` | 629 B | `AD46F3467B5C04114140C814E71902B97A63D04E9B6525D3D993BF79BAD18A39` | 620 B | `B845273CF4EA08E1987ECA26F65A014C738095877286B865AE4096AFC7401E58` | **FARKLI (Yol Hatası)** |
| `backend/api/auth/csrf.php` | 273 B | `A07896A67A98F27687F340F121CA01CCF4F49FA2A8963F8BE43D3DAFD66B4B71` | 273 B | `A07896A67A98F27687F340F121CA01CCF4F49FA2A8963F8BE43D3DAFD66B4B71` | **EŞLEŞİYOR** |
| `backend/api/auth/login.php` | 3829 B | `2E46DC2D4585CB732B6A933276B0DB7144DC569B0CAF355F8C302CE18C3AB456` | 2490 B | `6DAEC3710BA6BFF551055CC730ED83D8F04AA121CEE4610718770280408763C0` | **FARKLI (Sertleştirme)** |
| `backend/api/auth/logout.php` | 740 B | `B8127412A509139EA2C6773DA2BCD22EA4D2BE02703E74EDB8C61796E6EF47A0` | 740 B | `B8127412A509139EA2C6773DA2BCD22EA4D2BE02703E74EDB8C61796E6EF47A0` | **EŞLEŞİYOR** |
| `backend/api/auth/me.php` | 429 B | `4FCBB660C3BDF74304331B0F4A8734CF5C32BA689F3721580986C8C632658891` | 429 B | `4FCBB660C3BDF74304331B0F4A8734CF5C32BA689F3721580986C8C632658891` | **EŞLEŞİYOR** |
| `backend/src/auth.php` | 3000 B | `163529C75E535F826F986EA093F030243D86937A4DCC1BE14772BE2F75ABAD9F` | 2034 B | `5BC9906DD6378E9D314A300A4C9E7E0186CB4EA39556227500424922D82D9D4F` | **FARKLI (KVKK ve Rol)** |
| `backend/src/bootstrap.php` | 1981 B | `EC9BA8F1E64CB2762958BB0CD9199EBC06532A4419B10BD32B5CD37F3C4265D2` | 992 B | `8FF0891D3854C5AAE5FDE7AF8AB6DEA2CAC36AD143AF929A106A95A2668BC25C` | **FARKLI (Oturum Güv.)** |
| `backend/src/Database.php` | 942 B | `BD5906AF347EBC5082DF67A1EB5E57C07B4410220811C9F2F3376FD864D6C0E2` | 942 B | `BD5906AF347EBC5082DF67A1EB5E57C07B4410220811C9F2F3376FD864D6C0E2` | **EŞLEŞİYOR** |
| `backend/src/http.php` | 1139 B | `F7D6CC502DE1B632DFD85DE2FF86688079EF74A88570DDB44A21B6176A7603CA` | 1139 B | `F7D6CC502DE1B632DFD85DE2FF86688079EF74A88570DDB44A21B6176A7603CA` | **EŞLEŞİYOR** |
| `backend/config/config.php` | 866 B | `028DD8AA37AD7BA83BF106C16DC924E126EE510A94A42B15D0111B971B5CF2E7` | 600 B | `27FD03FF98DB598EDA4FF936B6C5105A5BC9A173D4C816902185B8FB4538847F` | **FARKLI (503 vs 500)** |
| `backend/config/config.example.php`| 997 B | `B41990205E418088B6C7CDCB23CF822FCB4E8CA1BAF2C0973665C307F62CD603` | 487 B | `1F48C8036EFFE66D6B1F694A355E6953CAC5F8F7C1B3096A8689E2F9F9B5B15E` | **FARKLI (Açıklamalar)** |
| `backend/config/config.local.php` | 487 B | `[GİZLİ_YAPILANDIRMA]` | 487 B | `[GİZLİ_YAPILANDIRMA]` | **MEVCUT (Gizli)** |
| `backend/config/config.test.php` | 448 B | `135F2EB1B26F56CA194C94267FAB866C90B37A003E1FF2EB0766F4F6DFDBB749` | Yok | Yok | **YALNIZ ODIS** |
| `backend/database/schema.sql` | 19458 B | `5F6FD7D72982F47DBF4B661572F7A03AFC464EF100E6406014F7EFB784317AA8` | 3009 B | `4CDA80DF7D3E599C08B707B9E91EB700374DA7C2DC72D0F693A5F6BAE700F49A` | **FARKLI (13 vs 4 Tablo)** |
| `backend/scripts/create_user.php` | 3204 B | `F83F6A204EE017CB7F3D12F852842B380C048D51D220BC31F991A06FC6A68043` | 1836 B | `7FBE189F2ABC28AE0CDCB3BA1EDBD503C0811DEB1F6AB79101CB0C51AD231A08` | **FARKLI (Rol/Okul Dest.)** |
| `backend/scripts/migrate.php` | 25382 B | `8D805EF4E4EE69B0448F84682879B96328E54AFDE4F2BE75624BB4848EBC48E7` | Yok | Yok | **YALNIZ ODIS** |
| `backend/scripts/seed_demo.php` | 3810 B | `DCBD9245F32823FDA73791BB5C96531448D4D610345FF20F30BF9A2F3DF90A16` | Yok | Yok | **YALNIZ ODIS** |
| `backend/scripts/test_backend.php`| 6799 B | `4DD966C337EBE73465FEFBDF04DB177E26DB6082DC9B32577DF3AD00B5D2899E` | Yok | Yok | **YALNIZ ODIS** |

### 4.2 Yalnızca WAMP İçinde Bulunan Eski / Gereksiz Dosyalar (28 Adet)
WAMP kök dizininde bulunan ve `odis-analysis`'te temizlenmiş olan dosyalar:
- Eski monolitik sayfalar: `admin.php`, `counselor.php`, `index.php` (monolitik sürüm), `login.php`, `logout.php`, `records.php`, `student-detail.php`, `students.php`
- Eski veritabanı ve oturum kalıntıları: `config/db.php`, `data/odis.sqlite`, `data/sessions/sess_*` (5 oturum dosyası)
- Eski şablon parçaları: `includes/footer.php`, `includes/functions.php`, `includes/header.php`
- Hatalı veya geçici dosyalar: `fetchColumn()` (kök dizinde 80 baytlık dosya), `index.zip`, `js.zip`, `scratch/test-*.mjs` (6 dosya)

---

## 5. API Endpoint Karşılaştırması

Aşama 4.2 şartnamesinde talep edilen 20 temel endpoint'in üç kaynak ve uzak depo üzerindeki kesin durumu:

| Endpoint | odis-analysis | WAMP | Git tracked | GitHub remote | İçerik uyumu |
|---|---|---|---|---|---|
| `students/create.php` | ✅ Var (2983 B) | ❌ Yok | ❌ Hayır | ⚠️ Doğrulanamadı | Yalnızca odis-analysis |
| `students/index.php` | ✅ Var (1505 B) | ❌ Yok | ❌ Hayır | ⚠️ Doğrulanamadı | Yalnızca odis-analysis |
| `students/show.php` | ✅ Var (3681 B) | ❌ Yok | ❌ Hayır | ⚠️ Doğrulanamadı | Yalnızca odis-analysis |
| `students/import.php` | ✅ Var (4276 B) | ❌ Yok | ❌ Hayır | ⚠️ Doğrulanamadı | Yalnızca odis-analysis |
| `students/update.php` | ❌ **Eksik** | ❌ **Eksik** | ❌ Hayır | ⚠️ Doğrulanamadı | İki kaynakta da yok |
| `students/delete.php` | ❌ **Eksik** | ❌ **Eksik** | ❌ Hayır | ⚠️ Doğrulanamadı | İki kaynakta da yok |
| `records/create.php` | ✅ Var (4038 B) | ❌ Yok | ❌ Hayır | ⚠️ Doğrulanamadı | Yalnızca odis-analysis |
| `records/index.php` | ✅ Var (1436 B) | ❌ Yok | ❌ Hayır | ⚠️ Doğrulanamadı | Yalnızca odis-analysis |
| `records/cancel.php` | ✅ Var (1587 B) | ❌ Yok | ❌ Hayır | ⚠️ Doğrulanamadı | Yalnızca odis-analysis |
| `observations/create.php` | ✅ Var (2664 B) | ❌ Yok | ❌ Hayır | ⚠️ Doğrulanamadı | Yalnızca odis-analysis |
| `observations/index.php` | ✅ Var (1308 B) | ❌ Yok | ❌ Hayır | ⚠️ Doğrulanamadı | Yalnızca odis-analysis |
| `support-cases/create.php` | ✅ Var (2772 B) | ❌ Yok | ❌ Hayır | ⚠️ Doğrulanamadı | Yalnızca odis-analysis |
| `support-cases/index.php` | ✅ Var (1862 B) | ❌ Yok | ❌ Hayır | ⚠️ Doğrulanamadı | Yalnızca odis-analysis |
| `support-cases/update.php` | ✅ Var (2937 B) | ❌ Yok | ❌ Hayır | ⚠️ Doğrulanamadı | Yalnızca odis-analysis |
| `admin-actions/create.php` | ✅ Var (2438 B) | ❌ Yok | ❌ Hayır | ⚠️ Doğrulanamadı | Yalnızca odis-analysis |
| `admin-actions/index.php` | ✅ Var (1125 B) | ❌ Yok | ❌ Hayır | ⚠️ Doğrulanamadı | Yalnızca odis-analysis |
| `academic-years/index.php` | ✅ Var (562 B) | ❌ Yok | ❌ Hayır | ⚠️ Doğrulanamadı | Yalnızca odis-analysis |
| `reports/index.php` | ✅ Var (3062 B) | ❌ Yok | ❌ Hayır | ⚠️ Doğrulanamadı | Yalnızca odis-analysis (Ham SQL var) |
| `schools/index.php` | ✅ Var (1408 B) | ❌ Yok | ❌ Hayır | ⚠️ Doğrulanamadı | Yalnızca odis-analysis |
| `audit/index.php` | ✅ Var (1173 B) | ❌ Yok | ❌ Hayır | ⚠️ Doğrulanamadı | Yalnızca odis-analysis |
| `health.php` | ✅ Var (629 B) | ✅ Var (620 B) | ✅ Evet | ⚠️ Doğrulanamadı | **Uyumsuz (odis ../../ hatalı, WAMP ../ doğru)** |

> [!IMPORTANT]
> **WAMP'ta Bulunmayan Endpointler:** `students/` (4 dosya), `records/` (3 dosya), `observations/` (2 dosya), `support-cases/` (3 dosya), `admin-actions/` (2 dosya), `reports/` (1 dosya), `schools/` (1 dosya), `academic-years/` (1 dosya), `audit/` (1 dosya) olmak üzere **18 kritik işlevsel endpoint WAMP üzerinde hiç mevcut değildir**.

---

## 6. Auth ve Bootstrap Karşılaştırması

Backend oturum ve güvenlik çekirdeğini oluşturan 8 dosya incelenmiştir:

| Güvenlik Kriteri | odis-analysis | WAMP | Hangi Kaynak Üstün? |
|---|---|---|---|
| **Oturum Yönetimi & Sertleştirme** | `use_trans_sid=0`, `entropy_length=32`, `force_secure` desteği, katı çerez ayarları | Temel çerez ayarları, eksik parametreler | **odis-analysis** (Daha güvenli) |
| **Kullanıcı Doğrulaması** | Veritabanından okul ve kullanıcı aktiflik kontrolü her istekte tekrarlanır | Temel DB doğrulaması | **odis-analysis** |
| **Rol Kontrolleri** | `require_role($user, array $roles)` fonksiyonu ile katı RBAC | `require_role` var fakat basitleştirilmiş | **odis-analysis** |
| **CSRF Doğrulaması** | `require_csrf()` zaman-sabit `hash_equals` ile doğrulanır | `hash_equals` kullanılıyor | **İkisi de Güvenli** |
| **Session Fixation Koruması** | `session_regenerate_id(true)` girişte çağrılıyor | `session_regenerate_id(true)` girişte çağrılıyor | **İkisi de Güvenli** |
| **Oturum Zaman Aşımı (Idle)** | 1800 sn (30 dk) aktivite farkı kontrol edilip oturum sıfırlanıyor | 1800 sn kontrolü var | **İkisi de Güvenli** |
| **Okul Kimliği Belirlenmesi** | Tamamen `$user['schoolId']` oturum nesnesinden alınır | Oturum nesnesinden alınır | **İkisi de Güvenli** |
| **Rehberlik Notu Gizliliği (KVKK)** | `can_view_counseling_notes()` fonksiyonu ile sadece `counselor` rolüne izin verilir | Fonksiyon WAMP'ta **YOK** | **odis-analysis** (Açık ara üstün) |
| **Audit Log Detayları** | JSON formatında `$details` desteği var | `$details` parametresi **YOK** | **odis-analysis** |
| **Config Hata Sızıntısı** | 503 ve genel mesaj (dosya yolu sızdırmaz) | 500 ve "config.local.php oluşturun" uyarısı (yol sızdırır) | **odis-analysis** (Daha güvenli) |

**Değerlendirme:** `backend/src/auth.php`, `bootstrap.php` ve `config.php` açısından **`odis-analysis` açık ara daha güncel, daha kapsamlı ve KVKK gereksinimlerini karşılayan sürümdür.** WAMP'taki sürüm geride kalmıştır.

---

## 7. Frontend ve Backend Entegrasyonu

Frontend dosyaları (`js/`) satır satır taranmış ve backend PHP uç noktalarıyla olan ilişkisi araştırılmıştır:

1. **Frontend Backend API'lerini Gerçekten Kullanıyor mu?**
   - **KISMİ (Sadece Auth):** `js/auth.js` dosyası `fetch()` ve `apiPost()` yardımcıları üzerinden `auth/csrf.php`, `auth/login.php`, `auth/me.php` ve `auth/logout.php` uç noktalarını çağırmaktadır.
   - **Veri İşlemleri Backend'e Bağlı Değil:** `js/students.js`, `js/records.js`, `js/teacher.view.js`, `js/admin.view.js` ve `js/counselor.view.js` içinde `fetch()`, `XMLHttpRequest` veya `apiPost` çağrısı **SIFIRDIR**.
2. **Öğrenci Oluşturma Nereye Yazılıyor?**
   - `admin.view.js` içindeki form gönderimi `Students.create()` fonksiyonunu çağırır.
   - `Students.create()` (`js/students.js:95`), kaydı doğrudan `Database.put(Database.STORES.STUDENTS, student)` ile tarayıcının **IndexedDB** deposuna yazar. MySQL backend'ine (`api/students/create.php`) hiçbir veri gönderilmez!
3. **Öğrenci Güncelleme Nereye Yazılıyor?**
   - `Students.update()` (`js/students.js:126`), kaydı doğrudan `Database.put` ile **IndexedDB**'ye yazar. Backend'de zaten `update.php` bulunmamaktadır.
4. **Silme veya Arşivleme Var mı?**
   - Frontend'de öğrenci silme/arşivleme işlevi **hiç tanımlanmamıştır**.
5. **Offline/PWA ile Sunucu Veritabanı Ayrımı:**
   - Sistem şu anda iki bağımsız katman gibi çalışmaktadır:
     - Katman 1: PHP + MySQL REST API (Sunucu tarafında hazır bekleyen 18 endpoint).
     - Katman 2: İstemci tarafı IndexedDB PWA (Tüm CRUD işlemlerini yerel depoda yapan arayüz).
   - Bu durum, Aşama 4 test raporundaki "50 CRUD testinin tamamının geçtiği" iddiasının ya saf IndexedDB testlerine ya da curl/script seviyesinde izole API testlerine dayandığını, arayüz üzerinden MySQL'e akan entegre bir testin henüz gerçekleşmediğini kanıtlamaktadır.

---

## 8. Aşama 4.1 Bulgularının Yeniden Değerlendirilmesi

Aşama 4.1 denetim raporundaki bulgular kaynak kodları üzerinde doğrulanmıştır:

1. **`reports/index.php` 4 Adet Ham SQL Sorgusu:**
   - **Doğrulandı:** `backend/api/reports/index.php` satır 70–73 arasında:
     ```php
     $totStudents = (int) $pdo->query("SELECT COUNT(*) FROM students WHERE school_id = '$schoolId' AND active = 1")->fetchColumn();
     $totRecords  = (int) $pdo->query("SELECT COUNT(*) FROM order_records WHERE school_id = '$schoolId' AND status = 'active'")->fetchColumn();
     $totCases    = (int) $pdo->query("SELECT COUNT(*) FROM support_cases WHERE school_id = '$schoolId' AND status != 'closed'")->fetchColumn();
     $totObs      = (int) $pdo->query("SELECT COUNT(*) FROM observations WHERE school_id = '$schoolId'")->fetchColumn();
     ```
     Hazırlıklı sorgu (`prepare`) yerine doğrudan değişken interpolasyonu yapılmıştır. `$schoolId` oturumdan gelse dahi güvenlik standardı ihlalidir.
2. **Öğrenci `update.php` Eksikliği:**
   - **Doğrulandı:** Ne `odis-analysis` ne de WAMP dizininde `backend/api/students/update.php` dosyası yoktur.
3. **Öğrenci `delete.php` Eksikliği:**
   - **Doğrulandı:** Ne `odis-analysis` ne de WAMP dizininde `backend/api/students/delete.php` dosyası yoktur.
4. **Health Endpoint Include Yolu:**
   - **Doğrulandı:** `odis-analysis/backend/api/health.php` dosyasında:
     `require_once __DIR__ . '/../../src/http.php';`
     Dosya `backend/api/` altında olduğundan iki seviye yukarı çıkıldığında `src` klasörüne ulaşılamaz (hata verir).
     WAMP sürümündeki `__DIR__ . '/../src/http.php'` yolu doğrudur.
5. **`config.test.php` ve `config.local.php` Ayrımı:**
   - **Doğrulandı:** `bootstrap.php` doğrudan `config.php`'yi yükler, `config.php` ise koşulsuz olarak `config.local.php`'yi yükler. `config.test.php` yalnızca CLI migration scriptinde (`migrate.php`) özel parametreyle okunmaktadır. Uygulama çalışma zamanında dinamik ortam seçimi (`APP_ENV`) mekanizması yoktur.
6. **`.gitignore` İçinde `config.local.php` Koruması:**
   - **Doğrulandı:** `odis-analysis/.gitignore` dosyasının en altında `backend/config/config.local.php` kuralı mevcuttur (korumalı). WAMP'taki `.gitignore` dosyasında bu kural **EKSİKTİR** (riskli).
7. **`staff` ve `classes` Endpoint Eksikliği:**
   - **Doğrulandı:** `schema.sql` içinde `classes` ve `staff` tabloları tanımlıdır; ancak `backend/api/classes/` ve `backend/api/staff/` klasörleri ve endpointleri mevcut değildir.
8. **`adminResultNote` Saklama Davranışı:**
   - **Doğrulandı:** `backend/api/support-cases/update.php` içinde `$input['adminResultNote']` veritabanındaki `support_cases` tablosuna yazılmamakta, sadece `write_audit()` çağrısı ile denetim günlüğü metnine eklenmektedir. Tabloda bu alan için bir kolon da bulunmamaktadır.
9. **Okul İzolasyonu ve `school_id` Değiştirilemezliği:**
   - **Doğrulandı:** Mevcut tüm `create.php` ve `index.php` dosyalarında `school_id` istemciden gelen gövdeden değil, oturumdaki `$user['schoolId']` değerinden alınmaktadır. Bu kural backend seviyesinde titizlikle korunmuştur.

---

## 9. Git ve GitHub Durumu

### 9.1 Yerel Git Durumu (`odis-analysis`)
- **Aktif Dal:** `feature/phase2-security-and-schema`
- **İzlenen ve Değiştirilmiş (Unstaged Modified):** 15 dosya
- **İzlenmeyen (Untracked `??`):** 13 dosya/klasör (tüm yeni API endpointleri ve yardımcı scriptler)
- **Staged (Commit'e Hazırlanmış):** 0 dosya

### 9.2 WAMP Git Durumu
- `C:\wamp64\www\odis\.git` deposu `refs/heads/main` (commit `d87f496`) üzerinde kalmıştır. Çalışma dizini izinleri ve yapısı Git komutlarıyla doğrudan yönetilmemektedir.

### 9.3 GitHub Uzak Depo Durumu
- Uzak Depo: `https://github.com/keremkose61/OD-S.git`
- Ağ kısıtlaması nedeniyle uzak depoya anlık sorgu (`ls-remote`) atılamamıştır (Sandbox 403 ilke kısıtı).
- Yerel Git önbelleğindeki uzak dallar:
  - `origin/main` -> `d87f496`
  - `origin/feature/php-mysql-backend` -> `8bc954d` (HEAD ile aynı)
  - `origin/fix/school-data-isolation-and-counseling-privacy` -> `6a91140`

---

## 10. Risk Analizi

| Risk Alanı | Risk Derecesi | Açıklama |
|---|---|---|
| **WAMP Üzerinde Çalışma Riski** | 🔴 **KRİTİK** | WAMP dizini 18 API endpointinden ve 13 tabloluk şemadan yoksundur. WAMP üzerinde geliştirme yapılırsa Aşama 2 ve 3 çalışmaları ezilir veya kaybolur. |
| **Git Değişikliklerinin Kaybolma Riski** | 🔴 **KRİTİK** | `odis-analysis` içinde 15 dosya değiştirilmiş ve 13 klasör commit edilmemiştir. `git checkout`, `stash` veya `pull` yapılması durumunda bu kodlar geri dönülemez şekilde silinebilir. |
| **SQL Enjeksiyon Riski** | 🟠 **YÜKSEK** | `reports/index.php` içindeki ham SQL sorguları güvenli mimari standardını bozmaktadır. |
| **Health Check Çökme Riski** | 🟡 **ORTA** | `health.php` dosyasındaki hatalı `../../` yolu deploy edildiğinde 500 hatası üretir. |
| **İstemci/Sunucu Senkronizasyon Riski** | 🟡 **ORTA** | Frontend verileri IndexedDB'ye yazarken backend API'lerinin bağımsız kalması veri tutarsızlığına yol açabilir. |

---

## 11. Önerilen Esas Çalışma Kaynağı

### Kanıta Dayalı Karar:
**Kod düzeltmelerine kesinlikle `odis-analysis` dizininde devam edilmelidir.**

### Nedenleri:
1. **Mimari Bütünlük:** Projenin hedeflediği PHP 8.3 + MySQL 8.4 REST API mimarisi (13 tablo, 18 endpoint, oturum sertleştirmesi, KVKK gizlilik kontrolleri) sadece `odis-analysis` içinde eksiksiz olarak mevcuttur.
2. **Kayıp Riskinin Önlenmesi:** `odis-analysis` içindeki uncommitted ve untracked dosyalar başka hiçbir yerde yedekli değildir.
3. **Güvenli Git Stratejisi:**
   - Mevcut branch olan `feature/phase2-security-and-schema` üzerinde kalınmalıdır.
   - Hiçbir branch değiştirme (`checkout`) veya sıfırlama (`reset`) yapılmamalıdır.
   - Düzeltmeler bu dizinde yapıldıktan ve test edildikten sonra temiz bir commit zinciri oluşturulmalıdır.
   - Testleri geçen doğrulanmış son sürüm, Aşama 4.3 veya dağıtım aşamasında WAMP (`C:\wamp64\www\odis`) dizinine güvenli bir şekilde senkronize edilmelidir.

---

## 12. Önceliklendirilmiş Düzeltme Planı

Düzeltmeler teknik ve güvenlik önemine göre 4 gruba ayrılmıştır:

### Grup A — Öncelikli Güvenlik Düzeltmeleri

#### A.1 `reports/index.php` Parametreli SQL Düzeltmesi
- **Dosya:** `backend/api/reports/index.php` (Satır 70–73)
- **Mevcut Durum:** `query("... WHERE school_id = '$schoolId' ...")` ile dize birleştirme yapılıyor.
- **Önerilen Değişiklik:** `$pdo->prepare()` ve `$stmt->execute(['school_id' => $schoolId])` kalıbına dönüştürülmesi.
- **Güvenlik Etkisi:** SQL Injection açığı tamamen kapatılır, multi-tenant izolasyonu garantiye alınır.
- **Bağımlılıklar:** Yok.
- **Test Gereksinimi:** `GET /backend/api/reports/index.php` çağrısı ile sayaçların doğrulanması.
- **Risk Seviyesi:** 🔴 YÜKSEK (Düzeltmesi kolay, riski yüksek).

#### A.2 `.gitignore` Dosyasına `config.local.php` Güvencesi
- **Dosya:** `.gitignore` (ve ileride WAMP `.gitignore`)
- **Mevcut Durum:** `odis-analysis` içinde kural mevcut; ancak WAMP dosyasında eksik.
- **Önerilen Değişiklik:** `odis-analysis`'teki korumanın korunması ve WAMP'a aktarılması.
- **Güvenlik Etkisi:** Veritabanı kimlik bilgilerinin GitHub'a sızması engellenir.
- **Bağımlılıklar:** Yok.
- **Test Gereksinimi:** `git status` çıktısında `config.local.php` dosyasının görünmediğinin teyidi.
- **Risk Seviyesi:** 🟡 ORTA.

---

### Grup B — Eksik Backend Özellikleri

#### B.1 Öğrenci Güncelleme Endpoint'i (`students/update.php`)
- **Dosya:** `backend/api/students/update.php` (Yeni oluşturulacak)
- **Mevcut Durum:** Endpoint mevcut değil.
- **Önerilen Değişiklik:**
  - `POST` metodu ve CSRF kontrolü (`require_csrf()`).
  - Yalnızca `admin` rolü yetkisi (`require_role($user, ['admin'])`).
  - Gelen `studentId` ve güncellenecek alanların doğrulanması.
  - Zorunlu güvenlik şartı: `WHERE id = :id AND school_id = :school_id` filtresi (okul kimliği değiştirilemez, oturumdan alınır).
  - Denetim günlüğüne kayıt (`write_audit`).
- **Güvenlik Etkisi:** CRUD bütünlüğü sağlanır, yetkisiz öğrenci manipülasyonu engellenir.
- **Bağımlılıklar:** `backend/src/bootstrap.php`, `backend/src/auth.php`.
- **Test Gereksinimi:** Farklı okul idaresi ile güncelleme denemesi (404 beklenir), geçerli güncelleme (200 beklenir).
- **Risk Seviyesi:** 🟠 YÜKSEK.

#### B.2 Öğrenci Pasifleştirme / Arşivleme Endpoint'i (`students/delete.php`)
- **Dosya:** `backend/api/students/delete.php` (Yeni oluşturulacak)
- **Mevcut Durum:** Endpoint mevcut değil.
- **Önerilen Değişiklik:**
  - Fiziksel silme yerine **Soft Delete** uygulanması: `UPDATE students SET active = 0 WHERE id = :id AND school_id = :school_id`.
  - Disiplin ve rehberlik geçmişinin veri kaybına uğramaması sağlanır.
  - `admin` rolü ve CSRF koruması.
- **Güvenlik Etkisi:** Veri bütünlüğü ve yasal kayıt saklama gereksinimleri (MEB mevzuatı) korunur.
- **Bağımlılıklar:** `schema.sql` `active` kolonu (zaten mevcut).
- **Test Gereksinimi:** Pasifleştirilen öğrencinin `students/index.php` listesinde çıkmadığının doğrulanması.
- **Risk Seviyesi:** 🟠 YÜKSEK.

#### B.3 `support-cases/update.php` İdari Not Kolon Uyumu
- **Dosya:** `backend/api/support-cases/update.php`
- **Mevcut Durum:** `adminResultNote` sadece audit log'a yazılıyor, vaka tablosunda tutulmuyor.
- **Önerilen Değişiklik:** İdari sonuç notunun vaka detayında kalıcı görünmesi isteniyorsa şemaya ve update sorgusuna eklenmesi veya mevcut audit tasarımının belgelenmesi.
- **Güvenlik Etkisi:** Veri kaybı veya takipsizlik önlenir.
- **Risk Seviyesi:** 🟡 ORTA.

---

### Grup C — Entegrasyon (Frontend / Backend Köprüsü)

#### C.1 `js/students.js` API Bağlantısı
- **Dosya:** `js/students.js`
- **Mevcut Durum:** Yalnızca IndexedDB'ye yazıyor.
- **Önerilen Değişiklik:**
  - `createStudent()` ve `updateStudent()` fonksiyonlarının önce `apiPost('students/create.php', ...)` ve `apiPost('students/update.php', ...)` çağırması, başarılı olursa IndexedDB önbelleğini güncellemesi (Cache-then-Network veya Network-first).
- **Güvenlik Etkisi:** Gerçek multi-tenant sunucu güvenliği arayüzden devreye girer.
- **Bağımlılıklar:** `js/auth.js` `apiPost` yardımcısı, `students/create.php`, `students/update.php`.
- **Test Gereksinimi:** Arayüzden eklenen öğrencinin MySQL `students` tablosuna düştüğünün teyidi.
- **Risk Seviyesi:** 🟠 YÜKSEK.

#### C.2 `js/records.js` API Bağlantısı
- **Dosya:** `js/records.js`
- **Mevcut Durum:** `Records.create()` yalnızca IndexedDB'ye yazıyor.
- **Önerilen Değişiklik:** `records/create.php` ve `records/cancel.php` endpointlerine `apiPost` ile bağlanması.
- **Risk Seviyesi:** 🟠 YÜKSEK.

---

### Grup D — Teknik Tutarlılık

#### D.1 `health.php` Include Yolu Düzeltmesi
- **Dosya:** `backend/api/health.php`
- **Mevcut Durum:** `../../src/http.php` yolu hatalı (1 seviye fazla çıkıyor).
- **Önerilen Değişiklik:** `../src/http.php`, `../src/Database.php` ve `../config/config.php` olarak güncellenmesi.
- **Güvenlik Etkisi:** Health endpoint'in HTTP 500 vermesi önlenir.
- **Bağımlılıklar:** Yok.
- **Test Gereksinimi:** `GET /backend/api/health.php` yanıtı `{ "status": "ok", "database": "connected" }`.
- **Risk Seviyesi:** 🟢 DÜŞÜK.

#### D.2 `config.test.php` Dinamik Ortam Seçimi
- **Dosya:** `backend/config/config.php`
- **Mevcut Durum:** Yalnızca `config.local.php` dosyasını arıyor.
- **Önerilen Değişiklik:** `getenv('ODIS_ENV') === 'test'` durumunda veya test runner çalışırken `config.test.php` dosyasını yükleyecek güvenli bir ortam ayrım mekanizması eklenmesi.
- **Risk Seviyesi:** 🟡 ORTA.

#### D.3 Dokümantasyon ve Git Temizliği
- Untracked API dosyalarının mantıksal commit blokları halinde Git'e eklenmesi.
- WAMP kök dizinindeki eski PHP ve geçici zip dosyalarının yedeklenip kaldırılması planı.

---

## 13. Sonuç ve Karar

### Değerlendirme Özeti:
- **Kaynak Tespiti Netleşmiştir:** Geliştirmenin kalbi `odis-analysis` dizinidir. WAMP projesi henüz bu aşamaya güncellenmemiştir.
- **Eksiklerin Haritası Çıkarılmıştır:** `update.php` ve `delete.php` eksikliği, `reports/index.php` ham SQL riski, `health.php` yol hatası ve frontend-backend kopukluğu somut kanıtlarla belgelenmiştir.
- **Veri Bütünlüğü Güvencesi:** Hiçbir dosya ezilmemiş, hiçbir Git verisi kaybedilmemiş, salt okunur sınırlarına tam riayet edilmiştir.

### Karar:
## 🟡 KOŞULLU ONAY

**Gerekçe:**
Yapılan inceleme ve hazırlanan düzeltme planı sağlam temellere dayanmaktadır ve kaynak karmaşasını kesin olarak çözmüştür. Ancak:
1. İki yeni kritik endpointin (`students/update.php` ve `students/delete.php`) yazılması,
2. `reports/index.php` dosyasındaki SQL sorgularının parametrelendirilmesi,
3. `health.php` yolunun düzeltilmesi,
4. Ve ardından bu dosyaların Git üzerinde güvenle commit edilmesi gerekmektedir.

---

## 14. Son Talimat ve Bildirim

Bu aşamada **HİÇBİR KOD DÜZELTMESİ VEYA DOSYA DEĞİŞİKLİĞİ YAPILMAMIŞTIR**.

Sistem durdurulmuş olup, **Aşama 4.2-B (Kod Düzeltmelerinin Uygulanması)** adımına geçmek için kullanıcı onayı beklenmektedir.
