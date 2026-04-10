-- ============================================================
-- Intelligent Academic Management System - Schema v3.0
-- All tables properly defined — No hardcoded data
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── DROP ALL TABLES (reverse dependency order) ──────────────
DROP TABLE IF EXISTS academic_risk CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS marks_control CASCADE;
DROP TABLE IF EXISTS quizzes CASCADE;
DROP TABLE IF EXISTS attendance_control CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS attendance_sessions CASCADE;
DROP TABLE IF EXISTS marks CASCADE;
DROP TABLE IF EXISTS results CASCADE;
DROP TABLE IF EXISTS submissions CASCADE;
DROP TABLE IF EXISTS assignments CASCADE;
DROP TABLE IF EXISTS student_enrollment CASCADE;
DROP TABLE IF EXISTS faculty_subject_mapping CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS semesters CASCADE;
DROP TABLE IF EXISTS batch_years CASCADE;
DROP TABLE IF EXISTS academic_years CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS public_courses CASCADE;
DROP TABLE IF EXISTS provisional_admissions CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS academic_hours CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DO $$ BEGIN
    DROP TYPE IF EXISTS user_role CASCADE;
    DROP TYPE IF EXISTS app_status CASCADE;
EXCEPTION WHEN others THEN null; END $$;

-- ─── ENUMS ───────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('SUPADMIN', 'ADMIN', 'FACULTY', 'STUDENT');
CREATE TYPE app_status AS ENUM ('pending', 'accepted', 'rejected');

-- ─────────────────────────────────────────────────────────────
-- 1. USERS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    role        user_role NOT NULL,
    system_id   VARCHAR(50) UNIQUE,
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────
-- 2. ACADEMIC STRUCTURE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE academic_years (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    start_date  DATE NOT NULL,
    end_date    DATE NOT NULL,
    is_current  BOOLEAN DEFAULT false
);

CREATE TABLE batch_years (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    entry_year  INT NOT NULL
);

CREATE TABLE semesters (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semester_number  INT NOT NULL UNIQUE,
    name             VARCHAR(50) NOT NULL
);

CREATE TABLE courses (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_name     VARCHAR(255) NOT NULL,
    course_code     VARCHAR(50) UNIQUE,
    description     TEXT,
    duration_years  INT DEFAULT 2,
    total_semesters INT DEFAULT 4,
    department      VARCHAR(100),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sections (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(50) NOT NULL,
    batch_id    UUID REFERENCES batch_years(id) ON DELETE CASCADE,
    semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE,
    capacity    INT DEFAULT 60,
    UNIQUE(name, batch_id, semester_id)
);

CREATE TABLE subjects (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code        VARCHAR(50) NOT NULL UNIQUE,
    name        VARCHAR(255) NOT NULL,
    credits     INT DEFAULT 3,
    semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE,
    course_id   UUID REFERENCES courses(id) ON DELETE CASCADE
);

-- Public catalog shown on admissions portal
CREATE TABLE public_courses (
    id           SERIAL PRIMARY KEY,
    category     VARCHAR(100),
    name         VARCHAR(255),
    campus       VARCHAR(100),
    open_from    VARCHAR(50),
    open_until   VARCHAR(50),
    status       VARCHAR(50),
    document_url TEXT
);

-- ─────────────────────────────────────────────────────────────
-- 3. ADMISSIONS WORKFLOW
-- ─────────────────────────────────────────────────────────────
CREATE TABLE applications (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name       VARCHAR(100) NOT NULL,
    last_name        VARCHAR(100) NOT NULL,
    email            VARCHAR(255) NOT NULL UNIQUE,
    phone            VARCHAR(20),
    previous_degree  VARCHAR(255),
    previous_cgpa    NUMERIC(4,2),
    course_interested VARCHAR(255),
    status           app_status DEFAULT 'pending',
    approved_by      UUID REFERENCES users(id),
    decision_date    TIMESTAMP,
    applied_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE provisional_admissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id  UUID REFERENCES applications(id) ON DELETE CASCADE,
    fee_amount      NUMERIC(10,2) NOT NULL,
    fee_deadline    TIMESTAMP NOT NULL,
    is_paid         BOOLEAN DEFAULT false,
    generated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────
-- 4. ENTITY PROFILES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE faculty (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    employee_id     VARCHAR(50) NOT NULL UNIQUE,
    designation     VARCHAR(100),
    department      VARCHAR(100),
    phone_number    VARCHAR(20),
    profile_pic_url TEXT
);

CREATE TABLE students (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id             UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    enrollment_number   VARCHAR(50) NOT NULL UNIQUE,
    course_id           UUID REFERENCES courses(id) ON DELETE SET NULL,
    department          VARCHAR(100),
    batch_id            UUID REFERENCES batch_years(id) ON DELETE SET NULL,
    current_semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
    current_section_id  UUID REFERENCES sections(id) ON DELETE SET NULL
);

-- ─────────────────────────────────────────────────────────────
-- 5. ACADEMIC MAPPINGS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE faculty_subject_mapping (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id       UUID REFERENCES faculty(id) ON DELETE CASCADE,
    subject_id       UUID REFERENCES subjects(id) ON DELETE CASCADE,
    section_id       UUID REFERENCES sections(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    assigned_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(faculty_id, subject_id, section_id, academic_year_id)
);

CREATE TABLE student_enrollment (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id       UUID REFERENCES students(id) ON DELETE CASCADE,
    subject_id       UUID REFERENCES subjects(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    UNIQUE(student_id, subject_id, academic_year_id)
);

-- ─────────────────────────────────────────────────────────────
-- 6. ATTENDANCE MODULE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE academic_hours (
    id          SERIAL PRIMARY KEY,
    hour_number INT NOT NULL UNIQUE,
    label       VARCHAR(50) NOT NULL,
    is_active   BOOLEAN DEFAULT true
);

CREATE TABLE attendance_sessions (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id   UUID REFERENCES faculty(id) ON DELETE CASCADE,
    subject_id   UUID REFERENCES subjects(id) ON DELETE CASCADE,
    section_id   UUID REFERENCES sections(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    hour_id      INT REFERENCES academic_hours(id) ON DELETE CASCADE,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subject_id, section_id, session_date, hour_id)
);

CREATE TABLE attendance_records (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    status     VARCHAR(1) CHECK (status IN ('P', 'A')),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, student_id)
);

-- Attendance lock governance
CREATE TABLE attendance_control (
    id         SERIAL PRIMARY KEY,
    scope      VARCHAR(20) NOT NULL,  -- 'global', 'course', 'subject'
    target_id  UUID,
    is_locked  BOOLEAN DEFAULT FALSE,
    locked_by  UUID REFERENCES users(id),
    locked_at  TIMESTAMP,
    UNIQUE(scope, target_id)
);

-- ─────────────────────────────────────────────────────────────
-- 7. MARKS & ASSESSMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE assignments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_id  UUID REFERENCES subjects(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    due_date    TIMESTAMP,
    total_marks INT DEFAULT 100
);

CREATE TABLE submissions (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    student_id    UUID REFERENCES students(id) ON DELETE CASCADE,
    score         INT,
    submitted_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- marks.type: 'Internal 1' (max 25), 'Internal 2' (max 25), 'Semester' (max 50)
CREATE TABLE marks (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    score      NUMERIC(6,2) NOT NULL,
    max_score  NUMERIC(6,2) NOT NULL DEFAULT 100,
    type       VARCHAR(50),       -- 'Internal 1', 'Internal 2', 'Semester'
    is_final   BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, subject_id, type)
);

CREATE TABLE results (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    gpa        NUMERIC(3,2),
    grade      VARCHAR(5),
    semester   INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Marks entry lock governance
CREATE TABLE marks_control (
    id         SERIAL PRIMARY KEY,
    exam_type  VARCHAR(50) NOT NULL,
    scope      VARCHAR(20) NOT NULL,  -- 'global', 'subject'
    target_id  UUID,
    is_locked  BOOLEAN DEFAULT FALSE,
    locked_by  UUID REFERENCES users(id),
    locked_at  TIMESTAMP,
    UNIQUE(exam_type, scope, target_id)
);

-- ─────────────────────────────────────────────────────────────
-- 8. AI RISK MODULE
-- ─────────────────────────────────────────────────────────────
CREATE TABLE academic_risk (
    id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id            UUID REFERENCES students(id) ON DELETE CASCADE,
    attendance_percentage NUMERIC(5,2) DEFAULT 0,
    average_marks         NUMERIC(5,2) DEFAULT 0,
    risk_score            NUMERIC(5,2) DEFAULT 0,
    risk_level            VARCHAR(10) CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    semester_id           UUID REFERENCES semesters(id),
    calculated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, semester_id)
);

-- ─────────────────────────────────────────────────────────────
-- 9. NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE notifications (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    message    TEXT NOT NULL,
    risk_level VARCHAR(20),
    is_read    BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────
-- 10. QUIZZES (AI Quiz Generator feature)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE quizzes (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    subject_id       UUID REFERENCES subjects(id) ON DELETE CASCADE,
    section_id       UUID REFERENCES sections(id) ON DELETE SET NULL,
    batch_id         UUID REFERENCES batch_years(id) ON DELETE SET NULL,
    created_by       UUID REFERENCES users(id),
    questions        JSONB NOT NULL DEFAULT '[]', -- Fallback or primary storage
    duration_minutes INT DEFAULT 30,
    total_marks      INT DEFAULT 100,
    difficulty       VARCHAR(20) DEFAULT 'Medium', -- Easy, Medium, Hard
    attempt_type     VARCHAR(20) DEFAULT 'Single', -- Single, Multiple
    start_at         TIMESTAMP,
    end_at           TIMESTAMP,
    is_published     BOOLEAN DEFAULT false,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE quiz_attempts (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    quiz_id      UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    student_id   UUID REFERENCES students(id) ON DELETE CASCADE,
    score        NUMERIC(6,2),
    total_marks  NUMERIC(6,2),
    answers      JSONB NOT NULL DEFAULT '{}',
    started_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    status       VARCHAR(20) DEFAULT 'IN_PROGRESS', -- IN_PROGRESS, SUBMITTED
    UNIQUE(quiz_id, student_id) WHERE status = 'IN_PROGRESS' -- Only one active attempt at a time
);

-- ─────────────────────────────────────────────────────────────
-- 11. AUTHENTICATION
-- ─────────────────────────────────────────────────────────────
CREATE TABLE password_resets (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
    token      VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────────────────────────
-- SEED: Essential base data only (admin user + academic hours)
-- All other data is seeded via seed_master_v2.js
-- ─────────────────────────────────────────────────────────────

-- Default admin (password: admin123)
INSERT INTO users (id, email, password, name, role, system_id)
VALUES (
    'bb744ce9-255c-414d-b9dd-8c90ef515f6f',
    'admin@college.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'System Administrator',
    'ADMIN',
    'ADM001'
);

-- Academic Hours 1 to 8
INSERT INTO academic_hours (hour_number, label) VALUES
(1,  'Hour 1  (08:00 - 08:50)'),
(2,  'Hour 2  (08:50 - 09:40)'),
(3,  'Hour 3  (09:40 - 10:30)'),
(4,  'Hour 4  (10:45 - 11:35)'),
(5,  'Hour 5  (11:35 - 12:25)'),
(6,  'Hour 6  (13:15 - 14:05)'),
(7,  'Hour 7  (14:05 - 14:55)'),
(8,  'Hour 8  (14:55 - 15:45)');
