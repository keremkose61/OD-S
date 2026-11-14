<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/auth.php';

require_method('GET');
$user = require_user($pdo);

$studentId = trim((string) ($_GET['student_id'] ?? ''));
$category  = trim((string) ($_GET['category'] ?? ''));
$limit     = min(100, max(1, (int) ($_GET['limit'] ?? 50)));

$sql = 'SELECT r.id, r.school_id AS schoolId, r.academic_year_id AS academicYearId,
               r.student_id AS studentId, r.student_class AS studentClass, r.category,
               r.description, r.recorded_at AS dateTime, r.created_by_name AS createdBy,
               r.is_duplicate_confirmed AS isDuplicateConfirmed, r.status,
               r.cancel_reason AS cancelReason,
               s.student_no AS studentNo, s.first_name AS firstName, s.last_name AS lastName
        FROM order_records r
        LEFT JOIN students s ON s.id = r.student_id AND s.school_id = r.school_id
        WHERE r.school_id = :school_id';

$params = ['school_id' => $user['schoolId']];

if ($studentId !== '') {
    $sql .= ' AND r.student_id = :student_id';
    $params['student_id'] = $studentId;
}

if ($category !== '') {
    $sql .= ' AND r.category = :category';
    $params['category'] = $category;
}

$sql .= ' ORDER BY r.recorded_at DESC LIMIT ' . $limit;

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$records = $stmt->fetchAll();

json_response(['records' => $records]);
