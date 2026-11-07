<?php
declare(strict_types=1);

$localConfig = __DIR__ . '/config.local.php';
if (!is_file($localConfig)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['error' => 'Backend yapılandırması bulunamadı. config.local.php dosyasını oluşturun.'], JSON_UNESCAPED_UNICODE);
    exit;
}

$config = require $localConfig;
if (!is_array($config) || empty($config['database']['name']) || !isset($config['database']['username'])) {
    throw new RuntimeException('Backend yapılandırması geçersiz.');
}

return $config;
