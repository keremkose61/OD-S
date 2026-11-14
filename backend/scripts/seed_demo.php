<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

echo "============================================================\n";
echo "           ODİS — Demo Veri Yükleme (Seed)                  \n";
echo "============================================================\n\n";

$configFile = __DIR__ . '/../config/config.local.php';
if (!is_file($configFile)) {
    $config = [
        'database' => [
            'host'     => '127.0.0.1',
            'port'     => 3306,
            'name'     => 'odis',
            'username' => 'root',
            'password' => '',
            'charset'  => 'utf8mb4',
        ],
    ];
} else {
    $config = require $configFile;
}

require_once __DIR__ . '/../src/Database.php';

try {
    $pdo = Database::connection($config);

    // 1. Akademik Yıllar
    echo "1. Akademik Yıllar Ekleniyor...\n";
    $years = [
        ['ay_kasif_2526', 'school_kasif', '2025-2026', '2025–2026 Eğitim-Öğretim Yılı', 0],
        ['ay_kasif_2627', 'school_kasif', '2026-2027', '2026–2027 Eğitim-Öğretim Yılı', 1],
        ['ay_afl_2627',   'school_ataturk', '2026-2027', '2026–2027 Eğitim-Öğretim Yılı', 1],
    ];
    $ayStmt = $pdo->prepare(
        'INSERT INTO academic_years (id, school_id, code, label, is_current)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE label = VALUES(label), is_current = VALUES(is_current)'
    );
    foreach ($years as $y) {
        $ayStmt->execute($y);
        echo "   ✓ {$y[3]} ({$y[1]})\n";
    }

    // 2. Demo Öğrenciler
    echo "\n2. Demo Öğrenciler Ekleniyor...\n";
    $students = [
        // Kaşif Kalkavan AL öğrencileri
        ['stu_kasif_01', 'school_kasif', 'ay_kasif_2627', '101', 'Ahmet', 'Yılmaz', '10-A', 'male', '#2563eb'],
        ['stu_kasif_02', 'school_kasif', 'ay_kasif_2627', '102', 'Zeynep', 'Kaya', '10-A', 'female', '#db2777'],
        ['stu_kasif_03', 'school_kasif', 'ay_kasif_2627', '103', 'Mehmet', 'Demir', '10-B', 'male', '#7c3aed'],
        ['stu_kasif_04', 'school_kasif', 'ay_kasif_2627', '104', 'Elif', 'Şahin', '10-B', 'female', '#ea580c'],
        ['stu_kasif_05', 'school_kasif', 'ay_kasif_2627', '105', 'Caner', 'Bulut', '10-A', 'male', '#059669'],
        ['stu_kasif_06', 'school_kasif', 'ay_kasif_2627', '201', 'Burak', 'Öztürk', '11-A', 'male', '#0891b2'],
        ['stu_kasif_07', 'school_kasif', 'ay_kasif_2627', '202', 'Seda', 'Aydın', '11-A', 'female', '#ca8a04'],
        ['stu_kasif_08', 'school_kasif', 'ay_kasif_2627', '301', 'Emre', 'Koç', '12-A', 'male', '#4f46e5'],
        // Atatürk Fen Lisesi öğrencileri (Okul yalıtım testi için)
        ['stu_afl_01', 'school_ataturk', 'ay_afl_2627', '1001', 'Alp', 'Arslan', '9-FEN-A', 'male', '#16a34a'],
        ['stu_afl_02', 'school_ataturk', 'ay_afl_2627', '1002', 'Defne', 'Yıldız', '9-FEN-A', 'female', '#9333ea'],
        ['stu_afl_03', 'school_ataturk', 'ay_afl_2627', '1003', 'Kaan', 'Tekin', '10-FEN-A', 'male', '#dc2626'],
    ];

    $stuStmt = $pdo->prepare(
        'INSERT INTO students (id, school_id, academic_year_id, student_no, first_name, last_name, class_name, gender, avatar_color)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name), class_name = VALUES(class_name)'
    );
    foreach ($students as $s) {
        $stuStmt->execute($s);
        echo "   ✓ {$s[3]} - {$s[4]} {$s[5]} ({$s[6]} - {$s[1]})\n";
    }

    echo "\n============================================================\n";
    echo "🎉 DEMO VERİLER BAŞARIYLA YÜKLENDİ!\n";
    echo "============================================================\n";
} catch (Throwable $e) {
    echo "\n❌ Demo seed hatası: " . $e->getMessage() . "\n";
    exit(1);
}
