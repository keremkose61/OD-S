<?php
declare(strict_types=1);

require_once __DIR__ . '/http.php';
require_once __DIR__ . '/Database.php';

$config = require __DIR__ . '/../config/config.php';

ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
ini_set('session.cookie_httponly', '1');

$sessionConfig = $config['session'] ?? [];
session_name((string) ($sessionConfig['name'] ?? 'ODISSESSID'));
session_set_cookie_params([
    'lifetime' => 0,
    'path' => '/',
    'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    'httponly' => true,
    'samesite' => 'Lax',
]);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

$idleTimeout = (int) ($sessionConfig['idle_timeout'] ?? 1800);
if (isset($_SESSION['last_activity']) && time() - (int) $_SESSION['last_activity'] > $idleTimeout) {
    $_SESSION = [];
    session_regenerate_id(true);
}
$_SESSION['last_activity'] = time();

$pdo = Database::connection($config);
