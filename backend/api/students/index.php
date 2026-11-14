<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/auth.php';

require_method('GET');
$user = require_user($pdo);

// Okul kimliği ASLA istemciden alınmaz; oturumdan belirlenir.
$schoolId = $user['schoolId'];

$query = trim((string) ($_GET['q'] ?? ''));
$classFilter = trim((string) ($_GET['class'] ?? ''));
$academicYearId = trim((string) ($_GET['academic_year_id'] ?? ''));

$sql = 'SELECT id, school_id AS schoolId, academic_year_id AS academicYearId, student_no AS studentNo,
               first_name AS firstName, last_name AS lastName, class_name AS class,
               gender, birth_date AS birthDate, avatar_color AS avatarColor, active, created_at AS createdAt
        FROM students
        WHERE school_id = :school_id AND active = 1';

$params = ['school_id' => $schoolId];

if ($academicYearId !== '') {
    $sql .= ' AND academic_year_id = :academic_year_id';
    $params['academic_year_id'] = $academicYearId;
}

if ($classFilter !== '') {
    $sql .= ' AND class_name = :class_name';
    $params['class_name'] = $classFilter;
}

if ($query !== '') {
    $sql .= ' AND (student_no LIKE :q OR first_name LIKE :q OR last_name LIKE :q OR CONCAT(first_name, " ", last_name) LIKE :q)';
    $params['q'] = '%' . $query . '%';
}

$sql .= ' ORDER BY class_name ASC, last_name ASC, first_name ASC';

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$students = $stmt->fetchAll();

json_response(['students' => $students]);
