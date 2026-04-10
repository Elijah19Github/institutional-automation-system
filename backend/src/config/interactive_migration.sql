-- Interactive Dashboard Migration
-- Adding missing fields for drill-down views

-- 1. Update Students Table
ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth DATE;

-- 2. Update Faculty Table
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS department VARCHAR(100);
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
