<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/auth.php';

require_method('POST');
require_csrf();

$user = require_user($pdo);
// Öğretmen ve İdare gözlem kaydı bildirebilir
require_role($user, ['teacher', 'admin']);

$input = request_json();

$studentId   = trim((string) ($input['studentId'] ?? ''));
$description = trim((string) ($input['description'] ?? ''));
$source      = trim((string) ($input['source'] ?? 'Öğretmen Gözlemi'));

if ($studentId === '' || $description === '') {
    json_response(['error' => 'Öğrenci ve gözlem açıklaması zorunludur.'], 422);
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

$id = 'obs_' . bin2hex(random_bytes(16));
$now = date('Y-m-d H:i:s');

$insert = $pdo->prepare(
    'INSERT INTO observations (id, school_id, academic_year_id, student_id, student_class,
                               description, source, verification_status, recorded_at, created_by_id, created_by_name)
     VALUES (:id, :school_id, :ay_id, :student_id, :class,
             :description, :source, "reported", :recorded_at, :creator_id, :creator_name)'
);

$insert->execute([
    'id'           => $id,
    'school_id'    => $user['schoolId'],
    'ay_id'        => $student['academic_year_id'],
    'student_id'   => $studentId,
    'class'        => $student['class_name'],
    'description'  => $description,
    'source'       => $source,
    'recorded_at'  => $now,
    'creator_id'   => $user['id'],
    'creator_name' => $user['displayName'],
]);

write_audit(
    $pdo,
    $user,
    'CREATE_OBSERVATION',
    'observation',
    $id,
    "Davranış gözlemi bildirildi: {$student['first_name']} {$student['last_name']}"
);

json_response([
    'success'     => true,
    'observation' => [
        'id'                 => $id,
        'schoolId'           => $user['schoolId'],
        'studentId'          => $studentId,
        'studentClass'       => $student['class_name'],
        'description'        => $description,
        'source'             => $source,
        'verificationStatus' => 'reported',
        'dateTime'           => $now,
        'createdBy'          => $user['displayName'],
    ],
], 201);
