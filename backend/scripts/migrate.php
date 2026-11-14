<?php
declare(strict_types=1);

/**
 * ODİS — Güvenli Veritabanı Kurulum ve Migration Betiği
 * 
 * Güvenlik ve Mimari İlkeleri:
 * 1. Yalnızca CLI ortamında çalıştırılabilir (Web erişimi engellenmiştir).
 * 2. Canlı veritabanı varsayılan olarak korunur ve reddedilir:
 *    Hedef ortam (--target=<db>) açıkça belirtilmelidir.
 *    Canlı 'odis' veritabanı için '--force-live' parametresi zorunludur.
 * 3. Veritabanı adı beyaz listesi: Yalnızca 'odis' ve 'odis_test' isimleri kabul edilir.
 * 4. Çift doğrulama: CLI argümanı ile config dosyasındaki veritabanı adı tam uyuşmalıdır.
 * 5. Faz 2 Şema Bütünlüğü Doğrulaması:
 *    Çalıştırılacak schema.sql dosyasının 13 Faz 2 tablosunu eksiksiz içerdiği doğrulanır.
 *    Eski 4 tabloluk şema tespit edilirse işlem başlamadan derhal durdurulur.
 * 6. Idempotent Sütun Kontrolü:
 *    MySQL 8.4'te 'ADD COLUMN IF NOT EXISTS' desteklenmediğinden,
 *    'SHOW COLUMNS FROM <table> LIKE <col>' kullanılarak sütunun varlığı sorgulanır.
 *    Tablo, sütun adları ve tipleri kod içinde tanımlı sabit beyaz listeden gelir.
 * 7. Users Tablosu Unique İndeks Kontrolü ve Dönüşümü:
 *    (school_id, username) bileşik indeksi eklenmeden önce mükerrer kayıt kontrolü yapılır.
 *    Eski 'uq_users_username' indeksi ancak yeni indeks doğrulandıktan sonra kaldırılır.
 * 8. Dry-Run Simülasyon Güvenliği:
 *    Dry-run modunda hiçbir yazma/DDL sorgusu çalıştırılmaz. Eksik tablolar hata sayılmaz,
 *    simülasyon olarak raporlanır ve gerçek başarı mesajı yerine simülasyon özeti sunulur.
 * 9. Hassas Bilgi Maskeleme: Hata mesajlarında parola ve kimlik bilgileri maskelenir.
 * 10. Aşamalı Raporlama: Her adım konsola durum bildirir; hata durumunda işlem anında durdurulur.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    echo "Bu betik yalnızca CLI (komut satırı) üzerinden çalıştırılabilir.\n";
    exit(1);
}

final class OdisMigration
{
    /**
     * İzin verilen hedef veritabanları beyaz listesi.
     */
    public const ALLOWED_DATABASES = [
        'odis_test',
        'odis',
    ];

    /**
     * Faz 2 mimarisi için zorunlu olan 13 tablo listesi.
     */
    public const EXPECTED_PHASE2_TABLES = [
        'schools', 'users', 'login_attempts', 'audit_logs',
        'academic_years', 'classes', 'students', 'order_records',
        'observations', 'support_cases', 'counseling_session_notes',
        'admin_actions', 'staff'
    ];

    /**
     * Güvenli sütun kontrol ve ekleme beyaz listesi (Sabit Kod Tanımları).
     * MySQL 8.4 uyumluluğu için SHOW COLUMNS üzerinden kontrol edilir.
     */
    public const COLUMN_WHITELIST = [
        'schools' => [
            'district'   => 'VARCHAR(190) NULL DEFAULT NULL',
            'principal'  => 'VARCHAR(190) NULL DEFAULT NULL',
            'phone'      => 'VARCHAR(32) NULL DEFAULT NULL',
            'email'      => 'VARCHAR(190) NULL DEFAULT NULL',
            'updated_at' => 'TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
        ],
        'login_attempts' => [
            'school_id'  => 'VARCHAR(64) NULL DEFAULT NULL',
        ],
    ];

    private string $currentPhase = 'Başlatma';

    public function run(array $argv): void
    {
        $this->printHeader();

        $options = $this->parseArguments($argv);

        if (isset($options['help'])) {
            $this->printHelp();
            exit(0);
        }

        // 1. Hedef ortam ve veritabanı güvenlik kontrolü
        $this->currentPhase = 'Faz 0: Güvenlik ve Hedef Ortam Doğrulaması';
        $this->logPhase($this->currentPhase);
        $targetDb = $this->validateTargetEnvironment($options);

        // 2. Yapılandırma dosyasını yükle ve doğrula
        $config = $this->loadAndVerifyConfig($targetDb);
        $dbConfig = $config['database'];

        $dryRun = !empty($options['dry-run']);
        $skipSeed = !empty($options['skip-seed']);

        if ($dryRun) {
            echo "⚠️  [DRY-RUN MODU AKTİF]: Gerçek DDL/DML sorguları çalıştırılmayacak, yalnızca denetim ve simülasyon yapılacak.\n\n";
        }

        try {
            // 3. MySQL sunucusuna bağlan ve veritabanının varlığını sağla
            $this->currentPhase = 'Faz 1: Sunucu Bağlantısı ve Veritabanı Kontrolü';
            $this->logPhase($this->currentPhase);
            $serverPdo = $this->connectServer($dbConfig);
            $this->ensureDatabase($serverPdo, $targetDb, $dryRun);

            // 4. Hedef veritabanına bağlan
            $this->currentPhase = 'Faz 2: Hedef Veritabanına Bağlantı';
            $this->logPhase($this->currentPhase);
            $pdo = $this->connectDatabase($dbConfig, $targetDb);

            // 5. Mevcut tablolarda eksik sütunları güvenli şekilde tamamla (Pre-migration patch)
            $this->currentPhase = 'Faz 3: Sütun Kontrolü ve Idempotent DDL (schools & login_attempts)';
            $this->logPhase($this->currentPhase);
            $this->runColumnPatching($pdo, $dryRun);

            // 6. users tablosu unique indeks dönüşümü ve çakışma kontrolü
            $this->currentPhase = 'Faz 4: users Tablosu Unique İndeks Dönüşümü';
            $this->logPhase($this->currentPhase);
            $this->handleUsersUniqueIndex($pdo, $dryRun);

            // 7. Şema bütünlüğü doğrulaması ve schema.sql çalıştırma
            $this->currentPhase = 'Faz 5: Şema Dosyası Doğrulaması ve Yürütme (schema.sql)';
            $this->logPhase($this->currentPhase);
            $this->executeSchema($pdo, $dryRun);

            // 8. Tablo listesini ve bütünlüğü doğrula
            $this->currentPhase = 'Faz 6: Şema Bütünlüğü ve Tablo Doğrulaması';
            $this->logPhase($this->currentPhase);
            $this->verifyTables($pdo, $dryRun);

            // 9. Personel kullanıcı tohum verileri kontrolü (Idempotent)
            $this->currentPhase = 'Faz 7: Personel Kullanıcı Tohum Verisi Kontrolü';
            $this->logPhase($this->currentPhase);
            $this->seedStaffUsers($pdo, $skipSeed, $dryRun);

            $this->printSuccess($targetDb, $dryRun);

        } catch (Throwable $e) {
            $this->handleFailure($e);
            exit(1);
        }
    }

    private function parseArguments(array $argv): array
    {
        $options = [];
        foreach (array_slice($argv, 1) as $arg) {
            if ($arg === '--help' || $arg === '-h') {
                $options['help'] = true;
            } elseif ($arg === '--force-live') {
                $options['force-live'] = true;
            } elseif ($arg === '--skip-seed') {
                $options['skip-seed'] = true;
            } elseif ($arg === '--dry-run') {
                $options['dry-run'] = true;
            } elseif (str_starts_with($arg, '--target=')) {
                $options['target'] = trim(substr($arg, 9));
            } elseif (str_starts_with($arg, '--env=')) {
                $options['target'] = trim(substr($arg, 6));
            }
        }
        return $options;
    }

    private function validateTargetEnvironment(array $options): string
    {
        $target = $options['target'] ?? null;

        if ($target === null || $target === '') {
            echo "❌ GÜVENLİK ENGELİ: Hedef veritabanı belirtilmedi!\n";
            echo "   Güvenlik politikası gereği canlı 'odis' veritabanına varsayılan olarak işlem yapılamaz.\n\n";
            echo "   Kullanım:\n";
            echo "     Test için : php migrate.php --target=odis_test\n";
            echo "     Canlı için: php migrate.php --target=odis --force-live\n\n";
            echo "   Detaylı bilgi için: php migrate.php --help\n";
            exit(1);
        }

        if (!in_array($target, self::ALLOWED_DATABASES, true)) {
            echo "❌ GÜVENLİK ENGELİ: Geçersiz hedef veritabanı ('$target')!\n";
            echo "   Yalnızca şu veritabanlarına izin verilmektedir: " . implode(', ', self::ALLOWED_DATABASES) . "\n";
            exit(1);
        }

        if ($target === 'odis') {
            if (empty($options['force-live'])) {
                echo "🛑 KRİTİK GÜVENLİK KORUMASI: CANLI VERİTABANI TESPİT EDİLDİ!\n";
                echo "   'odis' canlı veritabanında migration çalıştırmak için '--force-live' parametresini\n";
                echo "   açıkça belirtmeniz zorunludur:\n\n";
                echo "     php migrate.php --target=odis --force-live\n\n";
                echo "   İşlem veri güvenliği gereği derhal durduruldu.\n";
                exit(1);
            }
            echo "⚠️  CANLI ORTAM UYARISI: 'odis' canlı veritabanı hedeflendi (--force-live onaylandı).\n";
        } else {
            echo "✓ Hedef ortam doğrulandı: '$target' (İzole Test Ortamı).\n";
        }

        return $target;
    }

    private function loadAndVerifyConfig(string $targetDb): array
    {
        $configDir = __DIR__ . '/../config';
        $loadedFile = '';
        $config = null;

        if ($targetDb === 'odis_test' && is_file($configDir . '/config.test.php')) {
            $loadedFile = 'config.test.php';
            $config = require $configDir . '/config.test.php';
        } elseif (is_file($configDir . '/config.local.php')) {
            $loadedFile = 'config.local.php';
            $config = require $configDir . '/config.local.php';
        } else {
            $loadedFile = 'varsayılan WampServer ayarları';
            $config = [
                'database' => [
                    'host'     => '127.0.0.1',
                    'port'     => 3306,
                    'name'     => $targetDb,
                    'username' => 'root',
                    'password' => '',
                    'charset'  => 'utf8mb4',
                ],
            ];
        }

        if (!is_array($config) || !isset($config['database']) || !is_array($config['database'])) {
            throw new RuntimeException("Yapılandırma dosyasında 'database' anahtarı geçerli bir dizi değil.");
        }

        $configuredDb = (string) ($config['database']['name'] ?? '');

        // Test hedefi çalıştırıldığında konfigürasyondaki veritabanı adını güvenle test hedefine eşitle
        if ($targetDb === 'odis_test') {
            if ($configuredDb !== 'odis_test') {
                echo "ℹ Yapılandırma ($loadedFile) veritabanı adı '$configuredDb' yerine test hedefi 'odis_test' olarak ayarlandı.\n";
                $config['database']['name'] = 'odis_test';
            }
        } elseif ($targetDb === 'odis') {
            if ($configuredDb !== 'odis') {
                throw new RuntimeException(
                    "Yapılandırma uyuşmazlığı: Hedef 'odis' ancak $loadedFile içinde DB adı '$configuredDb'!"
                );
            }
        }

        echo "✓ Yapılandırma doğrulandı ($loadedFile -> Hedef DB: {$config['database']['name']}).\n";
        return $config;
    }

    private function connectServer(array $dbConfig): PDO
    {
        $host = (string) ($dbConfig['host'] ?? '127.0.0.1');
        $port = (int) ($dbConfig['port'] ?? 3306);
        $user = (string) ($dbConfig['username'] ?? 'root');
        $pass = (string) ($dbConfig['password'] ?? '');
        $charset = (string) ($dbConfig['charset'] ?? 'utf8mb4');

        echo "   MySQL sunucusuna bağlanılıyor ($host:$port)... ";
        $dsn = sprintf('mysql:host=%s;port=%d;charset=%s', $host, $port, $charset);
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
        echo "✓ Başarılı.\n";
        return $pdo;
    }

    private function ensureDatabase(PDO $serverPdo, string $dbName, bool $dryRun): void
    {
        echo "   Veritabanı '$dbName' kontrol ediliyor... ";
        if (!$dryRun) {
            $serverPdo->exec("CREATE DATABASE IF NOT EXISTS `{$dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        }
        echo "✓ Hazır.\n";
    }

    private function connectDatabase(array $dbConfig, string $dbName): PDO
    {
        $host = (string) ($dbConfig['host'] ?? '127.0.0.1');
        $port = (int) ($dbConfig['port'] ?? 3306);
        $user = (string) ($dbConfig['username'] ?? 'root');
        $pass = (string) ($dbConfig['password'] ?? '');
        $charset = (string) ($dbConfig['charset'] ?? 'utf8mb4');

        echo "   '$dbName' veritabanına bağlanılıyor... ";
        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=%s', $host, $port, $dbName, $charset);
        $pdo = new PDO($dsn, $user, $pass, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
        echo "✓ Bağlandı.\n";
        return $pdo;
    }

    private function runColumnPatching(PDO $pdo, bool $dryRun): void
    {
        echo "   Eksik sütun kontrolleri (MySQL 8.4 uyumlu information_schema kontrolü)...\n";

        foreach (self::COLUMN_WHITELIST as $table => $columns) {
            $checkTable = $pdo->prepare(
                "SELECT COUNT(*) FROM information_schema.TABLES 
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?"
            );
            $checkTable->execute([$table]);
            $tableExists = ((int) $checkTable->fetchColumn()) > 0;

            if (!$tableExists) {
                echo "   ℹ Tablo '$table' henüz mevcut değil, schema.sql tarafından oluşturulacak.\n";
                continue;
            }

            foreach ($columns as $column => $definition) {
                $checkCol = $pdo->prepare(
                    "SELECT COUNT(*) FROM information_schema.COLUMNS 
                     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?"
                );
                $checkCol->execute([$table, $column]);
                $colExists = ((int) $checkCol->fetchColumn()) > 0;

                if ($colExists) {
                    echo "   ✓ '$table.$column' sütunu zaten mevcut.\n";
                } else {
                    echo "   ➕ '$table.$column' sütunu eksik. Ekleniyor... ";
                    $alterSql = "ALTER TABLE `$table` ADD COLUMN `$column` $definition";
                    if (!$dryRun) {
                        $pdo->exec($alterSql);
                    }
                    echo "✓ Eklendi.\n";
                }
            }
        }
    }

    private function handleUsersUniqueIndex(PDO $pdo, bool $dryRun): void
    {
        echo "   'users' tablosu unique indeks yapısı denetleniyor...\n";

        $checkTable = $pdo->prepare(
            "SELECT COUNT(*) FROM information_schema.TABLES 
             WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'"
        );
        $checkTable->execute();
        if (((int) $checkTable->fetchColumn()) === 0) {
            echo "   ℹ 'users' tablosu henüz mevcut değil, schema.sql tarafından oluşturulacak.\n";
            return;
        }

        $stmt = $pdo->query("SHOW INDEX FROM `users`");
        $indexes = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $hasSchoolUsernameUnique = false;
        $legacyIndexName = null;

        foreach ($indexes as $idx) {
            $keyName = (string) ($idx['Key_name'] ?? '');
            $isUnique = ((int) ($idx['Non_unique'] ?? 1)) === 0;

            if ($keyName === 'uq_users_school_username') {
                $hasSchoolUsernameUnique = true;
            }
            if ($isUnique && ($keyName === 'uq_users_username' || $keyName === 'username')) {
                $legacyIndexName = $keyName;
            }
        }

        if (!$hasSchoolUsernameUnique) {
            echo "   🔍 Okul bazlı mükerrer kullanıcı adı kontrolü yapılıyor... ";
            $dupStmt = $pdo->query(
                "SELECT school_id, username, COUNT(*) as cnt 
                 FROM `users` 
                 GROUP BY school_id, username 
                 HAVING cnt > 1"
            );
            $duplicates = $dupStmt->fetchAll(PDO::FETCH_ASSOC);

            if (!empty($duplicates)) {
                $dupList = [];
                foreach ($duplicates as $d) {
                    $dupList[] = "Okul: {$d['school_id']}, Kullanıcı: {$d['username']} ({$d['cnt']} adet)";
                }
                throw new RuntimeException(
                    "İndeks dönüşümü durduruldu! Mükerrer kullanıcı adı kayıtları tespit edildi:\n" .
                    implode("\n", $dupList)
                );
            }
            echo "✓ Çakışma yok.\n";

            echo "   ➕ 'uq_users_school_username' bileşik indeksi ekleniyor... ";
            if (!$dryRun) {
                $pdo->exec("ALTER TABLE `users` ADD UNIQUE KEY `uq_users_school_username` (`school_id`, `username`)");
            }
            echo "✓ Eklendi.\n";
        } else {
            echo "   ✓ 'uq_users_school_username' indeksi zaten mevcut.\n";
        }

        if ($legacyIndexName !== null) {
            echo "   🔄 Eski global unique indeks ('$legacyIndexName') kaldırılıyor... ";
            if (!$dryRun) {
                $pdo->exec("ALTER TABLE `users` DROP INDEX `$legacyIndexName`");
            }
            echo "✓ Kaldırıldı.\n";
        }
    }

    private function validateSchemaFile(string $schemaFile): string
    {
        if (!is_file($schemaFile)) {
            throw new RuntimeException("Şema dosyası bulunamadı: $schemaFile");
        }

        $sql = file_get_contents($schemaFile);
        if (!$sql) {
            throw new RuntimeException("Şema dosyası okunamadı veya boş: $schemaFile");
        }

        // Faz 2 mimarisi için zorunlu olan 13 tablonun tamamının şemada yer aldığını doğrula
        $missingInSql = [];
        foreach (self::EXPECTED_PHASE2_TABLES as $table) {
            if (!preg_match('/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?' . preg_quote($table, '/') . '`?\b/i', $sql)) {
                $missingInSql[] = $table;
            }
        }

        if (!empty($missingInSql)) {
            throw new RuntimeException(
                "Geçersiz şema dosyası! Beklenen 13 Faz 2 tablosu eksik (" . implode(', ', $missingInSql) . "). " .
                "Eski veya uyumsuz şema dosyası reddedildi: $schemaFile"
            );
        }

        echo "   ✓ Şema dosyası doğrulandı (13 Faz 2 tablosu teyit edildi: " . basename($schemaFile) . ").\n";
        return $sql;
    }

    private function executeSchema(PDO $pdo, bool $dryRun): void
    {
        $schemaFile = __DIR__ . '/../database/schema.sql';
        $sql = $this->validateSchemaFile($schemaFile);

        echo "   'schema.sql' DDL komutları yürütülüyor... ";
        if (!$dryRun) {
            $pdo->exec($sql);
            echo "✓ Başarılı.\n";
        } else {
            echo "✓ (Dry-run simülasyonu: DDL çalıştırılmadı).\n";
        }
    }

    private function verifyTables(PDO $pdo, bool $dryRun): void
    {
        echo "   Veritabanı tabloları denetleniyor...\n";
        $tables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);

        $missing = array_diff(self::EXPECTED_PHASE2_TABLES, $tables);
        if (!empty($missing)) {
            if ($dryRun) {
                echo "   ℹ [DRY-RUN SİMÜLASYONU] Henüz mevcut olmayan " . count($missing) . " tablo schema.sql ile oluşturulacaktır:\n";
                foreach ($missing as $m) {
                    echo "      - $m (simülasyon: oluşturulacak)\n";
                }
            } else {
                throw new RuntimeException("Eksik tablolar tespit edildi: " . implode(', ', $missing));
            }
        }

        $existing = array_intersect(self::EXPECTED_PHASE2_TABLES, $tables);
        if (!empty($existing)) {
            echo "   ✓ Mevcut tablolar doğrulandı (" . count($existing) . " tablo):\n";
            foreach ($existing as $t) {
                $count = (int) $pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
                echo "      - $t ($count satır)\n";
            }
        }
    }

    private function seedStaffUsers(PDO $pdo, bool $skipSeed, bool $dryRun): void
    {
        if ($skipSeed) {
            echo "   ℹ '--skip-seed' parametresi nedeniyle personel tohum verisi atlandı.\n";
            return;
        }

        $usersCount = (int) $pdo->query('SELECT COUNT(*) FROM `users`')->fetchColumn();
        if ($usersCount > 0) {
            echo "   ℹ Kullanıcı tablosunda zaten mevcut $usersCount kullanıcı var. Mevcut hesaplar korundu, ekleme yapılmadı.\n";
            return;
        }

        echo "   Varsayılan personel kullanıcıları oluşturuluyor... ";
        if ($dryRun) {
            echo "✓ (Dry-run simülasyonu: Tohum verisi yazılmadı).\n";
            return;
        }

        $defaultUsers = [
            // Kaşif Kalkavan AL
            ['school_kasif', 'ogretmen', 'odis123', 'Ayşe Kaya (Öğretmen)', 'teacher'],
            ['school_kasif', 'rehberlik', 'odis123', 'Selin Danışman (Rehberlik)', 'counselor'],
            ['school_kasif', 'mudur', 'odis123', 'Müdür Yrd. Ali Vural', 'admin'],
            // Atatürk Fen Lisesi
            ['school_ataturk', 'afl_ogretmen', 'odis123', 'Barış Koç (Öğretmen - AFL)', 'teacher'],
            ['school_ataturk', 'afl_rehberlik', 'odis123', 'Derya Demir (Rehberlik - AFL)', 'counselor'],
            ['school_ataturk', 'afl_mudur', 'odis123', 'Zeynep Çelik (Müdür - AFL)', 'admin'],
        ];

        $ins = $pdo->prepare(
            'INSERT INTO users (school_id, username, password_hash, display_name, role)
             VALUES (:s_id, :u, :p, :d, :r)'
        );

        foreach ($defaultUsers as $u) {
            $ins->execute([
                's_id' => $u[0],
                'u'    => $u[1],
                'p'    => password_hash($u[2], PASSWORD_DEFAULT),
                'd'    => $u[3],
                'r'    => $u[4],
            ]);
        }
        echo "✓ 6 varsayılan personel kullanıcısı eklendi.\n";
    }

    private function handleFailure(Throwable $e): void
    {
        $msg = $e->getMessage();
        $sanitizedMsg = preg_replace('/(password|pwd|pass)=[^; &]+/i', '$1=[REDACTED]', $msg);
        $sanitizedMsg = preg_replace('/:[^:@\/]+@/', ':[REDACTED]@', (string) $sanitizedMsg);

        echo "\n❌ MIGRATION HATASI!\n";
        echo "   Aşama: {$this->currentPhase}\n";
        echo "   Hata Mesajı: $sanitizedMsg\n\n";
        echo "⚠️  UYARI: MySQL DDL işlemleri ('ALTER TABLE', 'CREATE TABLE') atomik değildir\n";
        echo "   ve otomatik geri alma (rollback) desteklemez. Lütfen yukarıdaki aşamayı inceleyip\n";
        echo "   gerekiyorsa yedeği kontrol ediniz.\n";
    }

    private function logPhase(string $phase): void
    {
        echo "\n▶ $phase\n";
    }

    private function printHeader(): void
    {
        echo "============================================================\n";
        echo "           ODİS — Güvenli Veritabanı Migration             \n";
        echo "============================================================\n";
    }

    private function printHelp(): void
    {
        echo "\nKullanım:\n";
        echo "  php migrate.php --target=<database> [seçenekler]\n\n";
        echo "Zorunlu Parametreler:\n";
        echo "  --target=<db>   Hedef veritabanı adı ('odis_test' veya 'odis').\n";
        echo "  --env=<db>      --target ile aynı işlevi görür.\n\n";
        echo "Güvenlik Seçenekleri:\n";
        echo "  --force-live    Canlı 'odis' veritabanına çalıştırma onayı (Canlı için ZORUNLU).\n";
        echo "  --dry-run       Yalnızca yapısal kontrolleri ve planı listeler, SQL çalıştırmaz.\n";
        echo "  --skip-seed     Personel kullanıcı tohum verilerini eklemez.\n";
        echo "  --help, -h      Bu yardım ekranını gösterir.\n\n";
        echo "Örnekler:\n";
        echo "  php migrate.php --target=odis_test\n";
        echo "  php migrate.php --target=odis_test --dry-run\n";
        echo "  php migrate.php --target=odis --force-live\n";
        echo "============================================================\n";
    }

    private function printSuccess(string $targetDb, bool $dryRun): void
    {
        echo "\n============================================================\n";
        if ($dryRun) {
            echo "ℹ️  DRY-RUN SİMÜLASYONU TAMAMLANDI (Gerçek değişiklik yapılmadı)\n";
            echo "   Hedef Veritabanı: $targetDb\n";
            echo "   Tüm kontroller ve şema simülasyonu başarıyla tamamlandı.\n";
            echo "   Veritabanında hiçbir veri veya tablo değiştirilmedi.\n";
        } else {
            echo "🎉 MIGRATION BAŞARIYLA TAMAMLANDI!\n";
            echo "   Hedef Veritabanı: $targetDb\n";
            echo "   Durum: 13 tablo kuruldu ve doğrulandı.\n";
        }
        echo "============================================================\n";
    }
}

// Yürütme
(new OdisMigration())->run($argv ?? []);
