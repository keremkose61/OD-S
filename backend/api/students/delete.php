<?php
declare(strict_types=1);

require_once __DIR__ . '/../../src/bootstrap.php';
require_once __DIR__ . '/../../src/auth.php';

require_method('POST');
require_csrf();

$user = require_user($pdo);
require_role($user, ['admin']);

$input = request_json();
$studentId = trim((string) ($input['id'] ?? $input['studentId'] ?? ''));

if ($studentId === '') {
    json_response(['error' => 'Geçersiz öğrenci kimliği.'], 422);
}

// Okul yalıtımı: Öğrenci yalnızca kullanıcının kendi okulunda aranır.
$stmt = $pdo->prepare(
    'SELECT id, school_id, student_no, first_name, last_name, class_name, active
     FROM students
     WHERE id = :id AND school_id = :school_id
     LIMIT 1'
);
$stmt->execute([
    'id'        => $studentId,
    'school_id' => $user['schoolId'],
]);
$student = $stmt->fetch();

if (!$student) {
    // Veri sızıntısını önlemek için başka bir okulun öğrencisi varsa dahi 404 dönülür.
    json_response(['error' => 'Öğrenci bulunamadı.'], 404);
}

// Tekrarlanan isteklerin kontrolü: Kayıt zaten pasif ise güvenle dön
if ((int) $student['active'] === 0) {
    json_response([
        'success'   => true,
        'message'   => 'Öğrenci kaydı zaten pasif / arşivlenmiş durumda.',
        'studentId' => $studentId,
        'active'    => 0,
    ]);
}

// Soft Delete (Pasifleştirme / Arşivleme) ve Audit Kaydı Atomik İşlemi (SEC-03):
// Disiplin ve rehberlik geçmişinin silinmemesi için fiziksel DELETE kesinlikle kullanılmaz.
$manageTransaction = !$pdo->inTransaction();
if ($manageTransaction) {
    $pdo->beginTransaction();
}

try {
    $update = $pdo->prepare(
        'UPDATE students
         SET active = 0, updated_at = CURRENT_TIMESTAMP
         WHERE id = :id AND school_id = :school_id'
    );
    $update->execute([
        'id'        => $studentId,
        'school_id' => $user['schoolId'],
    ]);

    write_audit(
        $pdo,
        $user,
        'DEACTIVATE_STUDENT',
        'student',
        $studentId,
        "Öğrenci kaydı arşivlendi / pasifleştirildi: {$student['first_name']} {$student['last_name']} ({$student['student_no']} - {$student['class_name']})"
    );

    if ($manageTransaction) {
        $pdo->commit();
    }
} catch (Throwable $e) {
    if ($manageTransaction && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    error_log('Student delete error: ' . $e->getMessage());
    json_response(['error' => 'Öğrenci pasifleştirilirken bir hata oluştu.'], 500);
}

json_response([
    'success'   => true,
    'message'   => 'Öğrenci başarıyla arşivlendi / pasifleştirildi.',
    'studentId' => $studentId,
    'active'    => 0,
]);
