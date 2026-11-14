<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/auth.php';

require_method('POST');
require_csrf();

$user = require_user($pdo);
require_role($user, ['admin']);

$input    = request_json();
$recordId = trim((string) ($input['recordId'] ?? ''));
$reason   = trim((string) ($input['reason'] ?? 'Hatalı kayıt bildirimi üzerine iptal edildi.'));

if ($recordId === '') {
    json_response(['error' => 'Geçersiz kayıt kimliği.'], 422);
}

// Okul yalıtımı kontrolü
$check = $pdo->prepare(
    'SELECT id, student_id, category FROM order_records WHERE id = :id AND school_id = :school_id LIMIT 1'
);
$check->execute(['id' => $recordId, 'school_id' => $user['schoolId']]);
$record = $check->fetch();

if (!$record) {
    json_response(['error' => 'Kayıt bulunamadı veya bu okul kapsamında değil.'], 404);
}

// Soft delete — kayıt fiziksel olarak silinmez, durumu 'cancelled' yapılır
$update = $pdo->prepare(
    'UPDATE order_records
     SET status = "cancelled", cancel_reason = :reason, cancelled_by_id = :canceller_id, cancelled_at = CURRENT_TIMESTAMP
     WHERE id = :id AND school_id = :school_id'
);
$update->execute([
    'reason'       => $reason,
    'canceller_id' => $user['id'],
    'id'           => $recordId,
    'school_id'    => $user['schoolId'],
]);

write_audit(
    $pdo,
    $user,
    'CANCEL_ORDER_RECORD',
    'order_record',
    $recordId,
    "Kayıt iptal edildi (Gerekçe: {$reason})"
);

json_response(['success' => true, 'message' => 'Kayıt başarıyla iptal edildi.']);
