<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/auth.php';

require_method('POST');
require_csrf();

$user = require_user($pdo);
require_role($user, ['counselor', 'admin']);

$input = request_json();

$studentId   = trim((string) ($input['studentId'] ?? ''));
$title       = trim((string) ($input['title'] ?? 'Rehberlik Değerlendirme Süreci'));
$description = trim((string) ($input['description'] ?? ''));
$priority    = trim((string) ($input['priority'] ?? 'medium'));
$source      = trim((string) ($input['referralSource'] ?? 'İdare Sevk'));

if ($studentId === '') {
    json_response(['error' => 'Öğrenci kimliği zorunludur.'], 422);
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

$id = 'case_' . bin2hex(random_bytes(16));
$now = date('Y-m-d H:i:s');

$insert = $pdo->prepare(
    'INSERT INTO support_cases (id, school_id, academic_year_id, student_id, student_class,
                               title, status, priority, description, referral_source,
                               referred_by_id, opened_at, created_by_id)
     VALUES (:id, :school_id, :ay_id, :student_id, :class,
             :title, "open", :priority, :description, :source,
             :referrer_id, :opened_at, :creator_id)'
);

$insert->execute([
    'id'          => $id,
    'school_id'   => $user['schoolId'],
    'ay_id'       => $student['academic_year_id'],
    'student_id'  => $studentId,
    'class'       => $student['class_name'],
    'title'       => $title,
    'priority'    => in_array($priority, ['low', 'medium', 'high', 'urgent'], true) ? $priority : 'medium',
    'description' => $description,
    'source'      => $source,
    'referrer_id' => $user['id'],
    'opened_at'   => $now,
    'creator_id'  => $user['id'],
]);

write_audit(
    $pdo,
    $user,
    'CREATE_SUPPORT_CASE',
    'support_case',
    $id,
    "Rehberlik sevk süreci açıldı: {$student['first_name']} {$student['last_name']} ({$title})"
);

json_response([
    'success' => true,
    'case'    => [
        'id'           => $id,
        'schoolId'     => $user['schoolId'],
        'studentId'    => $studentId,
        'studentClass' => $student['class_name'],
        'title'        => $title,
        'status'       => 'open',
        'openedAt'     => $now,
    ],
], 201);
