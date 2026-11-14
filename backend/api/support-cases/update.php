<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/auth.php';

require_method('POST');
require_csrf();

$user = require_user($pdo);
require_role($user, ['counselor', 'admin']);

$input       = request_json();
$caseId      = trim((string) ($input['caseId'] ?? ''));
$newStatus   = trim((string) ($input['status'] ?? ''));
$adminResult = trim((string) ($input['adminResultNote'] ?? ''));
$privateNote = trim((string) ($input['privateNote'] ?? ''));
$followUpDate = trim((string) ($input['followUpDate'] ?? ''));

if ($caseId === '') {
    json_response(['error' => 'Geçersiz vaka kimliği.'], 422);
}

// Okul yalıtımı kontrolü
$check = $pdo->prepare(
    'SELECT id, school_id, student_id, title, status FROM support_cases WHERE id = :id AND school_id = :school_id LIMIT 1'
);
$check->execute(['id' => $caseId, 'school_id' => $user['schoolId']]);
$case = $check->fetch();

if (!$case) {
    json_response(['error' => 'Destek vakası bulunamadı veya bu okul kapsamında değil.'], 404);
}

$allowedStatuses = ['open', 'in_progress', 'resolved', 'closed'];
$statusToSet = in_array($newStatus, $allowedStatuses, true) ? $newStatus : $case['status'];
$closedAt = ($statusToSet === 'closed' || $statusToSet === 'resolved') ? date('Y-m-d H:i:s') : null;

// support_cases tablosunu güncelle
$update = $pdo->prepare(
    'UPDATE support_cases
     SET status = :status, closed_at = :closed_at
     WHERE id = :id AND school_id = :school_id'
);
$update->execute([
    'status'    => $statusToSet,
    'closed_at' => $closedAt,
    'id'        => $caseId,
    'school_id' => $user['schoolId'],
]);

// REHBERLİK GİZLİLİĞİ: Yalnızca rehberlik personeli özel klinik görüşme notu ekleyebilir
$isCounselor = can_view_counseling_notes($user);
if ($isCounselor && $privateNote !== '') {
    $noteInsert = $pdo->prepare(
        'INSERT INTO counseling_session_notes (case_id, school_id, author_id, note, session_date, is_private)
         VALUES (:case_id, :school_id, :author_id, :note, :session_date, 1)'
    );
    $noteInsert->execute([
        'case_id'      => $caseId,
        'school_id'    => $user['schoolId'],
        'author_id'    => $user['id'],
        'note'         => $privateNote,
        'session_date' => !empty($followUpDate) ? $followUpDate : date('Y-m-d'),
    ]);
}

// AUDIT GÜVENLİĞİ (KVKK): Özel klinik not içeriği KESİNLİKLE denetim kütüğüne yazılmaz!
// Yalnızca idari sonuç özeti kaydedilir.
$auditSummary = "Destek süreci güncellendi: {$statusToSet}.";
if ($adminResult !== '') {
    $auditSummary .= " İdari Sonuç: {$adminResult}";
}

write_audit(
    $pdo,
    $user,
    'UPDATE_SUPPORT_STATUS',
    'support_case',
    $caseId,
    $auditSummary
);

json_response([
    'success' => true,
    'caseId'  => $caseId,
    'status'  => $statusToSet,
    'message' => 'Destek süreci başarıyla güncellendi.',
]);
