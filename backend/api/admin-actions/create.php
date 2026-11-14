<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/auth.php';

require_method('POST');
require_csrf();

$user = require_user($pdo);
require_role($user, ['admin']);

$input = request_json();

$studentId   = trim((string) ($input['studentId'] ?? ''));
$actionType  = trim((string) ($input['actionType'] ?? ''));
$description = trim((string) ($input['description'] ?? ''));
$actionDate  = trim((string) ($input['date'] ?? ''));

if ($studentId === '' || $actionType === '') {
    json_response(['error' => 'Öğrenci ve idari işlem türü zorunludur.'], 422);
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

$id   = 'act_' . bin2hex(random_bytes(16));
$date = !empty($actionDate) ? date('Y-m-d H:i:s', strtotime($actionDate)) : date('Y-m-d H:i:s');

$insert = $pdo->prepare(
    'INSERT INTO admin_actions (id, school_id, academic_year_id, student_id, action_type, description, action_date, created_by_id, created_by_name)
     VALUES (:id, :school_id, :ay_id, :student_id, :action_type, :description, :action_date, :creator_id, :creator_name)'
);

$insert->execute([
    'id'           => $id,
    'school_id'    => $user['schoolId'],
    'ay_id'        => $student['academic_year_id'],
    'student_id'   => $studentId,
    'action_type'  => $actionType,
    'description'  => $description,
    'action_date'  => $date,
    'creator_id'   => $user['id'],
    'creator_name' => $user['displayName'],
]);

write_audit(
    $pdo,
    $user,
    'CREATE_ADMIN_ACTION',
    'admin_action',
    $id,
    "İdari işlem uygulandı: {$student['first_name']} {$student['last_name']} ({$actionType})"
);

json_response([
    'success' => true,
    'action'  => [
        'id'          => $id,
        'schoolId'    => $user['schoolId'],
        'studentId'   => $studentId,
        'actionType'  => $actionType,
        'description' => $description,
        'date'        => $date,
        'createdBy'   => $user['displayName'],
    ],
], 201);
