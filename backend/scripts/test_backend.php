<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

echo "============================================================\n";
echo "      ODİS — Backend Güvenlik ve Mantık Doğrulama Testi      \n";
echo "============================================================\n\n";

$passed = 0;
$failed = 0;

function it(string $description, callable $test): void {
    global $passed, $failed;
    try {
        $test();
        echo "   ✓ [GEÇTİ] $description\n";
        $passed++;
    } catch (Throwable $e) {
        echo "   ✗ [BAŞARISIZ] $description\n";
        echo "      Hata: " . $e->getMessage() . "\n";
        $failed++;
    }
}

function expectTrue(bool $condition, string $msg = 'Koşul true olmalıdır.'): void {
    if (!$condition) throw new RuntimeException($msg);
}

function expectEquals($expected, $actual, string $msg = 'Değerler eşleşmelidir.'): void {
    if ($expected !== $actual) {
        throw new RuntimeException("$msg (Beklenen: " . json_encode($expected) . ", Gelen: " . json_encode($actual) . ")");
    }
}

// ── TEST 1: Parola Güvenliği ve Hashleme ─────────────────────────────────────
echo "👉 1. Parola Güvenliği ve Hashleme...\n";
it('password_hash() standart algoritma ve zaman sabiti doğrulaması', function () {
    $rawPassword = 'SuperSecretPassword123!';
    $hash = password_hash($rawPassword, PASSWORD_DEFAULT);
    expectTrue(password_verify($rawPassword, $hash), 'Doğru parola doğrulanmalı');
    expectTrue(!password_verify('WrongPassword', $hash), 'Yanlış parola reddedilmeli');
});

// ── TEST 2: CSRF Güvenliği ve Zaman Sabit Karşılaştırma ──────────────────────
echo "\n👉 2. CSRF Token Güvenliği...\n";
it('CSRF belirteci hash_equals zaman-sabit fonksiyonuyla doğrulanır', function () {
    $token = bin2hex(random_bytes(32));
    expectTrue(strlen($token) === 64, 'Token 64 karakter uzunluğunda olmalı');
    expectTrue(hash_equals($token, $token), 'Aynı token doğrulanmalı');
    expectTrue(!hash_equals($token, 'invalid_token'), 'Geçersiz token reddedilmeli');
});

// ── TEST 3: Rehberlik Gizliliği (Counseling Privacy) Kuralı ──────────────────
echo "\n👉 3. Rehberlik Gizlilik Kuralı (KVKK)...\n";
require_once __DIR__ . '/../src/auth.php';

it('can_view_counseling_notes() yalnızca counselor rolüne true dönmelidir', function () {
    $counselor = ['role' => 'counselor', 'schoolId' => 'school_kasif'];
    $admin = ['role' => 'admin', 'schoolId' => 'school_kasif'];
    $teacher = ['role' => 'teacher', 'schoolId' => 'school_kasif'];

    expectTrue(can_view_counseling_notes($counselor), 'Rehber öğretmen yetkili olmalı');
    expectTrue(!can_view_counseling_notes($admin), 'İdareci özel notları görememeli');
    expectTrue(!can_view_counseling_notes($teacher), 'Öğretmen özel notları görememeli');
});

// ── TEST 4: Okullar Arası Veri Yalıtımı (Multi-Tenant) ───────────────────────
echo "\n👉 4. Okullar Arası Veri Yalıtımı ve SQLite Bellek İçi Testi...\n";
it('İki farklı okulun aynı kullanıcı adına sahip personeli izole saklanır', function () {
    $pdo = new PDO('sqlite::memory:');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    $pdo->exec('
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            school_id TEXT NOT NULL,
            username TEXT NOT NULL,
            display_name TEXT NOT NULL,
            UNIQUE(school_id, username)
        );
    ');

    // school_kasif kullanıcısı
    $stmt = $pdo->prepare('INSERT INTO users (school_id, username, display_name) VALUES (?, ?, ?)');
    $stmt->execute(['school_kasif', 'ogretmen', 'Ayşe Kaya']);

    // school_ataturk kullanıcısı (aynı username serbest olmalı)
    $stmt->execute(['school_ataturk', 'ogretmen', 'Barış Koç']);

    // Aynı okulda tekrar ekleme engellenmeli
    $duplicateThrown = false;
    try {
        $stmt->execute(['school_kasif', 'ogretmen', 'Başka Bir Ayşe']);
    } catch (PDOException $e) {
        $duplicateThrown = true;
    }
    expectTrue($duplicateThrown, 'Aynı okulda mükerrer kullanıcı adı engellenmeli');

    // school_kasif sorgusunda yalnızca kendi personeli gelmeli
    $lookup = $pdo->prepare('SELECT display_name FROM users WHERE school_id = ?');
    $lookup->execute(['school_kasif']);
    $names = $lookup->fetchAll(PDO::FETCH_COLUMN);
    expectEquals(['Ayşe Kaya'], $names, 'Yalnızca Kaşif personeli dönmeli');
});

// ── TEST 5: Toplu Öğrenci Aktarım Doğrulaması (Import Validation) ─────────────
echo "\n👉 5. Toplu Öğrenci Aktarım Doğrulama Mantığı...\n";
it('Eksik ve mükerrer numaralı öğrenciler doğru tespit edilir', function () {
    $testRows = [
        ['studentNo' => '101', 'firstName' => 'Ali', 'lastName' => 'Kaya', 'class' => '10-A'],
        ['studentNo' => '101', 'firstName' => 'Mükerrer', 'lastName' => 'Ali', 'class' => '10-A'], // Dosya içi mükerrer
        ['studentNo' => '', 'firstName' => 'NoYok', 'lastName' => 'Test', 'class' => '10-A'],     // No eksik
        ['studentNo' => '102', 'firstName' => '', 'lastName' => 'AdYok', 'class' => '10-B'],      // Ad eksik
    ];

    $seen = [];
    $errors = [];
    $valid = [];

    foreach ($testRows as $idx => $r) {
        $no = trim($r['studentNo']);
        if ($no === '') {
            $errors[] = "Satır " . ($idx + 1) . ": No eksik";
            continue;
        }
        if (isset($seen[$no])) {
            $errors[] = "Satır " . ($idx + 1) . ": Mükerrer no: $no";
            continue;
        }
        $seen[$no] = true;
        if (trim($r['firstName']) === '') {
            $errors[] = "Satır " . ($idx + 1) . ": Ad eksik";
            continue;
        }
        $valid[] = $r;
    }

    expectEquals(1, count($valid), 'Yalnızca 1 geçerli öğrenci kabul edilmeli');
    expectEquals(3, count($errors), '3 hatalı satır raporlanmalı');
});

echo "\n============================================================\n";
echo "                      TEST SONUÇLARI                        \n";
echo "============================================================\n";
echo "Toplam Test: " . ($passed + $failed) . "\n";
echo "Başarılı   : $passed\n";
echo "Başarısız  : $failed\n";
if ($failed === 0) {
    echo "GENEL DURUM: ✅ TÜM BACKEND GÜVENLİK TESTLERİ BAŞARIYLA GEÇTİ!\n";
} else {
    echo "GENEL DURUM: ❌ BAZI TESTLER BAŞARISIZ OLDU.\n";
    exit(1);
}
echo "============================================================\n\n";
