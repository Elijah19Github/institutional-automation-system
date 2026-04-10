const { pool } = require('../src/config/db');

async function verifyQuizVisibility() {
    try {
        // 1. Get a student (who has a course and semester)
        const studentRes = await pool.query(`
            SELECT id, course_id, current_semester_id, current_section_id, batch_id 
            FROM students 
            WHERE course_id IS NOT NULL 
              AND current_semester_id IS NOT NULL 
            LIMIT 1
        `);
        
        if (studentRes.rows.length === 0) {
            console.log('No eligible student found for test');
            return;
        }
        const student = studentRes.rows[0];
        console.log('Testing with Student:', student.id);

        // 2. Run the newly implemented query
        const query = `
             SELECT q.id, q.title, s.course_id, s.semester_id
             FROM quizzes q
             LEFT JOIN subjects s ON q.subject_id = s.id
             WHERE q.is_published = true
                AND (q.section_id IS NULL OR q.section_id = $1::UUID)
                AND (q.batch_id IS NULL OR q.batch_id = $2::UUID)
                AND (s.id IS NOT NULL AND (s.course_id IS NULL OR s.course_id = $3::UUID))
                AND (s.id IS NOT NULL AND (s.semester_id IS NULL OR s.semester_id = $4::UUID))
                AND (q.start_at IS NULL OR q.start_at <= NOW())
                AND (q.end_at IS NULL OR q.end_at >= NOW())
        `;
        
        const params = [
            student.current_section_id || null, 
            student.batch_id || null, 
            student.course_id || null, 
            student.current_semester_id || null
        ];
        const res = await pool.query(query, params);
        
        console.log(`Found ${res.rows.length} quizzes for this student.`);
        res.rows.forEach(q => {
            console.log(`- Quiz: ${q.title} (Subject Course: ${q.course_id}, Sem: ${q.semester_id})`);
        });

        if (res.rows.length > 0) {
            console.log('✅ Verification successful: Student sees quizzes matching their course/semester.');
        } else {
            console.log('⚠️ No quizzes found, but the query executed. Ensure there are published quizzes for this student\'s Course/Semester.');
        }

    } catch (err) {
        console.error('Final Verification Failed:', err);
    } finally {
        pool.end();
    }
}

verifyQuizVisibility();
