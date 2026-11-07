<?php
declare(strict_types=1);

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

$config = require __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../src/Database.php';

[$script, $username, $role, $schoolId] = array_pad($argv, 4, null);
$allowedRoles = ['teacher', 'counselor', 'admin'];

if (!$username || !$role || !$schoolId || !in_array($role, $allowedRoles, true)) {
    fwrite(STDERR, "Kullanım: php backend/scripts/create_user.php <kullanici> <teacher|counselor|admin> <school_id>\n");
    exit(1);
}

fwrite(STDOUT, "Görünen ad: ");
$displayName = trim((string) fgets(STDIN));
fwrite(STDOUT, "Parola: ");
$password = trim((string) fgets(STDIN));

if (strlen($password) < 12) {
    fwrite(STDERR, "Parola en az 12 karakter olmalıdır.\n");
    exit(1);
}

$pdo = Database::connection($config);
$school = $pdo->prepare('SELECT id FROM schools WHERE id = :id AND active = 1');
$school->execute(['id' => $schoolId]);
if (!$school->fetch()) {
    fwrite(STDERR, "Okul bulunamadı veya pasif.\n");
    exit(1);
}

$insert = $pdo->prepare(
    'INSERT INTO users (school_id, username, password_hash, display_name, role)
     VALUES (:school_id, :username, :password_hash, :display_name, :role)'
);

try {
    $insert->execute([
        'school_id' => $schoolId,
        'username' => strtolower(trim($username)),
        'password_hash' => password_hash($password, PASSWORD_DEFAULT),
        'display_name' => $displayName !== '' ? $displayName : $username,
        'role' => $role,
    ]);
    fwrite(STDOUT, "Kullanıcı başarıyla oluşturuldu. Kullanıcı ID: " . $pdo->lastInsertId() . "\n");
} catch (PDOException $e) {
    fwrite(STDERR, "Kullanıcı oluşturulamadı. Kullanıcı adı bu okulda kayıtlı olabilir.\n");
    exit(1);
}
