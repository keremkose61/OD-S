<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/auth.php';

require_method('GET');
$user = require_user($pdo);
// Raporlara İdare ve Rehberlik erişebilir
require_role($user, ['admin', 'counselor']);

$schoolId = $user['schoolId'];
$academicYearId = trim((string) ($_GET['academic_year_id'] ?? ''));

// 1. Kategori bazında disiplin/düzen istatistikleri
$catSql = 'SELECT category, COUNT(*) AS count
           FROM order_records
           WHERE school_id = :school_id AND status = \'active\'';
$catParams = ['school_id' => $schoolId];

if ($academicYearId !== '') {
    $catSql .= ' AND academic_year_id = :ay_id';
    $catParams['ay_id'] = $academicYearId;
}
$catSql .= ' GROUP BY category ORDER BY count DESC';

$catStmt = $pdo->prepare($catSql);
$catStmt->execute($catParams);
$categoryCounts = $catStmt->fetchAll();

// 2. Sınıf bazında kayıt dağılımı
$classSql = 'SELECT student_class AS className, COUNT(*) AS count
             FROM order_records
             WHERE school_id = :school_id AND status = \'active\'';
$classParams = ['school_id' => $schoolId];
if ($academicYearId !== '') {
    $classSql .= ' AND academic_year_id = :ay_id';
    $classParams['ay_id'] = $academicYearId;
}
$classSql .= ' GROUP BY student_class ORDER BY count DESC LIMIT 10';

$classStmt = $pdo->prepare($classSql);
$classStmt->execute($classParams);
$classCounts = $classStmt->fetchAll();

// 3. Destek süreçleri durum dağılımı
$caseStmt = $pdo->prepare(
    'SELECT status, COUNT(*) AS count
     FROM support_cases
     WHERE school_id = :school_id
     GROUP BY status'
);
$caseStmt->execute(['school_id' => $schoolId]);
$caseCounts = $caseStmt->fetchAll();

// 4. Son 30 günlük kayıt trendi (gün bazlı)
$trendStmt = $pdo->prepare(
    'SELECT DATE(recorded_at) AS date, COUNT(*) AS count
     FROM order_records
     WHERE school_id = :school_id
       AND status = \'active\'
       AND recorded_at >= (NOW() - INTERVAL 30 DAY)
     GROUP BY DATE(recorded_at)
     ORDER BY date ASC'
);
$trendStmt->execute(['school_id' => $schoolId]);
$dailyTrend = $trendStmt->fetchAll();

// 5. Genel Özet Sayaçları
$totStudentsStmt = $pdo->prepare('SELECT COUNT(*) FROM students WHERE school_id = :school_id AND active = 1');
$totStudentsStmt->execute(['school_id' => $schoolId]);
$totStudents = (int) $totStudentsStmt->fetchColumn();

$totRecordsStmt = $pdo->prepare('SELECT COUNT(*) FROM order_records WHERE school_id = :school_id AND status = \'active\'');
$totRecordsStmt->execute(['school_id' => $schoolId]);
$totRecords = (int) $totRecordsStmt->fetchColumn();

$totCasesStmt = $pdo->prepare('SELECT COUNT(*) FROM support_cases WHERE school_id = :school_id AND status != \'closed\'');
$totCasesStmt->execute(['school_id' => $schoolId]);
$totCases = (int) $totCasesStmt->fetchColumn();

$totObsStmt = $pdo->prepare('SELECT COUNT(*) FROM observations WHERE school_id = :school_id');
$totObsStmt->execute(['school_id' => $schoolId]);
$totObs = (int) $totObsStmt->fetchColumn();

json_response([
    'summary' => [
        'totalStudents'     => $totStudents,
        'totalOrderRecords' => $totRecords,
        'activeSupportCases'=> $totCases,
        'totalObservations' => $totObs,
    ],
    'categories' => $categoryCounts,
    'classes'    => $classCounts,
    'cases'      => $caseCounts,
    'trend'      => $dailyTrend,
]);
