<?php
declare(strict_types=1);

/**
 * Copy this file to config.local.php and fill in your local database credentials.
 * Never commit config.local.php or any real credentials to version control.
 *
 * Production checklist:
 *   - Set a strong, random session name (not the default).
 *   - Set force_secure => true when running behind HTTPS.
 *   - Use a dedicated MySQL user with minimal privileges (not root).
 */
return [
    'database' => [
        'host'     => '127.0.0.1',
        'port'     => 3306,
        'name'     => 'odis',
        'username' => 'odis_user',   // Use a dedicated MySQL user, NOT root
        'password' => '',            // Set a strong password
        'charset'  => 'utf8mb4',
    ],
    'session' => [
        'name'         => 'ODISSESSID',
        'idle_timeout' => 1800,      // seconds (30 minutes)
        // Set to true in production (HTTPS required).
        // Keep false for local WampServer HTTP development.
        'force_secure' => false,
    ],
];
