/**
 * risk.routes.js
 * ──────────────────────────────────────────────────────────────
 * AI Risk Prediction Module — fully DB-driven
 *
 * Endpoints:
 *   POST /api/risk/calculate          – Single student risk
 *   POST /api/risk/batch-calculate    – All students bulk
 *   GET  /api/risk/distribution       – Counts for dashboard
 *   GET  /api/risk/student/:id        – Student risk detail
 * ──────────────────────────────────────────────────────────────
 */

const express = require('express');
const router  = express.Router();
const { pool } = require('../config/db');

// ── Shared risk computation SQL fragment ─────────────────────
// Returns { attendance_pct, average_marks_pct, risk_score, risk_level }
// for a single student_id.
const RISK_CALC_SQL = `
    WITH att AS (
        SELECT
            ar.student_id,
            ROUND(
                SUM(CASE WHEN ar.status = 'P' THEN 1 ELSE 0 END) * 100.0
                / NULLIF(COUNT(ar.id), 0)
            , 2) AS attendance_percentage
        FROM attendance_records ar
        WHERE ar.student_id = $1
        GROUP BY ar.student_id
    ),
    mrk AS (
        SELECT
            m.student_id,
            ROUND(AVG(
                m.score * 100.0 / NULLIF(m.max_score, 0)
            ), 2) AS average_marks
        FROM marks m
        WHERE m.student_id = $1
        GROUP BY m.student_id
    )
    SELECT
        COALESCE(att.attendance_percentage, 0) AS attendance_percentage,
        COALESCE(mrk.average_marks, 0)         AS average_marks,
        ROUND(
            COALESCE(att.attendance_percentage, 0) * 0.5 +
            COALESCE(mrk.average_marks, 0)         * 0.5
        , 2) AS risk_score,
        CASE
            WHEN COALESCE(att.attendance_percentage, 0) < 60
             AND COALESCE(mrk.average_marks, 0) < 40 THEN 'HIGH'
            WHEN COALESCE(att.attendance_percentage, 0) < 75
              OR COALESCE(mrk.average_marks, 0) < 50  THEN 'MEDIUM'
            ELSE 'LOW'
        END AS risk_level
    FROM (SELECT $1::uuid AS dummy) d
    LEFT JOIN att ON true
    LEFT JOIN mrk ON true
`;

// ─────────────────────────────────────────────────────────────
// POST /api/risk/calculate
// Calculate and store risk for one student
// ─────────────────────────────────────────────────────────────
router.post('/calculate', async (req, res) => {
    const { student_id } = req.body;
    if (!student_id) {
        return res.status(400).json({ success: false, message: 'student_id is required' });
    }

    try {
        // 1. Get student's current semester
        const stuRes = await pool.query(
            `SELECT current_semester_id, user_id FROM students WHERE id = $1`, [student_id]
        );
        if (stuRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }
        const { current_semester_id, user_id } = stuRes.rows[0];

        // 2. Run risk computation
        const riskRes = await pool.query(RISK_CALC_SQL, [student_id]);
        const { attendance_percentage, average_marks, risk_score, risk_level } = riskRes.rows[0];

        // 3. Upsert into academic_risk
        await pool.query(
            `INSERT INTO academic_risk (student_id, attendance_percentage, average_marks, risk_score, risk_level, semester_id)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (student_id, semester_id) DO UPDATE SET
                 attendance_percentage = EXCLUDED.attendance_percentage,
                 average_marks         = EXCLUDED.average_marks,
                 risk_score            = EXCLUDED.risk_score,
                 risk_level            = EXCLUDED.risk_level,
                 calculated_at         = CURRENT_TIMESTAMP`,
            [student_id, attendance_percentage, average_marks, risk_score, risk_level, current_semester_id]
        );

        // 4. Trigger notification for MEDIUM / HIGH risk
        if (risk_level !== 'LOW') {
            const message = risk_level === 'HIGH'
                ? '⚠️ URGENT: Your academic performance is critically low. Please consult your faculty immediately.'
                : '📢 WARNING: Your attendance or marks are below the required threshold. Improvement is needed.';

            await pool.query(
                `INSERT INTO notifications (user_id, message, risk_level)
                 VALUES ($1, $2, $3)`,
                [user_id, message, risk_level]
            );
        }

        res.json({
            success: true,
            data: { student_id, attendance_percentage, average_marks, risk_score, risk_level }
        });

    } catch (err) {
        console.error('Risk calculation error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// POST /api/risk/batch-calculate
// Calculate and store risk for ALL students (admin use)
// ─────────────────────────────────────────────────────────────
router.post('/batch-calculate', async (req, res) => {
    try {
        const result = await pool.query(`
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
                    COALESCE(SUM(CASE WHEN ar.status = 'P' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(ar.id), 0), 0) * 0.5 +
                    COALESCE(AVG(m.score * 100.0 / NULLIF(m.max_score, 0)), 0) * 0.5
                ), 2) AS risk_score,
                CASE
                    WHEN COALESCE(SUM(CASE WHEN ar.status='P' THEN 1 ELSE 0 END)*100.0/NULLIF(COUNT(ar.id),0),0) < 60
                     AND COALESCE(AVG(m.score*100.0/NULLIF(m.max_score,0)), 0) < 40 THEN 'HIGH'
                    WHEN COALESCE(SUM(CASE WHEN ar.status='P' THEN 1 ELSE 0 END)*100.0/NULLIF(COUNT(ar.id),0),0) < 75
                      OR COALESCE(AVG(m.score*100.0/NULLIF(m.max_score,0)), 0) < 50  THEN 'MEDIUM'
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
            RETURNING student_id, risk_level
        `);

        const distribution = result.rows.reduce(
            (acc, r) => { acc[r.risk_level] = (acc[r.risk_level] || 0) + 1; return acc; },
            { HIGH: 0, MEDIUM: 0, LOW: 0 }
        );

        res.json({
            success: true,
            message: `Risk calculated for ${result.rows.length} students`,
            distribution
        });

    } catch (err) {
        console.error('Batch risk calculation error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// GET /api/risk/distribution
// Risk distribution counts for dashboard charts
// ─────────────────────────────────────────────────────────────
router.get('/distribution', async (req, res) => {
    try {
        // Get most recent risk record per student
        const result = await pool.query(`
            SELECT
                COUNT(CASE WHEN ar.risk_level = 'HIGH'   THEN 1 END) AS high,
                COUNT(CASE WHEN ar.risk_level = 'MEDIUM' THEN 1 END) AS medium,
                COUNT(CASE WHEN ar.risk_level = 'LOW'    THEN 1 END) AS safe,
                COUNT(CASE WHEN ar.risk_level IN ('HIGH','MEDIUM') THEN 1 END) AS at_risk
            FROM academic_risk ar
            INNER JOIN (
                SELECT student_id, MAX(calculated_at) AS latest
                FROM academic_risk
                GROUP BY student_id
            ) latest ON ar.student_id = latest.student_id AND ar.calculated_at = latest.latest
        `);

        const row = result.rows[0];
        res.json({
            success: true,
            data: {
                high:     parseInt(row.high)   || 0,
                medium:   parseInt(row.medium) || 0,
                safe:     parseInt(row.safe)   || 0,
                at_risk:  parseInt(row.at_risk)|| 0,
            }
        });

    } catch (err) {
        console.error('Risk distribution error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// GET /api/risk/student/:id
// Detailed risk profile for one student (used in StudentRiskAnalysis)
// ─────────────────────────────────────────────────────────────
router.get('/student/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Latest stored risk
        const stored = await pool.query(
            `SELECT ar.*, sem.name AS semester_name
             FROM academic_risk ar
             LEFT JOIN semesters sem ON ar.semester_id = sem.id
             WHERE ar.student_id = $1
             ORDER BY ar.calculated_at DESC LIMIT 1`,
            [id]
        );

        // Per-subject breakdown
        const subjects = await pool.query(`
            SELECT
                sub.name AS subject_name, sub.code AS subject_code,
                ROUND(
                    SUM(CASE WHEN ar.status='P' THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(ar.id),0)
                , 2) AS attendance_pct,
                ROUND(AVG(m.score * 100.0 / NULLIF(m.max_score,0)), 2) AS avg_marks_pct
            FROM subjects sub
            LEFT JOIN attendance_sessions a_sess ON a_sess.subject_id = sub.id
            LEFT JOIN attendance_records ar ON ar.session_id = a_sess.id AND ar.student_id = $1
            LEFT JOIN marks m ON m.subject_id = sub.id AND m.student_id = $1
            WHERE sub.id IN (
                SELECT DISTINCT a_sess2.subject_id
                FROM attendance_records ar2
                JOIN attendance_sessions a_sess2 ON ar2.session_id = a_sess2.id
                WHERE ar2.student_id = $1
            )
            GROUP BY sub.id, sub.name, sub.code
            ORDER BY sub.name ASC
        `, [id]);

        res.json({
            success: true,
            data: {
                risk: stored.rows[0] || null,
                subjects: subjects.rows,
            }
        });

    } catch (err) {
        console.error('Student risk detail error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
