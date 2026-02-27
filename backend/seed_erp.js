require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function seedTestData() {
    const client = await pool.connect();
    try {
        console.log('Seeding minimal ERP test data...');
        await client.query('BEGIN');

        // 1. Create Academic Hierarchy
        const yearRes = await client.query("INSERT INTO academic_years (name, start_date, end_date, is_current) VALUES ('2025-2026', '2025-08-01', '2026-05-31', true) RETURNING id");
        const yearId = yearRes.rows[0].id;

        const batchRes = await client.query("INSERT INTO batch_years (name, entry_year) VALUES ('MCA Batch 2025', 2025) RETURNING id");
        const batchId = batchRes.rows[0].id;

        const semRes = await client.query("INSERT INTO semesters (semester_number, name) VALUES (1, 'Semester 1') RETURNING id");
        const semId = semRes.rows[0].id;

        const secRes = await client.query("INSERT INTO sections (name, batch_id, semester_id) VALUES ('MCA-A', $1, $2) RETURNING id", [batchId, semId]);
        const secId = secRes.rows[0].id;

        const subjRes = await client.query("INSERT INTO subjects (code, name, credits, semester_id) VALUES ('MCA101', 'Advanced Data Structures', 4, $1) RETURNING id", [semId]);
        const subjId = subjRes.rows[0].id;

        // 2. Create Faculty User & Profile
        const hash = await bcrypt.hash('faculty123', 10);
        const facUserRes = await client.query("INSERT INTO users (email, password, name, role) VALUES ('dr.smith@campus.edu', $1, 'Dr. John Smith', 'FACULTY') RETURNING id", [hash]);
        const facUserId = facUserRes.rows[0].id;

        const facRes = await client.query("INSERT INTO faculty (user_id, employee_id, designation) VALUES ($1, 'EMP001', 'Professor') RETURNING id", [facUserId]);
        const facId = facRes.rows[0].id;

        // 3. Map Faculty to Subject & Section
        await client.query("INSERT INTO faculty_subject_mapping (faculty_id, subject_id, section_id, academic_year_id) VALUES ($1, $2, $3, $4)", [facId, subjId, secId, yearId]);

        // 4. Create Student Users & Profiles
        const stuHash = await bcrypt.hash('student1', 10);

        for (let i = 1; i <= 3; i++) {
            const stuUserRes = await client.query(`INSERT INTO users (email, password, name, role) VALUES ('student${i}@campus.edu', $1, 'Test Student ${i}', 'STUDENT') RETURNING id`, [stuHash]);
            await client.query(
                `INSERT INTO students (user_id, enrollment_number, batch_id, current_semester_id, current_section_id) VALUES ($1, $2, $3, $4, $5)`,
                [stuUserRes.rows[0].id, `STU2025-00${i}`, batchId, semId, secId]
            );
        }

        await client.query('COMMIT');
        console.log('✅ Test Data Seeded!');
        console.log('Faculty Login: dr.smith@campus.edu / faculty123');
        console.log('Student Login: student1@campus.edu / student1');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Seeding failed:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

seedTestData();
