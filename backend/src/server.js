require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const admissionsRoutes = require('./routes/admissionsRoutes');
const academicRoutes = require('./routes/academicRoutes');
const aiRiskRoutes = require('./routes/aiRiskRoutes');
const academicSetupRoutes = require('./routes/academicSetupRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admissions', admissionsRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/ai-risk', aiRiskRoutes);
app.use('/api/academic-setup', academicSetupRoutes);
app.use('/api/attendance', attendanceRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Smart Campus OS API running securely' });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));
