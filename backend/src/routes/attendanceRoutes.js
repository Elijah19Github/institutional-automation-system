const express = require('express');
const { pool } = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// 1. GET /academic-hours : Fetch available hour slots 1-13
router.get('/academic-hours', authenticate, authorize(['faculty', 'admin', 'supadmin']), async (req, res, next) => {
    try {
        const result = await pool.query('SELECT * FROM academic_hours WHERE is_active = true ORDER BY hour_number ASC');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
});

// 2. GET /faculty/assigned : Fetch the Subject+Section configurations mapped to logged-in Faculty.
router.get('/faculty/assigned', authenticate, authorize(['faculty', 'admin', 'supadmin']), async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Fetch subjects where the logged-in user is the mapped faculty
        const result = await pool.query(`
            SELECT 
                fsm.id as mapping_id,
                subj.id as subject_id, subj.name as subject_name, subj.code as subject_code,
                subj.course_id,
                sec.id as section_id, sec.name as section_name,
                sem.name as semester_name,
                b.name as batch_name
            FROM faculty_subject_mapping fsm
            JOIN faculty f ON fsm.faculty_id = f.id
            JOIN subjects subj ON fsm.subject_id = subj.id
            JOIN sections sec ON fsm.section_id = sec.id
            JOIN semesters sem ON sec.semester_id = sem.id
            JOIN batch_years b ON sec.batch_id = b.id
            WHERE f.user_id = $1
            ORDER BY sem.semester_number ASC, sec.name ASC
        `, [userId]);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
});

/**
 * 2b. GET /admin/all-configs
 * Fetch EVERY Subject+Section configuration across the institution.
 * Role: Admin, Supadmin
 */
router.get('/admin/all-configs', authenticate, authorize(['admin', 'supadmin']), async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT 
                fsm.id as mapping_id,
                subj.id as subject_id, subj.name as subject_name, subj.code as subject_code,
                sec.id as section_id, sec.name as section_name,
                sem.name as semester_name,
                b.name as batch_name,
                u.name as faculty_name,
                c.course_name
            FROM faculty_subject_mapping fsm
            JOIN faculty f ON fsm.faculty_id = f.id
            JOIN users u ON f.user_id = u.id
            JOIN subjects subj ON fsm.subject_id = subj.id
            JOIN sections sec ON fsm.section_id = sec.id
            JOIN semesters sem ON subj.semester_id = sem.id
            JOIN batch_years b ON sec.batch_id = b.id
            JOIN courses c ON subj.course_id = c.id
            ORDER BY c.course_name ASC, sem.name ASC, sec.name ASC
        `);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
});

// 3. GET /session/students : Fetch students enrolled in a specific section for an hour.
router.get('/session/students', authenticate, authorize(['faculty', 'admin', 'supadmin']), async (req, res, next) => {
    try {
        const { section_id, subject_id, date, hour_id } = req.query;

        if (!section_id || !subject_id || !date || !hour_id) {
            return res.status(400).json({ success: false, message: 'section_id, subject_id, date, and hour_id are required query parameters.' });
        }

        // Fetch students enrolled in the section and check if there's already an attendance record for today's session
        const result = await pool.query(`
            SELECT 
                s.id as student_id,
                s.enrollment_number,
                u.name as student_name,
                COALESCE((
                    SELECT CASE 
                        WHEN ar.status = 'P' THEN 'present'
                        WHEN ar.status = 'A' THEN 'absent'
                        ELSE 'unmarked'
                    END
                    FROM attendance_records ar
                    JOIN attendance_sessions a_sess ON ar.session_id = a_sess.id
                    WHERE ar.student_id = s.id 
                      AND a_sess.section_id = $1 
                      AND a_sess.subject_id = $2 
                      AND a_sess.session_date = $3
                      AND a_sess.hour_id = $4
                      AND a_sess.hour_id = $4
                ), 'unmarked') as today_status,
                (
                    SELECT 
                        COALESCE(
                            ROUND(
                                (SUM(CASE WHEN ar2.status = 'P' THEN 1.0 ELSE 0.0 END) / 
                                NULLIF(COUNT(ar2.id), 0)) * 100, 2
                            ), 100
                        )
                    FROM attendance_records ar2
                    JOIN attendance_sessions a2 ON ar2.session_id = a2.id
                    WHERE ar2.student_id = s.id AND a2.subject_id = $2
                ) as overall_percentage
            FROM students s
            JOIN users u ON s.user_id = u.id
            WHERE s.current_section_id = $1
            ORDER BY s.enrollment_number ASC
        `, [section_id, subject_id, date, hour_id]);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
});

// 4. POST /session : Mark Batch Attendance and create Session record
router.post('/session', authenticate, authorize(['faculty', 'admin', 'supadmin']), async (req, res, next) => {
    try {
        const { subject_id, section_id, session_date, hour_id, records } = req.body;
        const userId = req.user.id;

        if (!subject_id || !section_id || !session_date || !hour_id || !records || !Array.isArray(records)) {
            return res.status(400).json({ success: false, message: 'Invalid payload.' });
        }

        // --- LOCK & GRACE PERIOD VALIDATION ---
        const isStaff = ['faculty'].includes(req.user.role);
        const isAdmin = ['admin', 'supadmin'].includes(req.user.role);

        // 1. Check Grace Period (24h)
        const sessionDateObj = new Date(session_date);
        const now = new Date();
        const diffInHours = (now - sessionDateObj) / (1000 * 60 * 60);

        if (diffInHours > 48 && isStaff) { // 24h grace period + buffer (total 48h from midnight of session date)
            return res.status(403).json({ 
                success: false, 
                code: 'GRACE_PERIOD_EXPIRED', 
                message: 'Attendance marking for this date is now locked (24h grace period expired).' 
            });
        }

        // 2. Check Database Locks
        const lockCheck = await pool.query(`
            SELECT scope, is_locked FROM attendance_control
            WHERE (scope = 'global' AND is_locked = TRUE)
               OR (scope = 'course' AND target_id = (SELECT course_id FROM subjects WHERE id = $1) AND is_locked = TRUE)
               OR (scope = 'subject' AND target_id = $1 AND is_locked = TRUE)
        `, [subject_id]);

        if (lockCheck.rows.length > 0 && isStaff) {
            return res.status(403).json({ 
                success: false, 
                code: 'ATTENDANCE_LOCKED', 
                message: 'Attendance for this category is currently locked by Administrator.' 
            });
        }

        const todayStr = new Date().toISOString().split('T')[0];
        if (session_date > todayStr) {
            return res.status(400).json({ success: false, code: 'FUTURE_DATE_NOT_ALLOWED', message: 'You cannot mark attendance for a future date.' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // --- FACULTY/SUBJECT VALIDATION ---
            let facultyIdResult = await client.query('SELECT id FROM faculty WHERE user_id = $1', [userId]);

            if (facultyIdResult.rows.length === 0 && ['admin', 'supadmin'].includes(req.user.role)) {
                facultyIdResult = await client.query(`
                    SELECT faculty_id as id FROM faculty_subject_mapping 
                    WHERE subject_id = $1 AND section_id = $2 LIMIT 1
                 `, [subject_id, section_id]);

                if (facultyIdResult.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(403).json({ success: false, code: 'UNAUTHORIZED_SUBJECT_ACCESS' });
                }
            } else if (facultyIdResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(403).json({ success: false, code: 'UNAUTHORIZED_SUBJECT_ACCESS' });
            }

            const facultyId = facultyIdResult.rows[0].id;

            // Optional explicit check: verify mapped if it's strictly a Faculty submitting
            if (req.user.role === 'faculty') {
                const mapCheck = await client.query(
                    `SELECT id FROM faculty_subject_mapping WHERE faculty_id = $1 AND subject_id = $2 AND section_id = $3`,
                    [facultyId, subject_id, section_id]
                );
                if (mapCheck.rows.length === 0) {
                    await client.query('ROLLBACK');
                    return res.status(403).json({ success: false, code: 'UNAUTHORIZED_SUBJECT_ACCESS' });
                }
            }


            // --- DUPLICATE / CHANGE DETECTION ---
            const existingSession = await client.query(`
                SELECT id FROM attendance_sessions 
                WHERE subject_id = $1 AND section_id = $2 AND session_date = $3 AND hour_id = $4
            `, [subject_id, section_id, session_date, hour_id]);

            if (existingSession.rows.length > 0) {
                const sessionId = existingSession.rows[0].id;

                // Fetch previous records
                const prevRecords = await client.query(`SELECT student_id, status FROM attendance_records WHERE session_id = $1`, [sessionId]);
                const prevMap = new Map();
                prevRecords.rows.forEach(r => prevMap.set(r.student_id, r.status));

                let hasChanges = false;

                for (const newRec of records) {
                    const oldStatus = prevMap.get(newRec.student_id);
                    if (oldStatus !== newRec.status) {
                        hasChanges = true;
                        await client.query(
                            `UPDATE attendance_records SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE session_id = $2 AND student_id = $3`,
                            [newRec.status, sessionId, newRec.student_id]
                        );
                    }
                }

                if (!hasChanges) {
                    await client.query('ROLLBACK');
                    return res.status(200).json({ success: false, code: 'NO_CHANGES_DETECTED' }); // Still HTTP success to stop client crash, handled locally
                }

                // If modified, touch session updated_at
                await client.query(`UPDATE attendance_sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [sessionId]);

            } else {
                // Insert New Session
                const sessionInsert = await client.query(`
                    INSERT INTO attendance_sessions (faculty_id, subject_id, section_id, session_date, hour_id)
                    VALUES ($1, $2, $3, $4, $5)
                    RETURNING id
                `, [facultyId, subject_id, section_id, session_date, hour_id]);

                const sessionId = sessionInsert.rows[0].id;

                for (const record of records) {
                    if (!['P', 'A'].includes(record.status)) {
                        throw new Error(`Invalid status '${record.status}'. Must be 'P' or 'A'.`);
                    }
                    await client.query(`
                        INSERT INTO attendance_records (session_id, student_id, status)
                        VALUES ($1, $2, $3)
                    `, [sessionId, record.student_id, record.status]);
                }
            }

            await client.query('COMMIT');
            res.json({ success: true, message: 'Attendance recorded successfully.' });
        } catch (txnError) {
            await client.query('ROLLBACK');
            throw txnError;
        } finally {
            client.release();
        }

    } catch (error) {
        next(error);
    }
});

// 4. GET /student/percentage : Dynamically calculate overall present percentage for a student across all subjects
router.get('/student/percentage', authenticate, authorize(['student', 'admin', 'supadmin']), async (req, res, next) => {
    try {
        const studentUserId = req.user.id;

        // Ensure the student exists and map to their Student ID
        const studentRecord = await pool.query('SELECT id FROM students WHERE user_id = $1', [studentUserId]);
        if (studentRecord.rows.length === 0) return res.status(404).json({ success: false, message: 'Student profile not found.' });

        const studentId = studentRecord.rows[0].id;

        // Mathematical dynamic percentage calculation: (total_present / total_classes) * 100
        const result = await pool.query(`
            SELECT 
                COUNT(*) as total_classes,
                SUM(CASE WHEN status = 'P' THEN 1 ELSE 0 END) as total_present
            FROM attendance_records
            WHERE student_id = $1
        `, [studentId]);

        const { total_classes, total_present } = result.rows[0];
        const countClasses = parseInt(total_classes) || 0;
        const countPresent = parseInt(total_present) || 0;

        let percentage = 0.00;
        if (countClasses > 0) {
            percentage = (countPresent / countClasses) * 100;
        }

        const subjectsResult = await pool.query(`
            SELECT 
                sub.name as subject_name,
                sub.id as subject_id,
                sub.code as subject_code,
                sem.name as semester_name,
                sem.semester_number,
                COUNT(ar.id) as total_classes,
                SUM(CASE WHEN ar.status = 'P' THEN 1 ELSE 0 END) as total_present,
                ROUND(
                    (SUM(CASE WHEN ar.status = 'P' THEN 1.0 ELSE 0.0 END) / 
                    NULLIF(COUNT(ar.id), 0)) * 100, 2
                ) as subject_percentage
            FROM attendance_records ar
            JOIN attendance_sessions a_sess ON ar.session_id = a_sess.id
            JOIN subjects sub ON a_sess.subject_id = sub.id
            JOIN semesters sem ON sub.semester_id = sem.id
            WHERE ar.student_id = $1
            GROUP BY sub.name, sub.id, sub.code, sem.name, sem.semester_number
            ORDER BY sem.semester_number ASC, sub.name ASC
        `, [studentId]);

        res.json({
            success: true,
            data: {
                overall: {
                    total_classes: countClasses,
                    total_present: countPresent,
                    percentage: parseFloat(percentage.toFixed(2))
                },
                subjects: subjectsResult.rows
            }
        });

    } catch (error) {
        next(error);
    }
});


// 5. PATCH /record/:id : Admin Override for specific attendance record
router.patch('/record/:id', authenticate, authorize(['admin', 'supadmin']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'P' or 'A'

        if (!['P', 'A'].includes(status)) {
            return res.status(400).json({ success: false, message: "Status must be 'P' or 'A'." });
        }

        const result = await pool.query(
            "UPDATE attendance_records SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *",
            [status, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Record not found.' });
        res.json({ success: true, message: 'Record updated successfully.', data: result.rows[0] });
    } catch (error) {
        next(error);
    }
});

// 6. GET /admin/analytics : Fetch institution macro-level attendance
router.get('/admin/analytics', authenticate, authorize(['admin', 'supadmin']), async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT 
                c.course_name,
                c.course_code,
                b.name as batch_name,
                sem.semester_number,
                COUNT(ar.id) as total_attendance_records,
                SUM(CASE WHEN ar.status = 'P' THEN 1 ELSE 0 END) as total_present,
                ROUND(
                    (SUM(CASE WHEN ar.status = 'P' THEN 1.0 ELSE 0.0 END) / 
                    NULLIF(COUNT(ar.id), 0)) * 100, 2
                ) as average_percentage
            FROM attendance_records ar
            JOIN attendance_sessions a_sess ON ar.session_id = a_sess.id
            JOIN sections sec ON a_sess.section_id = sec.id
            JOIN semesters sem ON sec.semester_id = sem.id
            JOIN batch_years b ON sec.batch_id = b.id
            JOIN subjects sub ON a_sess.subject_id = sub.id
            JOIN courses c ON sub.course_id = c.id
            GROUP BY c.course_name, c.course_code, b.name, sem.semester_number
            ORDER BY c.course_name, sem.semester_number, b.name
        `);

        // Low attendance students globally (<75%)
        const lowResult = await pool.query(`
            SELECT 
                s.id as student_id,
                u.name as student_name,
                ROUND(
                    (SUM(CASE WHEN ar.status = 'P' THEN 1.0 ELSE 0.0 END) / 
                    NULLIF(COUNT(ar.id), 0)) * 100, 2
                ) as overall_percentage
            FROM attendance_records ar
            JOIN students s ON ar.student_id = s.id
            JOIN users u ON s.user_id = u.id
            GROUP BY s.id, u.name
            HAVING (SUM(CASE WHEN ar.status = 'P' THEN 1.0 ELSE 0.0 END) / NULLIF(COUNT(ar.id), 0)) * 100 < 75
            ORDER BY overall_percentage ASC
        `);

        res.json({
            success: true,
            data: {
                groupings: result.rows,
                defaulters: lowResult.rows
            }
        });
    } catch (error) {
        next(error);
    }
});

// 7. GET /student/hourly : Detailed day-wise hourly attendance
router.get('/student/hourly', authenticate, authorize(['student', 'admin', 'supadmin']), async (req, res, next) => {
    try {
        const studentUserId = req.user.id;
        const { from, to } = req.query;

        const studentRecord = await pool.query('SELECT id FROM students WHERE user_id = $1', [studentUserId]);
        if (studentRecord.rows.length === 0) return res.status(404).json({ success: false, message: 'Student profile not found.' });
        const studentId = studentRecord.rows[0].id;

        let query = `
            SELECT 
                a_sess.session_date,
                a_sess.hour_id,
                ah.label as hour_label,
                ar.status,
                sub.name as subject_name,
                sub.code as subject_code
            FROM attendance_records ar
            JOIN attendance_sessions a_sess ON ar.session_id = a_sess.id
            JOIN academic_hours ah ON a_sess.hour_id = ah.id
            JOIN subjects sub ON a_sess.subject_id = sub.id
            WHERE ar.student_id = $1
        `;
        const params = [studentId];

        if (from) {
            params.push(from);
            query += ` AND a_sess.session_date >= $${params.length}`;
        }
        if (to) {
            params.push(to);
            query += ` AND a_sess.session_date <= $${params.length}`;
        }

        query += ` ORDER BY a_sess.session_date DESC, a_sess.hour_id ASC`;

        const result = await pool.query(query, params);

        // Group by date
        const dailyAttendance = {};
        result.rows.forEach(row => {
            const dateKey = new Date(row.session_date).toISOString().split('T')[0];
            if (!dailyAttendance[dateKey]) {
                dailyAttendance[dateKey] = {
                    date: dateKey,
                    hours: {}
                };
            }
            dailyAttendance[dateKey].hours[row.hour_id] = {
                status: row.status,
                subject_name: row.subject_name,
                subject_code: row.subject_code,
                label: row.hour_label
            };
        });

        // Get all active academic hours for header
        const hoursRes = await pool.query('SELECT id, hour_number, label FROM academic_hours WHERE is_active = true ORDER BY hour_number ASC');

        res.json({
            success: true,
            data: {
                daily: Object.values(dailyAttendance),
                available_hours: hoursRes.rows
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
