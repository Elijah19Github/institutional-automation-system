const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');

// Dummy ai risk route
router.get('/high-risk', authenticate, (req, res) => {
    res.json({ success: true, data: [] });
});

module.exports = router;
