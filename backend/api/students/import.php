<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/auth.php';

require_method('POST');
require_csrf();

$user = require_user($pdo);
require_role($user, ['admin']);

$input = request_json();
$students = $input['students'] ?? [];
$academicYearId = trim((string) ($input['academicYearId'] ?? ''));

if (!is_array($students) || empty($students)) {
    json_response(['error' => 'İçe aktarılacak geçerli öğrenci listesi bulunamadı.'], 422);
}

// Aktif akademik yılı belirle
if ($academicYearId === '') {
    $ayStmt = $pdo->prepare('SELECT id FROM academic_years WHERE school_id = :school_id AND is_current = 1 LIMIT 1');
    $ayStmt->execute(['school_id' => $user['schoolId']]);
    $academicYearId = (string) ($ayStmt->fetchColumn() ?: 'ay_default');
}

// Mevcut öğrenci numaralarını hafızaya al (hızlı mükerrer kontrolü için)
$existingStmt = $pdo->prepare(
    'SELECT student_no FROM students WHERE school_id = :school_id AND academic_year_id = :ay_id'
);
$existingStmt->execute([
    'school_id' => $user['schoolId'],
    'ay_id'     => $academicYearId,
]);
$existingNos = array_flip($existingStmt->fetchAll(PDO::FETCH_COLUMN));

$validRows = [];
$errors = [];
$seenFileNos = [];

$colors = [
    '#2563eb', '#7c3aed', '#db2777', '#dc2626',
    '#ea580c', '#ca8a04', '#16a34a', '#0891b2',
];

foreach ($students as $idx => $row) {
    $lineNum = $idx + 1;
    $no = trim((string) ($row['studentNo'] ?? $row['no'] ?? ''));
    $fn = trim((string) ($row['firstName'] ?? $row['ad'] ?? ''));
    $ln = trim((string) ($row['lastName'] ?? $row['soyad'] ?? ''));
    $cn = trim((string) ($row['class'] ?? $row['sinif'] ?? ''));
    $gender = strtolower(trim((string) ($row['gender'] ?? $row['cinsiyet'] ?? '')));

    if ($no === '') {
        $errors[] = "Satır $lineNum: Öğrenci numarası eksik.";
        continue;
    }
    if (isset($seenFileNos[$no])) {
        $errors[] = "Satır $lineNum: Dosya içinde mükerrer öğrenci no: $no.";
        continue;
    }
    $seenFileNos[$no] = true;

    if (isset($existingNos[$no])) {
        $errors[] = "Satır $lineNum: Öğrenci no ($no) bu okulda zaten kayıtlı.";
        continue;
    }
    if ($fn === '') {
        $errors[] = "Satır $lineNum: Öğrenci adı eksik ($no).";
        continue;
    }
    if ($ln === '') {
        $errors[] = "Satır $lineNum: Öğrenci soyadı eksik ($no).";
        continue;
    }
    if ($cn === '') {
        $errors[] = "Satır $lineNum: Öğrenci sınıfı eksik ($no).";
        continue;
    }

    $validGender = in_array($gender, ['k', 'kız', 'female'], true) ? 'female' :
                   (in_array($gender, ['e', 'erkek', 'male'], true) ? 'male' : null);

    $avatarColor = $colors[abs(crc32($fn . $ln)) % count($colors)];

    $validRows[] = [
        'id'        => 'stu_' . bin2hex(random_bytes(16)),
        'school_id' => $user['schoolId'],
        'ay_id'     => $academicYearId,
        'no'        => $no,
        'fn'        => $fn,
        'ln'        => $ln,
        'cn'        => $cn,
        'gender'    => $validGender,
        'avatar'    => $avatarColor,
    ];
}

// Veritabanına toplu ekleme (Transaction)
$importedCount = 0;
if (!empty($validRows)) {
    $pdo->beginTransaction();
    try {
        $stmt = $pdo->prepare(
            'INSERT INTO students (id, school_id, academic_year_id, student_no, first_name, last_name, class_name, gender, avatar_color)
             VALUES (:id, :school_id, :ay_id, :no, :fn, :ln, :cn, :gender, :avatar)'
        );

        foreach ($validRows as $r) {
            $stmt->execute($r);
            $importedCount++;
        }

        $pdo->commit();

        write_audit(
            $pdo,
            $user,
            'IMPORT_STUDENTS',
            'student',
            null,
            "Toplu öğrenci aktarımı: $importedCount öğrenci başarıyla eklendi."
        );
    } catch (Throwable $e) {
        $pdo->rollBack();
        json_response(['error' => 'Toplu aktarım sırasında veritabanı hatası oluştu: ' . $e->getMessage()], 500);
    }
}

json_response([
    'success'       => true,
    'importedCount' => $importedCount,
    'errorCount'    => count($errors),
    'errors'        => $errors,
]);
