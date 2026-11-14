<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/auth.php';

require_method('GET');
$user = require_user($pdo);

$studentId = trim((string) ($_GET['student_id'] ?? ''));
$isCounselor = can_view_counseling_notes($user);

$sql = 'SELECT o.id, o.school_id AS schoolId, o.academic_year_id AS academicYearId,
               o.student_id AS studentId, o.student_class AS studentClass, o.description,
               o.source, o.verification_status AS verificationStatus,
               ' . ($isCounselor ? 'o.counselor_note AS counselorNote,' : 'NULL AS counselorNote,') . '
               o.recorded_at AS dateTime, o.created_by_name AS createdBy,
               s.student_no AS studentNo, s.first_name AS firstName, s.last_name AS lastName
        FROM observations o
        LEFT JOIN students s ON s.id = o.student_id AND s.school_id = o.school_id
        WHERE o.school_id = :school_id';

$params = ['school_id' => $user['schoolId']];

if ($studentId !== '') {
    $sql .= ' AND o.student_id = :student_id';
    $params['student_id'] = $studentId;
}

$sql .= ' ORDER BY o.recorded_at DESC LIMIT 50';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$observations = $stmt->fetchAll();

json_response(['observations' => $observations]);
