const express = require('express');
const { pool } = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// ------------------------------------------------------------------
// 1. COURSES MANAGEMENT
// ------------------------------------------------------------------

// Create Course
router.post('/courses', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        const { course_name, duration_years, total_semesters } = req.body;
        if (!course_name || !duration_years || !total_semesters) {
            return res.status(400).json({ success: false, message: 'Missing course details.' });
        }

        const result = await pool.query(
            "INSERT INTO courses (course_name, duration_years, total_semesters) VALUES ($1, $2, $3) RETURNING *",
            [course_name, duration_years, total_semesters]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// Get All Courses
router.get('/courses', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        const result = await pool.query("SELECT * FROM courses WHERE is_active = true ORDER BY created_at DESC");
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
});

// Update Course
router.put('/courses/:id', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { course_name, duration_years, total_semesters, is_active } = req.body;

        const result = await pool.query(
            "UPDATE courses SET course_name = $1, duration_years = $2, total_semesters = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *",
            [course_name, duration_years, total_semesters, is_active, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Course not found.' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// Soft Delete Course
router.delete('/courses/:id', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query("UPDATE courses SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Course not found.' });
        res.json({ success: true, message: 'Course deactivated successfully.' });
    } catch (error) {
        next(error);
    }
});

// ------------------------------------------------------------------
// 2. SUBJECTS MANAGEMENT
// ------------------------------------------------------------------

// Create Subject
router.post('/subjects', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        const { name, code, course_id, semester_number, credits } = req.body;
        if (!name || !code || !course_id || !semester_number) {
            return res.status(400).json({ success: false, message: 'Missing subject details.' });
        }

        const result = await pool.query(
            "INSERT INTO subjects (name, code, course_id, semester_number, credits) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [name, code, course_id, semester_number, credits || 3]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'Subject code already exists.' });
        }
        next(error);
    }
});

// Get All Subjects (with Course Info)
router.get('/subjects', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT s.*, c.course_name 
            FROM subjects s
            LEFT JOIN courses c ON s.course_id = c.id
            ORDER BY c.course_name ASC, s.semester_number ASC
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
});

// Update Subject
router.put('/subjects/:id', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, code, course_id, semester_number, credits } = req.body;

        const result = await pool.query(
            "UPDATE subjects SET name = $1, code = $2, course_id = $3, semester_number = $4, credits = $5 WHERE id = $6 RETURNING *",
            [name, code, course_id, semester_number, credits, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Subject not found.' });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// Delete Subject (Hard delete for now or implement soft delete if column added later)
router.delete('/subjects/:id', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM subjects WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Subject not found.' });
        res.json({ success: true, message: 'Subject deleted successfully.' });
    } catch (error) {
        next(error);
    }
});

// ------------------------------------------------------------------
// 3. FACULTY ASSIGNMENT
// ------------------------------------------------------------------

// Assign Faculty
router.post('/assign-faculty', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        const { faculty_id, subject_id, section_id, semester_number, academic_year_id } = req.body;
        if (!faculty_id || !subject_id || !section_id || !semester_number || !academic_year_id) {
            return res.status(400).json({ success: false, message: 'All mapping fields are required.' });
        }

        const result = await pool.query(
            "INSERT INTO faculty_subject_mapping (faculty_id, subject_id, section_id, semester_number, academic_year_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [faculty_id, subject_id, section_id, semester_number, academic_year_id]
        );
        res.status(201).json({ success: true, message: 'Faculty assigned successfully.', data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'This faculty assignment already exists.' });
        }
        next(error);
    }
});

// Get Faculty Assignments
router.get('/faculty-assignments', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT fsm.id, fsm.semester_number, fsm.assigned_at,
                   u.name as faculty_name, f.employee_id,
                   sub.name as subject_name, sub.code as subject_code,
                   sec.name as section_name,
                   ay.name as academic_year
            FROM faculty_subject_mapping fsm
            JOIN faculty f ON fsm.faculty_id = f.id
            JOIN users u ON f.user_id = u.id
            JOIN subjects sub ON fsm.subject_id = sub.id
            JOIN sections sec ON fsm.section_id = sec.id
            JOIN academic_years ay ON fsm.academic_year_id = ay.id
            ORDER BY fsm.assigned_at DESC
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
});

// Remove Faculty Assignment
router.delete('/faculty-assignments/:id', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query("DELETE FROM faculty_subject_mapping WHERE id = $1 RETURNING *", [id]);
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Assignment not found.' });
        res.json({ success: true, message: 'Assignment removed successfully.' });
    } catch (error) {
        next(error);
    }
});

// Setup Data (Helper for Dropdowns)
router.get('/setup-data', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        const courses = await pool.query("SELECT id, course_name, total_semesters FROM courses WHERE is_active = true");
        const sections = await pool.query("SELECT id, name FROM sections");
        const faculty = await pool.query(`
            SELECT f.id, u.name, f.employee_id 
            FROM faculty f JOIN users u ON f.user_id = u.id
        `);
        const academicYears = await pool.query('SELECT id, name FROM academic_years ORDER BY start_date DESC');
        const subjects = await pool.query("SELECT id, name, code, course_id, semester_number FROM subjects");

        res.json({
            success: true,
            data: {
                courses: courses.rows,
                sections: sections.rows,
                faculty: faculty.rows,
                academicYears: academicYears.rows,
                subjects: subjects.rows
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
