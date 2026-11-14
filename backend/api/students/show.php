<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/auth.php';

require_method('GET');
$user = require_user($pdo);

$studentId = trim((string) ($_GET['id'] ?? ''));
if ($studentId === '') {
    json_response(['error' => 'Geçersiz öğrenci kimliği.'], 400);
}

// Okul yalıtımı: Öğrenci sorgusu zorunlu olarak kullanıcının kendi okuluyla filtrelenir.
$stmt = $pdo->prepare(
    'SELECT id, school_id AS schoolId, academic_year_id AS academicYearId, student_no AS studentNo,
            first_name AS firstName, last_name AS lastName, class_name AS class,
            gender, birth_date AS birthDate, avatar_color AS avatarColor, active, created_at AS createdAt
     FROM students
     WHERE id = :id AND school_id = :school_id AND active = 1
     LIMIT 1'
);
$stmt->execute([
    'id'        => $studentId,
    'school_id' => $user['schoolId'],
]);
$student = $stmt->fetch();

if (!$student) {
    // Veri sızıntısını önlemek için başka bir okulun öğrencisi varsa dahi 404 dönülür.
    json_response(['error' => 'Öğrenci bulunamadı.'], 404);
}

// Düzen kayıtları
$recStmt = $pdo->prepare(
    'SELECT id, school_id AS schoolId, academic_year_id AS academicYearId, student_id AS studentId,
            student_class AS studentClass, category, description, recorded_at AS dateTime,
            created_by_name AS createdBy, status, cancel_reason AS cancelReason
     FROM order_records
     WHERE student_id = :student_id AND school_id = :school_id
     ORDER BY recorded_at DESC'
);
$recStmt->execute(['student_id' => $studentId, 'school_id' => $user['schoolId']]);
$records = $recStmt->fetchAll();

// İdari işlemler
$actStmt = $pdo->prepare(
    'SELECT id, school_id AS schoolId, academic_year_id AS academicYearId, student_id AS studentId,
            action_type AS actionType, description, action_date AS date, created_by_name AS createdBy
     FROM admin_actions
     WHERE student_id = :student_id AND school_id = :school_id
     ORDER BY action_date DESC'
);
$actStmt->execute(['student_id' => $studentId, 'school_id' => $user['schoolId']]);
$actions = $actStmt->fetchAll();

// Gözlemler (Rehberlik notu yalnızca rehber öğretmene iletilir)
$isCounselor = can_view_counseling_notes($user);
$obsStmt = $pdo->prepare(
    'SELECT id, school_id AS schoolId, academic_year_id AS academicYearId, student_id AS studentId,
            student_class AS studentClass, description, source, verification_status AS verificationStatus,
            ' . ($isCounselor ? 'counselor_note AS counselorNote,' : 'NULL AS counselorNote,') . '
            recorded_at AS dateTime, created_by_name AS createdBy
     FROM observations
     WHERE student_id = :student_id AND school_id = :school_id
     ORDER BY recorded_at DESC'
);
$obsStmt->execute(['student_id' => $studentId, 'school_id' => $user['schoolId']]);
$observations = $obsStmt->fetchAll();

// Destek vakaları
$caseStmt = $pdo->prepare(
    'SELECT id, school_id AS schoolId, academic_year_id AS academicYearId, student_id AS studentId,
            student_class AS studentClass, title, status, priority, description,
            referral_source AS referralSource, opened_at AS openedAt, closed_at AS closedAt
     FROM support_cases
     WHERE student_id = :student_id AND school_id = :school_id
     ORDER BY opened_at DESC'
);
$caseStmt->execute(['student_id' => $studentId, 'school_id' => $user['schoolId']]);
$cases = $caseStmt->fetchAll();

json_response([
    'student'      => $student,
    'records'      => $records,
    'actions'      => $actions,
    'observations' => $observations,
    'cases'        => $cases,
]);
