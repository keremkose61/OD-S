<?php
declare(strict_types=1);

require_once __DIR__ . '/http.php';
require_once __DIR__ . '/Database.php';

$config = require __DIR__ . '/../config/config.php';

// ── Session hardening ────────────────────────────────────────────────────────
ini_set('session.use_strict_mode', '1');
ini_set('session.use_only_cookies', '1');
ini_set('session.cookie_httponly', '1');
// Prevent session ID from appearing in URLs
ini_set('session.use_trans_sid', '0');
// Use a strong random session ID generator
ini_set('session.entropy_length', '32');

$sessionConfig = $config['session'] ?? [];
session_name((string) ($sessionConfig['name'] ?? 'ODISSESSID'));

// 'secure' flag: always true in production (HTTPS).
// In local WampServer development HTTPS is typically absent; allow override via config.
$isSecure = !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off';
$forceSecure = (bool) ($sessionConfig['force_secure'] ?? false);

session_set_cookie_params([
    'lifetime' => 0,
    'path'     => '/',
    'secure'   => $isSecure || $forceSecure,
    'httponly' => true,
    'samesite' => 'Lax',
]);

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

// ── Idle timeout ─────────────────────────────────────────────────────────────
$idleTimeout = (int) ($sessionConfig['idle_timeout'] ?? 1800);
if (isset($_SESSION['last_activity']) && time() - (int) $_SESSION['last_activity'] > $idleTimeout) {
    $_SESSION = [];
    session_regenerate_id(true);
}
$_SESSION['last_activity'] = time();

// ── Database connection ───────────────────────────────────────────────────────
$pdo = Database::connection($config);
