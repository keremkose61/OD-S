<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/auth.php';

require_method('POST');
require_csrf();

$user = require_user($pdo);
require_role($user, ['admin']);

$input = request_json();

$studentId = trim((string) ($input['id'] ?? $input['studentId'] ?? ''));
if ($studentId === '') {
    json_response(['error' => 'Geçersiz öğrenci kimliği.'], 422);
}

// Okul yalıtımı: Öğrenci yalnızca oturum açmış kullanıcının kendi okulunda aranır.
// school_id ASLA istemciden alınmaz; değiştirilemez.
$stmt = $pdo->prepare(
    'SELECT id, school_id, academic_year_id, student_no, first_name, last_name, class_name, gender, birth_date, avatar_color, active
     FROM students
     WHERE id = :id AND school_id = :school_id
     LIMIT 1'
);
$stmt->execute([
    'id'        => $studentId,
    'school_id' => $user['schoolId'],
]);
$existing = $stmt->fetch();

if (!$existing || (int) $existing['active'] !== 1) {
    // Veri sızıntısını önlemek için öğrenci başka okulda kayıtlı olsa veya pasif olsa dahi 404 dönülür.
    json_response(['error' => 'Öğrenci bulunamadı.'], 404);
}

$studentNo      = trim((string) ($input['studentNo'] ?? $existing['student_no']));
$firstName      = trim((string) ($input['firstName'] ?? $existing['first_name']));
$lastName       = trim((string) ($input['lastName'] ?? $existing['last_name']));
$className      = trim((string) ($input['class'] ?? $input['className'] ?? $existing['class_name']));
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
$genderInput    = array_key_exists('gender', $input) ? trim((string) $input['gender']) : (string) ($existing['gender'] ?? '');
$birthDateInput = array_key_exists('birthDate', $input) ? trim((string) $input['birthDate']) : (string) ($existing['birth_date'] ?? '');
$avatarColor    = trim((string) ($input['avatarColor'] ?? $existing['avatar_color'] ?? '#2563eb'));

if ($studentNo === '' || $firstName === '' || $lastName === '' || $className === '') {
    json_response(['error' => 'Öğrenci no, ad, soyad ve sınıf alanları zorunludur.'], 422);
}

// Uzunluk sınırları (schema.sql doğrulaması)
if (mb_strlen($studentNo) > 20 || mb_strlen($firstName) > 100 || mb_strlen($lastName) > 100 || mb_strlen($className) > 50 || mb_strlen($avatarColor) > 20) {
    json_response(['error' => 'Alan uzunlukları veritabanı sınırlarını aşıyor.'], 422);
}

// Cinsiyet doğrulaması
$gender = in_array($genderInput, ['male', 'female', 'other'], true) ? $genderInput : null;

// Doğum tarihi formatı (YYYY-MM-DD veya boş)
$birthDate = null;
if ($birthDateInput !== '') {
    $d = DateTime::createFromFormat('Y-m-d', $birthDateInput);
    if ($d && $d->format('Y-m-d') === $birthDateInput) {
        $birthDate = $birthDateInput;
    } else {
        json_response(['error' => 'Geçersiz doğum tarihi formatı (YYYY-AA-GG).'], 422);
    }
}

// Mükerrer öğrenci no kontrolü (kendi kaydı haricinde aynı okul ve akademik yılda)
$check = $pdo->prepare(
    'SELECT id FROM students
     WHERE school_id = :school_id AND academic_year_id = :ay_id AND student_no = :no AND id != :id
     LIMIT 1'
);
$check->execute([
    'school_id' => $user['schoolId'],
    'ay_id'     => $academicYearId,
    'no'        => $studentNo,
    'id'        => $studentId,
]);
if ($check->fetch()) {
    json_response(['error' => "Bu okulda {$studentNo} numaralı başka bir öğrenci zaten kayıtlı."], 409);
}

// Atomik Güncelleme ve Audit Kaydı (SEC-03)
// school_id ve id kesinlikle güncellenmez; WHERE koşulunda okul kısıtı korunur.
$manageTransaction = !$pdo->inTransaction();
if ($manageTransaction) {
    $pdo->beginTransaction();
}

try {
    $update = $pdo->prepare(
        'UPDATE students
         SET student_no = :no,
             first_name = :fn,
             last_name = :ln,
             class_name = :cn,
             academic_year_id = :ay_id,
             gender = :gender,
             birth_date = :bd,
             avatar_color = :avatar,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = :id AND school_id = :school_id'
    );

    $update->execute([
        'no'        => $studentNo,
        'fn'        => $firstName,
        'ln'        => $lastName,
        'cn'        => $className,
        'ay_id'     => $academicYearId,
        'gender'    => $gender,
        'bd'        => $birthDate,
        'avatar'    => $avatarColor,
        'id'        => $studentId,
        'school_id' => $user['schoolId'],
    ]);

    write_audit(
        $pdo,
        $user,
        'UPDATE_STUDENT',
        'student',
        $studentId,
        "Öğrenci bilgileri güncellendi: {$firstName} {$lastName} ({$studentNo} - {$className})"
    );

    if ($manageTransaction) {
        $pdo->commit();
    }
} catch (Throwable $e) {
    if ($manageTransaction && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Student update error: ' . $e->getMessage());
    json_response(['error' => 'Öğrenci güncellenirken bir hata oluştu.'], 500);
}

json_response([
    'success' => true,
    'message' => 'Öğrenci bilgileri başarıyla güncellendi.',
    'student' => [
        'id'             => $studentId,
        'schoolId'       => $user['schoolId'],
        'academicYearId' => $academicYearId,
        'studentNo'      => $studentNo,
        'firstName'      => $firstName,
        'lastName'       => $lastName,
        'class'          => $className,
        'gender'         => $gender,
        'birthDate'      => $birthDate,
        'avatarColor'    => $avatarColor,
    ],
]);
