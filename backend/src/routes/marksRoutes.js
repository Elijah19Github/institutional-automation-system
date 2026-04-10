const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// GET /api/marks/faculty-assignments
// Get subjects/sections assigned to the logged-in faculty
router.get('/faculty-assignments', authenticate, authorize(['faculty']), async (req, res) => {
    try {
        const facultyRes = await pool.query('SELECT id FROM faculty WHERE user_id = $1', [req.user.id]);
        if (facultyRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Faculty record not found' });
        
        const facultyId = facultyRes.rows[0].id;
        const result = await pool.query(`
            SELECT 
                fsm.id as mapping_id,
                s.id as subject_id,
                s.name as subject_name,
                s.code as subject_code,
                sec.id as section_id,
                sec.name as section_name,
                c.course_name,
                c.id as course_id
            FROM faculty_subject_mapping fsm
            JOIN subjects s ON fsm.subject_id = s.id
            JOIN sections sec ON fsm.section_id = sec.id
            JOIN courses c ON s.course_id = c.id
            WHERE fsm.faculty_id = $1
        `, [facultyId]);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching assignments:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// GET /api/marks/students-for-entry
// Get students for a specific subject/section for marks entry
router.get('/students-for-entry', authenticate, authorize(['faculty', 'admin']), async (req, res) => {
    try {
        const { subject_id, section_id, exam_type } = req.query;
        
        // 1. Check if locked
        const lockRes = await pool.query(`
            SELECT is_locked FROM marks_control 
            WHERE exam_type = $1 AND (
                (scope = 'global') OR 
                (scope = 'subject' AND target_id = $2)
            )
        `, [exam_type, subject_id]);
        
        const isLocked = lockRes.rows.some(r => r.is_locked);

        // 2. Fetch students
        // Note: In real app, we need a student_section_mapping table
        // For now, we'll fetch students who belong to the course associated with the subject
        const subjectRes = await pool.query('SELECT course_id FROM subjects WHERE id = $1', [subject_id]);
        const courseId = subjectRes.rows[0].course_id;

        const studentsRes = await pool.query(`
            SELECT 
                s.id,
                u.name,
                s.enrollment_number as regno,
                m.score as current_mark,
                m.id as mark_record_id
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN marks m ON m.student_id = s.id AND m.subject_id = $1 AND m.type = $2
            WHERE s.course_id = $3
            ORDER BY u.name ASC
        `, [subject_id, exam_type, courseId]);

        res.json({ 
            success: true, 
            data: studentsRes.rows,
            is_locked: isLocked
        });
    } catch (error) {
        console.error('Error fetching students for entry:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// POST /api/marks/bulk-entry
router.post('/bulk-entry', authenticate, authorize(['faculty', 'admin']), async (req, res) => {
    const client = await pool.connect();
    try {
        const { subject_id, exam_type, marks_data } = req.body; // marks_data: [{student_id, score}]

        // 1. Re-check lock
        const lockRes = await pool.query(`
            SELECT is_locked FROM marks_control 
            WHERE exam_type = $1 AND (
                (scope = 'global') OR 
                (scope = 'subject' AND target_id = $2)
            )
        `, [exam_type, subject_id]);
        
        if (lockRes.rows.some(r => r.is_locked)) {
            return res.status(403).json({ success: false, message: 'Marks entry is locked for this assessment.' });
        }

        await client.query('BEGIN');

        for (const entry of marks_data) {
            // Check limits
            const score = parseFloat(entry.score);
            if (isNaN(score) || score < 0) {
                throw new Error(`Invalid score ${entry.score}. Must be non-negative numeric.`);
            }

            let maxScore = 100;
            if (exam_type === 'Internal 1') maxScore = 25;
            if (exam_type === 'Internal 2') maxScore = 25;
            if (exam_type === 'Semester') maxScore = 50;

            if (score > maxScore) {
                throw new Error(`Score ${score} exceeds max allowed (${maxScore}) for ${exam_type}`);
            }

            await client.query(`
                INSERT INTO marks (student_id, subject_id, type, score)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (student_id, subject_id, type) 
                DO UPDATE SET score = EXCLUDED.score
            `, [entry.student_id, subject_id, exam_type, entry.score]);
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Marks updated successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error in bulk marks entry:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    } finally {
        client.release();
    }
});

// GET /api/marks/student-marks
// Get individual marks for the logged-in student
router.get('/student-marks', authenticate, authorize(['student']), async (req, res) => {
    try {
        const studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
        if (studentRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Student record not found' });
        
        const studentId = studentRes.rows[0].id;
        
        const marksRes = await pool.query(`
            SELECT 
                s.id as subject_id,
                s.name as subject_name,
                s.code as subject_code,
                sem.name as semester_name,
                sem.semester_number,
                m.type,
                m.score
            FROM marks m
            JOIN subjects s ON m.subject_id = s.id
            JOIN semesters sem ON s.semester_id = sem.id
            WHERE m.student_id = $1
            ORDER BY sem.semester_number ASC
        `, [studentId]);

        // Aggregate by subject
        const subjectsMap = {};
        marksRes.rows.forEach(row => {
            if (!subjectsMap[row.subject_id]) {
                subjectsMap[row.subject_id] = {
                    subject_id: row.subject_id,
                    subject_name: row.subject_name,
                    subject_code: row.subject_code,
                    semester_name: row.semester_name,
                    semester_number: row.semester_number,
                    marks: { 'Internal 1': 0, 'Internal 2': 0, 'Semester': 0 },
                    total: 0
                };
            }
            subjectsMap[row.subject_id].marks[row.type] = Number(row.score) || 0;
            subjectsMap[row.subject_id].total += Number(row.score) || 0;
        });

        res.json({ success: true, data: Object.values(subjectsMap) });
    } catch (error) {
        console.error('Error fetching student marks:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

// GET /api/marks/overall/:subject_id
// Get overall marks for all students in a subject
router.get('/overall/:subject_id', authenticate, authorize(['faculty', 'admin', 'supadmin']), async (req, res) => {
    try {
        const { subject_id } = req.params;
        
        // Ensure subject exists and get details
        const subRes = await pool.query('SELECT name, code FROM subjects WHERE id = $1', [subject_id]);
        if (subRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Subject not found' });

        const marksRes = await pool.query(`
            SELECT 
                st.id as student_id,
                u.name as student_name,
                st.enrollment_number as regno,
                m.type,
                m.score
            FROM students st
            JOIN users u ON st.user_id = u.id
            JOIN marks m ON m.student_id = st.id
            WHERE m.subject_id = $1
            ORDER BY u.name ASC
        `, [subject_id]);

        const studentsMap = {};
        marksRes.rows.forEach(row => {
            if (!studentsMap[row.student_id]) {
                studentsMap[row.student_id] = {
                    student_id: row.student_id,
                    student_name: row.student_name,
                    regno: row.regno,
                    marks: { 'Internal 1': 0, 'Internal 2': 0, 'Semester': 0 },
                    total: 0
                };
            }
            studentsMap[row.student_id].marks[row.type] = Number(row.score) || 0;
            studentsMap[row.student_id].total += Number(row.score) || 0;
        });

        res.json({ 
            success: true, 
            subject: subRes.rows[0],
            data: Object.values(studentsMap) 
        });
    } catch (error) {
        console.error('Error fetching overall marks:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;
