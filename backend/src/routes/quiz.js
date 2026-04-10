const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const { pool } = require('../config/db');
const { authenticate } = require('../middleware/authMiddleware');

const upload = multer();

// ─────────────────────────────────────────────────────────────────────────────
// 🤖 AI PROXY ENDPOINTS (Faculty Only)
// ─────────────────────────────────────────────────────────────────────────────

router.post('/generate', authenticate, upload.any(), async (req, res) => {
    if (req.user.role === 'STUDENT') return res.status(403).json({ error: 'Access denied' });
    try {
        // Map any uploaded files
        const pdfFile = req.files?.find(f => f.fieldname === 'pdf');
        
        const { course_name, subject, topic, difficulty, num_questions, content } = req.body;
        console.log('Quiz Gen Body:', req.body);
        
        // Validation with friendlier error
        const missing = [];
        if (!course_name) missing.push('course_name');
        if (!subject) missing.push('subject');
        if (!topic) missing.push('topic');
        if (!difficulty) missing.push('difficulty');
        if (!num_questions) missing.push('num_questions');

        if (missing.length > 0) {
            return res.status(400).json({ 
                error: `Missing required fields: ${missing.join(', ')}`,
                details: 'The AI generator needs these fields to create accurate questions.',
                received: req.body
            });
        }

        const formData = new FormData();
        const fields = { course_name, subject, topic, difficulty, num_questions, content: content || '' };
        
        for (const [key, value] of Object.entries(fields)) {
            formData.append(key, value);
        }

        if (pdfFile) {
            formData.append('pdf', pdfFile.buffer, { filename: pdfFile.originalname, contentType: pdfFile.mimetype });
        }

        const response = await axios.post('http://127.0.0.1:8001/api/quiz/generate', formData, {
            headers: { ...formData.getHeaders() },
            timeout: 60000 // 60s timeout
        });
        res.json(response.data);
    } catch (error) {
        console.error('Quiz Proxy Failure:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({ 
            error: 'AI service connection failed', 
            details: error.response?.data || error.message 
        });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// 👨‍🏫 FACULTY QUIZ MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

// Get all quizzes (Faculty View with Stats)
router.get('/', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT q.*, 
                    s.name as subject_name,
                    COUNT(qa.id) as attempt_count,
                    AVG(qa.score) as avg_score
             FROM quizzes q
             LEFT JOIN subjects s ON q.subject_id = s.id
             LEFT JOIN quiz_attempts qa ON q.id = qa.quiz_id AND qa.status = 'SUBMITTED'
             WHERE q.created_by = $1 OR $2 = 'ADMIN'
             GROUP BY q.id, s.name
             ORDER BY q.created_at DESC`,
            [req.user.id, req.user.role]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching quizzes:', error);
        res.status(500).json({ error: 'Failed to fetch quizzes' });
    }
});

// Helper to convert empty strings to null for database compatibility (UUID, DATE, etc)
const toNull = (val) => (val && val !== "" && val !== "undefined" && val !== "null") ? val : null;

// Save/Create Quiz
router.post('/save', authenticate, async (req, res) => {
    const client = await pool.connect();
    try {
        let { 
            title, description, subject_id, section_id, batch_id, 
            questions, duration_minutes, total_marks, difficulty, 
            attempt_type, start_at, end_at, is_published 
        } = req.body;

        await client.query('BEGIN');

        // 1. Sanitize UUIDs and Dates (convert "" to null)
        subject_id = toNull(subject_id);
        section_id = toNull(section_id);
        batch_id = toNull(batch_id);
        start_at = toNull(start_at);
        end_at = toNull(end_at);

        // 2. Validation logic
        if (!title || title.length < 3) throw new Error('Quiz Title must be at least 3 characters.');
        if (!subject_id) throw new Error('Target Subject is required.');
        if (!questions || !Array.isArray(questions) || questions.length === 0) throw new Error('At least one question is required.');
        
        // Only validate times if both are provided
        if (start_at && end_at && new Date(start_at) >= new Date(end_at)) {
            throw new Error('Start time must be before end time.');
        }

        // 3. Sanitize questions
        const sanitizedQuestions = questions.map((q, idx) => {
            if (!q.question || !q.option_a || !q.option_b || !q.option_c || !q.option_d || !q.correct_answer) {
                throw new Error(`Question ${idx + 1} is incomplete.`);
            }
            return q;
        });

        const quizResult = await client.query(
            `INSERT INTO quizzes (
                title, description, subject_id, section_id, batch_id, 
                questions, duration_minutes, total_marks, difficulty, 
                attempt_type, start_at, end_at, is_published, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id`,
            [
                title, description, subject_id, section_id, batch_id, 
                JSON.stringify(sanitizedQuestions), 
                parseInt(duration_minutes) || 30, 
                parseInt(total_marks) || 100, 
                difficulty, 
                attempt_type, start_at, end_at, is_published, req.user.id
            ]
        );

        await client.query('COMMIT');
        res.json({ success: true, quiz_id: quizResult.rows[0].id });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving quiz:', error.message);
        res.status(400).json({ 
            success: false,
            error: error.message || 'Failed to save quiz',
            details: error.code === '23503' ? 'Invalid Subject, Section or Batch selection.' : error.message
        });
    } finally {
        client.release();
    }
});

// Get detailed results for a quiz
router.get('/:id/results', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT qa.*, u.name as student_name, s.regno, s.usn
             FROM quiz_attempts qa
             JOIN students s ON qa.student_id = s.id
             JOIN users u ON s.user_id = u.id
             WHERE qa.quiz_id = $1 AND qa.status = 'SUBMITTED'
             ORDER BY qa.submitted_at DESC`,
            [id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching quiz results:', error);
        res.status(500).json({ error: 'Failed to fetch results' });
    }
});

// Delete Quiz
router.delete('/:id', authenticate, async (req, res) => {
    try {
        await pool.query('DELETE FROM quizzes WHERE id = $1 AND (created_by = $2 OR $3 = "ADMIN")', [req.params.id, req.user.id, req.user.role]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete quiz' });
    }
});

// ─────────────────────────────────────────────────────────────────────────────
// 🎓 STUDENT QUIZ SYSTEM
// ─────────────────────────────────────────────────────────────────────────────

// Student Dashboard: Available, Ongoing, Completed
router.get('/student/dashboard', authenticate, async (req, res) => {
    try {
        const studentRes = await pool.query('SELECT id, current_section_id, batch_id, course_id, current_semester_id FROM students WHERE user_id = $1', [req.user.id]);
        
        if (studentRes.rows.length === 0) {
            // Return empty data instead of 403 to keep UI alive
            return res.json({ 
                success: true, 
                data: { available: [], ongoing: null, completed: [], is_profile_incomplete: true } 
            });
        }
        const student = studentRes.rows[0];

        // Available Quizzes: Published, targeted to student's section/batch, or matching student's course/semester via subject
        const available = await pool.query(
            `SELECT q.id, q.title, q.description, q.duration_minutes, q.total_marks, q.start_at, q.end_at, q.difficulty,
                    (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id = q.id AND student_id = $1::UUID) as attempt_count
             FROM quizzes q
             LEFT JOIN subjects s ON q.subject_id = s.id
             WHERE q.is_published = true
               AND (q.section_id IS NULL OR q.section_id = $2::UUID)
               AND (q.batch_id IS NULL OR q.batch_id = $3::UUID)
               AND (s.id IS NOT NULL AND (s.course_id IS NULL OR s.course_id = $4::UUID))
               AND (s.id IS NOT NULL AND (s.semester_id IS NULL OR s.semester_id = $5::UUID))
               AND (q.start_at IS NULL OR q.start_at <= NOW())
               AND (q.end_at IS NULL OR q.end_at >= NOW())
               AND NOT EXISTS (
                   SELECT 1 FROM quiz_attempts qa 
                   WHERE qa.quiz_id = q.id AND qa.student_id = $1::UUID AND (qa.status = 'SUBMITTED' AND q.attempt_type = 'Single')
               )`,
            [
                student.id || null, 
                student.current_section_id || null, 
                student.batch_id || null, 
                student.course_id || null, 
                student.current_semester_id || null
            ]
        );

        // Ongoing attempt
        const ongoing = await pool.query(
            `SELECT q.id, q.title, qa.started_at, q.duration_minutes
             FROM quiz_attempts qa
             JOIN quizzes q ON qa.quiz_id = q.id
             WHERE qa.student_id = $1 AND qa.status = 'IN_PROGRESS'`,
            [student.id]
        );

        // Completed
        const completed = await pool.query(
            `SELECT q.title, qa.score, qa.total_marks, qa.submitted_at, q.id as quiz_id
             FROM quiz_attempts qa
             JOIN quizzes q ON qa.quiz_id = q.id
             WHERE qa.student_id = $1 AND qa.status = 'SUBMITTED'
             ORDER BY qa.submitted_at DESC`,
            [student.id]
        );

        res.json({ success: true, data: { available: available.rows, ongoing: ongoing.rows[0], completed: completed.rows } });
    } catch (error) {
        console.error('Error fetching student quiz dashboard:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard' });
    }
});

// Start a quiz attempt
router.post('/:id/start', authenticate, async (req, res) => {
    try {
        const studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
        const studentId = studentRes.rows[0].id;
        const quizId = req.params.id;

        // Check if Single Attempt and already done
        const quiz = await pool.query('SELECT attempt_type, is_published FROM quizzes WHERE id = $1', [quizId]);
        if (!quiz.rows[0].is_published) return res.status(403).json({ error: 'Quiz is not published' });

        if (quiz.rows[0].attempt_type === 'Single') {
            const existing = await pool.query('SELECT 1 FROM quiz_attempts WHERE quiz_id = $1 AND student_id = $2 AND status = "SUBMITTED"', [quizId, studentId]);
            if (existing.rows.length > 0) return res.status(403).json({ error: 'Multiple attempts not allowed' });
        }

        // Check if there's already an active attempt
        const active = await pool.query('SELECT id FROM quiz_attempts WHERE quiz_id = $1 AND student_id = $2 AND status = "IN_PROGRESS"', [quizId, studentId]);
        if (active.rows.length > 0) return res.json({ success: true, attempt_id: active.rows[0].id });

        const result = await pool.query(
            'INSERT INTO quiz_attempts (quiz_id, student_id, status) VALUES ($1, $2, "IN_PROGRESS") RETURNING id',
            [quizId, studentId]
        );
        res.json({ success: true, attempt_id: result.rows[0].id });
    } catch (error) {
        console.error('Error starting quiz:', error);
        res.status(500).json({ error: 'Failed to start quiz' });
    }
});

// Get quiz questions (for attempt)
router.get('/:id/attempt-data', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, title, questions, duration_minutes, total_marks FROM quizzes WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Quiz not found' });
        
        // Remove 'correct_answer' and 'explanation' from questions before sending to student
        const quiz = result.rows[0];
        quiz.questions = quiz.questions.map(q => {
            const { correct_answer, explanation, ...safeQ } = q;
            return safeQ;
        });

        res.json({ success: true, data: quiz });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch quiz data' });
    }
});

// Submit Quiz
router.post('/:id/submit', authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        const { answers } = req.body;
        const studentRes = await pool.query('SELECT id FROM students WHERE user_id = $1', [req.user.id]);
        const studentId = studentRes.rows[0].id;

        const quizRes = await pool.query('SELECT questions, total_marks, subject_id FROM quizzes WHERE id = $1', [id]);
        const quiz = quizRes.rows[0];
        const questions = quiz.questions;

        let correctCount = 0;
        questions.forEach((q, idx) => {
            if (answers[idx] && answers[idx].toLowerCase() === q.correct_answer.toLowerCase()) {
                correctCount++;
            }
        });

        const score = (correctCount / questions.length) * quiz.total_marks;

        await pool.query(
            `UPDATE quiz_attempts 
             SET score = $1, total_marks = $2, answers = $3, status = 'SUBMITTED', submitted_at = NOW()
             WHERE quiz_id = $4 AND student_id = $5 AND status = 'IN_PROGRESS'`,
            [score, quiz.total_marks, JSON.stringify(answers), id, studentId]
        );

        // Automatically record to marks table as 'Quiz' type
        await pool.query(
            `INSERT INTO marks (student_id, subject_id, score, max_score, type)
             VALUES ($1, $2, $3, $4, 'Quiz')
             ON CONFLICT (student_id, subject_id, type) 
             DO UPDATE SET score = EXCLUDED.score, created_at = NOW()`,
            [studentId, quiz.subject_id, score, quiz.total_marks]
        );

        res.json({ success: true, score, total_marks: quiz.total_marks });
    } catch (error) {
        console.error('Error submitting quiz:', error);
        res.status(500).json({ error: 'Failed to submit quiz' });
    }
});

module.exports = router;