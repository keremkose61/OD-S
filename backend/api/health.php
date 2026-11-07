<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/http.php';
require_once __DIR__ . '/../../src/Database.php';

require_method('GET');

try {
    $config = require __DIR__ . '/../../config/config.php';
    Database::connection($config)->query('SELECT 1');
    json_response([
        'status' => 'ok',
        'database' => 'connected',
    ]);
} catch (Throwable $error) {
    error_log('[ODIS backend] Health check failed: ' . $error->getMessage());
    json_response([
        'status' => 'error',
        'error' => 'Backend veya veritabanı bağlantısı kurulamadı.',
    ], 503);
}
