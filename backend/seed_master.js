require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function seed() {
    try {
        console.log('🌱 Starting Master System Seed...');

        // 1. Core Users (Admin already exists, but reset just in case)
        await pool.query('DELETE FROM attendance_records');
        await pool.query('DELETE FROM attendance_sessions');
        await pool.query('DELETE FROM marks');
        await pool.query('DELETE FROM results');
        await pool.query('DELETE FROM submissions');
        await pool.query('DELETE FROM assignments');
        await pool.query('DELETE FROM faculty_subject_mapping');
        await pool.query('DELETE FROM students');
        await pool.query('DELETE FROM faculty');
        await pool.query('DELETE FROM subjects');
        await pool.query('DELETE FROM sections');
        await pool.query('DELETE FROM semesters');
        await pool.query('DELETE FROM batch_years');
        await pool.query('DELETE FROM academic_years');
        await pool.query('DELETE FROM courses');
        await pool.query('DELETE FROM public_courses');
        await pool.query('DELETE FROM academic_hours');
        await pool.query('DELETE FROM users'); // Full reset for consistency

        // 0. Pre-calculating hashes for performance
        console.log('⚡ Hashing passwords...');
        const adminHash = await bcrypt.hash('admin123', 10);
        const userHash = await bcrypt.hash('password123', 10);

        // 1. Admin
        console.log('🛠️ Seeding Admin...');
        await pool.query("INSERT INTO users (email, password, name, role, system_id) VALUES ('admin@college.com', $1, 'System Administrator', 'ADMIN', 'ADM001')", [adminHash]);

        // Academic Hours
        console.log('⏰ Seeding Academic Hours...');
        let firstHourId;
        for(let i=1; i<=13; i++) {
            const hRes = await pool.query('INSERT INTO academic_hours (hour_number, label) VALUES ($1, $2) RETURNING id', [i, `Hour ${i}`]);
            if (i === 1) firstHourId = hRes.rows[0].id;
        }

        // Academic Year
        const ay = await pool.query("INSERT INTO academic_years (name, start_date, end_date, is_current) VALUES ('2024-2025', '2024-06-01', '2025-05-31', true) RETURNING id");
        const ayId = ay.rows[0].id;

        // Batch / Course
        const batch = await pool.query("INSERT INTO batch_years (name, entry_year) VALUES ('Batch 2024', 2024) RETURNING id");
        const batchId = batch.rows[0].id;

        const courseResult = await pool.query("INSERT INTO courses (course_name, course_code, description) VALUES ('Master of Computer Applications', 'MCA', 'Advanced computing program') RETURNING id");
        const courseId = courseResult.rows[0].id;

        // Semesters
        const sem = await pool.query("INSERT INTO semesters (semester_number, name) VALUES (1, 'Semester 1') RETURNING id");
        const semId = sem.rows[0].id;

        // Section
        const sec = await pool.query("INSERT INTO sections (name, batch_id, semester_id) VALUES ('MCA-A', $1, $2) RETURNING id", [batchId, semId]);
        const secId = sec.rows[0].id;

        // Subjects
        const sub1 = await pool.query("INSERT INTO subjects (name, code, credits, semester_id, course_id) VALUES ('Data Structures', 'MCA101', 4, $1, $2) RETURNING id", [semId, courseId]);
        const sub2 = await pool.query("INSERT INTO subjects (name, code, credits, semester_id, course_id) VALUES ('Node.js Microservices', 'MCA102', 3, $1, $2) RETURNING id", [semId, courseId]);
        const subIds = [sub1.rows[0].id, sub2.rows[0].id];

        // Faculty
        const facultyUser = await pool.query("INSERT INTO users (email, password, name, role, system_id) VALUES ('faculty@college.com', $1, 'Prof. Alan Turing', 'FACULTY', 'FAC001') RETURNING id", [userHash]);
        const facultyRecord = await pool.query("INSERT INTO faculty (user_id, employee_id, designation) VALUES ($1, 'FAC001', 'Head of Dept') RETURNING id", [facultyUser.rows[0].id]);
        const facultyId = facultyRecord.rows[0].id;

        // Faculty Subject Mapping
        for(const sid of subIds) {
            await pool.query("INSERT INTO faculty_subject_mapping (faculty_id, subject_id, section_id, academic_year_id) VALUES ($1, $2, $3, $4)", [facultyId, sid, secId, ayId]);
        }

        // Students (50 students)
        console.log('👨‍🎓 Creating 50 students...');
        for(let i=1; i<=50; i++) {
            const sid_str = `STU2024${i.toString().padStart(3,'0')}`;
            const stuUser = await pool.query(`INSERT INTO users (email, password, name, role, system_id) VALUES ('student${i}@college.com', $1, 'Student ${i}', 'STUDENT', $2) RETURNING id`, [userHash, sid_str]);
            const stu = await pool.query("INSERT INTO students (user_id, enrollment_number, batch_id, current_semester_id, current_section_id) VALUES ($1, $2, $3, $4, $5) RETURNING id", 
                [stuUser.rows[0].id, sid_str, batchId, semId, secId]);
            const sid = stu.rows[0].id;

            // Seed Attendance (Last 7 days, 80% present)
            for(let d=0; d<7; d++) {
                const date = new Date();
                date.setDate(date.getDate() - d);
                const dateStr = date.toISOString().split('T')[0];

                for(const subId of subIds) {
                    // Create Session if not exists
                    let sess = await pool.query("SELECT id FROM attendance_sessions WHERE subject_id = $1 AND section_id = $2 AND session_date = $3", [subId, secId, dateStr]);
                    let sessId;
                    if(sess.rows.length === 0) {
                        const newSess = await pool.query("INSERT INTO attendance_sessions (faculty_id, subject_id, section_id, session_date, hour_id) VALUES ($1, $2, $3, $4, $5) RETURNING id", [facultyId, subId, secId, dateStr, firstHourId]);
                        sessId = newSess.rows[0].id;
                    } else {
                        sessId = sess.rows[0].id;
                    }

                    const status = Math.random() > 0.2 ? 'P' : 'A';
                    await pool.query("INSERT INTO attendance_records (session_id, student_id, status) VALUES ($1, $2, $3)", [sessId, sid, status]);
                }
            }

            // Seed Marks
            for(const subId of subIds) {
                const score = 40 + Math.floor(Math.random() * 60);
                await pool.query("INSERT INTO marks (student_id, subject_id, score, type) VALUES ($1, $2, $3, 'Midterm')", [sid, subId, score]);
            }

            // Results
            const gpa = (2.5 + Math.random() * 1.5).toFixed(2);
            await pool.query("INSERT INTO results (student_id, subject_id, gpa, semester) VALUES ($1, $2, $3, 1)", [sid, subIds[0], gpa]);
        }

        // Public Catalog
        console.log('📜 Seeding Public Catalog...');
        await pool.query(`
            INSERT INTO public_courses (category, name, campus, open_from, open_until, status) VALUES 
            ('Post Graduate', 'Master of Computer Applications (MCA)', 'Bangalore Central Campus', '15-Mar-2026', '20-Oct-2026', 'Open'),
            ('Under Graduate', 'B.Tech in Artificial Intelligence', 'Kengeri Campus', '10-Apr-2026', '30-Dec-2026', 'Open'),
            ('Doctoral (PhD)', 'PhD in Computer Science', 'Bannerghatta Campus', '01-Jan-2026', '31-Dec-2026', 'Open')
        `);

        console.log('✅ Master Seed Complete!');
    } catch (err) {
        console.error('❌ Seeding Failed:', err);
    } finally {
        await pool.end();
    }
}

seed();
