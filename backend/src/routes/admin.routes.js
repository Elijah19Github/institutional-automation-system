const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer Configuration for Faculty Photos
const uploadDir = path.join(__dirname, '../../uploads/faculty');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, `faculty-${Date.now()}${path.extname(file.originalname)}`)
});

const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true);
        else cb(new Error('Only images are allowed'));
    }
});

// GET /api/admin/dashboard
router.get('/dashboard', authenticate, authorize(['admin', 'supadmin', 'student']), adminController.getDashboardMetrics);

// POST /api/admin/faculty - Create new faculty profile
router.post('/faculty', authenticate, authorize(['admin', 'supadmin']), upload.single('profile_pic'), adminController.createFaculty);

// GET /api/admin/faculty-metrics (Accessed by Faculty)
router.get('/faculty-metrics', authenticate, authorize(['admin', 'supadmin', 'faculty']), adminController.getFacultyDashboardMetrics);

// Drill-down routes
router.get('/students', authenticate, authorize(['admin', 'supadmin']), adminController.getStudentsList);
router.get('/student-directory-rich', authenticate, authorize(['admin', 'supadmin']), adminController.getRichStudentDirectory);
router.get('/faculty', authenticate, authorize(['admin', 'supadmin']), adminController.getFacultyList);
router.get('/courses', authenticate, authorize(['admin', 'supadmin']), adminController.getCoursesList);
router.get('/courses/:id', authenticate, authorize(['admin', 'supadmin']), adminController.getCourseDetails);
router.get('/student-risk/:id', authenticate, authorize(['admin', 'supadmin']), adminController.getStudentRiskReport);

// Metrics Breakdown
router.get('/metrics/attendance-breakdown', authenticate, authorize(['admin', 'supadmin']), adminController.getAttendanceBreakdown);
router.get('/metrics/performance-breakdown', authenticate, authorize(['admin', 'supadmin']), adminController.getPerformanceBreakdown);

// Enrollment Management
router.patch('/students/:id/enrollment', authenticate, authorize(['admin', 'supadmin']), adminController.updateStudentEnrollment);

module.exports = router;

