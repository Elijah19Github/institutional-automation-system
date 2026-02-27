require('dotenv').config();
const { pool } = require('./src/config/db');

async function migrate() {
    console.log("Starting Academic Management DB Migration...");
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS courses (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                course_name VARCHAR(255) NOT NULL,
                duration_years INT NOT NULL,
                total_semesters INT NOT NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("-> Created 'courses' table");

        await pool.query('ALTER TABLE subjects ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE CASCADE');
        console.log("-> Added 'course_id' foreign key to 'subjects'");

        await pool.query('ALTER TABLE subjects ADD COLUMN IF NOT EXISTS semester_number INT');
        console.log("-> Added 'semester_number' to 'subjects'");

        await pool.query('ALTER TABLE faculty_subject_mapping ADD COLUMN IF NOT EXISTS semester_number INT');
        await pool.query('ALTER TABLE faculty_subject_mapping ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        console.log("-> Added 'semester_number' and 'assigned_at' to 'faculty_subject_mapping'");

        console.log("SUCCESS: All schema modifications complete.");
    } catch (error) {
        console.error("FATAL ERROR during migration:", error);
    } finally {
        await pool.end();
        console.log("Database connection closed.");
        process.exit(0);
    }
}

migrate();
