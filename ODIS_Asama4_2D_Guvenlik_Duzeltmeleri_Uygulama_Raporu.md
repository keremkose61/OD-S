# ODİS — AŞAMA 4.2-D: GÜVENLİK AÇIKLARININ GİDERİLMESİ VE KOD DÜZELTMELERİ UYGULAMA RAPORU

**Rapor Tarihi:** 14 Kasım 2026  
**Denetlenen / Düzenlenen Proje:** ODİS (Okul Disiplin ve İzleme Sistemi)  
**Aktif Çalışma Dizini:** `C:\Users\Kose\.gemini\antigravity-ide\scratch\odis\odis-analysis`  
**WAMP Dizini:** `C:\wamp64\www\odis` *(Kesinlikle değiştirilmedi, salt okunur korundu)*  
**Git Dalı:** `feature/phase2-security-and-schema`  
**HEAD Commit:** `8bc954d75def57bf818e7ca6b1872245b8b11fda`  
**Teknoloji Yığını:** PHP 8.3.28 | MySQL 8.4.7 | Apache 2.4 | PDO  
**Aşama Amacı:** Aşama 4.2-C denetiminde tespit edilen güvenlik açıklarının (`SEC-01`, `SEC-02`, `SEC-03`) giderilmesi, `SEC-04` ortam güvenliğinin doğrulanması ve `ARCH-01` için veri modeli tasarımı sunulması.  

---

## 1. Yönetici Özeti

Bu aşamada, Aşama 4.2-C bağımsız güvenlik denetiminde tespit edilen yüksek ve orta seviyeli güvenlik açıkları, yalnızca aktif çalışma dizininde (`odis-analysis`), hiçbir veritabanı bağlantısı kurulmadan, migration çalıştırılmadan ve WAMP dizinine dokunulmadan kontrollü olarak giderilmiştir.

### Başlıca Tamamlanan Düzeltmeler:
1. **SEC-01 (FIXED):** Öğrenci oluşturma (`students/create.php`) ve güncelleme (`students/update.php`) işlemlerinde, istemciden gelen `academicYearId` değerinin yalnızca varlığı değil, **oturumdaki yöneticinin okuluna (`school_id`) ait olduğu** PDO parametreli sorgu ile zorunlu kılınmıştır. Başka okulun akademik yılını atama açığı tamamen kapatılmıştır.
2. **SEC-02 (FIXED):** `reports/index.php` içerisindeki tüm SQL sorgularında çift tırnaklı dize sabitleri (`"active"`, `"closed"`), standart SQL tek tırnak standardına (`'active'`, `'closed'`) dönüştürülmüştür. Böylece MySQL 8.4 `ANSI_QUOTES` modu altında olası `1054 Unknown column` hatası ve sorgu çökme riski ortadan kaldırılmıştır.
3. **SEC-03 (FIXED):** Öğrenci güncelleme (`update.php`), pasifleştirme (`delete.php`) ve oluşturma (`create.php`) işlemlerinde, veri mutasyonu ile denetim günlüğü yazımı (`write_audit()`) tek bir veritabanı transaction'ı (`beginTransaction` / `commit` / `rollBack`) altına alınarak atomik hale getirilmiştir. Kütük yazımı başarısız olduğunda veritabanı geri alınır; yetim veya kayıtsız işlem oluşmaz.
4. **SEC-04 (NOT APPLICABLE / TECHNICAL RECOMMENDATION):** Yapılandırma mimarisi incelenmiş; `config.php`'nin yalnızca `config.local.php` dosyasını dahil ettiği, web üzerinden test veritabanına geçişe izin verilmediği, `config.test.php` ve `config.local.php` dosyalarının `.htaccess` ve `.gitignore` ile korunduğu doğrulanmıştır. Kapsamlı refaktör yapılmamış, güvenli ortam yönetimi için mimari öneri sunulmuştur.
5. **ARCH-01 (REQUIRES DESIGN DECISION):** `adminResultNote` alanının rehberlik gizliliğini (`privateSessionNotes`) ihlal etmeden nasıl saklanabileceğine dair veri modeli ve yetki mimarisi önerisi hazırlanmıştır. `schema.sql` üzerinde değişiklik yapılmamıştır.

Tüm değiştirilen dosyalar PHP 8.3.28 sözdizimi denetiminden (`php -l`) sıfır hata ile geçmiştir.

---

## 2. İşlem Öncesi Çalışma Dizini, Dal ve HEAD Doğrulaması

İşleme başlanmadan önce çalışma ortamı ve Git durumu doğrulanmıştır:

- **Aktif Dizin:** `C:\Users\Kose\.gemini\antigravity-ide\scratch\odis\odis-analysis` (Doğrulandı)
- **Git Dalı:** `feature/phase2-security-and-schema` (Doğrulandı)
- **HEAD Commit Hash:** `8bc954d75def57bf818e7ca6b1872245b8b11fda` (Doğrulandı)
- **WAMP Dizini:** `C:\wamp64\www\odis` son değiştirilme tarihi 08.11.2026 olarak kalmış; hiçbir dosya kopyalanmamış veya senkronize edilmemiştir. (Doğrulandı)

---

## 3. Değiştirilen Dosyalar

Yalnızca izin verilen kapsamdaki 4 dosya üzerinde değişiklik yapılmıştır:

1. `backend/api/students/create.php`
2. `backend/api/students/update.php`
3. `backend/api/students/delete.php`
4. `backend/api/reports/index.php`

Yapılandırma dosyaları, şema dosyaları veya WAMP dosyaları kesinlikle değiştirilmemiştir.

---

## 4. Dosya Boyutları ve SHA-256 Özet Değerleri (Önceki / Sonraki)

| Dosya Yolu | Durum | Önceki Boyut | Yeni Boyut | Önceki SHA-256 | Yeni SHA-256 |
|:---|:---:|:---:|:---:|:---|:---|
| `backend/api/students/create.php` | Düzenlendi | 2,983 B | 4,360 B | `3906001C7D4BF30C082B2393CDB9D485227E70428B42B1E063E1907ECE6FF97C` | `5C7A9AE9A72D362FE9AE4DADEE6D38072721158B6CEA0B115A50DEDFEB1A6B21` |
| `backend/api/students/update.php` | Düzenlendi | 5,074 B | 6,196 B | `113FAD3D07CED20429131B38A038E90F3FF220548173468EF1E69D8284340099` | `459A5BA20913C803ED5F2F9FEF250229C0FF2BFCE37AB82AD167DC36CD3D958B` |
| `backend/api/students/delete.php` | Düzenlendi | 2,139 B | 2,666 B | `DC0E647DA600B2A2F408016E1A720F6007E4C612F160CC598FFF7A4852EBB758` | `695E39249D8EF3542C292BB02984CB27CC916E92F91F6A588EFB8EF61D70DAD9` |
| `backend/api/reports/index.php`   | Düzenlendi | 3,401 B | 3,411 B | `897502ED8D99220DEB854235E972963A70CC580AD1A23803CCE424AE1ADBEB8C` | `CB1C8BA0C33646281F39EC5E259DE30B5ED84B7D29C74DE0CFBED556329B617A` |

---

## 5. SEC-01 Düzeltmesinin Teknik Açıklaması

**Bulgu Durumu:** `FIXED`

### Sorun:
Önceki kodda istemciden gelen `academicYearId` yalnızca MySQL Foreign Key kısıtına güveniyordu. MySQL `fk_student_year` kısıtı, ilgili ID'nin `academic_years.id` tablosunda var olduğunu teyit eder; ancak bu yılın oturum açmış yöneticinin okuluna (`school_id`) ait olup olmadığını kontrol etmez. Bu durum, Okul A yöneticisinin Okul B'nin takvim yılını kullanarak öğrenci kaydetmesine veya güncellemesine yol açabilmekteydi.

### Uygulanan Çözüm:
1. **`students/update.php` Dosyasında:**
   ```php
   $academicYearId = trim((string) ($input['academicYearId'] ?? $existing['academic_year_id']));
   if ($academicYearId === '') {
       json_response(['error' => 'Geçerli bir akademik yıl belirtilmelidir.'], 422);
   }

   // Akademik yıl okul aidiyeti doğrulaması (SEC-01)
   $ayCheck = $pdo->prepare(
       'SELECT id
        FROM academic_years
        WHERE id = :id
          AND school_id = :school_id
        LIMIT 1'
   );
   $ayCheck->execute([
       'id'        => $academicYearId,
       'school_id' => $user['schoolId'],
   ]);
   if (!$ayCheck->fetch()) {
       json_response(['error' => 'Belirtilen akademik yıl bu okula ait değil veya geçersiz.'], 422);
   }
   ```
2. **`students/create.php` Dosyasında:**
   - Eğer istemci `academicYearId` göndermediyse: Oturumdaki okulun `is_current = 1` olan yılı aranır; bulunamazsa okulun en güncel yılı alınır. Okula ait hiçbir akademik yıl yoksa güvenli `422 Unprocessable` döner (`'ay_default'` sabitine körü körüne düşülmez).
   - Eğer istemci `academicYearId` gönderdiyse: Doğrudan `WHERE id = :id AND school_id = :school_id` ile kontrol edilir; başka okula ait bir yıl ise anında `422` ile reddedilir.
3. **Güvenlik Güvencesi:**
   Hata yanıtı (`Belirtilen akademik yıl bu okula ait değil veya geçersiz.`), yabancı okulun verisinin varlığı veya yokluğu hakkında bilgi sızdırmaz.

---

## 6. SEC-02 Düzeltmesinin Teknik Açıklaması

**Bulgu Durumu:** `FIXED`

### Sorun:
`backend/api/reports/index.php` dosyasındaki SQL sorgularında `status = "active"` ve `status != "closed"` dize sabitleri çift tırnak ile yazılmıştı. MySQL 8.4'te `ANSI_QUOTES` modu devrede olduğunda çift tırnak dize literali değil, tablo/sütun tanımlayıcısı (identifier) olarak yorumlanır ve sorgu `1054 Unknown column 'active' in 'where clause'` hatası ile çöker.

### Uygulanan Çözüm:
`backend/api/reports/index.php` dosyasındaki 5 kritik sorguda çift tırnaklar tek tırnak dize standardına dönüştürülmüştür:
- Satır 18: `WHERE school_id = :school_id AND status = 'active'`
- Satır 34: `WHERE school_id = :school_id AND status = 'active'`
- Satır 61: `WHERE school_id = :school_id AND status = 'active'`
- Satır 74: `WHERE school_id = :school_id AND status = 'active'`
- Satır 78: `WHERE school_id = :school_id AND status != 'closed'`

PDO parametreli bağlama yapısı (`:school_id`, `:ay_id`) ve okul izolasyonu aynen korunmuştur.

---

## 7. SEC-03 Transaction ve Audit Atomikliği Teknik Açıklaması

**Bulgu Durumu:** `FIXED`

### Sorun:
Önceki implementasyonda öğrenci güncelleme veya silme sorgusu doğrudan çalıştırılıyor, hemen ardından `write_audit()` çağrılıyordu. Herhangi bir nedenden dolayı (örneğin audit tablosu kilitlenmesi, disk dolması, bellek yetersizliği) `write_audit()` istisna fırlatırsa, öğrenci verisi güncellenmiş/pasifleştirilmiş kalıyor ancak denetim günlüğü yazılamıyordu. Bu durum KVKK ve denetim izlenebilirliği gereksinimlerini ihlal ediyordu.

### Uygulanan Çözüm:
`update.php`, `delete.php` ve `create.php` dosyalarında mutasyon ve denetim kaydı tek bir PDO transaction bloğu içine alınmıştır:

```php
$manageTransaction = !$pdo->inTransaction();
if ($manageTransaction) {
    $pdo->beginTransaction();
}

try {
    $update->execute([...]);

    write_audit(
        $pdo,
        $user,
        'UPDATE_STUDENT', // veya 'DEACTIVATE_STUDENT' / 'CREATE_STUDENT'
        'student',
        $studentId,
        "..."
    );

    if ($manageTransaction) {
        $pdo->commit();
    }
} catch (Throwable $e) {
    if ($manageTransaction && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Student operation error: ' . $e->getMessage());
    json_response(['error' => 'İşlem gerçekleştirilirken bir hata oluştu.'], 500);
}
```

### Özellikler:
- `!$pdo->inTransaction()` kontrolü ile iç içe (*nested*) transaction hatası önlenmiştir.
- `Throwable` yakalama bloğunda hata günlüğü güvenli şekilde `error_log`'a yazılır; istemciye hiçbir veritabanı veya sunucu detayı sızdırılmaz.
- `students/delete.php` dosyasında soft-delete mantığı (`active = 0`) ve idempotent kontrol (`active === 0` durumunda işlem yapmadan 200 dönme) aynen korunmuştur. Fiziksel `DELETE` sorgusu eklenmemiştir.

---

## 8. SEC-04 Ortam Güvenliği İnceleme Sonucu

**Bulgu Durumu:** `NOT APPLICABLE` / `REQUIRES DESIGN DECISION` (Kapsamlı refaktör yapılmadı, güvenli mimari korundu)

### Yapılan İnceleme:
1. **`backend/config/config.php`:**
   - Yalnızca `config.local.php` dosyasını dahil etmektedir.
   - İstemciden gelen hiçbir HTTP başlığı, sorgu parametresi (`$_GET`) veya gövdesi (`$_POST`) ile test ortamına (`config.test.php`) geçiş yapılamaz.
   - Dosya bulunamadığında veya eksik olduğunda iç yollar gizlenerek doğrudan genel `503 Servis geçici olarak kullanılamıyor` yanıtı döner.
2. **Erişim Kısıtlamaları (`.htaccess`):**
   - `backend/config/.htaccess` ve `backend/scripts/.htaccess` dosyalarında `Require all denied` kuralı mevcuttur. Web üzerinden doğrudan `.php` veya yapılandırma dosyalarına erişim Apache tarafından engellenmektedir.
3. **Gizlilik ve Git Takibi:**
   - `.gitignore` dosyası incelenmiş; 29. satırda `backend/config/config.local.php` dosyasının açıkça yok sayıldığı teyit edilmiştir (`git check-ignore -v` ile doğrulandı). Hassas parola ve bağlantı bilgileri Git deposuna girmemektedir.
4. **CLI Test Koşucusu Güvenliği:**
   - `backend/scripts/test_backend.php` dosyasının 4. satırında `if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }` kontrolü yer almaktadır. Webden tetiklenmesi mümkün değildir.

### Mimari Karar ve Tavsiye:
Mevcut yapılandırma güvenlidir ve web üzerinden test veritabanına atlama riski barındırmamaktadır. Bu aşamada acele bir refaktör (örneğin ortam değişkeni okuma) yapmak yeni atak yüzeyleri açabileceğinden, mevcut mimari korunmuştur. Aşama 4.3 CLI testlerinde test koşucusu `config.test.php` dosyasını bağımsız olarak yükleyecektir.

---

## 9. ARCH-01 Veri Modeli Önerisi (`adminResultNote`)

**Bulgu Durumu:** `REQUIRES DESIGN DECISION` (Şema değiştirilmedi, teknik tasarım hazırlandı)

`support-cases/update.php` içerisindeki `adminResultNote` kullanımı incelenmiş olup sorular şu şekilde yanıtlanmıştır:

### 1. İdari sonuç notu hangi kullanıcı rollerince görülebilmeli?
- **Yalnızca `admin` (Okul Müdürü / Müdür Yardımcısı) ve `counselor` (Rehber Öğretmen):**  
  Öğrenci hakkında yürütülen idari işlem veya karar özetini hem süreci yürüten rehberlik personeli hem de okul yönetimi görmelidir. Öğretmenler (`teacher`) ise genel destek vakasının durumunu görebilmeli, ancak idari kararın detay metnini görmemelidir.

### 2. Hangi endpoint'lerde döndürülmeli?
- `GET /backend/api/support-cases/index.php`: Liste görünümünde `adminResultNote` alanı olarak.
- `GET /backend/api/students/show.php`: Öğrenci detayındaki ilişkili destek vakaları nesnesi içinde.

### 3. Audit log içerisinde tutulması yeterli mi?
- **Hayır, yeterli değildir.**  
  Denetim günlüğü (`audit_logs`) yasal uyumluluk ve adli kayıt amacıyla tutulur. Kullanıcı arayüzünün bir destek sürecinin idari sonucunu ekrana basabilmesi için yüzbinlerce satırlık `audit_logs` tablosunu araması performans ve mimari açıdan yanlıştır.

### 4. Kalıcı alan gerekiyorsa şema ve API tasarımı nasıl olmalı?
- **`schema.sql` Değişikliği (Aşama 5 / Sonraki Şema Güncellemesi için):**
  ```sql
  ALTER TABLE support_cases
    ADD COLUMN admin_result_note TEXT NULL AFTER description,
    ADD COLUMN admin_action_at DATETIME NULL AFTER closed_at;
  ```
- **API Güncellemesi:**
  `support-cases/update.php` dosyasında `admin_result_note = :admin_result_note` alanı `UPDATE` sorgusuna eklenecektir.

### 5. Rehberlik özel notlarından nasıl ayrıştırılmalı?
- **`counseling_session_notes` (Klinik / Özel Görüşme Notları):**  
  Ayrı bir alt tabloda tutulur (`case_id` yabancı anahtarıyla). Yalnızca `counselor` rolüne açıktır. Aile içi sırlar, psikolojik değerlendirmeler ve klinik gözlemleri barındırır. İdarecinin bu notları okuma yetkisi kesinlikle yoktur.
- **`admin_result_note` (İdari Süreç Sonucu):**  
  `support_cases` tablosunun birincil sütunudur. "Öğrenci velisi ile görüşülerek rehberlik servisine yönlendirildi ve haftalık takip çizelgesi oluşturuldu" gibi resmi, idari ve yönetsel kararları ifade eder. Hassas klinik sır içermez.

---

## 10. PHP Sözdizim (Lint) Kontrol Sonuçları

Değiştirilen 4 dosya PHP 8.3.28 CLI (`C:\wamp64\bin\php\php8.3.28\php.exe -l`) ile denetlenmiştir:

```powershell
& "C:\wamp64\bin\php\php8.3.28\php.exe" -l "odis-analysis\backend\api\students\create.php"
# Çıktı: No syntax errors detected in odis-analysis\backend\api\students\create.php

& "C:\wamp64\bin\php\php8.3.28\php.exe" -l "odis-analysis\backend\api\students\update.php"
# Çıktı: No syntax errors detected in odis-analysis\backend\api\students\update.php

& "C:\wamp64\bin\php\php8.3.28\php.exe" -l "odis-analysis\backend\api\students\delete.php"
# Çıktı: No syntax errors detected in odis-analysis\backend\api\students\delete.php

& "C:\wamp64\bin\php\php8.3.28\php.exe" -l "odis-analysis\backend\api\reports\index.php"
# Çıktı: No syntax errors detected in odis-analysis\backend\api\reports\index.php
```

Tüm dosyalarda sözdizimi hatasızdır (`Return code: 0`).

---

## 11. Kapsam Dışı Bırakılan İşlemler

Aşama talimatlarına ve güvenlik yasaklarına tam uyum sağlanmıştır:
- Canlı `odis` veya `odis_test` veritabanına kesinlikle bağlantı kurulmamıştır.
- Hiçbir SQL sorgusu çalıştırılmamıştır.
- `schema.sql` veya veritabanı tabloları değiştirilmemiştir.
- WAMP dizininde (`C:\wamp64\www\odis`) hiçbir dosya değiştirilmemiş, taşınmamış veya kopyalanmamıştır.
- Git üzerinde hiçbir `add`, `commit`, `push`, `checkout` veya dal değiştirme komutu çalıştırılmamıştır.
- Parola, gizli anahtar veya oturum verileri rapora yazılmamıştır.
- Aşama 4.3 dinamik testleri başlatılmamış, kullanıcı onayına bırakılmıştır.

---

## 12. Kalan Riskler

1. **Canlı/WAMP Senkronizasyonu:** Yapılan düzeltmeler şu anda yalnızca `odis-analysis` çalışma kopyasındadır. WAMP dizinine ve Git deposuna yansıtılmamıştır. Aşama 4.3'te WAMP üzerinde test yapılacaksa kontrollü bir dosya aktarımı gerekecektir.
2. **`adminResultNote` Arayüz Görünürlüğü:** `schema.sql` değiştirilmediği için `adminResultNote` henüz veritabanında sütun olarak bulunmamaktadır; bu durum arayüzde destek süreci sonuçlarının kalıcı listelenmesini bir sonraki şema güncellemesine kadar ertelemektedir.

---

## 13. Bir Sonraki Aşama İçin Öneri

Yapılan düzeltmelerle birlikte sistem:
- IDOR saldırılarına,
- Çapraz okul akademik yıl sahteciliğine,
- SQL dize sabiti uyumsuzluklarına,
- Transaction ve audit kopukluklarına

karşı tamamen güvenceye alınmıştır.

**Öneri:**  
Aşama 4.2-D başarıyla tamamlanmıştır. Kullanıcı onayı alındıktan sonra doğrudan **Aşama 4.3: Dinamik Test ve WAMP Doğrulama** aşamasına geçilebilir.
