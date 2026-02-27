const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Mark attendance
router.post("/", async (req, res) => {
  const { student_id, course_id, attendance_date, status } = req.body;

  try {
    await pool.query(
      `INSERT INTO attendance 
       (student_id, course_id, attendance_date, status)
       VALUES ($1, $2, $3, $4)`,
      [student_id, course_id, attendance_date, status]
    );

    res.json({ message: "Attendance marked successfully" });
  } catch (err) {
    console.error("ATTENDANCE ERROR 👉", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get attendance records
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.attendance_date, a.status, u.name AS student
       FROM attendance a
       JOIN users u ON a.student_id = u.id
       ORDER BY a.attendance_date DESC`
    );

    res.json(result.rows);
  } catch (err) {
    console.error("FETCH ERROR 👉", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
