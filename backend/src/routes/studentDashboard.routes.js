const express = require('express');
const router = express.Router();
const studentDashboardController = require('../controllers/studentDashboard.controller');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// GET /api/student-dashboard
router.get('/', authenticate, authorize(['student']), studentDashboardController.getStudentDashboardMetrics);

module.exports = router;
