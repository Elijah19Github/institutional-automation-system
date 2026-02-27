const express = require('express');
const { pool } = require('../config/db');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');

const router = express.Router();

// 1. GET /applications : List all pending applications (Admin Only)
router.get('/applications', authenticate, authorize(['admin', 'supadmin']), async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT a.id, a.first_name, a.last_name, a.email, a.phone, a.previous_degree, a.previous_cgpa, a.status, a.applied_at,
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

        // Update application
        const appResult = await client.query(
            "UPDATE applications SET status = $1, approved_by = $2, decision_date = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
            [status, req.user.id, id]
        );

        if (appResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Application not found.' });
        }

        // If accepted, generate provisional admission
        if (status === 'accepted') {
            if (!fee_amount) {
                await client.query('ROLLBACK');
                return res.status(400).json({ success: false, message: 'fee_amount is required when accepting.' });
            }

            const deadline = new Date();
            deadline.setDate(deadline.getDate() + fee_deadline_days);

            await client.query(
                `INSERT INTO provisional_admissions (application_id, fee_amount, fee_deadline)
                 VALUES ($1, $2, $3)`,
                [id, fee_amount, deadline]
            );
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

// 3. GET /provisional : List all provisional admissions waiting for payment (Admin Only)
router.get('/provisional', authenticate, authorize(['admin', 'supadmin']), async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT p.id, p.fee_amount, p.fee_deadline, p.is_paid, 
                   a.first_name, a.last_name, a.email
            FROM provisional_admissions p
            JOIN applications a ON p.application_id = a.id
            ORDER BY p.generated_at DESC
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
});

// 4. POST /provisional/:id/pay : Confirm payment and GENERATE STUDENT ACCOUNT (Admin Only)
router.post('/provisional/:id/pay', authenticate, authorize(['admin', 'supadmin']), async (req, res, next) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { batch_id, semester_id, section_id } = req.body; // Requirements for enrollment mapping

        if (!batch_id || !semester_id || !section_id) {
            return res.status(400).json({ success: false, message: 'batch_id, semester_id, and section_id required.' });
        }

        await client.query('BEGIN');

        // 1. Check provisional record
        const provResult = await client.query(
            `SELECT p.is_paid, a.first_name, a.last_name, a.email 
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

        // 3. Generate User Account
        // Default password for new students: "password123"
        const hash = await bcrypt.hash('password123', 10);

        const userResult = await client.query(
            `INSERT INTO users (email, password, name, role) 
             VALUES ($1, $2, $3, 'STUDENT') RETURNING id`,
            [email, hash, fullName]
        );
        const userId = userResult.rows[0].id;

        // 4. Generate Student Record with Enrollment Mapping
        // Simple logic for Student ID generation (e.g STU-TIMESTAMP)
        const enrollmentNumber = `STU-${Date.now().toString().slice(-6)}`;

        await client.query(
            `INSERT INTO students (user_id, enrollment_number, batch_id, current_semester_id, current_section_id)
             VALUES ($1, $2, $3, $4, $5)`,
            [userId, enrollmentNumber, batch_id, semester_id, section_id]
        );

        await client.query('COMMIT');
        res.json({
            success: true,
            message: 'Payment confirmed. Student account created successfully.',
            credentials: { email, defaultPassword: 'password123', enrollmentNumber }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        next(error);
    } finally {
        client.release();
    }
});


module.exports = router;
