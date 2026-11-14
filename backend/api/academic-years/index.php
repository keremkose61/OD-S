<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/auth.php';

require_method('GET');
$user = require_user($pdo);

$stmt = $pdo->prepare(
    'SELECT id, school_id AS schoolId, code, label, is_current AS isCurrent, active, start_date AS startDate, end_date AS endDate
     FROM academic_years
     WHERE school_id = :school_id AND active = 1
     ORDER BY code DESC'
);
$stmt->execute(['school_id' => $user['schoolId']]);
$years = $stmt->fetchAll();

json_response(['academicYears' => $years]);
