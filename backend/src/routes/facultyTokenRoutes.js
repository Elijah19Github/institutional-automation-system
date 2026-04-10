const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const crypto = require('crypto');
const { authenticate, authorize } = require('../middleware/auth');

// 1. Generate Token
router.post('/generate', authenticate, authorize(['admin', 'supadmin']), async (req, res, next) => {
    try {
        const { expiry_hours } = req.body;
        const hours = parseInt(expiry_hours) || 24;
        
        const token = crypto.randomBytes(32).toString('hex');
        
        const expiryDate = new Date();
        expiryDate.setHours(expiryDate.getHours() + hours);

        const result = await pool.query(
            `INSERT INTO faculty_registration_tokens (token, expiry_date, created_by) 
             VALUES ($1, $2, $3) RETURNING *`,
            [token, expiryDate, req.user.id]
        );

        res.status(201).json({
            success: true,
            data: result.rows[0],
            link: `http://localhost:5173/register-faculty?token=${token}`
        });

    } catch (error) {
        next(error);
    }
});

// 2. List Active/All Tokens
router.get('/', authenticate, authorize(['admin', 'supadmin']), async (req, res, next) => {
    try {
        const result = await pool.query(`
            SELECT t.*, u.name as created_by_name 
            FROM faculty_registration_tokens t
            LEFT JOIN users u ON t.created_by = u.id
            ORDER BY t.created_at DESC
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        next(error);
    }
});

// 3. Revoke Token (Delete or mark as used)
router.patch('/:id/revoke', authenticate, authorize(['admin', 'supadmin']), async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            "UPDATE faculty_registration_tokens SET is_used = TRUE WHERE id = $1 RETURNING *",
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Token not found' });
        
        res.json({ success: true, message: 'Token revoked successfully' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
