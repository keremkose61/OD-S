SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS schools (
    id VARCHAR(64) NOT NULL,
    code VARCHAR(32) NOT NULL,
    name VARCHAR(190) NOT NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_schools_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    school_id VARCHAR(64) NOT NULL,
    username VARCHAR(80) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(190) NOT NULL,
    role ENUM('teacher', 'counselor', 'admin') NOT NULL,
    active TINYINT(1) NOT NULL DEFAULT 1,
    password_changed_at TIMESTAMP NULL DEFAULT NULL,
    last_login_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_school_username (school_id, username),
    KEY idx_users_school_role (school_id, role),
    CONSTRAINT fk_users_school FOREIGN KEY (school_id) REFERENCES schools(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    school_id VARCHAR(64) NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    action VARCHAR(80) NOT NULL,
    entity_type VARCHAR(80) NULL,
    entity_id VARCHAR(100) NULL,
    ip_address VARCHAR(45) NULL,
    user_agent VARCHAR(255) NULL,
    details JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_audit_school_created (school_id, created_at),
    KEY idx_audit_user_created (user_id, created_at),
    CONSTRAINT fk_audit_school FOREIGN KEY (school_id) REFERENCES schools(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO schools (id, code, name, active) VALUES
('school_kasif', 'KKAL-34', 'Kaşif Kalkavan Anadolu Lisesi', 1),
('school_ataturk', 'AFL-34', 'Atatürk Fen Lisesi', 1),
('school_cumhuriyet', 'CMTAL-34', 'Cumhuriyet Mesleki ve Teknik Anadolu Lisesi', 1)
ON DUPLICATE KEY UPDATE
    code = VALUES(code),
    name = VALUES(name),
    active = VALUES(active);

SET FOREIGN_KEY_CHECKS = 1;
