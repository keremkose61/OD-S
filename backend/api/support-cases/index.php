<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/auth.php';

require_method('GET');
$user = require_user($pdo);
// Yalnızca rehberlik ve idare destek süreçlerini listeleyebilir
require_role($user, ['counselor', 'admin']);

$isCounselor = can_view_counseling_notes($user);

$sql = 'SELECT c.id, c.school_id AS schoolId, c.academic_year_id AS academicYearId,
               c.student_id AS studentId, c.student_class AS studentClass, c.title,
               c.status, c.priority, c.description, c.referral_source AS referralSource,
               c.opened_at AS openedAt, c.closed_at AS closedAt,
               s.student_no AS studentNo, s.first_name AS firstName, s.last_name AS lastName
        FROM support_cases c
        LEFT JOIN students s ON s.id = c.student_id AND s.school_id = c.school_id
        WHERE c.school_id = :school_id
        ORDER BY c.opened_at DESC';

$stmt = $pdo->prepare($sql);
$stmt->execute(['school_id' => $user['schoolId']]);
$cases = $stmt->fetchAll();

// YALNIZCA REHBERLİK: Gizli görüşme notlarını bağla
if ($isCounselor && !empty($cases)) {
    $caseIds = array_column($cases, 'id');
    $placeholders = implode(',', array_fill(0, count($caseIds), '?'));

    $notesStmt = $pdo->prepare(
        "SELECT case_id, id, note, session_date, created_at
         FROM counseling_session_notes
         WHERE school_id = ? AND case_id IN ($placeholders)
         ORDER BY session_date DESC"
    );
    $notesStmt->execute(array_merge([$user['schoolId']], $caseIds));
    $notes = $notesStmt->fetchAll();

    $notesMap = [];
    foreach ($notes as $n) {
        $notesMap[$n['case_id']][] = $n;
    }

    foreach ($cases as &$c) {
        $c['privateSessionNotes'] = $notesMap[$c['id']] ?? [];
    }
    unset($c);
}

json_response(['cases' => $cases]);
