const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { pool } = require('../config/db');

const router = express.Router();

// 1. PUBLIC ROUTE: Student Application Submission
router.post('/apply', async (req, res, next) => {
    try {
        const { firstName, lastName, email, phone, previousDegree, previousCgpa } = req.body;

        if (!firstName || !lastName || !email) {
            return res.status(400).json({ success: false, message: 'First name, last name, and email are required.' });
        }

        // Check if application with email already exists
        const checkApp = await pool.query('SELECT id FROM applications WHERE email = $1', [email]);
        if (checkApp.rows.length > 0) {
            return res.status(400).json({ success: false, message: 'An application with this email already exists.' });
        }

        // Insert new pending application
        const result = await pool.query(
            `INSERT INTO applications 
             (first_name, last_name, email, phone, previous_degree, previous_cgpa) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [firstName, lastName, email, phone, previousDegree, previousCgpa]
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

// 2. PUBLIC ROUTE: Login (Users table holds all active roles)
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        // Fetch ACTIVE users only
        const result = await pool.query(
            "SELECT id, name, email, password, role FROM users WHERE email = $1 AND is_active = true",
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

module.exports = router;
