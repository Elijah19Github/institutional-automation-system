const express = require('express');
const { pool } = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// 1. GET /setup : Fetch all dropdown data needed for Admin mappings (Batches, Semesters, Sections)
router.get('/setup', authenticate, authorize(['admin', 'supadmin', 'faculty']), async (req, res, next) => {
    try {
        const batches = await pool.query('SELECT * FROM batch_years ORDER BY entry_year DESC');
        const semesters = await pool.query('SELECT * FROM semesters ORDER BY semester_number ASC');
        const subjects = await pool.query('SELECT * FROM subjects ORDER BY code ASC');
        const academicYears = await pool.query('SELECT * FROM academic_years ORDER BY start_date DESC');

        res.json({
            success: true,
            data: {
                batches: batches.rows,
                semesters: semesters.rows,
                subjects: subjects.rows,
                academicYears: academicYears.rows
            }
        });
    } catch (error) {
        next(error);
    }
});

// 2. GET /sections : List sections with their batch and semester
router.get('/sections', authenticate, authorize(['admin', 'supadmin']), async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT s.id, s.name, s.capacity, b.name as batch, sem.name as semester
            FROM sections s
            JOIN batch_years b ON s.batch_id = b.id
            JOIN semesters sem ON s.semester_id = sem.id
            ORDER BY b.entry_year DESC, sem.semester_number ASC, s.name ASC
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
});

// 3. POST /sections : Create a new Section mapped to Batch & Semester (Admin)
router.post('/sections', authenticate, authorize(['admin', 'supadmin']), async (req, res, next) => {
    try {
        const { name, batch_id, semester_id, capacity = 60 } = req.body;

        if (!name || !batch_id || !semester_id) {
            return res.status(400).json({ success: false, message: 'Missing required section fields.' });
        }

        const result = await pool.query(
            "INSERT INTO sections (name, batch_id, semester_id, capacity) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, batch_id, semester_id, capacity]
        );

        res.status(201).json({ success: true, message: 'Section created successfully.', data: result.rows[0] });
    } catch (error) {
        // Handle unique constraint logic (e.g. "MCA-A" already exists for this batch+semester)
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'This section already exists for this batch and semester.' });
        }
        next(error);
    }
});

// 4. POST /map-faculty : Assign a faculty to a subject for a specific section (Admin)
router.post('/map-faculty', authenticate, authorize(['admin', 'supadmin']), async (req, res, next) => {
    try {
        const { faculty_id, subject_id, section_id, academic_year_id } = req.body;

        if (!faculty_id || !subject_id || !section_id || !academic_year_id) {
            return res.status(400).json({ success: false, message: 'All mapping fields are required.' });
        }

        await pool.query(
            "INSERT INTO faculty_subject_mapping (faculty_id, subject_id, section_id, academic_year_id) VALUES ($1, $2, $3, $4)",
            [faculty_id, subject_id, section_id, academic_year_id]
        );

        res.status(201).json({ success: true, message: 'Faculty assigned successfully.' });
    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'This faculty is already mapped to this subject and section for the academic year.' });
        }
        next(error);
    }
});


module.exports = router;
