<?php
declare(strict_types=1);

// SECURITY: This script must only run from the command line.
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$config = require __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../src/Database.php';

$allowedRoles = ['teacher', 'counselor', 'admin'];

[$script, $username, $role, $schoolId] = array_pad($argv, 4, null);

if (!$username || !$role || !$schoolId || !in_array($role, $allowedRoles, true)) {
    fwrite(STDERR, "Kullanım: php backend/scripts/create_user.php <kullanici> <teacher|counselor|admin> <school_id>\n");
    exit(1);
}

$username = strtolower(trim($username));
if (strlen($username) < 3 || strlen($username) > 80) {
    fwrite(STDERR, "Kullanıcı adı 3-80 karakter arasında olmalıdır.\n");
    exit(1);
}

fwrite(STDOUT, "Görünen ad: ");
$displayName = rtrim((string) fgets(STDIN));

// Secure password prompt — read without echo if possible (posix_isatty)
if (function_exists('posix_isatty') && posix_isatty(STDIN)) {
    system('stty -echo');
    fwrite(STDOUT, "Parola (görünmez): ");
    $password = rtrim((string) fgets(STDIN));
    system('stty echo');
    fwrite(STDOUT, "\n");
} else {
    fwrite(STDOUT, "Parola: ");
    $password = rtrim((string) fgets(STDIN));
}

// Minimum length
if (strlen($password) < 12) {
    fwrite(STDERR, "Parola en az 12 karakter olmalıdır.\n");
    exit(1);
}

// Prevent empty password from slipping through on non-TTY environments
if ($password === '') {
    fwrite(STDERR, "Parola boş olamaz.\n");
    exit(1);
}

$pdo = Database::connection($config);

// Verify school exists and is active
$school = $pdo->prepare('SELECT id, name FROM schools WHERE id = :id AND active = 1');
$school->execute(['id' => $schoolId]);
$schoolRow = $school->fetch();
if (!$schoolRow) {
    fwrite(STDERR, "Okul bulunamadı veya pasif: {$schoolId}\n");
    exit(1);
}

// Check if username already exists in this school (school-scoped uniqueness)
$check = $pdo->prepare('SELECT id FROM users WHERE school_id = :school_id AND username = :username LIMIT 1');
$check->execute(['school_id' => $schoolId, 'username' => $username]);
if ($check->fetch()) {
    fwrite(STDERR, "Bu okulda '{$username}' kullanıcı adı zaten kayıtlı.\n");
    exit(1);
}

$insert = $pdo->prepare(
    'INSERT INTO users (school_id, username, password_hash, display_name, role)
     VALUES (:school_id, :username, :password_hash, :display_name, :role)'
);

try {
    $insert->execute([
        'school_id'     => $schoolId,
        'username'      => $username,
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'display_name'  => $displayName !== '' ? $displayName : $username,
        'role'          => $role,
    ]);
    $newId = $pdo->lastInsertId();
    fwrite(STDOUT, "Kullanıcı başarıyla oluşturuldu.\n");
    fwrite(STDOUT, "  Okul   : {$schoolRow['name']}\n");
    fwrite(STDOUT, "  Kullanıcı adı: {$username}\n");
    fwrite(STDOUT, "  Rol    : {$role}\n");
    fwrite(STDOUT, "  ID     : {$newId}\n");
} catch (PDOException $e) {
    fwrite(STDERR, "Kullanıcı oluşturulamadı. Bu okul için kullanıcı adı zaten alınmış olabilir.\n");
    exit(1);
}
