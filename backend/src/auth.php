<?php
declare(strict_types=1);

function current_user(PDO $pdo): ?array
{
    $userId = $_SESSION['user_id'] ?? null;
    if (!$userId) {
        return null;
    }

    $stmt = $pdo->prepare(
        'SELECT u.id, u.username, u.display_name, u.role, u.school_id, s.name AS school_name
         FROM users u
         INNER JOIN schools s ON s.id = u.school_id
         WHERE u.id = :id AND u.active = 1 AND s.active = 1
         LIMIT 1'
    );
    $stmt->execute(['id' => $userId]);
    $user = $stmt->fetch();

    if (!$user) {
        $_SESSION = [];
        session_regenerate_id(true);
        return null;
    }

    return [
        'id' => (int) $user['id'],
        'username' => $user['username'],
        'displayName' => $user['display_name'],
        'role' => $user['role'],
        'schoolId' => $user['school_id'],
        'schoolName' => $user['school_name'],
    ];
}

function require_user(PDO $pdo): array
{
    $user = current_user($pdo);
    if (!$user) {
        json_response(['error' => 'Oturum açmanız gerekiyor.'], 401);
    }
    return $user;
}

function require_role(array $user, array $roles): void
{
    if (!in_array($user['role'], $roles, true)) {
        json_response(['error' => 'Bu işlem için yetkiniz bulunmuyor.'], 403);
    }
}

function write_audit(PDO $pdo, array $user, string $action, ?string $entityType = null, ?string $entityId = null): void
{
    $stmt = $pdo->prepare(
        'INSERT INTO audit_logs (school_id, user_id, action, entity_type, entity_id, ip_address, user_agent)
         VALUES (:school_id, :user_id, :action, :entity_type, :entity_id, :ip, :agent)'
    );
    $stmt->execute([
        'school_id' => $user['schoolId'],
        'user_id' => $user['id'],
        'action' => $action,
        'entity_type' => $entityType,
        'entity_id' => $entityId,
        'ip' => $_SERVER['REMOTE_ADDR'] ?? null,
        'agent' => substr((string) ($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 255),
    ]);
}
