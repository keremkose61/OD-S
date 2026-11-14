<?php
declare(strict_types=1);

function json_response(array $payload, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, private');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function request_json(): array
{
    $raw = file_get_contents('php://input');
    $data = json_decode($raw ?: '{}', true);
    return is_array($data) ? $data : [];
}

function require_method(string $method): void
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== strtoupper($method)) {
        header('Allow: ' . strtoupper($method));
        json_response(['error' => 'Desteklenmeyen istek yöntemi.'], 405);
    }
}

function require_csrf(): void
{
    $provided = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    $stored = $_SESSION['csrf_token'] ?? '';
    if (!is_string($provided) || !is_string($stored) || $stored === '' || !hash_equals($stored, $provided)) {
        json_response(['error' => 'İstek doğrulanamadı. Sayfayı yenileyip tekrar deneyin.'], 419);
    }
}
