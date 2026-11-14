# ODİS — AŞAMA 4.2-C: BAĞIMSIZ KOD GÜVENLİĞİ VE ŞEMA UYUMLULUĞU DENETİM RAPORU

**Rapor Tarihi:** 14 Kasım 2026  
**Denetlenen Proje:** ODİS (Okul Disiplin ve İzleme Sistemi)  
**Çalışma Dizini:** `C:\Users\Kose\.gemini\antigravity-ide\scratch\odis\odis-analysis`  
**WAMP Dizini:** `C:\wamp64\www\odis`  
**Git Dalı:** `feature/phase2-security-and-schema`  
**HEAD Commit:** `8bc954d75def57bf818e7ca6b1872245b8b11fda`  
**Teknoloji Yığını:** PHP 8.3.28 | MySQL 8.4.7 | Apache 2.4 (WampServer) | PDO  
**Denetim Kapsamı:** Salt okunur statik kod analizi, şema çapraz doğrulaması, IDOR & tenant izolasyonu denetimi, RBAC & CSRF doğrulaması  

---

## 1. Yönetici Özeti

Bu bağımsız denetim, Aşama 4.2-B kapsamında geliştirilen yeni API uç noktalarını (`students/update.php`, `students/delete.php`) ve güvenlik düzeltmelerini (`reports/index.php`, `health.php`) kaynak kod, veritabanı şeması (`schema.sql`) ve çekirdek güvenlik bileşenleri (`auth.php`, `http.php`, `bootstrap.php`) nezdinde sıfır güven (*zero-trust*) ilkesiyle incelemiştir. Önceki raporda belirtilen hiçbir **PASS** kararı peşinen doğru kabul edilmemiş, her bir işlev statik sözdizimi ve semantik mantık denetimine tabi tutulmuştur.

### Özet Değerlendirme ve Temel Bulgular:
1. **Önceki PASS Kararlarının Teyidi:**
   - `students/update.php` ve `students/delete.php` dosyalarında HTTP metot denetimi (`require_method('POST')`), CSRF zaman-sabit doğrulaması (`require_csrf()`), oturum kontrolü (`require_user()`) ve rol yetkilendirmesi (`require_role($user, ['admin'])`) eksiksiz uygulanmıştır.
   - İstemciden gelen `school_id` / `schoolId` parametreleri her iki uç noktada da tamamen yok sayılmakta; tüm sorgular oturumdaki `$user['schoolId']` ile yalıtılmaktadır.
   - Öğrenci silme işlemi fiziksel bir `DELETE` yapmamakta, `active = 0` mantıksal silme (*soft-delete*) uygulamaktadır. İlişkili gözlem, disiplin ve rehberlik kayıtları veri bütünlüğünü korumaktadır.
   - `health.php` dosyasındaki include yolları düzeltilmiş ve sözdizimi hatası kalmamıştır.

2. **Bağımsız Denetimde Tespit Edilen Yeni Bulgular ve Güvenlik Açıkları:**
   - **[YÜKSEK / HIGH] `academic_year_id` Okul Aidiyeti Denetimi Eksikliği (`students/update.php` & `students/create.php`):**  
     Öğrenci güncelleme veya oluşturma sırasında istemciden gelen `academicYearId` değerinin veritabanında varlığı MySQL Foreign Key (`fk_student_year`) ile kontrol edilmekte, ancak bu akademik yılın **oturum açan yöneticinin okuluna (`school_id`) ait olup olmadığı doğrulanmamaktadır**. Kötü niyetli bir yönetici, başka bir okulun `academic_year_id` değerini göndererek öğrencisini yabancı bir okulun takvim yılına bağlayabilmektedir.
   - **[ORTA / MEDIUM] SQL `ANSI_QUOTES` ve Çift Tırnak Dize Sabiti Riski (`reports/index.php`):**  
     `reports/index.php` içindeki SQL sorgularında dize sabitleri çift tırnak içine alınmıştır (`status = "active"`, `status != "closed"`). MySQL 8.4'te `ANSI_QUOTES` SQL modu aktif olduğunda çift tırnaklı dizgiler sütun/tablo tanımlayıcısı olarak yorumlanır ve `Unknown column 'active' in 'where clause'` hatasıyla sorgunun çökmesine yol açar. Standart tek tırnak (`'active'`, `'closed'`) kullanılmalıdır.
   - **[DÜŞÜK / LOW] Atomik Olmayan Veritabanı İşlemleri (Eksik Transaction):**  
     `update.php` ve `delete.php` uç noktalarında öğrenci güncelleme/pasifleştirme sorgusu ile denetim kütüğü kaydı (`write_audit()`) arasında veritabanı transaction (`beginTransaction` / `commit`) kullanılmamıştır. Denetim kaydı sırasında bir hata oluşursa veri güncellenmiş ancak kütük kaydı kaybolmuş olacaktır.
   - **[BİLGİ / INFO] `adminResultNote` Veri Saklama Uyumsuzluğu (`support-cases/update.php`):**  
     Destek vakası güncellenirken gönderilen `adminResultNote` alanı `support_cases` tablosunda karşılık gelen bir sütun bulunmadığı için yalnızca denetim kütüğüne (`audit_logs`) yazılmakta, vaka detayında kalıcı olarak saklanamamaktadır.

**Nihai Denetim Kararı:** **KOŞULLU ONAY (CONDITIONAL PASS)**  
Kod tabanı güvenlik standartlarını büyük ölçüde karşılamaktadır; ancak Aşama 4.3 dinamik testlerine ve canlı ortama geçilmeden önce `academic_year_id` okul aidiyeti denetimi ile `reports/index.php` çift tırnak kullanımı düzeltilmelidir.

---

## 2. İncelenen Dosyalar ve Git Durumu

Denetim, `C:\Users\Kose\.gemini\antigravity-ide\scratch\odis\odis-analysis` dizini altındaki 11 kritik dosya üzerinde yürütülmüştür.

- **Yerel Git Durumu:** `feature/phase2-security-and-schema` dalı, temel commit `8bc954d75def57bf818e7ca6b1872245b8b11fda`.
- **Çalışma Ağacı (Working Tree):** Aşama 4.2-B kapsamında eklenen yeni dosyalar untracked (`?? backend/api/students/update.php`, `?? backend/api/students/delete.php`) durumundadır. `reports/index.php` ve `health.php` dosyalarındaki düzeltmeler çalışma kopyasında mevcuttur.
- **WAMP Durumu:** WAMP çalışma dizini (`C:\wamp64\www\odis`) bu denetimde kesinlikle değiştirilmemiş, senkronizasyon yapılmamıştır.

---

## 3. Dosya Doğrulama Tablosu

Tüm dosyaların bütünlüğü Windows PowerShell `Get-FileHash` (SHA-256) algoritması ile doğrulanmıştır:

| No | Dosya Yolu | Boyut (Bayt) | SHA-256 Özeti | Denetim Durumu |
|:--:|:---|:---:|:---|:---:|
| 1 | `backend/api/reports/index.php` | 3,401 | `897502ED8D99220DEB854235E972963A70CC580AD1A23803CCE424AE1ADBEB8C` | DÜZELTME GEREKİYOR (ANSI_QUOTES) |
| 2 | `backend/api/health.php` | 620 | `B845273CF4EA08E1987ECA26F65A014C738095877286B865AE4096AFC7401E58` | GEÇTİ (PASS) |
| 3 | `backend/api/students/update.php` | 5,074 | `113FAD3D07CED20429131B38A038E90F3FF220548173468EF1E69D8284340099` | DÜZELTME GEREKİYOR (academic_year_id) |
| 4 | `backend/api/students/delete.php` | 2,139 | `DC0E647DA600B2A2F408016E1A720F6007E4C612F160CC598FFF7A4852EBB758` | GEÇTİ (PASS) |
| 5 | `backend/api/students/create.php` | 2,983 | `3906001C7D4BF30C082B2393CDB9D485227E70428B42B1E063E1907ECE6FF97C` | DÜZELTME GEREKİYOR (academic_year_id) |
| 6 | `backend/api/students/index.php` | 1,505 | `FF13BD00809600470840BC6E587F47F607BE2FADA2EB9F373414F2BA44913947` | GEÇTİ (PASS) |
| 7 | `backend/api/students/show.php` | 3,681 | `FA4C46DEDAB5CA37F6E359F06D998DBE7E83EF79E48B18FA522414E6EE88C14F` | GEÇTİ (PASS) |
| 8 | `backend/src/auth.php` | 3,000 | `163529C75E535F826F986EA093F030243D86937A4DCC1BE14772BE2F75ABAD9F` | GEÇTİ (PASS) |
| 9 | `backend/src/http.php` | 1,139 | `F7D6CC502DE1B632DFD85DE2FF86688079EF74A88570DDB44A21B6176A7603CA` | GEÇTİ (PASS) |
| 10 | `backend/src/bootstrap.php` | 1,981 | `EC9BA8F1E64CB2762958BB0CD9199EBC06532A4419B10BD32B5CD37F3C4265D2` | GEÇTİ (PASS) |
| 11 | `backend/database/schema.sql` | 19,458 | `5F6FD7D72982F47DBF4B661572F7A03AFC464EF100E6406014F7EFB784317AA8` | GEÇTİ (PASS) |

---

## 4. Öğrenci Güncelleme API'si (`students/update.php`) Güvenlik Denetimi

`backend/api/students/update.php` dosyasının satır satır statik kod analizi yapılmıştır:

### 4.1 İstek Yöntemi, Kimlik Doğrulama ve CSRF Kontrolü
- **Satır 7 (`require_method('POST')`):** GET, PUT, DELETE istekleri HTTP 405 Method Not Allowed ile reddedilir. `Allow: POST` başlığı eklenir. `[PASS]`
- **Satır 8 (`require_csrf()`):** `HTTP_X_CSRF_TOKEN` başlığı oturumdaki `csrf_token` ile `hash_equals()` fonksiyonu kullanılarak zaman-sabit (*timing-attack safe*) karşılaştırılır. Eşleşmezse HTTP 419 döner. `[PASS]`
- **Satır 10 (`require_user($pdo)`):** Oturumda aktif kullanıcı yoksa veya kullanıcı veritabanında pasif/silinmiş durumdaysa HTTP 401 Unauthorized döner. `[PASS]`
- **Satır 11 (`require_role($user, ['admin'])`):** Sadece `admin` rolü kabul edilir. `teacher` ve `counselor` rolleri HTTP 403 Forbidden alır. `[PASS]`

### 4.2 Okul İzolasyonu (Tenant Isolation) ve IDOR Koruması
- **Satır 27-31:**
  ```php
  $existingStmt = $pdo->prepare(
      'SELECT * FROM students WHERE id = :id AND school_id = :school_id LIMIT 1'
  );
  $existingStmt->execute(['id' => $studentId, 'school_id' => $user['schoolId']]);
  $existing = $existingStmt->fetch();
  ```
  Öğrencinin varlığı doğrudan oturumdan gelen `$user['schoolId']` ile kısıtlanmıştır. Başka bir okulun öğrenci ID'si gönderildiğinde kayıt bulunamaz ve Satır 33'te HTTP 404 (`Öğrenci bulunamadı.`) döner. Bilgi sızıntısı (*information disclosure*) engellenmiştir. `[PASS]`
- **Satır 88-103 (`UPDATE` Sorgusu):**
  İstemciden gönderilebilecek sahte `school_id` veya `schoolId` parametreleri giriş dizisinden asla okunmamakta ve `UPDATE` sorgusunda yer almamaktadır.
  Sorgu koşulu: `WHERE id = :id AND school_id = :school_id` şeklindedir ve `:school_id` parametresine kesin olarak `$user['schoolId']` atanmaktadır. `[PASS]`

### 4.3 `academic_year_id` Okul Aidiyeti Denetimi (GÜVENLİK AÇIĞI)
- **Satır 43:**
  ```php
  $academicYearId = trim((string) ($input['academicYearId'] ?? $existing['academic_year_id']));
  ```
  **Bulgu:** `$academicYearId` istemciden alındıktan sonra yalnızca `schema.sql`'deki Foreign Key (`fk_student_year`) tarafından `academic_years.id` tablosunda mevcut olup olmadığı MySQL seviyesinde denetlenir. **Ancak seçilen akademik yılın bu okula (`school_id`) ait olup olmadığı kontrol edilmemektedir!**
- **Etki:** Okul A'nın yöneticisi, Okul B'nin `academic_year_id` değerini göndererek öğrencisini başka bir okulun akademik yılına bağlayabilir. Bu durum çapraz okul veri kirliliğine ve raporlama tutarsızlıklarına neden olur.
- **Derece:** `HIGH`
- **Önerilen Düzeltme:**
  ```php
  $ayCheck = $pdo->prepare(
      'SELECT id FROM academic_years WHERE id = :id AND school_id = :school_id LIMIT 1'
  );
  $ayCheck->execute(['id' => $academicYearId, 'school_id' => $user['schoolId']]);
  if (!$ayCheck->fetch()) {
      json_response(['error' => 'Belirtilen akademik yıl bu okula ait değil veya geçersiz.'], 422);
  }
  ```

### 4.4 Öğrenci Numarası Mükerrerlik ve Benzersizlik Kontrolü
- **Satır 76-86:**
  ```php
  $dupStmt = $pdo->prepare(
      'SELECT id FROM students
       WHERE school_id = :school_id
         AND academic_year_id = :ay_id
         AND student_no = :no
         AND id != :id
       LIMIT 1'
  );
  $dupStmt->execute([
      'school_id' => $user['schoolId'],
      'ay_id'     => $academicYearId,
      'no'        => $studentNo,
      'id'        => $studentId,
  ]);
  if ($dupStmt->fetch()) {
      json_response(['error' => 'Bu öğrenci numarası belirtilen akademik yılda zaten kayıtlı.'], 409);
  }
  ```
  `schema.sql` içerisindeki `UNIQUE KEY uq_student_school_year_no (school_id, academic_year_id, student_no)` kısıtı ile birebir uyumludur. Aynı öğrencinin kendi numarası `id != :id` ile hariç tutulmuş, başka okulda aynı numaranın kullanılabilmesine izin verilmiş, HTTP 409 Conflict doğru döndürülmüştür. `[PASS]`

### 4.5 Veri Doğrulama ve Tipler
- `studentNo`, `firstName`, `lastName`, `className`: Boşluk kontrolü ve maksimum karakter sınırları (`mb_strlen` ile 32 ve 64 karakter) denetlenmektedir. `[PASS]`
- `gender`: `['KIZ', 'ERKEK', 'DIGER']` enum kümesi dışında gelenler HTTP 422 ile reddedilir. `[PASS]`
- `birthDate`: `DateTimeImmutable::createFromFormat('Y-m-d', ...)` ile takvim geçerliliği kontrol edilir. `[PASS]`

### 4.6 İşlem Güvenliği ve Audit Kaydı
- `UPDATE` sorgusu sonrası `write_audit($pdo, $user, 'UPDATE_STUDENT', ...)` çağrılarak denetim günlüğü yazılmaktadır.
- Ancak `$pdo->beginTransaction()` ve `$pdo->commit()` bulunmamaktadır. Audit log yazımı başarısız olursa öğrenci güncellenmiş ancak kütük kaydı oluşmamış kalabilir (`[LOW]`).

---

## 5. Öğrenci Silme / Pasifleştirme API'si (`students/delete.php`) Güvenlik Denetimi

### 5.1 İstek Yöntemi, Rol ve CSRF
- **Satır 7-11:** `require_method('POST')`, `require_csrf()`, `require_user($pdo)`, `require_role($user, ['admin'])` kontrolleri eksiksizdir. `[PASS]`

### 5.2 Okul İzolasyonu ve IDOR
- **Satır 24-28:**
  ```php
  $check = $pdo->prepare(
      'SELECT id, school_id, student_no, first_name, last_name, active
       FROM students
       WHERE id = :id AND school_id = :school_id
       LIMIT 1'
  );
  $check->execute(['id' => $studentId, 'school_id' => $user['schoolId']]);
  ```
  Başka okula ait öğrenci ID'si ile yapılan istekler HTTP 404 döner. İstemciden gelen hiçbir okul parametresi sorguya dahil edilmez. `[PASS]`

### 5.3 Soft-Delete ve Veri Bütünlüğü
- **Satır 50-53:**
  ```php
  $update = $pdo->prepare(
      'UPDATE students
       SET active = 0
       WHERE id = :id AND school_id = :school_id'
  );
  ```
  Fiziksel `DELETE FROM students` sorgusu kodda **kesinlikle bulunmamaktadır**. Öğrenci pasifize edilmektedir (`active = 0`). `[PASS]`
- **İlişkili Tablo Bütünlüğü:**
  Öğrenci fiziksel olarak silinmediği için:
  - `order_records` (Disiplin kayıtları)
  - `observations` (Öğretmen gözlemleri)
  - `support_cases` (Rehberlik süreçleri)
  - `counseling_session_notes` (Klinik görüşme notları)
  - `admin_actions` (İdari işlemler)
  tablolarındaki yabancı anahtar (*foreign key*) ilişkileri bozulmaz, veri kaybı veya öksüz (*orphaned*) kayıt oluşmaz. `[PASS]`

### 5.4 İdempotent Davranış
- **Satır 37-46:**
  Öğrenci zaten `active == 0` ise endpoint hata vermez veya mükerrer işlem yapmaz:
  ```php
  if ((int) $student['active'] === 0) {
      json_response([
          'success' => true,
          'message' => 'Öğrenci zaten pasif durumda.',
          'student' => [...],
      ], 200);
  }
  ```
  İdempotent çalışma mantığı HTTP 200 ile kusursuz sağlanmıştır. `[PASS]`

---

## 6. Şema Uyumluluğu Denetimi (`schema.sql` vs API Kodları)

`backend/database/schema.sql` dosyasındaki `students` tablosu tanımı:
```sql
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(36) NOT NULL,
  school_id VARCHAR(36) NOT NULL,
  academic_year_id VARCHAR(36) NOT NULL,
  student_no VARCHAR(32) NOT NULL,
  first_name VARCHAR(64) NOT NULL,
  last_name VARCHAR(64) NOT NULL,
  class_name VARCHAR(32) NOT NULL,
  gender ENUM('KIZ', 'ERKEK', 'DIGER') DEFAULT 'DIGER',
  birth_date DATE NULL,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_student_school_year_no (school_id, academic_year_id, student_no),
  KEY idx_student_school_class (school_id, class_name),
  KEY idx_student_active (school_id, active),
  CONSTRAINT fk_student_school FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  CONSTRAINT fk_student_year FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Şema Karşılaştırma Matrisi:
| Alan / Kısıt | `schema.sql` Tanımı | `update.php` Uyumu | `delete.php` Uyumu | `create.php` Uyumu | Durum |
|:---|:---|:---|:---|:---|:---:|
| `id` | VARCHAR(36) NOT NULL | trim(string) doğrulaması | trim(string) doğrulaması | UUIDv4 üretim | UYUMLU |
| `school_id` | VARCHAR(36) NOT NULL | `$user['schoolId']` | `$user['schoolId']` | `$user['schoolId']` | UYUMLU |
| `academic_year_id`| VARCHAR(36) NOT NULL | İsteğe bağlı / mevcut | Etkilenmez | İstek veya aktif yıl | **OKUL DENETİMİ EKSİK** |
| `student_no` | VARCHAR(32) NOT NULL | mb_strlen <= 32 | Etkilenmez | mb_strlen <= 32 | UYUMLU |
| `first_name` | VARCHAR(64) NOT NULL | mb_strlen <= 64 | Etkilenmez | mb_strlen <= 64 | UYUMLU |
| `last_name` | VARCHAR(64) NOT NULL | mb_strlen <= 64 | Etkilenmez | mb_strlen <= 64 | UYUMLU |
| `class_name` | VARCHAR(32) NOT NULL | mb_strlen <= 32 | Etkilenmez | mb_strlen <= 32 | UYUMLU |
| `gender` | ENUM('KIZ','ERKEK','DIGER') | in_array kontrolü | Etkilenmez | in_array kontrolü | UYUMLU |
| `birth_date` | DATE NULL | Y-m-d format veya null | Etkilenmez | Y-m-d format veya null | UYUMLU |
| `active` | TINYINT(1) DEFAULT 1 | Değiştirilmez (korunur)| `SET active = 0` | `1` atanır | UYUMLU |
| `uq_student...` | UNIQUE(school,year,no)| SQL ile kontrol ediliyor | Etkilenmez | SQL ile kontrol ediliyor| UYUMLU |

---

## 7. SQL Güvenliği ve `reports/index.php` Denetimi

`backend/api/reports/index.php` dosyasında Aşama 4.2-B kapsamında yapılan parametreli sorgu dönüşümü incelenmiştir:

1. **Parametreli Sorgular ve SQL Injection Engeli:**
   Önceki sürümdeki dinamik dize birleştirme (`"WHERE school_id = '{$schoolId}'"`) kaldırılmış; tüm filtreler (`startDate`, `endDate`, `academicYearId`, `schoolId`) PDO adlandırılmış parametreleri (`:school_id`, `:start_date`, `:end_date`, vb.) ile bağlanmıştır. SQL Injection açığı tamamen kapatılmıştır. `[PASS]`
2. **`ANSI_QUOTES` ve Çift Tırnak Riski (BULGU):**
   - Satır 18: `AND r.status = "active"`
   - Satır 34: `WHERE r.school_id = :school_id AND r.status = "active"`
   - Satır 61: `WHERE r.school_id = :school_id AND r.status = "active"`
   - Satır 74: `WHERE o.school_id = :school_id AND o.status = "active"`
   - Satır 78: `WHERE sc.school_id = :school_id AND sc.status != "closed"`
   
   **Teknik Analiz:**  
   MySQL 8.4'te `sql_mode` içinde `ANSI_QUOTES` aktifse veya gelecekte PostgreSQL / SQLite uyumluluğu düşünülürse, çift tırnak (`"active"`) bir dize literali değil, bir **sütun adı** olarak derlenir. Veritabanında `active` adında bir sütun bulunamadığında sorgu `1054 Unknown column 'active' in 'where clause'` hatasıyla çökecektir.
   - **Derece:** `MEDIUM`
   - **Öneri:** Çift tırnaklar tek tırnağa dönüştürülmelidir (`r.status = 'active'`, `sc.status != 'closed'`).

---

## 8. Okul İzolasyonu (Tenant Isolation) Saldırı Matrisi

Statik kod analizi ile simüle edilen 10 yetkisiz erişim ve okul aşma saldırı senaryosu:

| No | Saldırı Senaryosu | Test Edilen Endpoint | Beklenen / Elde Edilen Davranış | Sonuç |
|:--:|:---|:---|:---|:---:|
| 1 | Okul A yöneticisinin Okul B'ye ait öğrenci ID'sini güncellemeye çalışması | `students/update.php` | `SELECT ... WHERE id = :id AND school_id = :school_id` sorgusu boş döner, HTTP 404 döner. Veri güncellenmez. | **BAŞARILI (ENGEL)** |
| 2 | Okul A yöneticisinin Okul B'ye ait öğrenci ID'sini silmeye / pasifleştirmeye çalışması | `students/delete.php` | `SELECT ... WHERE id = :id AND school_id = :school_id` boş döner, HTTP 404 döner. Veri silinmez. | **BAŞARILI (ENGEL)** |
| 3 | İstek gövdesinde (JSON) sahte `school_id: "okul-b"` gönderilmesi | `students/update.php` | `$input['school_id']` hiçbir yerde okunmaz. UPDATE sorgusu sadece oturumdaki `$user['schoolId']`'yi bağlar. | **BAŞARILI (ENGEL)** |
| 4 | URL sorgu parametresinde `?school_id=okul-b` gönderilmesi | `students/update.php` & `delete.php` | `$_GET` parametreleri yok sayılır. Yalnızca oturum nesnesi (`$_SESSION['user']['school_id']`) esas alınır. | **BAŞARILI (ENGEL)** |
| 5 | `teacher` (Öğretmen) rolü ile öğrenci güncelleme / silme denemesi | `students/update.php` & `delete.php` | `require_role($user, ['admin'])` devrededir, HTTP 403 Forbidden döner. | **BAŞARILI (ENGEL)** |
| 6 | `counselor` (Rehberlik) rolü ile öğrenci güncelleme / silme denemesi | `students/update.php` & `delete.php` | `require_role($user, ['admin'])` devrededir, HTTP 403 Forbidden döner. | **BAŞARILI (ENGEL)** |
| 7 | Oturum açmamış anonim kullanıcı ile güncelleme / silme denemesi | `students/update.php` & `delete.php` | `require_user($pdo)` devrededir, HTTP 401 Unauthorized döner. | **BAŞARILI (ENGEL)** |
| 8 | Geçersiz veya eksik CSRF belirteci ile POST isteği gönderme | `students/update.php` & `delete.php` | `require_csrf()` devrededir, `hash_equals` eşleşmez ve HTTP 419 Authentication Timeout döner. | **BAŞARILI (ENGEL)** |
| 9 | Okul A yöneticisinin Okul B'ye ait `academic_year_id` ile öğrenci güncellemesi | `students/update.php` | **AÇIK:** Kodda akademik yılın okula aidiyet kontrolü yoktur. Yabancı akademik yıl veritabanına yazılır. | **BAŞARISIZ (AÇIK TESPİT EDİLDİ)** |
| 10 | Okul B'de var olan bir öğrenci numarasını Okul A'da güncelleme | `students/update.php` | `WHERE school_id = :school_id ...` kontrolü nedeniyle Okul B'deki numara çakışma yaratmaz, güncelleme başarılı olur. | **BAŞARILI (İZOLASYON DOĞRU)** |

---

## 9. Rol Tabanlı Yetkilendirme (RBAC) ve CSRF Koruması

### 9.1 Rol Yetkilendirme Mantığı (`backend/src/auth.php`)
```php
function require_role(array $user, array $allowedRoles): void
{
    if (!in_array($user['role'] ?? '', $allowedRoles, true)) {
        json_response(['error' => 'Bu işlem için yetkiniz bulunmamaktadır.'], 403);
    }
}
```
- `in_array(..., true)` ile katı tip denetimi (*strict type check*) yapılmaktadır.
- Geçersiz veya tanımlanmamış roller anında HTTP 403 Forbidden ile kesilir.

### 9.2 CSRF Koruması Mantığı (`backend/src/http.php`)
```php
function require_csrf(): void
{
    $provided = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $stored = $_SESSION['csrf_token'] ?? '';
    if (!is_string($provided) || !is_string($stored) || $stored === '' || !hash_equals($stored, $provided)) {
        json_response(['error' => 'İstek doğrulanamadı. Sayfayı yenileyip tekrar deneyin.'], 419);
    }
}
```
- `hash_equals()` kullanımı ile zamanlama saldırılarına (*timing attacks*) karşı tam koruma sağlanmıştır.
- Boş veya tanımsız oturum belirteçlerine karşı `''` kontrolü mevcuttur.

---

## 10. Rehberlik Gizliliği ve Hassas Veri Koruması

1. **Klinik Görüşme Notlarının İzolasyonu (`counseling_session_notes`):**
   - `backend/src/auth.php` içerisindeki `can_view_counseling_notes(array $user): bool` fonksiyonu kesin kuralı uygular:
     ```php
     return ($user['role'] ?? '') === 'counselor';
     ```
   - Okul yöneticisi (`admin`) veya öğretmen (`teacher`) bu fonksiyondan `false` alır.
   - `backend/api/support-cases/index.php` dosyasında yalnızca `$isCounselor === true` olduğunda klinik notlar (`counseling_session_notes`) sorgulanmakta ve yanıta eklenmektedir. Yöneticiler bu uç noktayı çağırdığında `privateSessionNotes` dizisi yanıtta hiç yer almaz.
2. **Denetim Günlüklerinde (Audit Logs) Veri Sızıntısı Engeli:**
   - `backend/api/support-cases/update.php` içerisinde:
     ```php
     // AUDIT GÜVENLİĞİ (KVKK): Özel klinik not içeriği KESİNLİKLE denetim kütüğüne yazılmaz!
     $auditSummary = "Destek süreci güncellendi: {$statusToSet}.";
     if ($adminResult !== '') {
         $auditSummary .= " İdari Sonuç: {$adminResult}";
     }
     write_audit($pdo, $user, 'UPDATE_SUPPORT_STATUS', 'support_case', $caseId, $auditSummary);
     ```
     Klinik görüşme içeriği (`$privateNote`) kesinlikle denetim kütüğüne yazılmamakta, KVKK ve psikolojik danışmanlık etik ilkeleri tam olarak korunmaktadır.
3. **`adminResultNote` Veri Saklama Eksikliği:**
   - İdarecinin girdiği sonuç notu (`adminResultNote`), `support_cases` tablosunda uygun bir sütun bulunmadığından dolayı yalnızca denetim kütüğüne (`audit_logs`) eklenmektedir. Bu durum veri kaybına neden olmamakla birlikte, idarecinin sonuç notunu arayüzde tekrar görüntüleyebilmesi için Aşama 4.3 öncesinde şemaya `admin_result_note TEXT NULL` sütununun eklenmesi tavsiye edilir.

---

## 11. Bootstrap ve Yapılandırma Güvenliği

1. **Konfigürasyon Yönetimi (`config.php` vs `config.test.php`):**
   - `backend/config/config.php` dosyası varsayılan olarak doğrudan `config.local.php` dosyasını dahil etmektedir.
   - Kod tabanında dinamik bir ortam seçici (`APP_ENV` veya `ODIS_ENV`) bulunmamaktadır.
   - `config.test.php` bağımsız bir dosya olarak mevcuttur ve `odis_test` veritabanını hedeflemektedir. Testlerin canlı veritabanını (`odis`) etkilememesi için CLI test koşucularının `config.test.php` dosyasını açıkça yüklemesi güvenceye alınmalıdır.
2. **CLI Test Koşucularının Güvenliği:**
   - `backend/scripts/test_backend.php` dosyasının başında:
     ```php
     if (PHP_SAPI !== 'cli') {
         http_response_code(404);
         exit;
     }
     ```
     kontrolü yer almaktadır.
   - Ayrıca `backend/scripts/.htaccess` ve `backend/config/.htaccess` dosyalarında `Require all denied` direktifi mevcuttur. Web üzerinden doğrudan erişim çift katmanlı olarak engellenmiştir.
3. **Oturum Güvenliği Parametreleri (`backend/src/bootstrap.php`):**
   - `session.use_strict_mode = 1`
   - `session.use_only_cookies = 1`
   - `session.cookie_httponly = 1`
   - `session.use_trans_sid = 0`
   - `session.entropy_length = 32`
   - `samesite => 'Lax'`, `lifetime => 0`, `path => '/'`
   - `secure`: HTTPS ortamında otomatik `true`, yerel geliştirme için esnek.
   - **Oturum Zaman Aşımı (Idle Timeout):** 1800 saniye (30 dakika) hareketsizlik durumunda `$_SESSION` sıfırlanmakta ve `session_regenerate_id(true)` ile oturum kimliği imha edilmektedir. Mükemmel seviyededir.

---

## 12. Tespit Edilen Sorunlar ve Önem Dereceleri

| ID | Seviye | Dosya ve Satır | Açıklama |
|:---|:---:|:---|:---|
| **SEC-01** | `HIGH` | `backend/api/students/update.php:43`<br>`backend/api/students/create.php:29` | **Okul Dışı Akademik Yıl Bağlantısı:** İstemciden gelen `academicYearId`'nin oturumdaki okula (`school_id`) ait olup olmadığı doğrulanmamaktadır. Başka okulun akademik yılı bağlanabilir. |
| **SEC-02** | `MEDIUM` | `backend/api/reports/index.php:18,34,61,74,78` | **SQL ANSI_QUOTES Uyumsuzluğu:** SQL sorgularında dize sabitleri çift tırnak (`"active"`, `"closed"`) içine alınmıştır. `ANSI_QUOTES` modunda sütun adı zannedilerek SQL hatası üretir. |
| **SEC-03** | `LOW` | `backend/api/students/update.php:88-122`<br>`backend/api/students/delete.php:50-67` | **Eksik Transaction:** Öğrenci güncelleme/pasifleştirme ve `write_audit()` işlemleri veritabanı transaction bloğu (`beginTransaction` / `commit`) içine alınmamıştır. |
| **SEC-04** | `LOW` | `backend/config/config.php:5` | **Eksik Ortam Ayrımı (Environment Switcher):** `config.php` yalnızca `config.local.php`'yi yükler. `config.test.php`'ye dinamik geçiş ortam değişkenine bağlanmamıştır. |
| **ARCH-01**| `INFO` | `backend/api/support-cases/update.php:16` | **Kalıcı Olmayan Alan:** `adminResultNote` alanı yalnızca denetim günlüğüne yazılmakta, `support_cases` tablosunda saklanmamaktadır. |

---

## 13. Dinamik Doğrulama Test Planı (Aşama 4.3 İçin)

Aşama 4.3'te WAMP / CLI ortamında uygulanacak 10 kapsamlı test senaryosu:

| Test ID | Test Adı / Amacı | İstek Yöntemi ve Endpoint | Gövde / Parametreler | Beklenen HTTP Kodu | Beklenen Yanıt / DB Durumu |
|:---|:---|:---|:---|:---:|:---|
| **TC-01** | Yetkisiz Güncelleme Engeli | `POST /backend/api/students/update.php` | Oturum çerezi yok | `401 Unauthorized` | `{"error":"Oturum açmanız gerekiyor."}` |
| **TC-02** | Rol Yetki Engeli (Öğretmen) | `POST /backend/api/students/update.php` | Öğretmen oturumu, geçerli CSRF, `id: "st-1"` | `403 Forbidden` | `{"error":"Bu işlem için yetkiniz bulunmamaktadır."}` |
| **TC-03** | CSRF İhlali Engeli | `POST /backend/api/students/update.php` | Admin oturumu, geçersiz `X-CSRF-Token` | `419 Authentication Timeout` | `{"error":"İstek doğrulanamadı. ..."}` |
| **TC-04** | IDOR Okul İzolasyonu (Update) | `POST /backend/api/students/update.php` | Admin A oturumu, Okul B'ye ait `studentId` | `404 Not Found` | `{"error":"Öğrenci bulunamadı."}` |
| **TC-05** | IDOR Okul İzolasyonu (Delete) | `POST /backend/api/students/delete.php` | Admin A oturumu, Okul B'ye ait `studentId` | `404 Not Found` | `{"error":"Öğrenci bulunamadı."}` |
| **TC-06** | Yabancı Akademik Yıl Engeli | `POST /backend/api/students/update.php` | Admin A, kendi öğrencisi, Okul B'ye ait `academicYearId` | `422 Unprocessable` *(Düzeltme sonrası)* | `{"error":"Belirtilen akademik yıl bu okula ait değil..."}` |
| **TC-07** | Aynı Okulda Numara Çakışması | `POST /backend/api/students/update.php` | Admin A, öğrenci A1'e öğrenci A2'nin numarası verilir | `409 Conflict` | `{"error":"Bu öğrenci numarası ... zaten kayıtlı."}` |
| **TC-08** | Farklı Okulda Aynı Numara | `POST /backend/api/students/update.php` | Admin A, Okul B'deki bir öğrencinin numarası girilir | `200 OK` | `{"success":true}` - Başarıyla güncellenir. |
| **TC-09** | Soft-Delete İdempotentlik | `POST /backend/api/students/delete.php` | Admin A, pasif bir öğrenci ID'si tekrar gönderilir | `200 OK` | `{"message":"Öğrenci zaten pasif durumda."}` |
| **TC-10** | Raporlama ANSI SQL Modu | `GET /backend/api/reports/index.php` | Admin A, `startDate` ve `endDate` parametreleri | `200 OK` | ANSI_QUOTES aktifken SQL hatası vermeden istatistik döner. |

---

## 14. Aşama 4.3 Öncesi Düzeltilmesi Gereken Konular

Aşama 4.3 dinamik testlerine başlamadan önce aşağıdaki iki düzeltmenin yapılması şarttır:

1. **`students/update.php` ve `students/create.php` Dosyalarında Akademik Yıl Doğrulaması:**
   Öğrenci oluştururken veya güncellerken `academicYearId`'nin ilgili okula ait olduğu doğrulanmalıdır:
   ```php
   $ayCheck = $pdo->prepare('SELECT id FROM academic_years WHERE id = :id AND school_id = :school_id LIMIT 1');
   $ayCheck->execute(['id' => $academicYearId, 'school_id' => $user['schoolId']]);
   if (!$ayCheck->fetch()) {
       json_response(['error' => 'Belirtilen akademik yıl bu okula ait değil veya geçersiz.'], 422);
   }
   ```
2. **`reports/index.php` Dosyasında Çift Tırnak Düzeltmesi:**
   Tüm SQL metinlerinde `"active"` ve `"closed"` ifadeleri `'active'` ve `'closed'` tek tırnak standardına çekilmelidir.

---

## 15. Nihai Karar ve Aşama Geçiş Onayı

Yapılan bağımsız denetim sonucunda:

```
[ NİHAİ KARAR: KOŞULLU ONAY (CONDITIONAL PASS) ]
```

**Gerekçe:**  
Aşama 4.2-B kapsamında geliştirilen öğrenci güncelleme ve pasifleştirme uç noktaları; IDOR, CSRF, kimlik doğrulama, soft-delete ve temel okul izolasyonu gereksinimlerini başarıyla karşılamaktadır. Ancak başka bir okulun `academic_year_id` değerinin atanabilmesi (`SEC-01`) ve `reports/index.php` içerisindeki SQL çift tırnak dize literali riski (`SEC-02`), dinamik test aşamasına geçmeden önce giderilmelidir.

Bu iki düzeltmenin uygulanmasının ardından sistem doğrudan **Aşama 4.3: Dinamik Test ve WAMP Doğrulama** aşamasına geçmeye hazır olacaktır.
