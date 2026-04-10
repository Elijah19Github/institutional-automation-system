require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function seedHistoricalAttendance() {
    try {
        console.log('🌱 Starting Historical Attendance Seeding (4 Semesters)...');

        // 1. Get all students with their course and section info
        const studentsRes = await pool.query(`
            SELECT 
                s.id as student_id, 
                s.course_id, 
                s.batch_id, 
                s.current_section_id
            FROM students s
        `);
        const students = studentsRes.rows;
        console.log(`Found ${students.length} students.`);

        // 2. Get Semesters 1, 2, 3, 4
        const semestersRes = await pool.query(`SELECT id, semester_number, name FROM semesters WHERE semester_number <= 4 ORDER BY semester_number`);
        const targetSemesters = semestersRes.rows;
        const semIds = targetSemesters.map(s => s.id);
        console.log(`Targeting Semesters: ${targetSemesters.map(s => s.name).join(', ')}`);

        // 3. For each student, seed data for each targeted semester
        for (const student of students) {
            console.log(`Seeding attendance for Student ID: ${student.student_id}`);
            
            for (const sem of targetSemesters) {
                // Get subjects for this course and semester
                const subjectsRes = await pool.query(`
                    SELECT id, name FROM subjects 
                    WHERE course_id = $1 AND semester_id = $2
                `, [student.course_id, sem.id]);
                
                const subjects = subjectsRes.rows;
                
                for (const sub of subjects) {
                    // Find a faculty-section mapping for this subject
                    // If no mapping exists for the student's current section, just pick any mapping for the subject to get a faculty ID
                    const facultyRes = await pool.query(`
                        SELECT faculty_id, section_id FROM faculty_subject_mapping 
                        WHERE subject_id = $1 LIMIT 1
                    `, [sub.id]);

                    if (facultyRes.rows.length === 0) continue;

                    const facultyId = facultyRes.rows[0].faculty_id;
                    const sectionId = student.current_section_id || facultyRes.rows[0].section_id;

                    // Generate ~20-25 sessions for this subject
                    const sessionCount = 20 + Math.floor(Math.random() * 6);
                    
                    for (let i = 0; i < sessionCount; i++) {
                        // Generate a date in the past
                        // Offset by semester (e.g., Sem 1 was 1.5 years ago, Sem 2 was 1 year ago, etc.)
                        const monthOffset = (4 - sem.semester_number) * 6 + Math.floor(Math.random() * 4);
                        const dayOffset = Math.floor(Math.random() * 28);
                        const date = new Date();
                        date.setMonth(date.getMonth() - monthOffset);
                        date.setDate(date.getDate() - dayOffset);
                        const dateStr = date.toISOString().split('T')[0];
                        const hourId = (i % 8) + 1;

                        try {
                            // Create Session (using ON CONFLICT or check existence)
                            const sessionCheck = await pool.query(`
                                SELECT id FROM attendance_sessions 
                                WHERE subject_id = $1 AND section_id = $2 AND session_date = $3 AND hour_id = $4
                            `, [sub.id, sectionId, dateStr, hourId]);

                            let sessionId;
                            if (sessionCheck.rows.length > 0) {
                                sessionId = sessionCheck.rows[0].id;
                            } else {
                                const newSession = await pool.query(`
                                    INSERT INTO attendance_sessions (faculty_id, subject_id, section_id, session_date, hour_id)
                                    VALUES ($1, $2, $3, $4, $5)
                                    RETURNING id
                                `, [facultyId, sub.id, sectionId, dateStr, hourId]);
                                sessionId = newSession.rows[0].id;
                            }

                            // Create Record for this student
                            const status = Math.random() > 0.15 ? 'P' : 'A'; // 85% attendance rate
                            await pool.query(`
                                INSERT INTO attendance_records (session_id, student_id, status)
                                VALUES ($1, $2, $3)
                                ON CONFLICT DO NOTHING
                            `, [sessionId, student.student_id, status]);

                        } catch (err) {
                            // Ignore duplicates or minor errors
                        }
                    }
                }
            }
        }

        console.log('✅ Historical Attendance Seeding Completed.');
        await pool.end();
        process.exit(0);

    } catch (error) {
        console.error('❌ Error during seeding:', error);
        await pool.end();
        process.exit(1);
    }
}

seedHistoricalAttendance();
