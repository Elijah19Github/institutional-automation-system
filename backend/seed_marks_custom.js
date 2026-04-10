const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const generateRandomScore = (max) => Math.floor(Math.random() * (max - (max/2) + 1)) + Math.floor(max/2); // Returns between 50% and 100%

async function seedMarks() {
    try {
        console.log('Seeding Marks Data...');
        
        // Ensure a user exists to record
        const adminRes = await pool.query("SELECT id FROM users LIMIT 1");
        if (adminRes.rows.length === 0) {
            console.log('No user found, marks recorded_by might be null.');
        } 
        const adminId = adminRes.rows.length > 0 ? adminRes.rows[0].id : null;

        const studentsRes = await pool.query('SELECT id, course_id FROM students');
        const students = studentsRes.rows;

        if (students.length === 0) {
            console.log('No students found to seed marks for.');
            process.exit(0);
        }

        // Fix missing unique constraint for marks
        await pool.query(`
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'unique_marks_student_subject_type'
                ) THEN
                    ALTER TABLE marks ADD CONSTRAINT unique_marks_student_subject_type UNIQUE (student_id, subject_id, type);
                END IF;
            END $$;
        `);

        let marksCount = 0;

        for (const student of students) {
            // Get subjects for this student's course (Assuming 1st & 2nd SEMester represents 2 subjects roughly, or multiple subjects in a course)
            const subjectsRes = await pool.query('SELECT id FROM subjects WHERE course_id = $1', [student.course_id]);
            const subjects = subjectsRes.rows;

            for (const subject of subjects) {
                // Internal 1
                await pool.query(`
                    INSERT INTO marks (student_id, subject_id, type, score)
                    VALUES ($1, $2, 'Internal 1', $3)
                    ON CONFLICT (student_id, subject_id, type) 
                    DO UPDATE SET score = EXCLUDED.score;
                `, [student.id, subject.id, generateRandomScore(25)]);
                
                // Internal 2
                await pool.query(`
                    INSERT INTO marks (student_id, subject_id, type, score)
                    VALUES ($1, $2, 'Internal 2', $3)
                    ON CONFLICT (student_id, subject_id, type) 
                    DO UPDATE SET score = EXCLUDED.score;
                `, [student.id, subject.id, generateRandomScore(25)]);
                
                // Semester
                await pool.query(`
                    INSERT INTO marks (student_id, subject_id, type, score)
                    VALUES ($1, $2, 'Semester', $3)
                    ON CONFLICT (student_id, subject_id, type) 
                    DO UPDATE SET score = EXCLUDED.score;
                `, [student.id, subject.id, generateRandomScore(50)]);

                marksCount += 3;
            }
        }

        console.log(`Successfully seeded ${marksCount} marks across ${students.length} students!`);
        process.exit(0);
    } catch (e) {
        console.error('Marks seeding failed:', e);
        process.exit(1);
    }
}

seedMarks();
