<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/auth.php';

require_method('GET');
$user = current_user($pdo);
if (!$user) {
    json_response(['user' => null], 200);
}

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

json_response(['user' => $user, 'csrfToken' => $_SESSION['csrf_token']]);
