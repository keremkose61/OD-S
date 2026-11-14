# ODİS PHP 8 + MySQL Backend Mimarisi

ODİS (Okul Disiplin ve İzleme Sistemi) için geliştirilmiş, çok okullu (multi-tenant), rol tabanlı yetkilendirme (RBAC) ve KVKK rehberlik gizliliği güvenceli RESTful backend altyapısı.

## Gereksinimler

- PHP 8.1 veya üzeri (WampServer PHP 8.3 önerilir)
- WampServer / Apache (mod_rewrite, mod_headers etkin)
- MySQL 8.0+ veya MariaDB 10.4+
- PHP eklentileri: `pdo_mysql`, `mbstring`, `json`, `session`

---

## Hızlı Kurulum & Otomatik Migration

1. **WampServer Servislerini Başlatın:**
   - Apache ve MySQL servislerinin çalıştığından (yeşil simge) emin olun.

2. **Yerel Yapılandırma Dosyasını Hazırlayın:**
   - `backend/config/config.example.php` dosyasını `backend/config/config.local.php` olarak kopyalayın.
   - MySQL kullanıcı adı ve parolasını belirleyin (varsayılan WampServer için `root` ve boş parola).

3. **Otomatik Veritabanı Kurulumunu Çalıştırın:**
   ```bat
   php backend/scripts/migrate.php
   ```
   Bu komut:
   - `odis` veritabanını (`utf8mb4_unicode_ci`) otomatik oluşturur.
   - 13 ilişkisel InnoDB tablosunu foreign key'leriyle birlikte yükler.
   - Varsayılan personel ve yönetici hesaplarını parola hash'leriyle oluşturur.

4. **(İsteğe Bağlı) Demo Verileri Yükleyin:**
   ```bat
   php backend/scripts/seed_demo.php
   ```
   Eğitim-öğretim yılları, sınıflar ve demo öğrenci havuzunu MySQL'e aktarır.

5. **Backend Güvenlik ve Mantık Testlerini Doğrulayın:**
   ```bat
   php backend/scripts/test_backend.php
   ```

---

## Güvenlik ve Mimari İlkeler

### 1. Okullar Arası Veri Yalıtımı (Multi-Tenant Isolation)
- `school_id` hiçbir zaman istemciden parametre olarak kabul edilmez.
- Her kullanıcının okul kimliği, sunucu tarafında doğrulanmış oturumundan (`$_SESSION['user_id']` -> DB) belirlenir.
- Tüm SQL sorguları zorunlu olarak `WHERE school_id = :school_id` parametresiyle sınırlandırılır.

### 2. KVKK ve Rehberlik Servisi Çift Katmanlı Gizliliği
- Özel klinik görüşme notları (`counseling_session_notes`) tablosunda saklanır.
- Yalnızca `counselor` (Rehberlik) rolü bu notlara erişebilir; yöneticiler dahi bu tabloya erişemez.
- İdareye yalnızca kısa sonuç notu (`adminResultNote`) iletilir.
- Rehberlik özel notları **kesinlikle normal denetim kütüğüne (`audit_logs`) yazılmaz**.

### 3. Oturum ve İstek Güvenliği
- **CSRF Koruması:** Tüm POST istekleri `X-CSRF-Token` başlığını taşımalıdır ve `hash_equals()` ile doğrulanır.
- **Oturum Güvenliği:** `HttpOnly`, `SameSite=Lax`, `use_strict_mode=1`, `use_only_cookies=1`.
- **Brute-Force Koruması:** `login_attempts` tablosu üzerinde SHA-256 hash'li kullanıcı anahtarı ve IP bazında 15 dakikada maksimum 5 başarısız deneme sınırı.
- **Parola Güvenliği:** `password_hash()` (Argon2id/bcrypt) ile minimum 12 karakter zorunluluğu.

---

## API Uç Noktaları Özeti

### Kimlik Doğrulama & Oturum
- `GET  /backend/api/health.php` — Sistem ve veritabanı sağlık kontrolü
- `GET  /backend/api/auth/csrf.php` — CSRF token üretimi ve oturum kontrolü
- `POST /backend/api/auth/login.php` — Sunucu tarafı güvenli giriş
- `GET  /backend/api/auth/me.php` — Mevcut aktif kullanıcı profili
- `POST /backend/api/auth/logout.php` — Güvenli oturum kapatma

### Öğrenci Yönetimi
- `GET  /backend/api/students/index.php` — Okul öğrencilerini arama ve listeleme
- `GET  /backend/api/students/show.php?id=...` — Öğrenci kartı, disiplin ve gözlem geçmişi
- `POST /backend/api/students/create.php` — Yeni öğrenci kaydı oluşturma (Admin)
- `POST /backend/api/students/import.php` — Toplu Excel/öğrenci aktarımı (Admin, Transaction)

### Okul Düzeni & Disiplin
- `GET  /backend/api/records/index.php` — Düzen kayıtları listesi
- `POST /backend/api/records/create.php` — Yeni kural kaydı (Aynı gün mükerrerlik kontrollü)
- `POST /backend/api/records/cancel.php` — Hatalı kayıt iptali (Soft delete, Admin)

### Davranış Gözlemleri
- `GET  /backend/api/observations/index.php` — Gözlem kayıtları (Rehberlik notu maskeli)
- `POST /backend/api/observations/create.php` — Yeni davranış gözlemi bildirimi

### Rehberlik & Destek Süreçleri
- `GET  /backend/api/support-cases/index.php` — Destek vakaları (Rehberlik çift katmanlı)
- `POST /backend/api/support-cases/create.php` — Yeni vaka oluşturma
- `POST /backend/api/support-cases/update.php` — Durum güncelleme & klinik not kaydı

### Yönetim, Raporlama & Denetim
- `GET  /backend/api/schools/index.php` — Okul detayları ve toplam istatistikler
- `GET  /backend/api/academic-years/index.php` — Eğitim-öğretim yılları listesi
- `GET  /backend/api/admin-actions/index.php` — İdari kararlar listesi
- `POST /backend/api/admin-actions/create.php` — İdari işlem uygulama (Admin)
- `GET  /backend/api/reports/index.php` — Kategori, sınıf ve zaman trend analizleri
- `GET  /backend/api/audit/index.php` — Okul güvenlik ve işlem denetim kütüğü (Admin)
