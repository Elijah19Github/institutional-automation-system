const express = require("express");
const cors = require("cors");
const pool = require("./config/db"); // 🔥 IMPORT HERE
const path = require("path");





const app = express();

app.use(cors());
app.use(express.json());

//add here 
const usersRoutes = require("./routes/users.routes");
const authRoutes = require("./routes/auth.routes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const riskRoutes = require("./routes/risk.routes");
const notificationRoutes = require("./routes/notifications.routes");
const quizRoutes = require("./routes/quiz");
const coursesRoutes = require("./routes/courses.routes");
const contactRoutes = require("./routes/contact.routes");
const adminRoutes = require("./routes/admin.routes");
const adminControlRoutes = require("./routes/adminControlRoutes");
const academicSetupRoutes = require("./routes/academicSetupRoutes");
const facultyTokenRoutes = require("./routes/facultyTokenRoutes");
const marksRoutes = require("./routes/marksRoutes");
const studentDashboardRoutes = require("./routes/studentDashboard.routes");



app.get("/", (req, res) => {
  res.send("Backend is running");
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({
      status: "Database connected",
      time: result.rows[0],
    });
  } catch (error) {
    console.error("DB ERROR 👉", error);
    res.status(500).json({ error: error.message });
  }
});

//add here the use.
app.use("/api/users", usersRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminControlRoutes);
app.use("/api/academic-setup", academicSetupRoutes);
app.use("/api/faculty-tokens", facultyTokenRoutes);
app.use("/api/marks", marksRoutes);
app.use("/api/student-dashboard", studentDashboardRoutes);


// Static file hosting for PDF document uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


module.exports = app;
