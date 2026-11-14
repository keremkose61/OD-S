<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/auth.php';

require_method('POST');
require_csrf();

$user = require_user($pdo);
require_role($user, ['admin']);

$input = request_json();

$studentNo = trim((string) ($input['studentNo'] ?? ''));
$firstName = trim((string) ($input['firstName'] ?? ''));
$lastName  = trim((string) ($input['lastName'] ?? ''));
$className = trim((string) ($input['class'] ?? ''));
$academicYearId = trim((string) ($input['academicYearId'] ?? ''));
$gender    = trim((string) ($input['gender'] ?? ''));
$birthDate = trim((string) ($input['birthDate'] ?? ''));
$avatarColor = trim((string) ($input['avatarColor'] ?? '#2563eb'));

if ($studentNo === '' || $firstName === '' || $lastName === '' || $className === '') {
    json_response(['error' => 'Öğrenci no, ad, soyad ve sınıf alanları zorunludur.'], 422);
}

// Akademik yıl belirleme ve okul aidiyeti doğrulaması (SEC-01)
if ($academicYearId === '') {
    $ayStmt = $pdo->prepare('SELECT id FROM academic_years WHERE school_id = :school_id AND is_current = 1 LIMIT 1');
    $ayStmt->execute(['school_id' => $user['schoolId']]);
    $academicYearId = (string) ($ayStmt->fetchColumn() ?: '');

    if ($academicYearId === '') {
        $ayFallbackStmt = $pdo->prepare('SELECT id FROM academic_years WHERE school_id = :school_id ORDER BY start_date DESC LIMIT 1');
        $ayFallbackStmt->execute(['school_id' => $user['schoolId']]);
        $academicYearId = (string) ($ayFallbackStmt->fetchColumn() ?: '');
    }

    if ($academicYearId === '') {
        json_response(['error' => 'Bu okul için tanımlı geçerli bir akademik yıl bulunamadı.'], 422);
    }
} else {
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
}

// Bu okulda aynı öğrenci numarası var mı?
$check = $pdo->prepare(
    'SELECT id FROM students WHERE school_id = :school_id AND academic_year_id = :ay_id AND student_no = :no LIMIT 1'
);
$check->execute([
    'school_id' => $user['schoolId'],
    'ay_id'     => $academicYearId,
    'no'        => $studentNo,
]);
if ($check->fetch()) {
    json_response(['error' => "Bu okulda {$studentNo} numaralı öğrenci zaten kayıtlı."], 409);
}

$id = 'stu_' . bin2hex(random_bytes(16));

$insert = $pdo->prepare(
    'INSERT INTO students (id, school_id, academic_year_id, student_no, first_name, last_name, class_name, gender, birth_date, avatar_color)
     VALUES (:id, :school_id, :ay_id, :no, :fn, :ln, :cn, :gender, :bd, :avatar)'
);

$manageTransaction = !$pdo->inTransaction();
if ($manageTransaction) {
    $pdo->beginTransaction();
}

try {
    $insert->execute([
        'id'        => $id,
        'school_id' => $user['schoolId'],
        'ay_id'     => $academicYearId,
        'no'        => $studentNo,
        'fn'        => $firstName,
        'ln'        => $lastName,
        'cn'        => $className,
        'gender'    => in_array($gender, ['male', 'female', 'other'], true) ? $gender : null,
        'bd'        => !empty($birthDate) ? $birthDate : null,
        'avatar'    => $avatarColor,
    ]);

    write_audit($pdo, $user, 'CREATE_STUDENT', 'student', $id, "Öğrenci kaydı oluşturuldu: {$firstName} {$lastName} ({$studentNo} - {$className})");

    if ($manageTransaction) {
        $pdo->commit();
    }
} catch (Throwable $e) {
    if ($manageTransaction && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Student create error: ' . $e->getMessage());
    json_response(['error' => 'Öğrenci kaydı oluşturulurken bir hata oluştu.'], 500);
}

json_response([
    'success' => true,
    'student' => [
        'id'             => $id,
        'schoolId'       => $user['schoolId'],
        'academicYearId' => $academicYearId,
        'studentNo'      => $studentNo,
        'firstName'      => $firstName,
        'lastName'       => $lastName,
        'class'          => $className,
        'avatarColor'    => $avatarColor,
    ],
], 201);
