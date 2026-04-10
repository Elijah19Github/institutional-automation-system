require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const admissionsRoutes = require('./routes/admissionsRoutes');
const academicRoutes = require('./routes/academicRoutes');
const aiRiskRoutes = require('./routes/aiRiskRoutes');
const academicSetupRoutes = require('./routes/academicSetupRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const quizRoutes = require('./routes/quiz');
const coursesRoutes = require('./routes/courses.routes');
const contactRoutes = require('./routes/contact.routes');
const adminRoutes = require('./routes/admin.routes');
const adminControlRoutes = require('./routes/adminControlRoutes');
const marksRoutes = require('./routes/marksRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');

const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admissions', admissionsRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/ai-risk', aiRiskRoutes);
app.use('/api/academic-setup', academicSetupRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/admin', adminControlRoutes);
app.use('/api/marks', marksRoutes);


// Static file hosting for PDF document uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Smart Campus OS API running securely' });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
