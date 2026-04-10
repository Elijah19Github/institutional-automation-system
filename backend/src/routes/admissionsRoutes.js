const express = require('express');
const { pool } = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');

const router = express.Router();

// 1. GET /applications : List all applications (Admin Only)
router.get('/applications', authenticate, authorize(['admin', 'supadmin']), async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT a.id, a.first_name, a.last_name, a.email, a.phone, a.previous_degree, a.previous_cgpa, 
                   a.status, a.applied_at, a.course_interested,
                   u.name as approved_by_name, a.decision_date
            FROM applications a
            LEFT JOIN users u ON a.approved_by = u.id
            ORDER BY a.applied_at DESC
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
});

// 2. PUT /applications/:id/status : Accept or Reject an application (Admin Only)
router.put('/applications/:id/status', authenticate, authorize(['admin', 'supadmin']), async (req, res, next) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { status, fee_amount, fee_deadline_days = 3 } = req.body;

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Status must be accepted or rejected.' });
        }

        await client.query('BEGIN');

        // Update application with auditor info
        const appResult = await client.query(
            "UPDATE applications SET status = $1, approved_by = $2, decision_date = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
            [status, req.user.id, id]
        );

        if (appResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Application not found.' });
        }

        // If accepted, generate student account AND automatically enroll them
        if (status === 'accepted') {
            if (!fee_amount) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'fee_amount is required when accepting.' });
            }

            const { first_name, last_name, email, course_interested } = appResult.rows[0];

            // 1. Resolve Academic Entities Automatically
            const courseRes = await client.query("SELECT id FROM courses WHERE course_code = $1", [course_interested]);
            const batchRes = await client.query("SELECT id FROM batch_years ORDER BY entry_year DESC LIMIT 1");
            const semRes = await client.query("SELECT id FROM semesters WHERE semester_number = 1 LIMIT 1");

            if (courseRes.rows.length === 0 || batchRes.rows.length === 0 || semRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'Academic setup incomplete (Batches/Semesters/Courses missing).' });
            }

            const courseId = courseRes.rows[0].id;
            const batchId = batchRes.rows[0].id;
            const semesterId = semRes.rows[0].id;

            // Find matching Section (Search for course code in section name, e.g. "MCA-A")
            const sectionRes = await client.query(
                "SELECT id FROM sections WHERE batch_id = $1 AND semester_id = $2 AND name ILIKE $3 LIMIT 1",
                [batchId, semesterId, `%${course_interested}%`]
            );
            
            // Fallback to first available section if no name match
            let sectionId = sectionRes.rows.length > 0 ? sectionRes.rows[0].id : null;
            if (!sectionId) {
                const fallbackSection = await client.query(
                    "SELECT id FROM sections WHERE batch_id = $1 AND semester_id = $2 LIMIT 1",
                    [batchId, semesterId]
                );
                sectionId = fallbackSection.rows.length > 0 ? fallbackSection.rows[0].id : null;
            }

            if (!sectionId) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'No sections found for this batch/semester setup.' });
            }

            // 2. Auto-Generate Registration Number
            const yearStr = new Date().getFullYear().toString().slice(-2); 
            const courseCode = course_interested || 'GEN';
            const uuidSlice = id.split('-')[0].toUpperCase().slice(0, 4);
            const regNo = `${yearStr}${courseCode}${uuidSlice}`; 
            
            const fullName = `${first_name} ${last_name}`;
            const hashedPassword = await bcrypt.hash(regNo, 10);

            // 3. Create User Account
            const userResult = await client.query(
                `INSERT INTO users (email, password, name, role, system_id, is_active) 
                 VALUES ($1, $2, $3, 'STUDENT', $4, true) RETURNING id`,
                [email, hashedPassword, fullName, regNo]
            );
            const userId = userResult.rows[0].id;

            // 4. Create Student Profile AND Enroll immediately
            await client.query(
                `INSERT INTO students (user_id, enrollment_number, course_id, batch_id, current_semester_id, current_section_id)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [userId, regNo, courseId, batchId, semesterId, sectionId]
            );

            // 5. Create Provisional record as PAID
            const deadline = new Date();
            deadline.setDate(deadline.getDate() + fee_deadline_days);

            await client.query(
                `INSERT INTO provisional_admissions (application_id, fee_amount, fee_deadline, is_paid)
                 VALUES ($1, $2, $3, true)`,
                [id, fee_amount, deadline]
            );

            console.log(`[ADMISSIONS]: Approved & Enrolled ${email}. RegNo: ${regNo}, Section: ${sectionId}`);
        }

        await client.query('COMMIT');
        res.json({ success: true, message: `Application ${status} successfully.` });
    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
});

// 3. GET /provisional : List all provisional admissions (Admin Only)
router.get('/provisional', authenticate, authorize(['admin', 'supadmin']), async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT p.id, p.fee_amount, p.fee_deadline, p.is_paid, 
                   a.first_name, a.last_name, a.email, a.course_interested
            FROM provisional_admissions p
            JOIN applications a ON p.application_id = a.id
            ORDER BY p.generated_at DESC
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
});

// 4. POST /provisional/:id/pay : Confirm payment and ENROLL (Admin Only)
router.post('/provisional/:id/pay', authenticate, authorize(['admin', 'supadmin']), async (req, res, next) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { batch_id, semester_id, section_id } = req.body; 

        await client.query('BEGIN');

        const provResult = await client.query(
            `SELECT p.is_paid, a.email 
             FROM provisional_admissions p
             JOIN applications a ON p.application_id = a.id
             WHERE p.id = $1`, [id]
        );

        if (provResult.rows.length === 0) return res.status(404).json({ success: false, message: 'Record not found.' });
        if (provResult.rows[0].is_paid) return res.status(400).json({ success: false, message: 'Fee already paid.' });

        const { first_name, last_name, email } = provResult.rows[0];
        const fullName = `${first_name} ${last_name}`;

        // 2. Mark as paid
        await client.query('UPDATE provisional_admissions SET is_paid = true WHERE id = $1', [id]);

        // 3. Update existing Student mapping if required, or simply confirm payment.
        // The student entity was previously generated natively during the Application Acceptance workflow.

        const fetchUser = await client.query(
            `SELECT s.id 
             FROM students s 
             JOIN users u ON s.user_id = u.id 
             WHERE u.email = $1`, [email]
        );

        if (fetchUser.rows.length > 0) {
           await client.query(
                `UPDATE students 
                 SET batch_id = $1, current_semester_id = $2, current_section_id = $3
                 WHERE id = $4`,
                [batch_id, semester_id, section_id, fetchUser.rows[0].id]
           );
        }

        await client.query('COMMIT');
        res.json({
            success: true,
            message: 'Payment confirmed. Student enrolled directly into designated section mapping.'
        });

    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
});


module.exports = router;
