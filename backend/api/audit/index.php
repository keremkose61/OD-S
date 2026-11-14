<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/auth.php';

require_method('GET');
$user = require_user($pdo);
require_role($user, ['admin']);

$limit = min(100, max(1, (int) ($_GET['limit'] ?? 50)));

$stmt = $pdo->prepare(
    'SELECT a.id, a.school_id AS schoolId, a.user_id AS userId, a.action, a.entity_type AS entityType,
            a.entity_id AS entityId, a.ip_address AS ipAddress, a.details, a.created_at AS timestamp,
            u.display_name AS userName, u.role AS userRole
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.user_id
     WHERE a.school_id = :school_id
     ORDER BY a.created_at DESC
     LIMIT ' . $limit
);
$stmt->execute(['school_id' => $user['schoolId']]);
$logs = $stmt->fetchAll();

foreach ($logs as &$log) {
    if (!empty($log['details'])) {
        $decoded = json_decode((string) $log['details'], true);
        $log['detailsText'] = is_array($decoded) ? ($decoded['message'] ?? json_encode($decoded, JSON_UNESCAPED_UNICODE)) : $log['details'];
    } else {
        $log['detailsText'] = '';
    }
}
unset($log);

json_response(['auditLogs' => $logs]);
