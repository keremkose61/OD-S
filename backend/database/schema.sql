-- ============================================================
-- ODİS — Veritabanı Şeması
-- Karakter seti: utf8mb4_unicode_ci (Türkçe desteği)
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. OKULLAR ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schools (
    id         VARCHAR(64)  NOT NULL,
    code       VARCHAR(32)  NOT NULL,
    name       VARCHAR(190) NOT NULL,
    district   VARCHAR(190) NULL,
    principal  VARCHAR(190) NULL,
    phone      VARCHAR(32)  NULL,
    email      VARCHAR(190) NULL,
    active     TINYINT(1)   NOT NULL DEFAULT 1,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_schools_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 2. KULLANICILAR ──────────────────────────────────────────────────────────
-- SECURITY FIX: username uniqueness scoped to school, not globally.
-- Farklı okulların personeli aynı kullanıcı adını kullanabilir.
CREATE TABLE IF NOT EXISTS users (
    id                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    school_id           VARCHAR(64)     NOT NULL,
    username            VARCHAR(80)     NOT NULL,
    password_hash       VARCHAR(255)    NOT NULL,
    display_name        VARCHAR(190)    NOT NULL,
    role                ENUM('teacher','counselor','admin') NOT NULL,
    active              TINYINT(1)      NOT NULL DEFAULT 1,
    password_changed_at TIMESTAMP       NULL DEFAULT NULL,
    last_login_at       TIMESTAMP       NULL DEFAULT NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    -- School-scoped unique username (replaces the previous global unique constraint)
    UNIQUE KEY uq_users_school_username (school_id, username),
    KEY idx_users_school_role (school_id, role),
    CONSTRAINT fk_users_school FOREIGN KEY (school_id) REFERENCES schools (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. GİRİŞ DENEMELERİ (Brute-force koruması) ───────────────────────────────
CREATE TABLE IF NOT EXISTS login_attempts (
    id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    username_key CHAR(64)        NOT NULL,   -- SHA-256(lowercase username)
    ip_address   VARCHAR(45)     NOT NULL,
    school_id    VARCHAR(64)     NULL,       -- NULL = unknown at attempt time
    attempted_at TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_login_attempts_lookup (username_key, ip_address, attempted_at),
    KEY idx_login_attempts_cleanup (attempted_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 4. DENETİM GÜNLÜĞÜ ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    school_id   VARCHAR(64)     NOT NULL,
    user_id     BIGINT UNSIGNED NULL,
    action      VARCHAR(80)     NOT NULL,
    entity_type VARCHAR(80)     NULL,
    entity_id   VARCHAR(100)    NULL,
    ip_address  VARCHAR(45)     NULL,
    user_agent  VARCHAR(255)    NULL,
    details     JSON            NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_audit_school_created (school_id, created_at),
    KEY idx_audit_user_created   (user_id,   created_at),
    KEY idx_audit_action         (action,    created_at),
    CONSTRAINT fk_audit_school FOREIGN KEY (school_id) REFERENCES schools (id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users (id)
        ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 5. AKADEMİK YILLAR ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS academic_years (
    id         VARCHAR(64)  NOT NULL,
    school_id  VARCHAR(64)  NOT NULL,
    code       VARCHAR(20)  NOT NULL,   -- örn: '2025-2026'
    label      VARCHAR(80)  NOT NULL,   -- örn: '2025–2026 Eğitim-Öğretim Yılı'
    start_date DATE         NULL,
    end_date   DATE         NULL,
    is_current TINYINT(1)   NOT NULL DEFAULT 0,
    active     TINYINT(1)   NOT NULL DEFAULT 1,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_ay_school_code (school_id, code),
    KEY idx_ay_school_current   (school_id, is_current),
    CONSTRAINT fk_ay_school FOREIGN KEY (school_id) REFERENCES schools (id)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 6. SINIFLAR ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classes (
    id               VARCHAR(64)  NOT NULL,
    school_id        VARCHAR(64)  NOT NULL,
    academic_year_id VARCHAR(64)  NOT NULL,
    name             VARCHAR(50)  NOT NULL,   -- örn: '10-A'
    grade            TINYINT      NULL,        -- 9, 10, 11, 12
    branch           VARCHAR(10)  NULL,        -- 'A', 'B', vb.
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_class_school_year_name (school_id, academic_year_id, name),
    KEY idx_class_school   (school_id),
    CONSTRAINT fk_class_school FOREIGN KEY (school_id)        REFERENCES schools        (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_class_year  FOREIGN KEY (academic_year_id)  REFERENCES academic_years (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 7. ÖĞRENCİLER ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS students (
    id               VARCHAR(64)  NOT NULL,
    school_id        VARCHAR(64)  NOT NULL,
    academic_year_id VARCHAR(64)  NOT NULL,
    student_no       VARCHAR(20)  NOT NULL,
    first_name       VARCHAR(100) NOT NULL,
    last_name        VARCHAR(100) NOT NULL,
    class_name       VARCHAR(50)  NOT NULL,   -- denormalised for fast query
    gender           ENUM('male','female','other') NULL,
    birth_date       DATE         NULL,
    avatar_color     VARCHAR(20)  NULL,        -- UI renk bilgisi (#hexcode)
    active           TINYINT(1)   NOT NULL DEFAULT 1,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    -- Öğrenci numarası okul + yıl bazında unique
    UNIQUE KEY uq_student_school_year_no (school_id, academic_year_id, student_no),
    KEY idx_student_school      (school_id),
    KEY idx_student_class       (school_id, class_name),
    KEY idx_student_name        (school_id, last_name, first_name),
    CONSTRAINT fk_student_school FOREIGN KEY (school_id)       REFERENCES schools        (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_student_year   FOREIGN KEY (academic_year_id) REFERENCES academic_years (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 8. DÜZEN KAYITLARI (Kıyafet / Kural ihlali) ──────────────────────────────
CREATE TABLE IF NOT EXISTS order_records (
    id                   VARCHAR(64)  NOT NULL,
    school_id            VARCHAR(64)  NOT NULL,
    academic_year_id     VARCHAR(64)  NOT NULL,
    student_id           VARCHAR(64)  NOT NULL,
    student_class        VARCHAR(50)  NOT NULL,
    category             VARCHAR(40)  NOT NULL,   -- kilik-kiyafet, sac, arma, vb.
    description          TEXT         NULL,
    recorded_at          DATETIME     NOT NULL,
    created_by_id        BIGINT UNSIGNED NULL,
    created_by_name      VARCHAR(190) NULL,        -- Denormalised for display
    is_duplicate_confirmed TINYINT(1) NOT NULL DEFAULT 0,
    status               ENUM('active','cancelled') NOT NULL DEFAULT 'active',
    cancel_reason        TEXT         NULL,
    cancelled_by_id      BIGINT UNSIGNED NULL,
    cancelled_at         DATETIME     NULL,
    created_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_record_school_date  (school_id, recorded_at),
    KEY idx_record_student      (student_id, school_id),
    KEY idx_record_category     (school_id, category, recorded_at),
    KEY idx_record_status       (school_id, status),
    CONSTRAINT fk_record_school   FOREIGN KEY (school_id)       REFERENCES schools        (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_record_year     FOREIGN KEY (academic_year_id) REFERENCES academic_years (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_record_student  FOREIGN KEY (student_id)       REFERENCES students       (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_record_creator  FOREIGN KEY (created_by_id)    REFERENCES users          (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_record_canceller FOREIGN KEY (cancelled_by_id) REFERENCES users          (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 9. GÖZLEM KAYITLARI ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS observations (
    id                  VARCHAR(64)  NOT NULL,
    school_id           VARCHAR(64)  NOT NULL,
    academic_year_id    VARCHAR(64)  NOT NULL,
    student_id          VARCHAR(64)  NOT NULL,
    student_class       VARCHAR(50)  NOT NULL,
    description         TEXT         NOT NULL,
    source              VARCHAR(100) NULL,         -- Gözlemi yapan kişi/konum
    verification_status ENUM('reported','investigating','verified','dismissed') NOT NULL DEFAULT 'reported',
    counselor_note      TEXT         NULL,          -- Yalnızca rehber öğretmen görebilir
    recorded_at         DATETIME     NOT NULL,
    created_by_id       BIGINT UNSIGNED NULL,
    created_by_name     VARCHAR(190) NULL,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_obs_school_date  (school_id, recorded_at),
    KEY idx_obs_student      (student_id, school_id),
    KEY idx_obs_status       (school_id, verification_status),
    CONSTRAINT fk_obs_school   FOREIGN KEY (school_id)        REFERENCES schools        (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_obs_year     FOREIGN KEY (academic_year_id)  REFERENCES academic_years (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_obs_student  FOREIGN KEY (student_id)        REFERENCES students       (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_obs_creator  FOREIGN KEY (created_by_id)     REFERENCES users          (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 10. DESTEK VAKALARI (Rehberlik) ──────────────────────────────────────────
-- PRIVACY: Bu tabloya erişim API katmanında counselor ve admin ile kısıtlanmalı.
CREATE TABLE IF NOT EXISTS support_cases (
    id               VARCHAR(64)  NOT NULL,
    school_id        VARCHAR(64)  NOT NULL,
    academic_year_id VARCHAR(64)  NOT NULL,
    student_id       VARCHAR(64)  NOT NULL,
    student_class    VARCHAR(50)  NOT NULL,
    title            VARCHAR(255) NOT NULL,
    status           ENUM('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
    priority         ENUM('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
    description      TEXT         NULL,
    referral_source  VARCHAR(190) NULL,       -- Kim yönlendirdi
    referred_by_id   BIGINT UNSIGNED NULL,
    opened_at        DATETIME     NOT NULL,
    closed_at        DATETIME     NULL,
    created_by_id    BIGINT UNSIGNED NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_case_school_status (school_id, status),
    KEY idx_case_student       (student_id, school_id),
    CONSTRAINT fk_case_school    FOREIGN KEY (school_id)        REFERENCES schools        (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_case_year      FOREIGN KEY (academic_year_id)  REFERENCES academic_years (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_case_student   FOREIGN KEY (student_id)        REFERENCES students       (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_case_referrer  FOREIGN KEY (referred_by_id)    REFERENCES users          (id) ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_case_creator   FOREIGN KEY (created_by_id)     REFERENCES users          (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 11. REHBERLİK GÖRÜŞME NOTLARI ────────────────────────────────────────────
-- PRIVACY: Bu tablo yalnızca counselor rolüne açıktır.
-- Admin dahil başka roller bu tabloya erişemez.
CREATE TABLE IF NOT EXISTS counseling_session_notes (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    case_id     VARCHAR(64)     NOT NULL,
    school_id   VARCHAR(64)     NOT NULL,   -- Hızlı izolasyon için denormalised
    author_id   BIGINT UNSIGNED NOT NULL,   -- Yalnızca counselor yazabilir
    note        TEXT            NOT NULL,
    session_date DATE           NOT NULL,
    is_private   TINYINT(1)     NOT NULL DEFAULT 1,  -- Her zaman 1; ileride multi-level gizlilik için
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_note_case   (case_id),
    KEY idx_note_school (school_id, session_date),
    CONSTRAINT fk_note_case   FOREIGN KEY (case_id)   REFERENCES support_cases (id) ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_note_school FOREIGN KEY (school_id)  REFERENCES schools       (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_note_author FOREIGN KEY (author_id)  REFERENCES users         (id) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 12. İDARİ İŞLEMLER ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_actions (
    id               VARCHAR(64)  NOT NULL,
    school_id        VARCHAR(64)  NOT NULL,
    academic_year_id VARCHAR(64)  NOT NULL,
    student_id       VARCHAR(64)  NOT NULL,
    action_type      VARCHAR(80)  NOT NULL,
    description      TEXT         NULL,
    action_date      DATETIME     NOT NULL,
    created_by_id    BIGINT UNSIGNED NULL,
    created_by_name  VARCHAR(190) NULL,
    created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_action_school_date (school_id, action_date),
    KEY idx_action_student     (student_id, school_id),
    CONSTRAINT fk_action_school   FOREIGN KEY (school_id)        REFERENCES schools        (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_action_year     FOREIGN KEY (academic_year_id)  REFERENCES academic_years (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_action_student  FOREIGN KEY (student_id)        REFERENCES students       (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_action_creator  FOREIGN KEY (created_by_id)     REFERENCES users          (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 13. PERSONEL ──────────────────────────────────────────────────────────────
-- Not: Sisteme giriş yapabilen personel 'users' tablosundadır.
-- Bu tablo; sınıf sorumluluğu, branş vb. ek bilgileri tutar.
CREATE TABLE IF NOT EXISTS staff (
    id          VARCHAR(64)  NOT NULL,
    school_id   VARCHAR(64)  NOT NULL,
    user_id     BIGINT UNSIGNED NULL,          -- NULL ise sisteme girişi yoktur
    name        VARCHAR(190) NOT NULL,
    branch      VARCHAR(100) NULL,
    role_label  VARCHAR(100) NULL,             -- UI'da gösterilecek unvan
    active      TINYINT(1)   NOT NULL DEFAULT 1,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_staff_school (school_id),
    CONSTRAINT fk_staff_school FOREIGN KEY (school_id) REFERENCES schools (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_staff_user   FOREIGN KEY (user_id)   REFERENCES users   (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── ÖRNEK OKUL VERİSİ (seed) ─────────────────────────────────────────────────
-- Not: Üretimde bu INSERT'leri ayrı bir seed migration dosyasına taşıyın.
INSERT INTO schools (id, code, name, district, active) VALUES
    ('school_kasif',      'KKAL-34',  'Kaşif Kalkavan Anadolu Lisesi',                     'Pendik / İstanbul',  1),
    ('school_ataturk',    'AFL-34',   'Atatürk Fen Lisesi',                                'Kadıköy / İstanbul', 1),
    ('school_cumhuriyet', 'CMTAL-34', 'Cumhuriyet Mesleki ve Teknik Anadolu Lisesi',       'Üsküdar / İstanbul', 1)
ON DUPLICATE KEY UPDATE
    code     = VALUES(code),
    name     = VALUES(name),
    district = VALUES(district),
    active   = VALUES(active);

SET FOREIGN_KEY_CHECKS = 1;
