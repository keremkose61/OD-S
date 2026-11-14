<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/auth.php';

require_method('GET');
$user = require_user($pdo);

// Aktif okul bilgisi
$stmt = $pdo->prepare(
    'SELECT s.id, s.code, s.name, s.district, s.principal, s.phone, s.email, s.active
     FROM schools s
     WHERE s.id = :school_id AND s.active = 1
     LIMIT 1'
);
$stmt->execute(['school_id' => $user['schoolId']]);
$currentSchool = $stmt->fetch();

// Aktif okul istatistikleri
$countStudents = $pdo->prepare('SELECT COUNT(*) FROM students WHERE school_id = :s_id AND active = 1');
$countStudents->execute(['s_id' => $user['schoolId']]);
$totalStudents = (int) $countStudents->fetchColumn();

$countRecords = $pdo->prepare('SELECT COUNT(*) FROM order_records WHERE school_id = :s_id AND status = "active"');
$countRecords->execute(['s_id' => $user['schoolId']]);
$totalRecords = (int) $countRecords->fetchColumn();

$countCases = $pdo->prepare('SELECT COUNT(*) FROM support_cases WHERE school_id = :s_id AND status != "closed"');
$countCases->execute(['s_id' => $user['schoolId']]);
$activeCases = (int) $countCases->fetchColumn();

if ($currentSchool) {
    $currentSchool['stats'] = [
        'totalStudents' => $totalStudents,
        'totalRecords'  => $totalRecords,
        'activeCases'   => $activeCases,
    ];
}

json_response([
    'school' => $currentSchool,
]);
