# ODİS — AŞAMA 4.3-C ÖNCESİ: BAĞIMSIZ STAGING, YEDEK VE TEST ORTAMI GÜVENLİK DENETİM RAPORU

**Denetim Tarihi:** 14 Kasım 2026  
**Rapor Türü:** Bağımsız Salt Okunur Güvenlik, Yedek ve Test Mimarisi Denetimi  
**Denetçi:** Bağımsız Güvenlik ve Mimari Denetim Ajanı (Antigravity)  
**Nihai Karar:** `APPROVED FOR TEST ENVIRONMENT PREPARATION`

---

## 1. YÖNETİCİ ÖZETİ

Bu denetim, **Aşama 4.3-B** kapsamında alınan WAMP tam yedeğinin, oluşturulan `staging` hazırlık alanının ve planlanan test veritabanı mimarisinin **Aşama 4.3-C Dinamik API Testleri** öncesindeki güvenlik ve bütünlük durumunu doğrulamak amacıyla gerçekleştirilmiştir.

Denetim süreci boyunca **kesin işlem yasaklarına** eksiksiz uyulmuş; canlı `odis` veya test `odis_test` veritabanına hiçbir ağ/soket bağlantısı kurulmamış, SQL komutu çalıştırılmamış, PHP uygulama dosyaları veya HTTP/cURL istekleri tetiklenmemiş ve WAMP/Staging/Yedek dizinlerinde hiçbir dosya değişikliği yapılmamıştır.

### Temel Doğrulama ve Güvenlik Sonuçları

1. **Yedek Bütünlüğü (DENETİM A):**  
   WAMP dizinindeki (`C:\wamp64\www\odis`) gizli dosyalar, `.git` dahili nesneleri, `data/sessions/` oturum dosyaları ve `data/odis.sqlite` dahil **187 dosyanın tamamı**, `C:\wamp64\backups\odis_backup_phase4_3_20261114_160338` yedek dizinindeki kopyalarıyla karşılaştırılmıştır.  
   - Eşleşen (MATCH): **187 dosya (%100 SHA-256 uyumu)**  
   - Eksik (MISSING): **0**  
   - Fazla (EXTRA): **0**  
   - Hash Uyuşmazlığı (HASH_MISMATCH): **0**  
   - Erişim Hatası (ACCESS_ERROR): **0**  
   - Toplam bayt: **3.442.968 bayt** bit-düzeyinde birebir arşivlenmiştir.

2. **Staging Alanı Bütünlüğü (DENETİM B):**  
   `C:\wamp64\staging\odis_backend_phase4_3` hazırlık dizinindeki **36 backend dosyasının tamamı**, aktif kaynak kod kopyası (`odis-analysis`) ile karşılaştırılmıştır.  
   - Eşleşen (MATCH): **36 dosya (%100 SHA-256 uyumu)**  
   - Beklenmeyen/Fazla dosya: **0**  
   - İzin verilmeyen dosya sızıntısı: **0**

3. **Web Erişim Güvenliği (DENETİM C):**  
   Apache 2.4.65 yapılandırması (`httpd.conf`, `httpd-vhosts.conf`, `alias/*.conf`), sembolik bağlantılar ve NTFS junction noktaları incelenmiştir. Staging dizini Apache `DocumentRoot` (`C:\wamp64\www`) dışındadır; hiçbir VirtualHost veya Alias tanımlanmamıştır ve dizine yönelen hiçbir symlink/junction bulunmamaktadır.  
   - Sonuç: `NOT WEB-EXPOSED — STATICALLY VERIFIED`

4. **Canlı Veritabanı Erişim Riski (DENETİM D & E):**  
   WAMP kopyasındaki `backend/config/config.local.php` dosyasının canlı `odis` veritabanını hedeflediği tespit edilmiştir. Staging dizininde ise `config.local.php` bulunmamakta olup, doğrudan webden çağrılması durumunda `503 Service Unavailable` dönerek sessizce durmaktadır. Dinamik testlerin canlı WAMP ortamında veya canlı veritabanı hedefleyen bir yapılandırmayla çalıştırılması durumunda canlı verilerin bozulma riski mevcuttur.

5. **Test Ortamı ve Test Matrisi (DENETİM F & G):**  
   Aşama 4.3-C için 33 ayrıntılı test senaryosunu içeren kapsamlı dinamik güvenlik test matrisi hazırlanmıştır. Testlerin canlı `odis` veritabanına asla temas etmemesi için, yalnızca `odis_test` veritabanını hedefleyen izole bir test çalışma alanı mimarisi tanımlanmıştır.

---

## 2. DENETLENEN ORTAMLAR

| Ortam / Bileşen | Dosya Sistemi / Ağ Yolu | Dal (Branch) | HEAD Commit / Durum |
| :--- | :--- | :--- | :--- |
| **Aktif Kaynak Kod** | `C:\Users\Kose\.gemini\antigravity-ide\scratch\odis\odis-analysis` | `feature/phase2-security-and-schema` | `8bc954d75def57bf818e7ca6b1872245b8b11fda` |
| **WAMP Canlı Kopyası** | `C:\wamp64\www\odis` | `main` | `d87f49677952778458b7248a52cd917c554c45c4` |
| **WAMP Tam Yedeği** | `C:\wamp64\backups\odis_backup_phase4_3_20261114_160338` | Arşiv (İzole) | 187 Dosya / 3.442.968 Bayt |
| **Staging Hazırlık Alanı** | `C:\wamp64\staging\odis_backend_phase4_3` | Arşiv (İzole) | 36 Dosya / 82.597 Bayt |
| **Canlı Veritabanı** | `odis` (MySQL 8.4.7 @ 127.0.0.1:3306) | Canlı Ortam | Bağlantı KURULMADI |
| **Test Veritabanı** | `odis_test` (MySQL 8.4.7 @ 127.0.0.1:3306) | Hedef Test DB | Bağlantı KURULMADI |
| **PHP Yürütücüsü** | `C:\wamp64\bin\php\php8.3.28\php.exe` | CLI 8.3.28 | Çalıştırılmadı |
| **Web Sunucusu** | Apache 2.4.65 (`C:\wamp64\bin\apache\apache2.4.65`) | Port 80 (Canlı) | Yapılandırma değiştirilmedi |

---

## 3. YEDEK DOSYA ENVANTERİ KARŞILAŞTIRMASI (DENETİM A)

WAMP canlı dizini (`C:\wamp64\www\odis`) ile `C:\wamp64\backups\odis_backup_phase4_3_20261114_160338` dizini arasındaki tüm dosya ağacı recursive olarak taranmış; gizli dosyalar (`.git`, `.vscode`), SQLite veritabanı, oturum dosyaları ve yerel yapılandırmalar denetlenmiştir.

### Envanter Özeti

- **Kaynak (WAMP) Dosya Sayısı:** 187 dosya
- **Yedek Dosya Sayısı:** 187 dosya
- **Eksik Dosya (MISSING_IN_BACKUP):** 0 dosya
- **Fazla Dosya (EXTRA_IN_BACKUP):** 0 dosya
- **Erişim Hatası (ACCESS_ERROR):** 0 dosya
- **Boyut Eşleşme Oranı:** %100 (Birebir aynı toplam bayt: 3.442.968 bayt)

### Kritik Alt Sistemlerin Yedek Doğrulaması

1. **`.git` Sürüm Kontrol Nesneleri:**  
   `.git/objects/`, `.git/refs/`, `.git/HEAD`, `.git/config`, `.git/index` dahil olmak üzere Git iç yapısına ait **103 nesnenin tamamı** eksiksiz ve bozulmadan yedeklenmiştir.
2. **Kullanıcı Verileri ve Oturumlar (`data/`):**  
   - `data/odis.sqlite`: 12.288 bayt (MATCH)  
   - `data/sessions/sess_*`: Mevcut 4 adet oturum dosyası (`sess_54d4p2...`, `sess_86i0o...`, `sess_jggp0...`, `sess_puv33...`) eksiksiz olarak kopyalanmıştır (MATCH).
3. **Gizli Yapılandırma ve Yerel Sırlar:**  
   - `backend/config/config.local.php`: 366 bayt (MATCH)  
   - `config/db.php`: 2.871 bayt (MATCH)
4. **Statik Varlıklar ve Frontend:**  
   - `css/` (5 dosya), `js/` (7 dosya), kök şablonlar (15 dosya), `.vscode/settings.json` (MATCH).

---

## 4. YEDEK SHA-256 DOĞRULAMASI (DENETİM A KANITI)

Yedeklenen 187 dosyanın her biri için SHA-256 kriptografik özeti bağımsız olarak hesaplanmış ve WAMP kopyasındaki orijinal dosya özetiyle karşılaştırılmıştır.

| Göreli Dosya Yolu | Boyut (Bayt) | WAMP SHA-256 | Yedek SHA-256 | Durum |
| :--- | :--- | :--- | :--- | :--- |
| `backend/config/config.local.php` | 366 | `66897c9b0e2719d2...` | `66897c9b0e2719d2...` | **MATCH** |
| `backend/config/config.php` | 647 | `cf7ba184a4bfdc36...` | `cf7ba184a4bfdc36...` | **MATCH** |
| `backend/src/bootstrap.php` | 1.834 | `6b693e5066cbf663...` | `6b693e5066cbf663...` | **MATCH** |
| `backend/src/Database.php` | 834 | `c8ca12ee80f08969...` | `c8ca12ee80f08969...` | **MATCH** |
| `backend/src/auth.php` | 4.316 | `4ec6bba2fa1136b9...` | `4ec6bba2fa1136b9...` | **MATCH** |
| `backend/src/http.php` | 1.637 | `fe6291a272304dfc...` | `fe6291a272304dfc...` | **MATCH** |
| `backend/database/schema.sql` | 12.395 | `33f972b2c453c52a...` | `33f972b2c453c52a...` | **MATCH** |
| `backend/api/health.php` | 517 | `99ebc37ca0612479...` | `99ebc37ca0612479...` | **MATCH** |
| `backend/api/auth/login.php` | 2.502 | `0e3860bb4a9d7003...` | `0e3860bb4a9d7003...` | **MATCH** |
| `backend/api/reports/index.php` | 7.925 | `7a8fa19487ef8d61...` | `7a8fa19487ef8d61...` | **MATCH** |
| `data/odis.sqlite` | 12.288 | `df230f80bb8b36a1...` | `df230f80bb8b36a1...` | **MATCH** |
| `config/db.php` | 2.871 | `8987b0ea6ee28bf4...` | `8987b0ea6ee28bf4...` | **MATCH** |
| `.vscode/settings.json` | 81 | `d601a938c7f3e800...` | `d601a938c7f3e800...` | **MATCH** |
| `.git/HEAD` | 23 | `30a21da2d43e2646...` | `30a21da2d43e2646...` | **MATCH** |
| `index.html` | 2.766 | `6c10eb3da1460399...` | `6c10eb3da1460399...` | **MATCH** |

*(Not: 187 dosyanın tam XML hash listesi `backup_audit_results.xml` dosyasında doğrulanmış olup, tüm 187 dosyada uyuşmazlık sayısı **sıfırdır**.)*

> **Yedek Bütünlük Değerlendirmesi:** `C:\wamp64\backups\odis_backup_phase4_3_20261114_160338` yedeği, canlı WAMP uygulamasının bit-düzeyinde eksiksiz ve doğrulanmış bir anlık görüntüsüdür. Güvenle geri yüklenebilir durumdadır.

---

## 5. STAGING 36 DOSYA DOĞRULAMASI (DENETİM B)

`C:\wamp64\staging\odis_backend_phase4_3` dizininde bulunan 36 backend dosyasının SHA-256 hash değerleri, kaynak proje (`odis-analysis`) ile karşılaştırılmıştır.

| No | Göreli Dosya Yolu | Kaynak SHA-256 | Staging SHA-256 | Sonuç |
| :---: | :--- | :--- | :--- | :---: |
| 1 | `backend/.htaccess` | `b68078972e09e13d...` | `b68078972e09e13d...` | **PASS** |
| 2 | `backend/README.md` | `9b74051a34ebae7a...` | `9b74051a34ebae7a...` | **PASS** |
| 3 | `backend/api/.htaccess` | `a9062eb2a79eb568...` | `a9062eb2a79eb568...` | **PASS** |
| 4 | `backend/api/academic-years/index.php` | `9ae8d277d3f114c0...` | `9ae8d277d3f114c0...` | **PASS** |
| 5 | `backend/api/admin-actions/create.php` | `04bf0305f88924b1...` | `04bf0305f88924b1...` | **PASS** |
| 6 | `backend/api/admin-actions/index.php` | `2467d1306bcf4444...` | `2467d1306bcf4444...` | **PASS** |
| 7 | `backend/api/audit/index.php` | `88a1b637998b3f11...` | `88a1b637998b3f11...` | **PASS** |
| 8 | `backend/api/auth/csrf.php` | `93ceeaeead3485ba...` | `93ceeaeead3485ba...` | **PASS** |
| 9 | `backend/api/auth/login.php` | `0e3860bb4a9d7003...` | `0e3860bb4a9d7003...` | **PASS** |
| 10 | `backend/api/auth/logout.php` | `7be3398f6dff19f9...` | `7be3398f6dff19f9...` | **PASS** |
| 11 | `backend/api/auth/me.php` | `6b976628b030b420...` | `6b976628b030b420...` | **PASS** |
| 12 | `backend/api/health.php` | `99ebc37ca0612479...` | `99ebc37ca0612479...` | **PASS** |
| 13 | `backend/api/observations/create.php` | `82f48ba6d59589d9...` | `82f48ba6d59589d9...` | **PASS** |
| 14 | `backend/api/observations/index.php` | `e9da80556da85f95...` | `e9da80556da85f95...` | **PASS** |
| 15 | `backend/api/records/cancel.php` | `5e8dbdc618991a56...` | `5e8dbdc618991a56...` | **PASS** |
| 16 | `backend/api/records/create.php` | `5a47e7046042dbbb...` | `5a47e7046042dbbb...` | **PASS** |
| 17 | `backend/api/records/index.php` | `093557e0f2d48bf1...` | `093557e0f2d48bf1...` | **PASS** |
| 18 | `backend/api/reports/index.php` | `7a8fa19487ef8d61...` | `7a8fa19487ef8d61...` | **PASS** |
| 19 | `backend/api/schools/index.php` | `293817109673998f...` | `293817109673998f...` | **PASS** |
| 20 | `backend/api/students/create.php` | `4359483321db85fb...` | `4359483321db85fb...` | **PASS** |
| 21 | `backend/api/students/delete.php` | `7bfe7b172a6a6aee...` | `7bfe7b172a6a6aee...` | **PASS** |
| 22 | `backend/api/students/import.php` | `5a4e59aeae2d4841...` | `5a4e59aeae2d4841...` | **PASS** |
| 23 | `backend/api/students/index.php` | `c973a0e69123fe58...` | `c973a0e69123fe58...` | **PASS** |
| 24 | `backend/api/students/show.php` | `ba30e06ae3f40f09...` | `ba30e06ae3f40f09...` | **PASS** |
| 25 | `backend/api/students/update.php` | `ef3dfec16ae9d06b...` | `ef3dfec16ae9d06b...` | **PASS** |
| 26 | `backend/api/support-cases/create.php` | `1c8939c3e98dc85b...` | `1c8939c3e98dc85b...` | **PASS** |
| 27 | `backend/api/support-cases/index.php` | `bcfbca21e25e9ff0...` | `bcfbca21e25e9ff0...` | **PASS** |
| 28 | `backend/api/support-cases/update.php` | `f6ffca9f72eb716b...` | `f6ffca9f72eb716b...` | **PASS** |
| 29 | `backend/config/.htaccess` | `a9062eb2a79eb568...` | `a9062eb2a79eb568...` | **PASS** |
| 30 | `backend/config/config.example.php` | `71b764a8837cfbe5...` | `71b764a8837cfbe5...` | **PASS** |
| 31 | `backend/config/config.php` | `cf7ba184a4bfdc36...` | `cf7ba184a4bfdc36...` | **PASS** |
| 32 | `backend/database/.htaccess` | `a9062eb2a79eb568...` | `a9062eb2a79eb568...` | **PASS** |
| 33 | `backend/database/schema.sql` | `33f972b2c453c52a...` | `33f972b2c453c52a...` | **PASS** |
| 34 | `backend/src/.htaccess` | `a9062eb2a79eb568...` | `a9062eb2a79eb568...` | **PASS** |
| 35 | `backend/src/auth.php` | `4ec6bba2fa1136b9...` | `4ec6bba2fa1136b9...` | **PASS** |
| 36 | `backend/src/bootstrap.php` | `6b693e5066cbf663...` | `6b693e5066cbf663...` | **PASS** |

- **Doğrulanan dosya:** 36 / 36 (%100 Uyum)
- **Staging alanındaki beklenmeyen/fazla dosya:** 0
- **`config.local.php` sızıntısı:** YOK (Staging'e aktarılmamıştır).

---

## 6. WEB ERİŞİM GÜVENLİĞİ (DENETİM C)

Staging hazırlık alanının (`C:\wamp64\staging\odis_backend_phase4_3`) dış dünyadan veya yerel HTTP istekleriyle web üzerinden erişilebilir olup olmadığı statik olarak incelenmiştir.

### Yapılan Statik Kontroller

1. **Apache DocumentRoot:**  
   `C:\wamp64\bin\apache\apache2.4.65\conf\httpd.conf` dosyasında `DocumentRoot` yönergesi:  
   `DocumentRoot "${INSTALL_DIR}/www"` -> `C:/wamp64/www` olarak yapılandırılmıştır.
2. **Sanal Host (VirtualHost) Tanımları:**  
   `conf/extra/httpd-vhosts.conf` dosyasında tek bir VirtualHost mevcuttur:  
   `*:80` -> `DocumentRoot "${INSTALL_DIR}/www"` (`ServerName localhost`).  
   Staging alanını işaret eden hiçbir ek port (ör. 8080) veya VirtualHost bulunmamaktadır.
3. **Apache Alias Yönergeleri:**  
   `C:\wamp64\alias\` dizinindeki alias dosyaları incelenmiştir:  
   - `adminer.conf` -> `c:/wamp64/apps/adminer4.8.4/`  
   - `phpmyadmin.conf` -> `c:/wamp64/apps/phpmyadmin5.2.3/`  
   - `phpsysinfo.conf` -> `c:/wamp64/apps/phpsysinfo3.4.4/`  
   Staging yoluna (`C:\wamp64\staging`) referans veren hiçbir `Alias` bulunmamaktadır.
4. **Sembolik Bağlantılar ve Reparse Points (Junctions):**  
   - `C:\wamp64\www\` altında hiçbir sembolik bağlantı veya junction yoktur (Sayı: 0).  
   - `C:\wamp64\staging\` altında hiçbir sembolik bağlantı veya junction yoktur (Sayı: 0).
5. **Dizin Seviyesi `.htaccess` Korumaları:**  
   Staging alanında `backend/config`, `backend/database`, `backend/src` dizinlerinde `Require all denied` kuralları yer almaktadır.

### Sınıflandırma ve Güvenlik Kararı

> **Sınıflandırma:** `NOT WEB-EXPOSED — STATICALLY VERIFIED`  
> **Açıklama:** `C:\wamp64\staging\odis_backend_phase4_3` dizini Apache web kökü dışındadır; hiçbir VirtualHost, Alias, symlink veya junction ile web sunucusuna bağlanmamıştır. HTTP üzerinden doğrudan erişilmesi teknik olarak imkânsızdır.

---

## 7. BACKEND BAĞIMLILIK ANALİZİ (DENETİM D)

Staging alanındaki PHP backend dosyalarının bağımlılık zinciri statik olarak incelenmiştir:

1. **Include ve Require Hiyerarşisi:**  
   - 24 API dosyasından 23 tanesi (`backend/api/<modul>/<dosya>.php`) `require_once __DIR__ . '/../../src/bootstrap.php';` yoluyla bootstrap dosyasını çağırmaktadır.  
   - `backend/api/health.php` ise `backend/api/` altında tek seviyeli olduğundan doğrudan `require_once __DIR__ . '/../src/http.php';` ve `require_once __DIR__ . '/../src/Database.php';` çağırmaktadır.  
   - Dizin göreli yolları (%100) doğrudur.
2. **`bootstrap.php` Yükleme Zinciri:**  
   - `http.php` yüklenir (`require_once __DIR__ . '/http.php'`).  
   - `Database.php` yüklenir (`require_once __DIR__ . '/Database.php'`).  
   - `$config = require __DIR__ . '/../config/config.php';` çalıştırılır.  
   - Katı oturum parametreleri yapılandırılır ve `session_start()` çağrılır.  
   - `$pdo = Database::connection($config);` ile veri tabanı bağlantısı başlatılır.
3. **`config.php` Yerel Yapılandırma Mantığı:**  
   - `$localConfig = __DIR__ . '/config.local.php';` varlığı kontrol edilir.  
   - Dosya yoksa veya geçersizse anında `503 Service Unavailable` JSON hatası verilir ve yürütme `exit` ile kesilir.  
   - Staging dizininde `config.local.php` bulunmadığından, staging dosyaları kazara çalıştırılsa bile veritabanına sorgu atamadan 503 dönerek güvenli durma (fail-safe) durumundadır.
4. **`Database.php` Yapılandırma Anahtarları:**  
   - `$config['database']['host']` (varsayılan: `'127.0.0.1'`)  
   - `$config['database']['port']` (varsayılan: `3306`)  
   - `$config['database']['name']` (veri tabanı adı)  
   - `$config['database']['charset']` (varsayılan: `'utf8mb4'`)  
   - `$config['database']['username']`  
   - `$config['database']['password']`
5. **Yardımcı Fonksiyonlar ve Kapsam:**  
   - `backend/src/auth.php`: `current_user()`, `require_user()`, `require_role()`, `can_view_counseling_notes()`, `write_audit()`.  
   - `backend/src/http.php`: `json_response()`, `request_json()`, `require_method()`, `require_csrf()`.  
   - Tüm fonksiyonlar eksiksiz mevcuttur.
6. **Web Sunucusu `.htaccess` Kuralları:**  
   - `backend/api/.htaccess` içinde `Require all granted` tanımlıdır; API uç noktalarının erişimine engel bir kural yoktur.  
   - Hassas alt klasörlerde `Require all denied` ile doğrudan PHP kaynak okuması engellenmiştir.
7. **Çalışma Zamanı Dizin Bağımlılığı:**  
   - `bootstrap.php` doğrudan `session.save_path` ataması yapmamakta, PHP sistem varsayılanını (WAMP için `C:\wamp64\tmp`) kullanmaktadır. Bu nedenle staging altında özel bir `data/sessions` dizini bulunmaması oturum açılmasına engel teşkil etmez.

---

## 8. TEST VERİTABANI MİMARİSİ VE YAPILANDIRMA ANALİZİ (DENETİM E)

Aşama 4.3-C öncesinde canlı ve test veri tabanı ayrımı detaylı olarak incelenmiş ve 10 kritik soru yanıtlanmıştır:

### 10 Kritik Soru ve Yanıtları

1. **WAMP uygulaması hangi veritabanı adını kullanıyor?**  
   - **`odis`** (Canlı üretim veritabanı). WAMP kökündeki `backend/config/config.local.php` dosyasında `'name' => 'odis'` olarak tanımlıdır.
2. **Kaynak test yapılandırması hangi veritabanını kullanıyor?**  
   - **`odis_test`**. Kaynak projedeki `backend/config/config.test.php` dosyasında `'name' => 'odis_test'` olarak tanımlıdır.
3. **Web isteği sırasında test yapılandırması dinamik olarak seçilebiliyor mu?**  
   - **HAYIR**. `backend/config/config.php` dosyası sabit (hardcoded) bir şekilde `__DIR__ . '/config.local.php'` dosyasını yüklemektedir.
4. **HTTP isteğiyle (ör. header/query) canlı veritabanına geçiş mümkün mü?**  
   - **HAYIR**. Kodda harici girdiyle veritabanı seçimi yapılmamaktadır. Bu durum harici saldırganların ortam manipülasyonunu engellediği için olumlu bir güvenlik tasarımıdır.
5. **Test yapılandırması yalnızca CLI ortamında mı kullanılıyor?**  
   - **EVET**. `config.test.php` yalnızca CLI test komut dosyaları tarafından okunabilecek durumdadır; web API akışına dahil edilmemiştir.
6. **`config.local.php` yanlışlıkla değiştirilebilir veya üzerine yazılabilir mi?**  
   - **EVET (RİSK)**. Eğer canlı WAMP dizininde doğrudan test çalıştırılmak istenirse `config.local.php` dosyasının değiştirilmesi gerekebilir. Bu durum canlı ortamın kazara bozulmasına yol açabilir.
7. **Test ortamını canlı uygulamadan ayırmak için hangi dosyalar gereklidir?**  
   - Ayrı bir test dizini, bu dizine özel ve hedefi kesinlikle `'name' => 'odis_test'` olan bir `config.local.php` dosyası ve izole log/oturum alanları.
8. **Ayrı bir test uygulama dizini oluşturmak gerekiyor mu?**  
   - **KESİNLİKLE EVET**. Canlı WAMP dizini (`C:\wamp64\www\odis`) dinamik testler sırasında asla kullanılmamalıdır.
9. **Ayrı bir Apache VirtualHost veya localhost portu gerekli mi?**  
   - **EVET**. Test API isteklerinin canlı WAMP portundan (80) tamamen izole edilmesi için ayrı bir localhost portu (ör. `8088` veya `8080`) ya da Apache içinde `/odis-test` şeklinde izole bir alias tanımlanmalıdır.
10. **Test uygulaması yalnızca `odis_test` kullanacak şekilde nasıl sınırlandırılmalı?**  
    - Çift katmanlı savunma (Defense-in-Depth):  
      a) Test dizinindeki `config.local.php` dosyasında `'name' => 'odis_test'` statik olarak sabitlenir.  
      b) Test `bootstrap.php` içerisine güvenlik kilidi (Assertion Guard) eklenir: Eğer yapılandırmadaki veritabanı adı `'odis_test'` değilse betik derhal `die('CRITICAL: Non-test DB detected')` ile durdurulur.

---

## 9. CANLI VERİTABANINA ERİŞİM RİSK ANALİZİ

| Risk Senaryosu | Olasılık | Etki | Risk Seviyesi | Mevcut Durum ve Önlem |
| :--- | :---: | :---: | :---: | :--- |
| **WAMP Canlı Köküne Test İsteği Gönderme** | Yüksek | Kritik | **CRITICAL** | `http://localhost/odis/backend/api/...` adresine gönderilecek her istek canlı `odis` veritabanına gider! **Önlem:** Dinamik testler canlı köke ASLA yönlendirilmemelidir. |
| **`config.local.php` Üzerine Yanlışlıkla Yazma** | Orta | Yüksek | **HIGH** | Test veritabanına geçmek amacıyla WAMP canlı `config.local.php` dosyasının elle değiştirilmesi canlı sistemi riske atar. **Önlem:** WAMP canlı dizini dokunulmaz ilan edilmiştir. |
| **Staging Alanının Webden Canlıya Erişmesi** | Yok | Düşük | **INFO** | Staging'de `config.local.php` bulunmadığı için staging dosyaları çalıştırılsa dahi veritabanına bağlanamaz (503 döner). |
| **Test Verilerinin Canlı Tablolara Karışması** | Düşük | Kritik | **CRITICAL** | Test suite'in canlı veritabanında çalışması durumunda sahte öğrenci ve disiplin kayıtları oluşur. **Önlem:** Çift katmanlı DB Assertion Guard zorunlu tutulmalıdır. |

---

## 10. AŞAMA 4.3-C DİNAMİK GÜVENLİK TEST MATRİSİ (PLANLANAN 33 SENARYO)

*(Bu testler Aşama 4.3-C kapsamında çalıştırılmak üzere planlanmıştır; bu aşamada hiçbir test İSTEĞİ GÖNDERİLMEMİŞTİR.)*

### 10.1. Kimlik Doğrulama ve Oturum Testleri

| Test ID | Amaç | Yöntem & Endpoint | Beklenen HTTP | Beklenen Veri Sonucu | Güvenlik Kontrolü | Temizlik |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **AUTH-01** | Geçerli kimlik bilgileriyle giriş | `POST /api/auth/login.php` | `200 OK` | `status: ok`, Session Cookie (`ODISSESSID`) | `password_verify`, oturum başlatma | Oturum kapatma |
| **AUTH-02** | Hatalı parola ile giriş denemesi | `POST /api/auth/login.php` | `401 Unauthorized` | `error: Geçersiz kullanıcı adı veya şifre.` | Hatalı parola reddi, zaman sabiti | Gerekmez |
| **AUTH-03** | Aktif oturum doğrulaması | `GET /api/auth/me.php` | `200 OK` | Kullanıcı kimlik bilgileri, rol, okul ID | `require_user()`, oturum bütünlüğü | Gerekmez |
| **AUTH-04** | Güvenli oturum kapatma | `POST /api/auth/logout.php` | `200 OK` | `status: ok`, Cookie geçersiz kılma | `session_destroy()`, session sonlandırma | Gerekmez |
| **AUTH-05** | Eksik CSRF belirteci ile POST | `POST /api/students/create.php` | `403 Forbidden` | `error: CSRF token missing or invalid.` | `require_csrf()` denetimi | Gerekmez |
| **AUTH-06** | Hatalı CSRF belirteci ile POST | `POST /api/students/create.php` | `403 Forbidden` | `error: CSRF token missing or invalid.` | `hash_equals()` zaman sabiti kontrolü | Gerekmez |
| **AUTH-07** | Brute-force / Çoklu hatalı giriş | `POST /api/auth/login.php` (x10) | `429 Too Many Requests` veya `401` | Hata yanıtı veya oran sınırlama | Kimlik doğrulama yük kontrolü | IP/Kullanıcı sıfırlama |

### 10.2. Öğrenci İşlemleri ve IDOR Güvenlik Testleri

| Test ID | Amaç | Yöntem & Endpoint | Beklenen HTTP | Beklenen Veri Sonucu | Güvenlik Kontrolü | Temizlik |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **STUD-01** | Geçerli öğrenci oluşturma | `POST /api/students/create.php` | `201 Created` | `status: ok`, `student_id` | Okul izolasyonu, audit log kaydı | Soft/Hard delete |
| **STUD-02** | Kendi okulunun öğrencilerini listeleme | `GET /api/students/index.php` | `200 OK` | Yalnızca oturumdaki okulun öğrencileri | `WHERE school_id = :session_school` | Gerekmez |
| **STUD-03** | Öğrenci detayını görüntüleme | `GET /api/students/show.php?id=X` | `200 OK` | Öğrencinin profil ve akademik verileri | `school_id` eşleşme kontrolü | Gerekmez |
| **STUD-04** | Öğrenci bilgilerini güncelleme | `POST /api/students/update.php` | `200 OK` | `status: ok`, güncellenmiş öğrenci | Transaction + Audit atomikliği | Gerekmez |
| **STUD-05** | Öğrenciyi soft-delete ile pasife alma | `POST /api/students/delete.php` | `200 OK` | `status: ok`, `is_active: 0` | Soft-delete bayrağı, audit atomikliği | Gerekmez |
| **STUD-06** | **IDOR:** Başka okulun öğrencisini okuma | `GET /api/students/show.php?id=Y` | `404 Not Found` | `error: Öğrenci bulunamadı.` | Çapraz okul veri sızıntı engeli | Gerekmez |
| **STUD-07** | **IDOR:** Başka okulun öğrencisini güncelleme | `POST /api/students/update.php` | `404 Not Found` | `error: Öğrenci bulunamadı.` | Çapraz okul veri manipülasyon engeli | Gerekmez |
| **STUD-08** | **IDOR:** Başka okulun öğrencisini silme | `POST /api/students/delete.php` | `404 Not Found` | `error: Öğrenci bulunamadı.` | Çapraz okul yetkisiz silme engeli | Gerekmez |
| **STUD-09** | **İlişki İzolasyonu:** Başka okulun akademik yılıyla öğrenci ekleme | `POST /api/students/create.php` | `422 Unprocessable` | `error: Geçersiz veya yetkisiz akademik yıl.` | Akademik yıl okul aidiyet kontrolü | Gerekmez |
| **STUD-10** | **Parametre Manipülasyonu:** Payload'da sahte `school_id` gönderme | `POST /api/students/create.php` | `201 Created` | Öğrenci oturumdaki `school_id` ile oluşur | Client `school_id` yok sayma denetimi | Test verisini sil |

### 10.3. Rol Tabanlı Yetkilendirme (RBAC) Testleri

| Test ID | Amaç | Yöntem & Endpoint | Beklenen HTTP | Beklenen Veri Sonucu | Güvenlik Kontrolü | Temizlik |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **RBAC-01** | Admin yetkisiyle idari işlem oluşturma | `POST /api/admin-actions/create.php` | `201 Created` | `status: ok` | `require_role($user, ['admin'])` | Test kaydını sil |
| **RBAC-02** | Öğretmenin (Teacher) idari işlem denemesi | `POST /api/admin-actions/create.php` | `403 Forbidden` | `error: Bu işlem için yetkiniz yok.` | Rol sınırlandırma denetimi | Gerekmez |
| **RBAC-03** | Rehber öğretmenin (Counselor) idari işlem denemesi | `POST /api/admin-actions/create.php` | `403 Forbidden` | `error: Bu işlem için yetkiniz yok.` | Rol sınırlandırma denetimi | Gerekmez |
| **RBAC-04** | Yetkisiz / Oturumsuz doğrudan API erişimi | `GET /api/students/index.php` | `401 Unauthorized` | `error: Giriş yapmanız gerekiyor.` | `require_user()` oturum zorunluluğu | Gerekmez |

### 10.4. Rehberlik Gizliliği (Counseling Privacy / KVKK) Testleri

| Test ID | Amaç | Yöntem & Endpoint | Beklenen HTTP | Beklenen Veri Sonucu | Güvenlik Kontrolü | Temizlik |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **PRIV-01** | Rehber öğretmenin özel notları okuması | `GET /api/support-cases/index.php` | `200 OK` | `counselor_notes` alanı dolu döner | `can_view_counseling_notes() === true` | Gerekmez |
| **PRIV-02** | **İdarecinin (Admin) özel not erişim engeli** | `GET /api/support-cases/index.php` | `200 OK` | `counselor_notes` alanı maskelenir (`null`) | `can_view_counseling_notes() === false` | Gerekmez |
| **PRIV-03** | **Öğretmenin (Teacher) özel not erişim engeli** | `GET /api/support-cases/index.php` | `200 OK` | `counselor_notes` alanı maskelenir (`null`) | Rol bazlı gizlilik filtresi | Gerekmez |
| **PRIV-04** | **Audit Log Gizlilik Sızıntı Denetimi** | `GET /api/audit/index.php` | `200 OK` | Audit loglarında özel rehberlik notu bulunmaz | Hassas veri audit maskeleme | Gerekmez |

### 10.5. Diğer Modül ve Bütünlük Testleri

| Test ID | Amaç | Yöntem & Endpoint | Beklenen HTTP | Beklenen Veri Sonucu | Güvenlik Kontrolü | Temizlik |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **MOD-01** | Disiplin kaydı oluşturma ve listeleme | `POST /api/records/create.php` | `201 Created` | Disiplin kaydı oluşur | Okul izolasyonu, audit log | Test kaydı iptal |
| **MOD-02** | Gözlem kaydı oluşturma | `POST /api/observations/create.php` | `201 Created` | Gözlem kaydı oluşur | `teacher`/`counselor` rol izni | Test kaydı |
| **MOD-03** | Destek vakası oluşturma | `POST /api/support-cases/create.php` | `201 Created` | Destek vakası oluşur | Okul ve öğrenci eşleşmesi | Test vakası |
| **MOD-04** | Akademik yıl listeleme | `GET /api/academic-years/index.php` | `200 OK` | Yalnızca oturum okulunun yılları | Okul bazlı veri filtreleme | Gerekmez |
| **MOD-05** | Okul listesi görüntüleme | `GET /api/schools/index.php` | `200 OK` | Yalnızca izinli okul bilgisi | Multi-tenant sınır kontrolü | Gerekmez |
| **MOD-06** | Dinamik raporlama API'si | `GET /api/reports/index.php` | `200 OK` | SQL syntax hatası vermeden istatistik | ANSI_QUOTES uyumluluğu, parametreli SQL | Gerekmez |
| **MOD-07** | Sistem sağlık kontrolü (Health Check) | `GET /api/health.php` | `200 OK` | `status: ok`, `database: connected` | DB bağlantı testi | Gerekmez |
| **MOD-08** | Audit log listeleme | `GET /api/audit/index.php` | `200 OK` | Okul içi sistem hareketleri | Yalnızca `admin` rol erişimi | Gerekmez |

---

## 11. KAYNAK VE WAMP GIT DURUMU (DENETİM G)

Her iki Git deposunun çalışma ağaçları salt okunur olarak incelenmiştir:

### 1. Kaynak Git Deposu (`odis-analysis`)
- **Dizin:** `C:\Users\Kose\.gemini\antigravity-ide\scratch\odis\odis-analysis`
- **Dal (Branch):** `feature/phase2-security-and-schema`
- **HEAD Commit:** `8bc954d75def57bf818e7ca6b1872245b8b11fda`
- **Modified (Değiştirilmiş) Dosyalar (16 adet):**  
  `backend/.htaccess`, `backend/README.md`, `backend/api/auth/login.php`, `backend/api/health.php`, `backend/config/config.example.php`, `backend/config/config.php`, `backend/database/schema.sql`, `backend/scripts/create_user.php`, `backend/src/auth.php`, `backend/src/bootstrap.php`, `js/app.js`, `js/auth.js`, `js/records.js`, `js/teacher.view.js`, `test-odis-pdf-spec.mjs`, `verify-pwa.mjs`.
- **Untracked (Takip Edilmeyen) Dosyalar:**  
  Aşama denetim raporları (`ODIS_Asama*.md`), yeni backend modülleri (`academic-years/`, `admin-actions/`, `audit/`, `observations/`, `records/`, `reports/`, `schools/`, `students/`, `support-cases/`), `config.test.php` ve scriptler.
- **Staged (Commit'e Hazır) Dosyalar:** 0

### 2. WAMP Git Deposu (`C:\wamp64\www\odis`)
- **Dizin:** `C:\wamp64\www\odis`
- **Dal (Branch):** `main`
- **HEAD Commit:** `d87f49677952778458b7248a52cd917c554c45c4`
- **Modified Dosyalar (13 adet):** CSS ve frontend scriptleri (`css/*.css`, `js/*.js`, `index.html`, `sw.js`).
- **Untracked Dosyalar:** `admin.php`, `backend/`, `config/`, `data/`, legacy PHP dosyaları.
- **Staged Dosyalar:** 0

### 3. Staging ve Yedekleme Klasörlerinin Git Durumu
- `C:\wamp64\staging` ve `C:\wamp64\backups` klasörleri her iki Git deposunun çalışma ağacının tamamen dışındadır.
- Git depolarına yanlışlıkla dahil edilme veya commit edilme riski **kesinlikle bulunmamaktadır** (`PASS`).

---

## 12. BULGU LİSTESİ

| Bulgu No | Seviye | Durum | Açıklama | Kanıt / Dosya |
| :---: | :---: | :---: | :--- | :--- |
| **BLG-01** | **INFO** | **PASS** | WAMP yedek bütünlüğü 187 dosyada %100 eşleşti. | `C:\wamp64\backups\odis_backup_phase4_3_20261114_160338` |
| **BLG-02** | **INFO** | **PASS** | Staging 36 backend dosyasının SHA-256 değerleri kaynakla birebir uyuşmaktadır. | `C:\wamp64\staging\odis_backend_phase4_3` |
| **BLG-03** | **INFO** | **PASS** | Staging alanı web üzerinden tamamen izoledir. | Apache `httpd.conf`, `DocumentRoot`, 0 VirtualHost/Alias |
| **BLG-04** | **CRITICAL** | **FAIL** | WAMP canlı dizinindeki `config.local.php` canlı `odis` veritabanını işaret etmektedir. Canlı dizine atılacak test istekleri canlı veriyi bozar. | `C:\wamp64\www\odis\backend\config\config.local.php` (Satır 5: `'name' => 'odis'`) |
| **BLG-05** | **MEDIUM** | **PASS** | Staging alanında `config.local.php` bulunmamakta, kazara çağrılsa bile 503 dönerek canlı veriye erişimi engellemektedir. | `backend/config/config.php` (Satır 6-12) |
| **BLG-06** | **HIGH** | **NOT VERIFIED** | Dinamik testler için henüz izole bir `odis_test` web endpoint'i / portu yapılandırılmamıştır. | Apache port 80 canlıya yöneliktir. |

---

## 13. DÜZELTME VE MİMARİ ÖNERİLERİ

1. **Ayrı Test Web Kökü / VirtualHost Oluşturulması:**  
   WAMP Apache yapılandırmasına test amaçlı ayrı bir port (ör. `8088`) veya izole bir dizin alias'ı tanımlanmalıdır. Bu alan doğrudan `C:\wamp64\staging\odis_backend_phase4_3` (veya `C:\wamp64\test-odis`) dizinini hedeflemelidir.
2. **Sabit ve Değiştirilemez Test Konfigürasyonu:**  
   Test çalışma alanında oluşturulacak `config.local.php` dosyası kesinlikle statik olarak `'name' => 'odis_test'` değerine kilitlenmelidir.
3. **Çift Katmanlı Koruma (DB Assertion Guard):**  
   Test amaçlı kullanılacak `bootstrap.php` içerisine şu kontrol eklenmelidir:
   ```php
   if ($config['database']['name'] !== 'odis_test') {
       http_response_code(500);
       die(json_encode(['error' => 'CRITICAL SECURITY BREACH: Test suite attempted to run against non-test database!']));
   }
   ```
4. **WAMP Canlı Kökünün Dokunulmazlığı:**  
   `C:\wamp64\www\odis` dizini dinamik API testleri süresince salt okunur kabul edilmeli ve test scriptleri bu köke hiçbir HTTP isteği atmamalıdır.

---

## 14. AŞAMA 4.3-C İÇİN GEREKLİ ÖN KOŞULLAR

Aşama 4.3-C Dinamik API Testlerine geçilmeden önce aşağıdaki adımların tamamlanması zorunludur:

1. [ ] **Kullanıcı Açık Onayı:** Test ortamının hazırlanması ve `odis_test` veritabanı kurulumu için kullanıcının açık talimatı.
2. [ ] **Test Veritabanı Hazırlığı:** `odis_test` veritabanının MySQL 8.4 üzerinde oluşturulması ve `backend/database/schema.sql` şemasının bu veritabanına uygulanması.
3. [ ] **Test Tohumlama (Seed):** Test senaryoları (farklı okullar, admin/teacher/counselor personelleri) için demo verilerin yalnızca `odis_test` içerisine eklenmesi.
4. [ ] **İzole Test Endpoint'inin Ayarlanması:** Staging veya test dizini için `odis_test` hedefli `config.local.php` dosyasının oluşturulması ve test web sunucusu/portunun hazırlanması.
5. [ ] **Assertion Guard Devreye Alınması:** Test ortamında `odis` canlı veritabanına erişim denemelerini anında bloke eden emniyet kilidinin aktif edilmesi.

---

## 15. NİHAİ KARAR

Aşama 4.3-B yedekleme ve staging süreci ile Aşama 4.3-C öncesi güvenlik mimarisi denetim sonuçlarına göre:

### **`APPROVED FOR TEST ENVIRONMENT PREPARATION`**

**Gerekçe:**
- WAMP tam yedeği (187 dosya, 3.442.968 bayt) bit-düzeyinde %100 doğrulanmış ve güvenle arşivlenmiştir.
- Staging alanındaki 36 backend dosyası kaynak kodla birebir uyuşmaktadır.
- Staging alanı webden tamamen izoledir.
- Canlı `odis` veritabanına erişim riski tam olarak haritalandırılmış ve test ortamının canlı WAMP kökünden ayrı, yalnızca `odis_test` hedefleyen izole bir mimaride çalıştırılması gerektiği kanıtlanmıştır.

**Önemli Hatırlatma:**  
Bu aşama ile birlikte salt okunur güvenlik denetimi tamamlanmıştır. Herhangi bir dosya değişikliği, yapılandırma düzenlemesi, test veritabanı bağlantısı veya HTTP/API testi yapılmamıştır. Sonraki aşama için kullanıcının açık onayı beklenmektedir.
