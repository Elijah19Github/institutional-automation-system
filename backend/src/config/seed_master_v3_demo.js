const { pool } = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('🚮 Cleaning up existing data...');
        // Order of deletion to respect foreign keys
        const tables = [
            'academic_risk', 'notifications', 'marks_control', 'quiz_attempts', 'quizzes', 
            'attendance_records', 'attendance_sessions', 'marks', 'results', 'submissions', 
            'assignments', 'student_enrollment', 'faculty_subject_mapping', 'subjects', 
            'sections', 'semesters', 'batch_years', 'academic_years', 'students', 
            'faculty', 'courses', 'users'
        ];
        for (const table of tables) {
            await client.query(`TRUNCATE TABLE ${table} CASCADE`);
        }

        console.log('🏛️  Setting up Academic Infrastructure...');
        const saltRounds = 10;
        const pass = await bcrypt.hash('password123', saltRounds);
        const adminPass = await bcrypt.hash('admin123', saltRounds);

        // 1. Admin
        await client.query("INSERT INTO users (email, password, name, role, system_id) VALUES ('admin@college.com', $1, 'Super Admin', 'ADMIN', 'ADM_INIT')", [adminPass]);

        // 2. Academic Year & Batch
        const ay = await client.query("INSERT INTO academic_years (name, start_date, end_date, is_current) VALUES ('2024-2025', '2024-01-01', '2025-12-31', true) RETURNING id");
        const batch = await client.query("INSERT INTO batch_years (name, entry_year) VALUES ('Batch 2024', 2024) RETURNING id");

        // 3. Semesters (1-4)
        const semIds = [];
        for (let i = 1; i <= 4; i++) {
            const res = await client.query("INSERT INTO semesters (semester_number, name) VALUES ($1, $2) RETURNING id", [i, `Semester ${i}`]);
            semIds.push(res.rows[0].id);
        }

        // 4. Course (MCA)
        const course = await client.query("INSERT INTO courses (course_name, course_code, department) VALUES ('Master of Computer Applications', 'MCA', 'Computer Applications') RETURNING id");
        const courseId = course.rows[0].id;

        // 5. Sections (MCA-A, MCA-B)
        const secA = await client.query("INSERT INTO sections (name, batch_id, semester_id) VALUES ('MCA-A', $1, $2) RETURNING id", [batch.rows[0].id, semIds[3]]); // Current is Sem 4
        const secB = await client.query("INSERT INTO sections (name, batch_id, semester_id) VALUES ('MCA-B', $1, $2) RETURNING id", [batch.rows[0].id, semIds[3]]);
        
        // Also need sections for historical semesters to link mapping properly if needed, 
        // but since sections are linked to sem_id, we create placeholders for Sems 1, 2, 3 as well.
        const histSectionA = [];
        const histSectionB = [];
        for (let i = 0; i < 3; i++) {
            const sA = await client.query("INSERT INTO sections (name, batch_id, semester_id) VALUES ('MCA-A', $1, $2) RETURNING id", [batch.rows[0].id, semIds[i]]);
            const sB = await client.query("INSERT INTO sections (name, batch_id, semester_id) VALUES ('MCA-B', $1, $2) RETURNING id", [batch.rows[0].id, semIds[i]]);
            histSectionA.push(sA.rows[0].id);
            histSectionB.push(sB.rows[0].id);
        }
        histSectionA.push(secA.rows[0].id);
        histSectionB.push(secB.rows[0].id);

        // 6. Subjects (4 per semester)
        const subjects = [];
        for (let s = 1; s <= 4; s++) {
            const semSubjects = [];
            for (let j = 1; j <= 4; j++) {
                const sub = await client.query(
                    "INSERT INTO subjects (code, name, semester_id, course_id) VALUES ($1, $2, $3, $4) RETURNING id",
                    [`MCA${s}${j}`, `Subject ${s}.${j}`, semIds[s-1], courseId]
                );
                semSubjects.push(sub.rows[0].id);
            }
            subjects.push(semSubjects);
        }

        console.log('👨‍🏫 Creating Faculty & Students...');
        // 7. Faculty
        const faculties = [
            { email: 'fac_mca_a@college.com', name: 'Dr. Sarah (MCA-A)', eid: 'EMP001' },
            { email: 'fac_mca_b@college.com', name: 'Dr. Michael (MCA-B)', eid: 'EMP002' }
        ];
        const facultyIds = [];
        for (const f of faculties) {
            const u = await client.query("INSERT INTO users (email, password, name, role, system_id) VALUES ($1, $2, $3, 'FACULTY', $4) RETURNING id", [f.email, pass, f.name, f.eid]);
            const fac = await client.query("INSERT INTO faculty (user_id, employee_id, department) VALUES ($1, $2, 'Computer Applications') RETURNING id", [u.rows[0].id, f.eid]);
            facultyIds.push(fac.rows[0].id);
        }

        // 8. Mapping Faculty to Subjects
        // Fac 0 handles Sem 1, 3 | Fac 1 handles Sem 2, 4
        for (let s = 0; s < 4; s++) {
            const facIndex = s % 2;
            for (const subId of subjects[s]) {
                // Map to both sections
                await client.query("INSERT INTO faculty_subject_mapping (faculty_id, subject_id, section_id, academic_year_id) VALUES ($1, $2, $3, $4)", [facultyIds[facIndex], subId, histSectionA[s], ay.rows[0].id]);
                await client.query("INSERT INTO faculty_subject_mapping (faculty_id, subject_id, section_id, academic_year_id) VALUES ($1, $2, $3, $4)", [facultyIds[facIndex], subId, histSectionB[s], ay.rows[0].id]);
            }
        }

        // 9. Students (10 students)
        const studentIds = [];
        for (let i = 1; i <= 10; i++) {
            const email = `student${i}@college.com`;
            const regno = `24MCA${i.toString().padStart(3, '0')}`;
            const isSecA = i <= 5;
            const u = await client.query("INSERT INTO users (email, password, name, role, system_id) VALUES ($1, $2, $3, 'STUDENT', $4) RETURNING id", [email, pass, `Student ${i}`, regno]);
            const stu = await client.query(
                "INSERT INTO students (user_id, enrollment_number, course_id, batch_id, current_semester_id, current_section_id, department) VALUES ($1, $2, $3, $4, $5, $6, 'Computer Applications') RETURNING id",
                [u.rows[0].id, regno, courseId, batch.rows[0].id, semIds[3], isSecA ? secA.rows[0].id : secB.rows[0].id]
            );
            studentIds.push({ id: stu.rows[0].id, isSecA });
            
            // Enroll in all subjects for historical tracking (Simulated)
            for (let s = 0; s < 4; s++) {
                for (const subId of subjects[s]) {
                    await client.query("INSERT INTO student_enrollment (student_id, subject_id, academic_year_id) VALUES ($1, $2, $3)", [stu.rows[0].id, subId, ay.rows[0].id]);
                }
            }
        }

        console.log('📈 Generating Historical Attendance & Marks (4 Semesters)...');
        // 10. Bulk Data Loop
        const hourRes = await client.query("SELECT id FROM academic_hours LIMIT 1");
        const hourId = hourRes.rows[0].id;

        for (let s = 0; s < 4; s++) {
            console.log(`Processing Semester ${s+1}...`);
            const facultyIndex = s % 2;
            const semSubjectIds = subjects[s];

            for (const subId of semSubjectIds) {
                // Generate ~40 sessions per subject
                for (let session = 1; session <= 40; session++) {
                    const sessionDate = new Date(2024, (s * 4) + Math.floor(session/10), (session % 28) + 1);
                    
                    const sessARes = await client.query(
                        "INSERT INTO attendance_sessions (faculty_id, subject_id, section_id, session_date, hour_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
                        [facultyIds[facultyIndex], subId, histSectionA[s], sessionDate, hourId]
                    );
                    const sessBRes = await client.query(
                        "INSERT INTO attendance_sessions (faculty_id, subject_id, section_id, session_date, hour_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
                        [facultyIds[facultyIndex], subId, histSectionB[s], sessionDate, hourId]
                    );

                    for (const stu of studentIds) {
                        const targetSessId = stu.isSecA ? sessARes.rows[0].id : sessBRes.rows[0].id;
                        
                        // Reliability logic (Attendance)
                        let prob = 0.95; // High (1-3)
                        const stuNum = parseInt(stu.id.split('-')[0], 16) % 10 + 1; // Unstable way, let's use loop index
                        const idx = studentIds.indexOf(stu) + 1;
                        if (idx >= 4 && idx <= 6) prob = 0.75; // Medium
                        if (idx >= 7) prob = 0.45; // Low Risk

                        const status = Math.random() < prob ? 'P' : 'A';
                        await client.query("INSERT INTO attendance_records (session_id, student_id, status) VALUES ($1, $2, $3)", [targetSessId, stu.id, status]);
                    }
                }

                // Generate Marks for this subject
                for (const stu of studentIds) {
                    const idx = studentIds.indexOf(stu) + 1;
                    let marksBase = 85; 
                    if (idx >= 4 && idx <= 6) marksBase = 65;
                    if (idx >= 7) marksBase = 40;

                    const internal = marksBase + (Math.random() * 10 - 5);
                    const external = (marksBase + (Math.random() * 15 - 10)) * 2; // scale to 100

                    await client.query("INSERT INTO marks (student_id, subject_id, score, max_score, type) VALUES ($1, $2, $3, 50, 'Internal 1')", [stu.id, subId, Math.min(internal/2, 25)]);
                    await client.query("INSERT INTO marks (student_id, subject_id, score, max_score, type) VALUES ($1, $2, $3, 100, 'Semester')", [stu.id, subId, Math.min(external, 100)]);
                }
            }

            // Results Table (GPA calculation for results history)
            for (const stu of studentIds) {
                const idx = studentIds.indexOf(stu) + 1;
                let gpa = 9.2;
                if (idx >= 4 && idx <= 6) gpa = 7.5;
                if (idx >= 7) gpa = 4.8;
                await client.query("INSERT INTO results (student_id, gpa, semester, grade) VALUES ($1, $2, $3, $4)", [stu.id, gpa, s+1, gpa > 9 ? 'O' : gpa > 7 ? 'A' : 'E']);
            }
        }

        console.log('🤖 Calculating AI Risk Scores...');
        // 11. Static AI Risk Seeding based on generated metrics
        for (const stu of studentIds) {
            const idx = studentIds.indexOf(stu) + 1;
            let level = 'LOW';
            let score = 15;
            if (idx >= 4 && idx <= 6) { level = 'MEDIUM'; score = 55; }
            if (idx >= 7) { level = 'HIGH'; score = 88; }

            await client.query(
                "INSERT INTO academic_risk (student_id, attendance_percentage, average_marks, risk_score, risk_level, semester_id) VALUES ($1, $2, $3, $4, $5, $6)",
                [stu.id, (idx >= 7 ? 45 : 85), (idx >= 7 ? 40 : 80), score, level, semIds[3]]
            );
        }

        await client.query('COMMIT');
        console.log('🚀 DEMO GENERATION COMPLETE. DATA READY FOR COLLEGE PRESENTATION.');
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ SEEDING FAILED:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

seed();
