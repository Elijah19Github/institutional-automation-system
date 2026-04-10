/**
 * seed_master_v2.js
 * ─────────────────────────────────────────────────────────────────────────
 * Comprehensive seed for the Intelligent Academic Management System.
 *
 * ✔ Real subject names (MCA & MSc CS, 5 subjects × 6 semesters each)
 * ✔ Realistic faculty with department, designation, phone
 * ✔ 60 real-named students (30 MCA, 30 MSc CS) across 2 batches
 * ✔ Marks use correct types with proper max scores
 *   - Internal 1: out of 25
 *   - Internal 2: out of 25
 *   - Semester:   out of 50
 * ✔ 30-day attendance history with varied rates
 * ✔ Controlled performance mix:
 *   - ~80% students: good performance (LOW risk)
 *   - ~13% students: moderate performance (MEDIUM risk)
 *   -  ~7% students: poor performance  (HIGH risk)
 * ✔ Risk calculation stored in academic_risk table after seeding
 * ─────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// ─── SUBJECT CATALOGUE ────────────────────────────────────────────────────
const MCA_SUBJECTS = {
    1: [
        { name: 'Problem Solving using C',               code: 'MCA101', credits: 4 },
        { name: 'Data Structures',                       code: 'MCA102', credits: 4 },
        { name: 'Discrete Mathematics',                  code: 'MCA103', credits: 3 },
        { name: 'Computer Organization & Architecture', code: 'MCA104', credits: 3 },
        { name: 'Software Engineering',                  code: 'MCA105', credits: 3 },
    ],
    2: [
        { name: 'Object Oriented Programming using Java', code: 'MCA201', credits: 4 },
        { name: 'Database Management Systems',            code: 'MCA202', credits: 4 },
        { name: 'Operating Systems',                      code: 'MCA203', credits: 3 },
        { name: 'Computer Networks',                      code: 'MCA204', credits: 3 },
        { name: 'Web Technologies',                       code: 'MCA205', credits: 3 },
    ],
    3: [
        { name: 'Algorithm Design & Analysis',   code: 'MCA301', credits: 4 },
        { name: 'Advanced Java & J2EE',          code: 'MCA302', credits: 4 },
        { name: 'Python Programming',            code: 'MCA303', credits: 3 },
        { name: 'Software Project Management',  code: 'MCA304', credits: 3 },
        { name: 'Cloud Computing',               code: 'MCA305', credits: 3 },
    ],
    4: [
        { name: 'Machine Learning',              code: 'MCA401', credits: 4 },
        { name: 'Mobile Application Development',code: 'MCA402', credits: 4 },
        { name: 'Big Data Analytics',            code: 'MCA403', credits: 3 },
        { name: 'Cyber Security',                code: 'MCA404', credits: 3 },
        { name: 'Research Methodology',          code: 'MCA405', credits: 3 },
    ],
    5: [
        { name: 'Deep Learning',                 code: 'MCA501', credits: 4 },
        { name: 'IoT & Embedded Systems',        code: 'MCA502', credits: 4 },
        { name: 'Natural Language Processing',   code: 'MCA503', credits: 3 },
        { name: 'Distributed Systems',           code: 'MCA504', credits: 3 },
        { name: 'Project Work Phase I',          code: 'MCA505', credits: 4 },
    ],
    6: [
        { name: 'Advanced Database Technologies',code: 'MCA601', credits: 3 },
        { name: 'DevOps & Cloud Native',         code: 'MCA602', credits: 3 },
        { name: 'Blockchain Technology',         code: 'MCA603', credits: 3 },
        { name: 'Ethics in Technology',          code: 'MCA604', credits: 2 },
        { name: 'Major Project & Viva Voce',     code: 'MCA605', credits: 8 },
    ],
};

const MSCCS_SUBJECTS = {
    1: [
        { name: 'Mathematical Foundations of CS',  code: 'MSCCS101', credits: 4 },
        { name: 'Advanced Data Structures',        code: 'MSCCS102', credits: 4 },
        { name: 'Theory of Computation',           code: 'MSCCS103', credits: 3 },
        { name: 'Computer Architecture',           code: 'MSCCS104', credits: 3 },
        { name: 'Programming Paradigms',           code: 'MSCCS105', credits: 3 },
    ],
    2: [
        { name: 'Advanced Algorithms',              code: 'MSCCS201', credits: 4 },
        { name: 'Database Systems',                 code: 'MSCCS202', credits: 4 },
        { name: 'Operating Systems Design',        code: 'MSCCS203', credits: 3 },
        { name: 'Computer Networks & Security',    code: 'MSCCS204', credits: 3 },
        { name: 'Artificial Intelligence',         code: 'MSCCS205', credits: 3 },
    ],
    3: [
        { name: 'Machine Learning',                code: 'MSCCS301', credits: 4 },
        { name: 'Computer Vision',                 code: 'MSCCS302', credits: 4 },
        { name: 'Big Data Technologies',           code: 'MSCCS303', credits: 3 },
        { name: 'Software Architecture',           code: 'MSCCS304', credits: 3 },
        { name: 'Research Methods in CS',          code: 'MSCCS305', credits: 3 },
    ],
    4: [
        { name: 'Deep Learning & Neural Networks', code: 'MSCCS401', credits: 4 },
        { name: 'Distributed Computing',           code: 'MSCCS402', credits: 4 },
        { name: 'Quantum Computing Fundamentals',  code: 'MSCCS403', credits: 3 },
        { name: 'Advanced Cybersecurity',          code: 'MSCCS404', credits: 3 },
        { name: 'Project Work Phase I',            code: 'MSCCS405', credits: 4 },
    ],
    5: [
        { name: 'Computational Intelligence',      code: 'MSCCS501', credits: 4 },
        { name: 'Cloud & Edge Computing',          code: 'MSCCS502', credits: 3 },
        { name: 'Data Science & Analytics',        code: 'MSCCS503', credits: 4 },
        { name: 'Human Computer Interaction',      code: 'MSCCS504', credits: 3 },
        { name: 'Major Project Phase I',           code: 'MSCCS505', credits: 6 },
    ],
    6: [
        { name: 'Advanced Research Topics',        code: 'MSCCS601', credits: 3 },
        { name: 'Technology Entrepreneurship',     code: 'MSCCS602', credits: 3 },
        { name: 'Thesis Writing & Research Ethics',code: 'MSCCS603', credits: 3 },
        { name: 'Elective: Data Engineering',      code: 'MSCCS604', credits: 3 },
        { name: 'Dissertation & Viva Voce',        code: 'MSCCS605', credits: 8 },
    ],
};

// ─── STUDENT NAME LISTS ───────────────────────────────────────────────────
const MCA_STUDENT_NAMES_B25 = [
    'Arjun Sharma', 'Priya Nair', 'Karthik Reddy', 'Anjali Menon', 'Rahul Verma',
    'Sneha Pillai', 'Vikram Singh', 'Deepa Krishnan', 'Aditya Kumar', 'Pooja Gupta',
    'Raj Malhotra', 'Shreya Joshi', 'Nikhil Tiwari', 'Asha Patel', 'Sanjay Iyer',
];
const MCA_STUDENT_NAMES_B26 = [
    'Rohan Mehta', 'Kavitha Suresh', 'Tarun Saxena', 'Bhavna Chaudhari', 'Suresh Kumar',
    'Lalitha Devi', 'Mayank Trivedi', 'Rashmi Kulkarni', 'Hemant Varma', 'Amita Srivastava',
    'Dinesh Prasad', 'Sudha Rajan', 'Chetan Kamath', 'Vandana Goyal', 'Pranav Desai',
];
const MSCCS_STUDENT_NAMES_B25 = [
    'Meera Kapoor', 'Arjun Nair', 'Rohini Singh', 'Devraj Pillai', 'Lakshmi Reddy',
    'Suresh Menon', 'Kavya Sharma', 'Arun Thomas', 'Nandini Kumar', 'Vijay Krishnan',
    'Preethi Nair', 'Rajan Iyer', 'Swathi Patel', 'Abhinav Verma', 'Geeta Malhotra',
];
const MSCCS_STUDENT_NAMES_B26 = [
    'Kiran Kumar', 'Ananya Singh', 'Rohit Nair', 'Sunita Devi', 'Mohan Rao',
    'Indira Pillai', 'Siddharth Jain', 'Uma Krishnan', 'Naveen Kumar', 'Saritha Menon',
    'Atul Sinha', 'Madhuri Patel', 'Raghavendra Sharma', 'Chitra Suresh', 'Ashwin Reddy',
];

// ─── PERFORMANCE PROFILE ──────────────────────────────────────────────────
// Controls which students will be at risk (for a realistic distribution)
function getPerformanceProfile(studentIndex) {
    // Every 10th student → HIGH risk (poor attendance + poor marks)
    if (studentIndex % 10 === 0) {
        return {
            attendanceRate: 0.42 + Math.random() * 0.15,  // 42–57%
            int1Max: 25, int1: () => Math.floor(Math.random() * 8)  + 2,  // 2–9
            int2Max: 25, int2: () => Math.floor(Math.random() * 8)  + 2,  // 2–9
            semMax:  50, sem:  () => Math.floor(Math.random() * 10) + 8,   // 8–17
        };
    }
    // Every 7th student → MEDIUM risk (low attendance OR low marks)
    if (studentIndex % 7 === 0) {
        return {
            attendanceRate: 0.62 + Math.random() * 0.12,  // 62–74%
            int1Max: 25, int1: () => Math.floor(Math.random() * 7)  + 11, // 11–17
            int2Max: 25, int2: () => Math.floor(Math.random() * 7)  + 11, // 11–17
            semMax:  50, sem:  () => Math.floor(Math.random() * 12) + 22,  // 22–33
        };
    }
    // Default → LOW risk (good performance)
    return {
        attendanceRate: 0.78 + Math.random() * 0.22,  // 78–100%
        int1Max: 25, int1: () => Math.floor(Math.random() * 8)  + 17, // 17–24
        int2Max: 25, int2: () => Math.floor(Math.random() * 8)  + 17, // 17–24
        semMax:  50, sem:  () => Math.floor(Math.random() * 11) + 38,  // 38–48
    };
}

// ─── MAIN SEED ────────────────────────────────────────────────────────────
async function seed() {
    try {
        console.log('\n🌱  Starting Institutional Seed v3...\n');

        // ─────────────────────────────────────────────────────────────
        // NOTE: Run `node src/config/init_db.js` first to get a fresh schema.
        // This seed assumes tables are empty (as created by init_db.js).
        // ─────────────────────────────────────────────────────────────



        // ── 2. ACADEMIC YEAR ──────────────────────────────────────────
        console.log('📅  Seeding academic year...');
        const ayRes = await pool.query(
            `INSERT INTO academic_years (name, start_date, end_date, is_current)
             VALUES ('2025-2026', '2025-06-01', '2026-05-31', true) RETURNING id`
        );
        const ayId = ayRes.rows[0].id;

        // ── 3. BATCHES ────────────────────────────────────────────────
        const b25Res = await pool.query(`INSERT INTO batch_years (name, entry_year) VALUES ('Batch 2025', 2025) RETURNING id`);
        const b26Res = await pool.query(`INSERT INTO batch_years (name, entry_year) VALUES ('Batch 2026', 2026) RETURNING id`);
        const b25Id = b25Res.rows[0].id;
        const b26Id = b26Res.rows[0].id;

        // ── 4. COURSES ────────────────────────────────────────────────
        console.log('🎓  Seeding courses...');
        const mcaRes = await pool.query(
            `INSERT INTO courses (course_name, course_code, description, duration_years, total_semesters, department)
             VALUES ('Master of Computer Applications', 'MCA', 'Post Graduate program in Computer Applications', 3, 6, 'Computer Applications') RETURNING id`
        );
        const mscRes = await pool.query(
            `INSERT INTO courses (course_name, course_code, description, duration_years, total_semesters, department)
             VALUES ('MSc Computer Science', 'MSCCS', 'Post Graduate program in Computer Science', 2, 4, 'Computer Science') RETURNING id`
        );
        const mcaId = mcaRes.rows[0].id;
        const mscId = mscRes.rows[0].id;

        // ── 5. SEMESTERS (1–6) ────────────────────────────────────────
        console.log('📆  Seeding semesters...');
        const semIds = [];
        for (let i = 1; i <= 6; i++) {
            const sem = await pool.query(
                `INSERT INTO semesters (semester_number, name) VALUES ($1, $2) RETURNING id`,
                [i, `Semester ${i}`]
            );
            semIds.push(sem.rows[0].id);
        }

        // ── 6. SECTIONS ───────────────────────────────────────────────
        console.log('🏫  Seeding sections...');
        const sectionMap = {};
        for (const [bId] of [[b25Id], [b26Id]]) {
            for (let sIdx = 0; sIdx < semIds.length; sIdx++) {
                const sId = semIds[sIdx];
                const mcaSecRes = await pool.query(
                    `INSERT INTO sections (name, batch_id, semester_id, capacity) VALUES ('MCA-A', $1, $2, 60) RETURNING id`,
                    [bId, sId]
                );
                const mscSecRes = await pool.query(
                    `INSERT INTO sections (name, batch_id, semester_id, capacity) VALUES ('MSCCS-A', $1, $2, 60) RETURNING id`,
                    [bId, sId]
                );
                sectionMap[`${bId}_${sId}_MCA`]   = mcaSecRes.rows[0].id;
                sectionMap[`${bId}_${sId}_MSCCS`] = mscSecRes.rows[0].id;
            }
        }

        // ── 7. SUBJECTS ───────────────────────────────────────────────
        console.log('📚  Seeding subjects (real names)...');
        const subjectMap = { MCA: {}, MSCCS: {} };

        for (let semNum = 1; semNum <= 6; semNum++) {
            subjectMap.MCA[semNum] = [];
            for (const subj of MCA_SUBJECTS[semNum]) {
                const res = await pool.query(
                    `INSERT INTO subjects (name, code, credits, semester_id, course_id) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                    [subj.name, subj.code, subj.credits, semIds[semNum - 1], mcaId]
                );
                subjectMap.MCA[semNum].push(res.rows[0].id);
            }

            subjectMap.MSCCS[semNum] = [];
            for (const subj of MSCCS_SUBJECTS[semNum]) {
                const res = await pool.query(
                    `INSERT INTO subjects (name, code, credits, semester_id, course_id) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                    [subj.name, subj.code, subj.credits, semIds[semNum - 1], mscId]
                );
                subjectMap.MSCCS[semNum].push(res.rows[0].id);
            }
        }

        // ── 8. FACULTY ────────────────────────────────────────────────
        console.log('👨‍🏫  Seeding faculty...');
        const userHash = await bcrypt.hash('password123', 10);

        const facMcaUserRes = await pool.query(
            `INSERT INTO users (email, password, name, role, system_id) VALUES ($1, $2, $3, 'FACULTY', $4) RETURNING id`,
            ['dr.ritu.sharma@college.edu', userHash, 'Dr. Ritu Sharma', 'FAC001']
        );
        const facMcaRes = await pool.query(
            `INSERT INTO faculty (user_id, employee_id, designation, department, phone_number)
             VALUES ($1, 'FAC001', 'Head of Department', 'Computer Applications', '9876543210') RETURNING id`,
            [facMcaUserRes.rows[0].id]
        );
        const facMcaId = facMcaRes.rows[0].id;

        const facMscUserRes = await pool.query(
            `INSERT INTO users (email, password, name, role, system_id) VALUES ($1, $2, $3, 'FACULTY', $4) RETURNING id`,
            ['dr.ananya.krishnan@college.edu', userHash, 'Dr. Ananya Krishnan', 'FAC002']
        );
        const facMscRes = await pool.query(
            `INSERT INTO faculty (user_id, employee_id, designation, department, phone_number)
             VALUES ($1, 'FAC002', 'Head of Department', 'Computer Science', '9876543211') RETURNING id`,
            [facMscUserRes.rows[0].id]
        );
        const facMscId = facMscRes.rows[0].id;

        console.log('🔗  Mapping faculty to subjects & sections...');
        for (const [bId] of [[b25Id], [b26Id]]) {
            for (let semNum = 1; semNum <= 6; semNum++) {
                const sId = semIds[semNum - 1];
                const mcaSecId  = sectionMap[`${bId}_${sId}_MCA`];
                const mscSecId  = sectionMap[`${bId}_${sId}_MSCCS`];
                for (const subjectId of subjectMap.MCA[semNum]) {
                    await pool.query(
                        `INSERT INTO faculty_subject_mapping (faculty_id, subject_id, section_id, academic_year_id)
                         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
                        [facMcaId, subjectId, mcaSecId, ayId]
                    );
                }
                for (const subjectId of subjectMap.MSCCS[semNum]) {
                    await pool.query(
                        `INSERT INTO faculty_subject_mapping (faculty_id, subject_id, section_id, academic_year_id)
                         VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING`,
                        [facMscId, subjectId, mscSecId, ayId]
                    );
                }
            }
        }

        // ── 9. STUDENTS + MARKS + ATTENDANCE ─────────────────────────
        console.log('👨‍🎓  Seeding students...');

        let globalIdx = 0;

        async function seedStudentGroup(courseId, courseCode, courseTag, batchId, batchTag, nameList) {
            const currentSemNum = 2;
            const currentSemId  = semIds[currentSemNum - 1];
            const currentSecId  = sectionMap[`${batchId}_${currentSemId}_${courseCode}`];

            for (let i = 0; i < nameList.length; i++) {
                const name  = nameList[i];
                const tag   = courseCode === 'MCA' ? 'MCA' : 'MSCCS';
                const enNum = `STU${batchTag}${tag}${String(i + 1).padStart(3, '0')}`;
                const email = `${enNum.toLowerCase()}@college.edu`;

                globalIdx++;
                const profile = getPerformanceProfile(globalIdx);

                const uRes = await pool.query(
                    `INSERT INTO users (email, password, name, role, system_id) VALUES ($1, $2, $3, 'STUDENT', $4) RETURNING id`,
                    [email, userHash, name, enNum]
                );
                const userId = uRes.rows[0].id;

                const sRes = await pool.query(
                    `INSERT INTO students (user_id, enrollment_number, course_id, department, batch_id, current_semester_id, current_section_id)
                     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
                    [userId, enNum, courseId, courseTag, batchId, currentSemId, currentSecId]
                );
                const studentId = sRes.rows[0].id;

                // Marks: Semester 1 (past) and Semester 2 (current)
                const pastSubjectIds    = subjectMap[courseCode][1];
                const currentSubjectIds = subjectMap[courseCode][2];

                for (const subjectId of [...pastSubjectIds, ...currentSubjectIds]) {
                    await pool.query(
                        `INSERT INTO marks (student_id, subject_id, score, max_score, type, is_final)
                         VALUES ($1,$2,$3,25,'Internal 1',true) ON CONFLICT (student_id,subject_id,type) DO NOTHING`,
                        [studentId, subjectId, profile.int1()]
                    );
                    await pool.query(
                        `INSERT INTO marks (student_id, subject_id, score, max_score, type, is_final)
                         VALUES ($1,$2,$3,25,'Internal 2',true) ON CONFLICT (student_id,subject_id,type) DO NOTHING`,
                        [studentId, subjectId, profile.int2()]
                    );
                    if (pastSubjectIds.includes(subjectId)) {
                        await pool.query(
                            `INSERT INTO marks (student_id, subject_id, score, max_score, type, is_final)
                             VALUES ($1,$2,$3,50,'Semester',true) ON CONFLICT (student_id,subject_id,type) DO NOTHING`,
                            [studentId, subjectId, profile.sem()]
                        );
                    }
                }

                // Attendance: 30 days
                const facId = courseCode === 'MCA' ? facMcaId : facMscId;
                let hourCycle = 1;

                for (let daysBack = 29; daysBack >= 0; daysBack--) {
                    const d = new Date();
                    d.setDate(d.getDate() - daysBack);
                    const dayOfWeek = d.getDay();
                    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

                    const dateStr = d.toISOString().split('T')[0];
                    for (const subjectId of currentSubjectIds) {
                        const isPresent = Math.random() < profile.attendanceRate;

                        let sessionId;
                        const sessRes = await pool.query(
                            `SELECT id FROM attendance_sessions WHERE subject_id=$1 AND section_id=$2 AND session_date=$3 AND hour_id=$4`,
                            [subjectId, currentSecId, dateStr, hourCycle]
                        );
                        if (sessRes.rows.length === 0) {
                            const newSess = await pool.query(
                                `INSERT INTO attendance_sessions (faculty_id, subject_id, section_id, session_date, hour_id)
                                 VALUES ($1,$2,$3,$4,$5) RETURNING id`,
                                [facId, subjectId, currentSecId, dateStr, hourCycle]
                            );
                            sessionId = newSess.rows[0].id;
                        } else {
                            sessionId = sessRes.rows[0].id;
                        }
                        await pool.query(
                            `INSERT INTO attendance_records (session_id, student_id, status)
                             VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
                            [sessionId, studentId, isPresent ? 'P' : 'A']
                        );
                        hourCycle = (hourCycle % 5) + 1;
                    }
                }
                process.stdout.write(`.`);
            }
            console.log(` [${courseCode} ${batchTag} done]`);
        }

        await seedStudentGroup(mcaId, 'MCA',   'Computer Applications', b25Id, '25', MCA_STUDENT_NAMES_B25);
        await seedStudentGroup(mcaId, 'MCA',   'Computer Applications', b26Id, '26', MCA_STUDENT_NAMES_B26);
        await seedStudentGroup(mscId, 'MSCCS', 'Computer Science',      b25Id, '25', MSCCS_STUDENT_NAMES_B25);
        await seedStudentGroup(mscId, 'MSCCS', 'Computer Science',      b26Id, '26', MSCCS_STUDENT_NAMES_B26);

        // ── 10. BULK RISK CALCULATION ─────────────────────────────────
        console.log('\n\n🤖  Calculating AI risk scores for all students...');
        await pool.query(`
            INSERT INTO academic_risk (student_id, attendance_percentage, average_marks, risk_score, risk_level, semester_id)
            SELECT
                s.id AS student_id,
                COALESCE(ROUND(
                    SUM(CASE WHEN ar.status = 'P' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(ar.id), 0)
                , 2), 0) AS attendance_percentage,
                COALESCE(ROUND(AVG(
                    m.score * 100.0 / NULLIF(m.max_score, 0)
                ), 2), 0) AS average_marks,
                ROUND((
                    COALESCE(SUM(CASE WHEN ar.status='P' THEN 1 ELSE 0 END)*100.0/NULLIF(COUNT(ar.id),0),0)*0.5 +
                    COALESCE(AVG(m.score*100.0/NULLIF(m.max_score,0)),0)*0.5
                ),2) AS risk_score,
                CASE
                    WHEN COALESCE(SUM(CASE WHEN ar.status='P' THEN 1 ELSE 0 END)*100.0/NULLIF(COUNT(ar.id),0),0) < 60
                     AND COALESCE(AVG(m.score*100.0/NULLIF(m.max_score,0)),0) < 40 THEN 'HIGH'
                    WHEN COALESCE(SUM(CASE WHEN ar.status='P' THEN 1 ELSE 0 END)*100.0/NULLIF(COUNT(ar.id),0),0) < 75
                      OR COALESCE(AVG(m.score*100.0/NULLIF(m.max_score,0)),0) < 50 THEN 'MEDIUM'
                    ELSE 'LOW'
                END AS risk_level,
                s.current_semester_id AS semester_id
            FROM students s
            LEFT JOIN attendance_records ar ON ar.student_id = s.id
            LEFT JOIN marks m ON m.student_id = s.id
            GROUP BY s.id, s.current_semester_id
            ON CONFLICT (student_id, semester_id) DO UPDATE SET
                attendance_percentage = EXCLUDED.attendance_percentage,
                average_marks         = EXCLUDED.average_marks,
                risk_score            = EXCLUDED.risk_score,
                risk_level            = EXCLUDED.risk_level,
                calculated_at         = CURRENT_TIMESTAMP
        `);

        // ── 11. RISK NOTIFICATIONS ────────────────────────────────────
        console.log('🔔  Generating risk notifications...');
        await pool.query(`
            INSERT INTO notifications (user_id, message, risk_level)
            SELECT s.user_id,
                CASE ar.risk_level
                    WHEN 'HIGH'   THEN '⚠️ URGENT: Your academic performance is critically low. Please consult your faculty immediately.'
                    WHEN 'MEDIUM' THEN '📢 WARNING: Your attendance or marks are below the required threshold. Improvement needed.'
                END,
                ar.risk_level
            FROM academic_risk ar
            JOIN students s ON ar.student_id = s.id
            WHERE ar.risk_level IN ('HIGH','MEDIUM')
        `);

        console.log('\n✅  Seed completed successfully!\n');

        const counts = await pool.query(`
            SELECT
                (SELECT COUNT(*) FROM students)          AS students,
                (SELECT COUNT(*) FROM faculty)           AS faculty,
                (SELECT COUNT(*) FROM courses)           AS courses,
                (SELECT COUNT(*) FROM subjects)          AS subjects,
                (SELECT COUNT(*) FROM sections)          AS sections,
                (SELECT COUNT(*) FROM attendance_records) AS attendance_records,
                (SELECT COUNT(*) FROM marks)             AS marks,
                (SELECT COUNT(*) FROM academic_risk WHERE risk_level='HIGH')   AS high_risk,
                (SELECT COUNT(*) FROM academic_risk WHERE risk_level='MEDIUM') AS medium_risk,
                (SELECT COUNT(*) FROM academic_risk WHERE risk_level='LOW')    AS low_risk
        `);
        const c = counts.rows[0];
        console.log('📊  Database Summary:');
        console.log(`   • Students:           ${c.students}`);
        console.log(`   • Faculty:            ${c.faculty}`);
        console.log(`   • Courses:            ${c.courses}`);
        console.log(`   • Subjects:           ${c.subjects}`);
        console.log(`   • Sections:           ${c.sections}`);
        console.log(`   • Attendance Records: ${c.attendance_records}`);
        console.log(`   • Marks Records:      ${c.marks}`);
        console.log(`   • Risk → HIGH:        ${c.high_risk}`);
        console.log(`   • Risk → MEDIUM:      ${c.medium_risk}`);
        console.log(`   • Risk → LOW:         ${c.low_risk}`);
        console.log('\n🎓  Credentials:');
        console.log('   Admin    → admin@college.com              / admin123');
        console.log('   Faculty1 → dr.ritu.sharma@college.edu     / password123  (MCA HOD)');
        console.log('   Faculty2 → dr.ananya.krishnan@college.edu / password123  (MSc CS HOD)');
        console.log('   Students → stu25mca001@college.edu ...    / password123\n');

    } catch (err) {
        console.error('\n❌  Seed failed:', err.message);
        console.error(err.stack);
    } finally {
        await pool.end();
    }
}

seed();
