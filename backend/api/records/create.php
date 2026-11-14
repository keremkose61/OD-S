<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/auth.php';

require_method('POST');
require_csrf();

$user = require_user($pdo);
// Öğretmen ve İdare kural kaydı girebilir
require_role($user, ['teacher', 'admin']);

$input = request_json();

$studentId = trim((string) ($input['studentId'] ?? ''));
$category  = trim((string) ($input['category'] ?? ''));
$description = trim((string) ($input['description'] ?? ''));
$dateTime    = trim((string) ($input['dateTime'] ?? ''));
$isDuplicateConfirmed = !empty($input['isDuplicateConfirmed']);

$allowedCategories = ['kilik-kiyafet', 'sac', 'sakal', 'arma', 'makyaj', 'aksesuar', 'gec-gelme', 'diger'];
if (!in_array($category, $allowedCategories, true)) {
    json_response(['error' => 'Geçersiz disiplin/düzen kategorisi.'], 422);
}

// Öğrencinin bu okulda kayıtlı olduğunu doğrula
$stuStmt = $pdo->prepare(
    'SELECT id, student_no, first_name, last_name, class_name, academic_year_id
     FROM students
     WHERE id = :id AND school_id = :school_id AND active = 1
     LIMIT 1'
);
$stuStmt->execute(['id' => $studentId, 'school_id' => $user['schoolId']]);
$student = $stuStmt->fetch();

if (!$student) {
    json_response(['error' => 'Öğrenci bulunamadı veya bu okul kapsamında değil.'], 404);
}

$recordDate = !empty($dateTime) ? date('Y-m-d H:i:s', strtotime($dateTime)) : date('Y-m-d H:i:s');
$todayDate  = date('Y-m-d', strtotime($recordDate));

// Aynı gün aynı kategori mükerrerlik kontrolü (PDF Şartnamesi Bölüm 4)
if (!$isDuplicateConfirmed) {
    $dupStmt = $pdo->prepare(
        'SELECT id, recorded_at, created_by_name
         FROM order_records
         WHERE school_id = :school_id
           AND student_id = :student_id
           AND category = :category
           AND status = "active"
           AND DATE(recorded_at) = :today
         LIMIT 1'
    );
    $dupStmt->execute([
        'school_id'  => $user['schoolId'],
        'student_id' => $studentId,
        'category'   => $category,
        'today'      => $todayDate,
    ]);
    $duplicate = $dupStmt->fetch();

    if ($duplicate) {
        json_response([
            'isDuplicateWarning' => true,
            'existingRecord'     => $duplicate,
            'message'            => 'Bu öğrenci hakkında bugün aynı kategoride zaten bir kayıt girilmiş. Devam etmek için onaylayın.',
        ], 409);
    }
}

$id = 'rec_' . bin2hex(random_bytes(16));

$insert = $pdo->prepare(
    'INSERT INTO order_records (id, school_id, academic_year_id, student_id, student_class,
                                category, description, recorded_at, created_by_id, created_by_name,
                                is_duplicate_confirmed, status)
     VALUES (:id, :school_id, :ay_id, :student_id, :class,
             :category, :description, :recorded_at, :creator_id, :creator_name,
             :is_dup, "active")'
);

$insert->execute([
    'id'           => $id,
    'school_id'    => $user['schoolId'],
    'ay_id'        => $student['academic_year_id'],
    'student_id'   => $studentId,
    'class'        => $student['class_name'],
    'category'     => $category,
    'description'  => $description,
    'recorded_at'  => $recordDate,
    'creator_id'   => $user['id'],
    'creator_name' => $user['displayName'],
    'is_dup'       => $isDuplicateConfirmed ? 1 : 0,
]);

write_audit(
    $pdo,
    $user,
    'CREATE_ORDER_RECORD',
    'order_record',
    $id,
    "Disiplin/düzen kaydı eklendi: {$student['first_name']} {$student['last_name']} ({$category})"
);

json_response([
    'success' => true,
    'record'  => [
        'id'           => $id,
        'schoolId'     => $user['schoolId'],
        'studentId'    => $studentId,
        'studentClass' => $student['class_name'],
        'category'     => $category,
        'description'  => $description,
        'dateTime'     => $recordDate,
        'createdBy'    => $user['displayName'],
        'status'       => 'active',
    ],
], 201);
