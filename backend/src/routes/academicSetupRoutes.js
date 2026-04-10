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
        const { course_name, course_code, description, duration_years, total_semesters } = req.body;
        if (!course_name || !duration_years || !total_semesters) {
            return res.status(400).json({ success: false, message: 'Missing course details.' });
        }

        const result = await pool.query(
            "INSERT INTO courses (course_name, course_code, description, duration_years, total_semesters) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [course_name, course_code || null, description || null, duration_years, total_semesters]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') return res.status(400).json({ success: false, message: 'Course code already exists.' });
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
        const { name, code, course_id, semester_id, credits } = req.body;
        if (!name || !code || !course_id || !semester_id) {
            return res.status(400).json({ success: false, message: 'Missing subject details.' });
        }

        // Strict validation: No duplicate code or name for the same course
        const checkExist = await pool.query(
            "SELECT id FROM subjects WHERE course_id = $1 AND (code = $2 OR name = $3)",
            [course_id, code, name]
        );

        if (checkExist.rows.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `A subject with this code (${code}) or name (${name}) already exists for the selected course.` 
            });
        }

        const result = await pool.query(
            "INSERT INTO subjects (name, code, course_id, semester_id, credits) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [name, code, course_id, semester_id, credits || 3]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'Subject code/name already exists.' });
        }
        next(error);
    }
});

// Bulk Create Subjects
router.post('/subjects/bulk', authenticate, authorize(['admin']), async (req, res, next) => {
    const client = await pool.connect();
    try {
        const { subjects } = req.body; 
        if (!Array.isArray(subjects)) return res.status(400).json({ success: false, message: 'Subjects must be an array.' });

        await client.query('BEGIN');
        const results = [];
        
        for (const s of subjects) {
            // Strict validation: No duplicate code or name for the same course
            const checkExist = await client.query(
                "SELECT id FROM subjects WHERE course_id = $1 AND (code = $2 OR name = $3)",
                [s.course_id, s.code, s.name]
            );

            if (checkExist.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ 
                    success: false, 
                    message: `Conflict: Subject "${s.name}" (${s.code}) already exists for this course. Bulk creation aborted.` 
                });
            }

            const resInsert = await client.query(
                "INSERT INTO subjects (name, code, course_id, semester_id, credits) VALUES ($1, $2, $3, $4, $5) RETURNING *",
                [s.name, s.code, s.course_id, s.semester_id, s.credits || 3]
            );
            results.push(resInsert.rows[0]);
        }
        
        await client.query('COMMIT');
        res.status(201).json({ success: true, count: results.length, data: results });
    } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') return res.status(400).json({ success: false, message: 'One or more subject codes/names already exist.' });
        next(error);
    } finally {
        client.release();
    }
});

// Get All Subjects (with Course Info)
router.get('/subjects', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT s.*, c.course_name, sem.semester_number
            FROM subjects s
            LEFT JOIN courses c ON s.course_id = c.id
            LEFT JOIN semesters sem ON s.semester_id = sem.id
            ORDER BY c.course_name ASC, sem.semester_number ASC
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
        const { name, code, course_id, semester_id, credits } = req.body;

        const result = await pool.query(
            "UPDATE subjects SET name = $1, code = $2, course_id = $3, semester_id = $4, credits = $5 WHERE id = $6 RETURNING *",
            [name, code, course_id, semester_id, credits, id]
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
        const { faculty_id, subject_id, section_id, academic_year_id } = req.body;
        if (!faculty_id || !subject_id || !section_id || !academic_year_id) {
            return res.status(400).json({ success: false, message: 'faculty_id, subject_id, section_id, and academic_year_id are all required.' });
        }
        const result = await pool.query(
            "INSERT INTO faculty_subject_mapping (faculty_id, subject_id, section_id, academic_year_id) VALUES ($1, $2, $3, $4) RETURNING *",
            [faculty_id, subject_id, section_id, academic_year_id]
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
            SELECT fsm.id, fsm.assigned_at,
                   u.name as faculty_name, f.employee_id,
                   sub.name as subject_name, sub.code as subject_code,
                   sec.name as section_name,
                   sem.semester_number,
                   ay.name as academic_year
            FROM faculty_subject_mapping fsm
            JOIN faculty f ON fsm.faculty_id = f.id
            JOIN users u ON f.user_id = u.id
            JOIN subjects sub ON fsm.subject_id = sub.id
            JOIN sections sec ON fsm.section_id = sec.id
            JOIN semesters sem ON sub.semester_id = sem.id
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
        const sections = await pool.query(`
            SELECT s.id, s.name, b.name as batch_name, sem.semester_number 
            FROM sections s
            JOIN batch_years b ON s.batch_id = b.id
            JOIN semesters sem ON s.semester_id = sem.id
        `);
        const faculty = await pool.query(`
            SELECT f.id, u.name, f.employee_id 
            FROM faculty f JOIN users u ON f.user_id = u.id
        `);
        const academicYears = await pool.query('SELECT id, name FROM academic_years ORDER BY start_date DESC');
        const subjects = await pool.query(`
            SELECT s.id, s.name, s.code, s.course_id, sem.semester_number, s.semester_id
            FROM subjects s
            JOIN semesters sem ON s.semester_id = sem.id
        `);

        const batches = await pool.query("SELECT id, name, entry_year FROM batch_years ORDER BY entry_year DESC");
        const semesters = await pool.query("SELECT id, semester_number, name FROM semesters ORDER BY semester_number ASC");

        res.json({
            success: true,
            data: {
                courses: courses.rows,
                sections: sections.rows,
                faculty: faculty.rows,
                academicYears: academicYears.rows,
                subjects: subjects.rows,
                batches: batches.rows,
                semesters: semesters.rows
            }
        });
    } catch (error) {
        next(error);
    }
});

// ------------------------------------------------------------------
// 4. ACADEMIC YEARS MANAGEMENT
// ------------------------------------------------------------------
router.post('/academic-years', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        const { name, start_date, end_date, is_current } = req.body;
        const result = await pool.query(
            "INSERT INTO academic_years (name, start_date, end_date, is_current) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, start_date, end_date, is_current || false]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

router.put('/academic-years/:id', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, start_date, end_date, is_current } = req.body;
        const result = await pool.query(
            "UPDATE academic_years SET name = $1, start_date = $2, end_date = $3, is_current = $4 WHERE id = $5 RETURNING *",
            [name, start_date, end_date, is_current, id]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

router.delete('/academic-years/:id', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        await pool.query("DELETE FROM academic_years WHERE id = $1", [req.params.id]);
        res.json({ success: true, message: 'Academic year deleted.' });
    } catch (error) {
        next(error);
    }
});

// ------------------------------------------------------------------
// 5. BATCHES MANAGEMENT
// ------------------------------------------------------------------
router.post('/batches', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        const { name, entry_year } = req.body;
        const result = await pool.query(
            "INSERT INTO batch_years (name, entry_year) VALUES ($1, $2) RETURNING *",
            [name, entry_year]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

router.put('/batches/:id', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, entry_year } = req.body;
        const result = await pool.query(
            "UPDATE batch_years SET name = $1, entry_year = $2 WHERE id = $3 RETURNING *",
            [name, entry_year, id]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

router.delete('/batches/:id', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        await pool.query("DELETE FROM batch_years WHERE id = $1", [req.params.id]);
        res.json({ success: true, message: 'Batch deleted.' });
    } catch (error) {
        next(error);
    }
});

// ------------------------------------------------------------------
// 6. SEMESTERS MANAGEMENT
// ------------------------------------------------------------------
router.post('/semesters', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        const { semester_number, name } = req.body;
        const result = await pool.query(
            "INSERT INTO semesters (semester_number, name) VALUES ($1, $2) RETURNING *",
            [semester_number, name]
        );
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

router.delete('/semesters/:id', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        await pool.query("DELETE FROM semesters WHERE id = $1", [req.params.id]);
        res.json({ success: true, message: 'Semester deleted.' });
    } catch (error) {
        next(error);
    }
});

// ------------------------------------------------------------------
// 8. DEMO SEEDING
// ------------------------------------------------------------------
router.post('/seed-demo', authenticate, authorize(['admin']), async (req, res, next) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Check if we have academic years
        const ayCheck = await client.query("SELECT id FROM academic_years LIMIT 1");
        if (ayCheck.rows.length === 0) {
            await client.query("INSERT INTO academic_years (name, start_date, end_date, is_current) VALUES ('2024-2025', '2024-01-01', '2025-12-31', true)");
        }

        // 2. Check if we have semesters
        const semCheck = await client.query("SELECT id FROM semesters LIMIT 1");
        if (semCheck.rows.length === 0) {
            for (let i = 1; i <= 8; i++) {
                await client.query("INSERT INTO semesters (semester_number, name) VALUES ($1, $2)", [i, `Semester ${i}`]);
            }
        }

        // 3. Batches
        const batchCheck = await client.query("SELECT id FROM batch_years LIMIT 1");
        if (batchCheck.rows.length === 0) {
            await client.query("INSERT INTO batch_years (name, entry_year) VALUES ('Batch 2024', 2024)");
            await client.query("INSERT INTO batch_years (name, entry_year) VALUES ('Batch 2023', 2023)");
        }

        // 4. Default Courses if none
        const courseCheck = await client.query("SELECT id FROM courses LIMIT 1");
        if (courseCheck.rows.length === 0) {
            await client.query("INSERT INTO courses (course_name, course_code, duration_years, total_semesters, department) VALUES ('B.Tech CS', 'CS-BTECH', 4, 8, 'Computer Science')");
            await client.query("INSERT INTO courses (course_name, course_code, duration_years, total_semesters, department) VALUES ('MBA', 'MBA-GEN', 2, 4, 'Management')");
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Demo data seeded successfully (only missing entities were added).' });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
});


// GET /api/academic-setup/faculty/:facultyId/mappings
router.get('/faculty/:facultyId/mappings', authenticate, authorize(['admin']), async (req, res, next) => {
    try {
        const { facultyId } = req.params;
        const result = await pool.query(`
            SELECT id as mapping_id, subject_id, section_id 
            FROM faculty_subject_mapping 
            WHERE faculty_id = $1
        `, [facultyId]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
});

// POST /api/academic-setup/faculty/:facultyId/mappings
router.post('/faculty/:facultyId/mappings', authenticate, authorize(['admin']), async (req, res, next) => {
    const client = await pool.connect();
    try {
        const { facultyId } = req.params;
        const { mappings } = req.body; // Array of { subject_id, section_id }

        await client.query('BEGIN');

        // 1. Fetch Current Academic Year
        const ayRes = await client.query('SELECT id FROM academic_years WHERE is_current = true LIMIT 1');
        if (ayRes.rows.length === 0) {
            throw new Error('No current academic year defined. Please set one in Academic Setup.');
        }
        const ayId = ayRes.rows[0].id;

        // 2. Delete existing mappings for THIS faculty in THIS academic year
        // We only clear mappings for the current year to preserve history
        await client.query('DELETE FROM faculty_subject_mapping WHERE faculty_id = $1 AND academic_year_id = $2', [facultyId, ayId]);

        // 3. Insert new mappings
        for (const m of mappings) {
            await client.query(
                'INSERT INTO faculty_subject_mapping (faculty_id, subject_id, section_id, academic_year_id) VALUES ($1, $2, $3, $4)',
                [facultyId, m.subject_id, m.section_id, ayId]
            );
        }

        await client.query('COMMIT');
        res.json({ success: true, message: 'Mappings updated successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
});

module.exports = router;
