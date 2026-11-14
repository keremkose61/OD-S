# ODİS — AŞAMA 4.3-A: AKTİF KAYNAK KODU VE WAMP ORTAMI BAĞIMSIZ KARŞILAŞTIRMA DENETİM RAPORU

**Rapor Tarihi:** 14 Kasım 2026  
**Denetlenen Proje:** ODİS (Okul Disiplin ve İzleme Sistemi)  
**Aktif Geliştirme Dizini (Kaynak):** `C:\Users\Kose\.gemini\antigravity-ide\scratch\odis\odis-analysis`  
**WAMP Uygulama Dizini (Hedef):** `C:\wamp64\www\odis`  
**Git Dalı (Kaynak):** `feature/phase2-security-and-schema`  
**HEAD Commit (Kaynak):** `8bc954d75def57bf818e7ca6b1872245b8b11fda`  
**WAMP Git Durumu:** `main` dalı, HEAD `d87f49677952778458b7248a52cd917c554c45c4`  
**Teknoloji:** PHP 8.3.28 | MySQL 8.4.7 | Apache 2.4 (WampServer)  
**Denetim Türü:** Salt Okunur Karşılaştırma, SHA-256 Hash Doğrulaması ve Senkronizasyon Analizi  

---

## 1. Yönetici Özeti

Bu denetim, Aşama 4.2-D ve 4.2-E adımlarında güvenlik açıklarından arındırılan ve bağımsız doğrulaması tamamlanan **aktif geliştirme kopyası (`odis-analysis`)** ile yerel WAMP sunucusunda barınan **uygulama kopyası (`C:\wamp64\www\odis`)** arasındaki farkları ortaya koymak amacıyla gerçekleştirilmiştir.

### Temel Karşılaştırma Bulguları:
1. **WAMP Kopyasının Durumu (Ciddi Seviyede Eski):**  
   WAMP dizini, projenin en eski aşamalarından (`main` dalı) kalmadır. Aşama 2, 3 ve 4 boyunca geliştirilen modern REST API mimarisinin neredeyse hiçbiri WAMP dizininde bulunmamaktadır.
   - WAMP'ta `backend/api/students/` klasörü ve öğrenci uç noktaları (`create.php`, `update.php`, `delete.php`, `index.php`, `show.php`, `import.php`) **kesinlikle yoktur**.
   - `backend/api/reports/index.php`, `records/`, `observations/`, `support-cases/`, `admin-actions/`, `academic-years/`, `schools/` ve `audit/` klasörleri WAMP'ta **tamamen eksiktir**.
2. **Kritik Güvenlik Dosyaları:**  
   - `schema.sql`: Aktif kaynakta 19,458 baytlık (13 tablolu, çok okullu ve foreign key kısıtlı) eksiksiz şema bulunurken, WAMP'ta yalnızca 3,009 baytlık (sadece 4 tablo içeren) ilkel bir şema mevcuttur.
   - `backend/src/auth.php`: WAMP kopyasında `can_view_counseling_notes()` fonksiyonu bulunmamakta; `write_audit()` fonksiyonu detay parametresi almamaktadır.
   - `backend/src/bootstrap.php`: WAMP kopyasında oturum sertleştirme ve zaman aşımı mekanizmaları eksiktir.
3. **Frontend ve API Entegrasyon Tespiti:**  
   Frontend (`js/students.js`, `js/records.js` vb.) şu anda tamamen çevrimdışı öncelikli (*offline-first*) bir SPA/PWA mimarisinde olup verileri **IndexedDB** üzerinde tutmaktadır. `js/auth.js` haricinde frontend'den PHP backend API'lerine (`students/update.php` vb.) henüz doğrudan istek atılmamaktadır.
4. **Veri ve Yapılandırma Güvenliği:**  
   WAMP dizininde aktif SQLite veritabanı (`data/odis.sqlite`), aktif oturum dosyaları (`data/sessions/sess_*`) ve yerel yapılandırma (`config.local.php`) bulunmaktadır. Senkronizasyon sırasında bu dosyaların korunması şarttır.

**Nihai Karar:** **KOŞULLU HAZIR (CONDITIONALLY READY FOR SYNC)**  
WAMP dizini yedeklendikten ve koruma kuralları uygulandıktan sonra, P0 ve P1 seviyesindeki backend/API dosyaları güvenle WAMP ortamına aktarılabilir.

---

## 2. Dizin ve Git Doğrulaması

| Denetim Kriteri | Aktif Kaynak (`odis-analysis`) | WAMP Dizini (`C:\wamp64\www\odis`) | Durum / Uyarı |
|:---|:---|:---|:---:|
| **Dizin Varlığı** | Mevcut (`True`) | Mevcut (`True`) | DOĞRULANDI |
| **Git Deposu Mu?** | Evet (`.git` mevcut) | Evet (`.git` mevcut) | AYRI İKİ REPO |
| **Git Dalı** | `feature/phase2-security-and-schema` | `main` | DAL FARKLI |
| **HEAD Commit** | `8bc954d75def57bf818e7ca6b1872245b8b11fda` | `d87f49677952778458b7248a52cd917c554c45c4` | COMMIT FARKLI |
| **Çalışma Ağacı** | Değişiklikler mevcut (untracked API'ler) | Farklı / Ayrı yerel kopya | KORUNDU |
| **Erişim Sorunu** | Yok (PowerShell ile tam okuma) | Yok (PowerShell ile tam okuma) | DOĞRULANDI |

---

## 3. Dosya Karşılaştırma Özeti

İki dizin genelinde (özel kütüphaneler ve `.git` hariç) toplam **127 benzersiz dosya yolu** taranmıştır:

```
TOPLAM BENZERSİZ DOSYA : 127
├── IDENTICAL (Birebir Aynı)       : 19 dosya
├── DIFFERENT (Farklı İçerik)      : 49 dosya
├── MISSING_IN_WAMP (WAMP'ta Yok)  : 29 dosya
├── MISSING_IN_SOURCE (Kaynakta Yok): 29 dosya
└── SPECIAL (Özel / Korunan Yapı)  :  1 dosya (backend/config/config.local.php)
```

---

## 4. Eksik Dosyalar

### 4.1 WAMP Ortamında Eksik Olan Dosyalar (`MISSING_IN_WAMP` - 29 Dosya)
Bu dosyalar aktif geliştirme dizininde mevcut olup WAMP kopyasında **hiç bulunmamaktadır**:

| Dosya Yolu | Boyut | Açıklama / Öncelik |
|:---|:---:|:---|
| `backend/api/students/create.php` | 4,360 B | **P0:** Öğrenci oluşturma (SEC-01 & SEC-03 düzeltmeli) |
| `backend/api/students/update.php` | 6,196 B | **P0:** Öğrenci güncelleme (SEC-01 & SEC-03 düzeltmeli) |
| `backend/api/students/delete.php` | 2,666 B | **P0:** Öğrenci pasifleştirme/soft-delete (SEC-03 düzeltmeli) |
| `backend/api/reports/index.php` | 3,411 B | **P0:** Raporlama API (SEC-02 SQL tek tırnak düzeltmeli) |
| `backend/api/students/index.php` | 1,505 B | **P1:** Öğrenci listeleme uç noktası |
| `backend/api/students/show.php` | 3,681 B | **P1:** Öğrenci detay ve alt kayıt uç noktası |
| `backend/api/students/import.php` | 4,276 B | **P1:** Toplu öğrenci aktarım uç noktası |
| `backend/api/academic-years/index.php` | 562 B | **P1:** Akademik yıl listeleme uç noktası |
| `backend/api/admin-actions/create.php` | 2,438 B | **P1:** İdari işlem kaydetme uç noktası |
| `backend/api/admin-actions/index.php` | 1,125 B | **P1:** İdari işlem listeleme uç noktası |
| `backend/api/audit/index.php` | 1,173 B | **P1:** Denetim günlüğü listeleme uç noktası |
| `backend/api/observations/create.php` | 2,664 B | **P1:** Öğretmen gözlem kaydetme uç noktası |
| `backend/api/observations/index.php` | 1,308 B | **P1:** Öğretmen gözlem listeleme uç noktası |
| `backend/api/records/cancel.php` | 1,587 B | **P1:** Düzen kaydı iptal etme uç noktası |
| `backend/api/records/create.php` | 4,038 B | **P1:** Düzen kaydı ekleme uç noktası |
| `backend/api/records/index.php` | 1,436 B | **P1:** Düzen kayıtları listeleme uç noktası |
| `backend/api/schools/index.php` | 1,408 B | **P1:** Okul listeleme uç noktası |
| `backend/api/support-cases/create.php`| 2,772 B | **P1:** Destek süreci başlatma uç noktası |
| `backend/api/support-cases/index.php` | 1,862 B | **P1:** Destek süreçleri listeleme uç noktası |
| `backend/api/support-cases/update.php`| 2,937 B | **P1:** Destek süreci güncelleme uç noktası |
| `backend/config/config.test.php` | 448 B | **P1:** Yalıtılmış test veritabanı yapılandırması |
| `backend/scripts/migrate.php` | 25,382 B | **P1:** Veritabanı göç betiği |
| `backend/scripts/seed_demo.php` | 3,810 B | **P1:** Demo veri tohumlama betiği |
| `backend/scripts/test_backend.php` | 6,799 B | **P1:** Backend test koşucusu |
| *Rapor Belgeleri (4.2-A .. 4.2-E)* | ~123 KB | **P3:** Dokümantasyon ve denetim raporları (5 dosya) |

### 4.2 Aktif Kaynakta Olmayan, Yalnızca WAMP'ta Olan Dosyalar (`MISSING_IN_SOURCE` - 29 Dosya)
Bu dosyalar WAMP'ın eski monolit yapısından veya yerel çalışma ortamından kaynaklanmaktadır:
- **Eski Monolit PHP Dosyaları (10 dosya):** `admin.php`, `counselor.php`, `students.php`, `records.php`, `student-detail.php`, `login.php`, `logout.php`, `index.php`, `includes/header.php`, `includes/footer.php`, `includes/functions.php`, `config/db.php`.
- **Yerel Veri ve Oturumlar (8 dosya):** `data/odis.sqlite`, `data/sessions/sess_*` (6 adet oturum dosyası).
- **Yedek / Geçici Dosyalar (3 dosya):** `index.zip`, `js.zip`, `fetchColumn()`.
- **Test ve Scratch Dosyaları (7 dosya):** `scratch/test-*.mjs`, `.vscode/settings.json`.

---

## 5. Farklı Dosyalar (`DIFFERENT` - 49 Dosya)

Her iki tarafta da bulunan ancak aktif kaynakta güncellenmiş dosyaların başlıcaları:

| Dosya Yolu | Kaynak Boyut | WAMP Boyut | Temel Fark ve Değerlendirme |
|:---|:---:|:---:|:---|
| `backend/database/schema.sql` | 19,458 B | 3,009 B | **KRİTİK:** Kaynakta 13 tablo ve foreign key'ler var; WAMP'ta sadece 4 tablo var. |
| `backend/src/auth.php` | 3,000 B | 2,034 B | **KRİTİK:** Kaynakta rehberlik gizlilik kuralı ve detaylı audit desteği var. |
| `backend/src/bootstrap.php` | 1,981 B | 992 B | **KRİTİK:** Kaynakta session hardening ve idle timeout var. |
| `backend/api/auth/login.php` | 3,829 B | 2,490 B | **KRİTİK:** Kaynakta brute-force koruması ve CSRF doğrulaması güncel. |
| `backend/config/config.php` | 866 B | 600 B | Kaynakta hata gizleme ve 503 yönetimi güçlendirilmiş. |
| `backend/scripts/create_user.php` | 3,204 B | 1,836 B | Kaynakta okul bazlı kullanıcı üretimi mevcut. |
| `backend/.htaccess` | 958 B | 18 B | Kaynakta API yönlendirme kuralları ve güvenlik başlıkları var. |
| `js/app.js`, `js/auth.js` | ~18 KB | ~20 KB | Kaynakta backend API bağlantı temelleri ve CSRF entegrasyonu var. |
| `js/students.js`, `js/records.js` | ~34 KB | ~31 KB | Çok okullu filtreleme ve IndexedDB uyumlulukları. |

---

## 6. Güvenlik Dosyalarının Karşılaştırması (12 Dosya)

Aşama 4.3-A talimatı gereği belirlenen 12 güvenlik dosyasının ayrıntılı analizi:

| No | Dosya Yolu | Kaynak SHA-256 | WAMP SHA-256 | Durum | Güvenlik Değerlendirmesi |
|:--:|:---|:---|:---|:---:|:---|
| 1 | `backend/api/students/create.php` | `5C7A9AE9A7...` | *YOK* | `MISSING` | WAMP'ta öğrenci oluşturma API'si hiç yok. |
| 2 | `backend/api/students/update.php` | `459A5BA209...` | *YOK* | `MISSING` | WAMP'ta öğrenci güncelleme API'si hiç yok. |
| 3 | `backend/api/students/delete.php` | `695E39249D...` | *YOK* | `MISSING` | WAMP'ta soft-delete API'si hiç yok. |
| 4 | `backend/api/students/index.php` | `FF13BD0080...` | *YOK* | `MISSING` | WAMP'ta öğrenci listeleme API'si hiç yok. |
| 5 | `backend/api/students/show.php` | `FA4C46DEDAB...` | *YOK* | `MISSING` | WAMP'ta öğrenci detay API'si hiç yok. |
| 6 | `backend/api/reports/index.php` | `CB1C8BA0C3...` | *YOK* | `MISSING` | WAMP'ta raporlama API'si hiç yok. |
| 7 | `backend/api/health.php` | `B845273CF4...` | `B845273CF4...` | `IDENTICAL` | Include yolları her iki tarafta da düzeltilmiş. |
| 8 | `backend/src/auth.php` | `163529C75E...` | `5BC9906DD6...` | `DIFFERENT` | WAMP'ta `can_view_counseling_notes()` eksik! |
| 9 | `backend/src/http.php` | `F7D6CC502D...` | `F7D6CC502D...` | `IDENTICAL` | Birebir eşleşiyor (`require_csrf`, `json_response`). |
| 10 | `backend/src/Database.php` | `BD5906AF34...` | `BD5906AF34...` | `IDENTICAL` | Birebir eşleşiyor (`ERRMODE_EXCEPTION`). |
| 11 | `backend/src/bootstrap.php` | `EC9BA8F1E6...` | `8FF0891D38...` | `DIFFERENT` | WAMP'ta `use_trans_sid=0` ve timeout eksik! |
| 12 | `backend/database/schema.sql` | `5F6FD7D729...` | `4CDA80DF7D...` | `DIFFERENT` | WAMP şemasında 9 tablo eksik! |

### WAMP Kopyasındaki Güvenlik Özellikleri Özeti:
- Oturumdan okul kimliği alma: WAMP auth uç noktalarında var, ancak öğrenci/rapor uç noktaları bulunmuyor.
- `school_id` değiştirilemezliği: WAMP'ta öğrenci uç noktaları olmadığı için test edilemez.
- Akademik yıl okul aidiyeti: WAMP'ta hiç uygulanmamış.
- Öğrenci soft-delete: WAMP'ta endpoint yok.
- Transaction ve audit atomikliği: WAMP'ta yok.
- Rehberlik özel notları rol kontrolü: WAMP'ta `can_view_counseling_notes()` fonksiyonu eksik.
- SQL `ANSI_QUOTES` uyumu: WAMP'ta `reports/index.php` mevcut değil.

---

## 7. Frontend ve Backend Uyumluluğu

Frontend kodları (`js/students.js`, `js/auth.js`, `js/database.js`, `js/app.js`) incelenmiş ve 7 soru yanıtlanmıştır:

1. **Frontend öğrenci oluşturmada PHP API'sini kullanıyor mu?**  
   **HAYIR.** `js/students.js` Satır 95: `await Database.put(Database.STORES.STUDENTS, student);`. Veri doğrudan tarayıcı IndexedDB deposuna yazılmaktadır.
2. **Frontend öğrenci güncellemede `students/update.php` endpoint'ine istek gönderiyor mu?**  
   **HAYIR.** `updateStudent()` fonksiyonu yalnızca IndexedDB kaydını güncellemektedir.
3. **Frontend öğrenci silmede `students/delete.php` endpoint'ini kullanıyor mu?**  
   **HAYIR.** Silme/arşivleme işlemi de IndexedDB üzerinde gerçekleştirilmektedir.
4. **Öğrenci verileri hâlâ yalnızca IndexedDB üzerinde mi güncelleniyor?**  
   **EVET.** Sistem şu anda çevrimdışı öncelikli (*offline-first*) PWA olarak çalışmakta; öğrenci, disiplin ve gözlem verileri tarayıcı yerel deposunda barındırılmaktadır.
5. **CSRF token frontend tarafından API isteklerine ekleniyor mu?**  
   **EVET.** `js/auth.js` içindeki `apiPost()` fonksiyonu `X-CSRF-Token` başlığını eklemektedir. Ancak bu mekanizma şu an yalnızca `auth/login.php` ve `auth/logout.php` çağrılarında aktiftir.
6. **PHP oturum yönetimi ile frontend kimlik doğrulaması uyumlu mu?**  
   **EVET.** Giriş ekranı `apiPost('auth/login.php')` ile PHP oturumunu açmakta ve başarılı yanıttan sonra yerel oturum nesnesini oluşturmaktadır.
7. **WAMP sürümündeki frontend ve backend dosyaları birbirleriyle uyumlu mu?**  
   WAMP sürümündeki frontend dosyaları da IndexedDB kullandığı için tarayıcıda çalışabilmektedir; fakat WAMP backend'i Aşama 4.3 REST API testlerini karşılayacak endpoint'lere sahip değildir.

---

## 8. Yerel Yapılandırma ve Veri Koruma

Aşağıdaki dosyalar senkronizasyon sırasında **kesinlikle üzerine yazılmamalı veya silinmemelidir**:

| Korunan Dosya / Dizin | WAMP Konumu | Korunma Nedeni |
|:---|:---|:---|
| `backend/config/config.local.php` | `C:\wamp64\www\odis\backend\config\` | Yerel MySQL kullanıcı ve bağlantı sırları. *(Her iki tarafta hash aynı olsa da üzerine yazılmamalıdır)* |
| `data/odis.sqlite` | `C:\wamp64\www\odis\data\` | WAMP üzerinde varsa yerel SQLite veri tabanı. |
| `data/sessions/*` | `C:\wamp64\www\odis\data\sessions\` | Aktif oturum dosyaları. |
| `config/db.php` | `C:\wamp64\www\odis\config\` | Eski monolit yapılandırması (yedeklenmeli). |

---

## 9. Senkronizasyon Aday Listesi (Aşama 4.3-B İçin)

Aşama 4.3-B senkronizasyonunda aktarılması önerilen dosyalar önceliklendirilmeli ve kontrollü kopyalanmalıdır:

### 9.1 P0: Güvenlik İçin Zorunlu Dosyalar (Hemen Aktarılmalı)
1. `backend/api/students/create.php` -> WAMP (`backend/api/students/create.php`) [4,360 B]
2. `backend/api/students/update.php` -> WAMP (`backend/api/students/update.php`) [6,196 B]
3. `backend/api/students/delete.php` -> WAMP (`backend/api/students/delete.php`) [2,666 B]
4. `backend/api/reports/index.php` -> WAMP (`backend/api/reports/index.php`) [3,411 B]
5. `backend/src/auth.php` -> WAMP (`backend/src/auth.php`) [3,000 B]
6. `backend/src/bootstrap.php` -> WAMP (`backend/src/bootstrap.php`) [1,981 B]
7. `backend/api/auth/login.php` -> WAMP (`backend/api/auth/login.php`) [3,829 B]

### 9.2 P1: Backend API ve Veritabanı Bütünlüğü İçin Zorunlu Dosyalar
8. `backend/database/schema.sql` -> WAMP (`backend/database/schema.sql`) [19,458 B]
9. `backend/api/students/index.php` [1,505 B]
10. `backend/api/students/show.php` [3,681 B]
11. `backend/api/students/import.php` [4,276 B]
12. `backend/api/academic-years/index.php` [562 B]
13. `backend/api/admin-actions/create.php` ve `index.php`
14. `backend/api/audit/index.php`
15. `backend/api/observations/create.php` ve `index.php`
16. `backend/api/records/cancel.php`, `create.php`, `index.php`
17. `backend/api/schools/index.php`
18. `backend/api/support-cases/create.php`, `index.php`, `update.php`
19. `backend/config/config.test.php` [448 B]
20. `backend/scripts/migrate.php`, `seed_demo.php`, `test_backend.php`, `create_user.php`
21. `backend/.htaccess` [958 B]

### 9.3 P2: Frontend Varlıkları (İsteğe Bağlı / Senkronize Edilebilir)
- `js/`, `css/` ve `icons/` dizinleri (Arayüz uyumu için aktarılabilir; ancak yerel test betikleri korunmalıdır).

---

## 10. Veri Kaybı Riskleri ve Geri Dönüş Önlemleri

| Risk Tanımı | Etkilenen Bileşen | Önlem ve Geri Dönüş Planı |
|:---|:---|:---|
| **WAMP Kopyasının Bozulması** | `C:\wamp64\www\odis` | Senkronizasyon öncesi tüm WAMP klasörü `C:\wamp64\www\odis_backup_phase4_3` olarak kopyalanmalıdır. |
| **Bağlantı Sırlarının Ezilmesi** | `config.local.php` | Aktarım komutlarında (`robocopy` / `Copy-Item`) `config.local.php` dosyası kesinlikle hariç (`/XF config.local.php`) tutulmalıdır. |
| **Oturum ve SQLite Kaybı** | `data/` klasörü | `data/` dizini aktarım kapsamına alınmamalıdır (`/XD data`). |

---

## 11. Önerilen Senkronizasyon Sırası (Aşama 4.3-B)

1. **Adım 1:** WAMP dizininin tam yedeğinin alınması (`odis_backup_phase4_3`).
2. **Adım 2:** WAMP `backend/api/` altında eksik klasörlerin (`students`, `reports`, `records`, `observations`, `support-cases`, `admin-actions`, `academic-years`, `schools`, `audit`) oluşturulması.
3. **Adım 3:** P0 ve P1 seviyesindeki backend dosyalarının aktarılması (hariç tutulanlar: `config.local.php`, `data/`).
4. **Adım 4:** WAMP üzerinde aktarılan dosyaların SHA-256 hash doğrulaması.
5. **Adım 5:** WAMP PHP CLI ile `php -l` sözdizim denetimi.

---

## 12. Aşama 4.3-B İçin Gerekli Kullanıcı Kararları

1. **WAMP Tam Yedekleme Onayı:** WAMP klasörünün `odis_backup_phase4_3` adıyla yedeklenmesi onaylanıyor mu?
2. **Aktarım Kapsamı:** Yalnızca backend/API dosyaları mı (P0 + P1) aktarılsın, yoksa frontend dosyaları da (`js/`, `css/`) senkronize edilsin mi?
3. **Eski Monolit Dosyalar:** WAMP kök dizininde bulunan eski dosyalar (`admin.php`, `counselor.php`, `students.php`) korunsun mu, yoksa arşiv klasörüne mi kaldırılsın?

---

## 13. Nihai Değerlendirme ve Karar

```
[ NİHAİ KARAR: KOŞULLU HAZIR (CONDITIONALLY READY FOR SYNC) ]
```

**Gerekçe:**  
Aktif geliştirme kopyasındaki (`odis-analysis`) güvenlik düzeltmeleri ve yeni API uç noktaları eksiksiz, doğrulanmış ve aktarıma hazırdır. Ancak WAMP kopyasının oldukça eski olması, birçok dosyanın eksik bulunması ve yerel oturum/SQLite verilerinin mevcut olması sebebiyle, **tam yedekleme yapılmadan ve hariç tutma kuralları tanımlanmadan körü körüne senkronizasyon yapılmamalıdır.**

Yukarıdaki 3 kullanıcı kararı netleştikten sonra **Aşama 4.3-B: Güvenli Senkronizasyon** adımına geçilebilir.
