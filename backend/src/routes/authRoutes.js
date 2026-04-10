const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../config/db');

const router = express.Router();

// 1. PUBLIC ROUTE: Student Application Submission
router.post('/apply', async (req, res, next) => {
    try {
        const { firstName, lastName, email, phone, previousDegree, previousCgpa, course } = req.body;

        if (!firstName || !lastName || !email || !course) {
            return res.status(400).json({ success: false, message: 'First name, last name, email, and course selection are required.' });
        }

        // --- NEW: Strict Validation Parity ---
        const nameRegex = /^[A-Za-z\s]+$/;
        const phoneRegex = /^[6-9]\d{9}$/;

        if (!nameRegex.test(firstName)) return res.status(400).json({ success: false, message: 'First name must contain only alphabets.' });
        if (!nameRegex.test(lastName)) return res.status(400).json({ success: false, message: 'Last name must contain only alphabets.' });
        if (phone && !phoneRegex.test(phone)) return res.status(400).json({ success: false, message: 'Invalid 10-digit Indian phone number.' });

        const cgpaVal = parseFloat(previousCgpa);
        if (isNaN(cgpaVal) || cgpaVal < 0 || cgpaVal > 100) {
            return res.status(400).json({ success: false, message: 'CGPA must be a fractional value between 0 and 100.' });
        }
        // ------------------------------------

        // Check if application with email already exists
        const checkApp = await pool.query('SELECT id FROM applications WHERE email = $1', [email]);
        if (checkApp.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'An application with this email already exists.' });
        }

        // Insert new pending application
        const result = await pool.query(
            `INSERT INTO applications 
             (first_name, last_name, email, phone, previous_degree, previous_cgpa, course_interested) 
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
            [firstName, lastName, email, phone, previousDegree, previousCgpa, course]
        );

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully. Waiting for IT approval.',
            applicationId: result.rows[0].id
        });
    } catch (error) {
        next(error);
    }
});

// 2. PUBLIC ROUTE: Universal Login (Users table holds all active roles, Students table queried for regno)
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body; // email here acts as a universal identifier string

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide your Email or Registration Number, and a Password' });
        }

        // Fetch ACTIVE users using generic logic via email or newly standardized system_id
        const result = await pool.query(
            `SELECT id, name, email, password, role 
             FROM users 
             WHERE (email = $1 OR system_id = $1) AND is_active = true`,
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Invalid credentials or account inactive.' });
        }

        const user = result.rows[0];

        const isMatch = bcrypt.compareSync(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // The role string comes from our ENUM ('ADMIN', 'FACULTY', 'STUDENT')
        const normalizedRole = user.role ? user.role.toLowerCase() : 'student';

        const token = jwt.sign(
            { id: user.id, role: normalizedRole },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: normalizedRole
            }
        });
    } catch (error) {
        next(error);
    }
});

// 3. FORGOT PASSWORD: Generate a reset token
router.post('/forgot-password', async (req, res, next) => {
    try {
        const { email } = req.body;
        const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'No account found with this email address.' });
        }

        const token = crypto.randomBytes(32).toString('hex');

        await pool.query(
            "INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '1 hour')",
            [userRes.rows[0].id, token]
        );

        res.json({
            success: true,
            message: 'Reset link generated successfully. (Developer Mode)',
            resetLink: `http://localhost:5173/reset-password/${token}`
        });
    } catch (error) {
        next(error);
    }
});

// 4. RESET PASSWORD: Validate token and update password
router.post('/reset-password', async (req, res, next) => {
    try {
        const { token, newPassword } = req.body;

        const resetRecord = await pool.query(
            'SELECT * FROM password_resets WHERE token = $1 AND expires_at > NOW()',
            [token]
        );

        if (resetRecord.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
        }

        const userId = resetRecord.rows[0].user_id;
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
        await pool.query('DELETE FROM password_resets WHERE user_id = $1', [userId]);

        res.json({ success: true, message: 'Password updated successfully! Please log in.' });
    } catch (error) {
        next(error);
    }
});
// 5. PUBLIC ROUTE: Faculty Registration using Token
router.post('/register-faculty', async (req, res, next) => {
    try {
        const { token, name, email, password, employee_id, phone_number, department } = req.body;
        
        if (!token || !name || !email || !password || !employee_id) {
            return res.status(400).json({ success: false, message: "All required fields must be filled." });
        }

        // Validate Token
        const tokenCheck = await pool.query(
            "SELECT * FROM faculty_registration_tokens WHERE token = $1 AND is_used = FALSE AND expiry_date > NOW()",
            [token]
        );
        if (tokenCheck.rows.length === 0) return res.status(400).json({ success: false, message: "Invalid or expired registration token." });
        
        // Prevent Email duplicates
        const userCheck = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
        if(userCheck.rows.length > 0) return res.status(400).json({ success: false, message: "Email already exists." });
        
        // Prevent Employee ID duplicates
        const empCheck = await pool.query("SELECT id FROM faculty WHERE employee_id = $1", [employee_id]);
        if(empCheck.rows.length > 0) return res.status(400).json({ success: false, message: "Employee ID already exists." });
        
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Insert User
            const hashedPassword = await bcrypt.hash(password, 10);
            const userRes = await client.query(
                "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'faculty') RETURNING id",
                [name, email, hashedPassword]
            );
            const userId = userRes.rows[0].id;

            // Insert Faculty
            await client.query(
                "INSERT INTO faculty (user_id, employee_id, department, phone_number) VALUES ($1, $2, $3, $4)",
                [userId, employee_id, department, phone_number]
            );
            
            // Mark token as used
            await client.query("UPDATE faculty_registration_tokens SET is_used = TRUE WHERE id = $1", [tokenCheck.rows[0].id]);
            
            await client.query('COMMIT');
            res.status(201).json({ success: true, message: "Faculty profile created successfully. You can now login." });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (error) {
        next(error);
    }
});

module.exports = router;
