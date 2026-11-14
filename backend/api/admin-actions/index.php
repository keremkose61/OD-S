<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/auth.php';

require_method('GET');
$user = require_user($pdo);
require_role($user, ['admin']);

$studentId = trim((string) ($_GET['student_id'] ?? ''));

$sql = 'SELECT a.id, a.school_id AS schoolId, a.academic_year_id AS academicYearId,
               a.student_id AS studentId, a.action_type AS actionType, a.description,
               a.action_date AS date, a.created_by_name AS createdBy,
               s.student_no AS studentNo, s.first_name AS firstName, s.last_name AS lastName, s.class_name AS studentClass
        FROM admin_actions a
        LEFT JOIN students s ON s.id = a.student_id AND s.school_id = a.school_id
        WHERE a.school_id = :school_id';

$params = ['school_id' => $user['schoolId']];

if ($studentId !== '') {
    $sql .= ' AND a.student_id = :student_id';
    $params['student_id'] = $studentId;
}

$sql .= ' ORDER BY a.action_date DESC LIMIT 50';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$actions = $stmt->fetchAll();

json_response(['actions' => $actions]);
