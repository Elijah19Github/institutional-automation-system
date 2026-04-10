const express = require('express');
const { pool } = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/admin/attendance-control - Get all lock statuses
router.get('/attendance-control', authenticate, authorize(['admin', 'supadmin']), async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT ac.*, u.name as locked_by_name
            FROM attendance_control ac
            LEFT JOIN users u ON ac.locked_by = u.id
            ORDER BY ac.scope, ac.target_id
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
});

// POST /api/admin/attendance-control/toggle - Toggle lock for a specific scope
router.post('/attendance-control/toggle', authenticate, authorize(['admin', 'supadmin']), async (req, res, next) => {
    try {
        const { scope, target_id, is_locked } = req.body;
        const adminId = req.user.id;

        const result = await pool.query(`
            INSERT INTO attendance_control (scope, target_id, is_locked, locked_by, locked_at)
            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
            ON CONFLICT (scope, target_id) 
            DO UPDATE SET 
                is_locked = EXCLUDED.is_locked,
                locked_by = EXCLUDED.locked_by,
                locked_at = CURRENT_TIMESTAMP
        `, [scope, target_id || null, is_locked, adminId]);

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

// POST /api/admin/attendance-control/bulk-toggle - Bulk Toggle for courses/subjects
router.post('/attendance-control/bulk-toggle', authenticate, authorize(['admin', 'supadmin']), async (req, res, next) => {
    try {
        const { scope, target_ids, is_locked } = req.body;
        const adminId = req.user.id;

        if (!Array.isArray(target_ids)) return res.status(400).json({ success: false, message: 'target_ids must be an array' });

        for (const id of target_ids) {
            await pool.query(`
                INSERT INTO attendance_control (scope, target_id, is_locked, locked_by, locked_at)
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                ON CONFLICT (scope, target_id) 
                DO UPDATE SET is_locked = EXCLUDED.is_locked, locked_by = EXCLUDED.locked_by, locked_at = CURRENT_TIMESTAMP
            `, [scope, id, is_locked, adminId]);
        }

        res.json({ success: true, message: `Bulk ${is_locked ? 'lock' : 'unlock'} successful.` });
    } catch (error) {
        next(error);
    }
});
// GET /api/admin/marks-status - Get submission stats per subject
router.get('/marks-status', authenticate, authorize(['admin', 'supadmin']), async (req, res, next) => {
    try {
        const { examType } = req.query;
        const result = await pool.query(`
            SELECT 
                s.id,
                s.name,
                s.code,
                c.course_name,
                COALESCE(mc.is_locked, false) as is_locked,
                ROUND(
                    (SELECT COUNT(DISTINCT m.student_id) * 100.0 / NULLIF((SELECT COUNT(*) FROM students st WHERE st.course_id = s.course_id), 0)
                     FROM marks m WHERE m.subject_id = s.id AND m.type = $1),
                    1
                ) as submission_rate
            FROM subjects s
            JOIN courses c ON s.course_id = c.id
            LEFT JOIN marks_control mc ON mc.target_id = s.id AND mc.exam_type = $1 AND mc.scope = 'subject'
            ORDER BY c.course_name, s.name
        `, [examType]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
});

// POST /api/admin/lock-marks - Toggle lock for marks entry
router.post('/lock-marks', authenticate, authorize(['admin', 'supadmin']), async (req, res, next) => {
    try {
        const { examType, subjectId, isLocked } = req.body;
        const adminId = req.user.id;

        await pool.query(`
            INSERT INTO marks_control (exam_type, scope, target_id, is_locked, locked_by, locked_at)
            VALUES ($1, 'subject', $2, $3, $4, CURRENT_TIMESTAMP)
            ON CONFLICT (exam_type, scope, target_id) 
            DO UPDATE SET 
                is_locked = EXCLUDED.is_locked,
                locked_by = EXCLUDED.locked_by,
                locked_at = CURRENT_TIMESTAMP
        `, [examType, subjectId, isLocked, adminId]);

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});
module.exports = router;
