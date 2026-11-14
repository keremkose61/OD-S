<?php
declare(strict_types=1);

// SECURITY: Never reveal internal path, file names or configuration details in error responses.
$localConfig = __DIR__ . '/config.local.php';
if (!is_file($localConfig)) {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, private');
    echo json_encode(['error' => 'Servis geçici olarak kullanılamıyor.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$config = require $localConfig;
if (!is_array($config) || empty($config['database']['name']) || !isset($config['database']['username'])) {
    http_response_code(503);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, private');
    echo json_encode(['error' => 'Servis geçici olarak kullanılamıyor.'], JSON_UNESCAPED_UNICODE);
    exit;
}

return $config;
