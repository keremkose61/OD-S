<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/auth.php';

require_method('POST');
require_csrf();

$input = request_json();
$username = strtolower(trim((string) ($input['username'] ?? '')));
$password = (string) ($input['password'] ?? '');

if ($username === '' || $password === '' || strlen($username) > 80 || strlen($password) > 1024) {
    json_response(['error' => 'Kullanıcı adı veya parola hatalı.'], 422);
}

$usernameKey = hash('sha256', $username);
$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');

$cleanup = $pdo->prepare('DELETE FROM login_attempts WHERE attempted_at < (NOW() - INTERVAL 1 DAY)');
$cleanup->execute();

$rate = $pdo->prepare(
    'SELECT COUNT(*) FROM login_attempts
     WHERE username_key = :username_key AND ip_address = :ip
       AND attempted_at >= (NOW() - INTERVAL 15 MINUTE)'
);
$rate->execute(['username_key' => $usernameKey, 'ip' => $ip]);
if ((int) $rate->fetchColumn() >= 5) {
    json_response(['error' => 'Çok fazla başarısız giriş denemesi. 15 dakika sonra tekrar deneyin.'], 429);
}

$stmt = $pdo->prepare(
    'SELECT u.id, u.username, u.password_hash, u.active, u.school_id
     FROM users u INNER JOIN schools s ON s.id = u.school_id
     WHERE u.username = :username AND s.active = 1 LIMIT 1'
);
$stmt->execute(['username' => $username]);
$account = $stmt->fetch();

if (!$account || !(bool) $account['active'] || !password_verify($password, $account['password_hash'])) {
    $attempt = $pdo->prepare('INSERT INTO login_attempts (username_key, ip_address) VALUES (:username_key, :ip)');
    $attempt->execute(['username_key' => $usernameKey, 'ip' => $ip]);
    json_response(['error' => 'Kullanıcı adı veya parola hatalı.'], 401);
}

session_regenerate_id(true);
$_SESSION = [
    'user_id' => (int) $account['id'],
    'last_activity' => time(),
    'csrf_token' => bin2hex(random_bytes(32)),
];

$clear = $pdo->prepare('DELETE FROM login_attempts WHERE username_key = :username_key AND ip_address = :ip');
$clear->execute(['username_key' => $usernameKey, 'ip' => $ip]);

$update = $pdo->prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = :id');
$update->execute(['id' => $account['id']]);

$user = current_user($pdo);
write_audit($pdo, $user, 'USER_LOGIN', 'auth', (string) $user['id']);

json_response(['user' => $user, 'csrfToken' => $_SESSION['csrf_token']]);
