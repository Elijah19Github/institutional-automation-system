-- Real-World Institutional ERP Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Wipe existing old tables if any (Cascading)
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS marks CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS ai_risk_analysis CASCADE;
DROP TABLE IF EXISTS placements CASCADE;
DROP TABLE IF EXISTS library_books CASCADE;
DROP TABLE IF EXISTS hostel_rooms CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS faculty CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS attendance_sessions CASCADE;
DROP TABLE IF EXISTS academic_hours CASCADE;
DROP TABLE IF EXISTS attendance_sessions CASCADE;
DROP TABLE IF EXISTS student_enrollment CASCADE;
DROP TABLE IF EXISTS faculty_subject_mapping CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS semesters CASCADE;
DROP TABLE IF EXISTS batch_years CASCADE;
DROP TABLE IF EXISTS academic_years CASCADE;
DROP TABLE IF EXISTS provisional_admissions CASCADE;
DROP TABLE IF EXISTS applications CASCADE;

-- Drop Enums if they exist
DO $$ BEGIN
    DROP TYPE IF EXISTS user_role CASCADE;
    DROP TYPE IF EXISTS app_status CASCADE;
EXCEPTION
    WHEN others THEN null;
END $$;

-------------------------------------------------------------------
-- ENUMS
-------------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('SUPADMIN', 'ADMIN', 'FACULTY', 'STUDENT');
CREATE TYPE app_status AS ENUM ('pending', 'accepted', 'rejected');

-------------------------------------------------------------------
-- 1. CORE USER MANAGEMENT
-------------------------------------------------------------------
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-------------------------------------------------------------------
-- 2. ACADEMIC HIERARCHY (The Backbone)
-------------------------------------------------------------------

-- Represents an academic year (e.g., "2024-2025")
CREATE TABLE academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false
);

-- Represents a Batch of students (e.g., "Batch 2024", "Batch 2025")
CREATE TABLE batch_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    entry_year INT NOT NULL
);

-- Represents Semesters (e.g., 1, 2, 3, 4)
CREATE TABLE semesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    semester_number INT NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL -- "Semester 1", "Semester 2"
);

-- Represents Sections/Classes under a Batch & Semester (e.g., "MCA-A", "MCA-B")
CREATE TABLE sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL,
    batch_id UUID REFERENCES batch_years(id) ON DELETE CASCADE,
    semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE,
    capacity INT DEFAULT 60,
    UNIQUE(name, batch_id, semester_id) -- A section name must be unique per batch/semester
);

-- Represents Subjects/Courses
CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE, -- e.g., "MCA101"
    name VARCHAR(255) NOT NULL, -- e.g., "Data Structures"
    credits INT DEFAULT 3,
    semester_id UUID REFERENCES semesters(id) ON DELETE CASCADE
);

-------------------------------------------------------------------
-- 3. ADMISSION WORKFLOW
-------------------------------------------------------------------

-- Applicants who apply initially
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    previous_degree VARCHAR(255),
    previous_cgpa NUMERIC(4,2),
    status app_status DEFAULT 'pending',
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Track those accepted who need to pay fees before getting a Student Account
CREATE TABLE provisional_admissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    fee_amount NUMERIC(10,2) NOT NULL,
    fee_deadline TIMESTAMP NOT NULL,
    is_paid BOOLEAN DEFAULT false,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-------------------------------------------------------------------
-- 4. ENTITY PROFILES (STUDENT / FACULTY)
-------------------------------------------------------------------

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    enrollment_number VARCHAR(50) NOT NULL UNIQUE, -- The generated Student ID
    batch_id UUID REFERENCES batch_years(id) ON DELETE SET NULL,
    current_semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
    current_section_id UUID REFERENCES sections(id) ON DELETE SET NULL
);

CREATE TABLE faculty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    designation VARCHAR(100)
);

-------------------------------------------------------------------
-- 5. ACADEMIC MAPPINGS
-------------------------------------------------------------------

-- Maps which faculty teaches which subject in which section
CREATE TABLE faculty_subject_mapping (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    UNIQUE(faculty_id, subject_id, section_id, academic_year_id)
);

-- Maps which student is currently studying which subject 
-- (Usually auto-inherited via their Section, but this allows for electives or backlog tracking)
CREATE TABLE student_enrollment (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id) ON DELETE CASCADE,
    UNIQUE(student_id, subject_id, academic_year_id)
);


-------------------------------------------------------------------
-- 6. ATTENDANCE MODULE (Dynamic Session Based)
-------------------------------------------------------------------

-- Academic Hours for Time Slot Tracking
CREATE TABLE academic_hours (
    id SERIAL PRIMARY KEY,
    hour_number INT NOT NULL UNIQUE,
    label VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true
);

-- A specific lecture/session taken by a faculty
CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
    section_id UUID REFERENCES sections(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    hour_id INT REFERENCES academic_hours(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(subject_id, section_id, session_date, hour_id) -- Prevent duplicate sessions on same hour slot
);

-- Individual record for each student in a session
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(1) CHECK (status IN ('P', 'A')), -- 'P'resent, 'A'bsent
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, student_id)
);

-------------------------------------------------------------------
-- SEED DATA FOR TESTING
-------------------------------------------------------------------

-- Create default Super Admin user (Needs raw password hash for "admin123")
INSERT INTO users (id, email, password, name, role) 
VALUES ('bb744ce9-255c-414d-b9dd-8c90ef515f6f', 'admin@college.com', '$2y$10$w8DqO.J3h3t6gL2Xw.G0P.T.tU28O4.tE1tYQxM8eW14N/L31G5vO', 'System Admin', 'ADMIN');

-- Seed Academic Hours 1 to 13
INSERT INTO academic_hours (hour_number, label) VALUES
(1, 'Hour 1'), (2, 'Hour 2'), (3, 'Hour 3'), (4, 'Hour 4'),
(5, 'Hour 5'), (6, 'Hour 6'), (7, 'Hour 7'), (8, 'Hour 8'),
(9, 'Hour 9'), (10, 'Hour 10'), (11, 'Hour 11'), (12, 'Hour 12'), (13, 'Hour 13');
