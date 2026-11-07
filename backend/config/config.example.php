<?php
declare(strict_types=1);

/**
 * Copy this file to config.local.php and set local database credentials.
 * Never commit config.local.php or real credentials.
 */
return [
    'database' => [
        'host' => '127.0.0.1',
        'port' => 3306,
        'name' => 'odis',
        'username' => 'root',
        'password' => '',
        'charset' => 'utf8mb4',
    ],
    'session' => [
        'name' => 'ODISSESSID',
        'idle_timeout' => 1800,
    ],
];
