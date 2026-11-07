# ODİS PHP + MySQL Backend

Bu dizin, ODİS'in tarayıcıdaki demo kimlik doğrulamasını sunucu tarafına taşımak için başlangıç altyapısını içerir.

## Gereksinimler

- PHP 8.1 veya üzeri
- WampServer / Apache
- MySQL veya MariaDB
- PHP eklentileri: `pdo_mysql`, `mbstring`

## Yerel kurulum

1. WampServer'ı başlatın ve Apache/MySQL servislerinin yeşil olduğunu doğrulayın.
2. phpMyAdmin üzerinden `odis` adında bir veritabanı oluşturun (karakter seti: `utf8mb4_unicode_ci`).
3. `backend/database/schema.sql` dosyasını `odis` veritabanına içe aktarın.
4. `backend/config/config.example.php` dosyasını aynı klasörde `config.local.php` adıyla kopyalayın.
5. `config.local.php` içindeki MySQL kullanıcı adı ve parolasını kendi WampServer kurulumunuza göre düzenleyin.
6. Proje kökünü Apache'nin web kökünde yayınlayın. Örnek: `C:\\wamp64\\www\\odis`. Apache yapılandırmasında proje klasörü için `.htaccess` kullanımına (`AllowOverride All`) izin verildiğini doğrulayın.
7. İlk yönetici hesabını yalnızca sunucuda PHP CLI üzerinden oluşturun:

```bat
cd C:\\wamp64\\www\\odis
php backend\\scripts\\create_user.php admin admin school_kasif
```

Komut sizden parola isteyecektir. Gerçek hesap parolalarını kaynak koda veya Git deposuna yazmayın.

## API uçları

- `GET /backend/api/health.php` — backend ve veritabanı bağlantısını kontrol eder.
- `GET /backend/api/auth/csrf.php` — oturum ve CSRF belirteci oluşturur.
- `POST /backend/api/auth/login.php` — kullanıcı adı/parola ile oturum açar.
- `GET /backend/api/auth/me.php` — geçerli sunucu oturumunu döndürür.
- `POST /backend/api/auth/logout.php` — oturumu kapatır.

POST istekleri `X-CSRF-Token` başlığını taşımalıdır. Oturum kimliği HttpOnly çerezde tutulur; rol ve okul kimliği tarayıcıdan kabul edilmez, veritabanından okunur.

## Güvenlik notları

- Bu ilk altyapı aşamasıdır; henüz mevcut tüm ODİS modüllerinin MySQL'e taşındığı anlamına gelmez.
- Öğrenci, kayıt, gözlem ve rehberlik API'leri tamamlanmadan gerçek öğrenci verisiyle kullanmayın.
- Canlı kullanımda HTTPS zorunludur.
- `config.local.php` ve veritabanı yedekleri Git'e yüklenmemelidir.
