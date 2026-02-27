const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.post("/calculate", async (req, res) => {
  const { student_id } = req.body;

  try {
    // Calculate attendance percentage
    const attendanceRes = await pool.query(
      `SELECT 
         COALESCE(
           COUNT(*) FILTER (WHERE status = true)::float / 
           NULLIF(COUNT(*), 0) * 100, 
           0
         ) AS attendance_percentage
       FROM attendance
       WHERE student_id = $1`,
      [student_id]
    );

    const attendance = Number(attendanceRes.rows[0].attendance_percentage || 0);

    // Calculate average marks
    const marksRes = await pool.query(
      `SELECT COALESCE(AVG(marks), 0) AS avg_marks
       FROM assessments
       WHERE student_id = $1`,
      [student_id]
    );

    const avgMarks = Number(marksRes.rows[0].avg_marks || 0);

    // Risk logic
    let risk = "LOW";

    if (attendance < 60 && avgMarks < 40) risk = "HIGH";
    else if (attendance < 75 || avgMarks < 50) risk = "MEDIUM";

    // Auto-generate notification for MEDIUM / HIGH risk 🔔 DEBUG + Notification trigger
    if (risk !== "LOW") {
      console.log("Creating notification for", student_id, "with risk", risk);
        await pool.query(
            `INSERT INTO notifications (user_id, message, risk_level)
            VALUES ($1, $2, $3)`,
            [
            student_id,
            `Academic Risk Alert: ${risk} risk detected. Immediate attention required.`,
            risk
            ]
        );
    }


    // Store result
    await pool.query(
      `INSERT INTO academic_risk 
       (student_id, attendance_percentage, average_marks, risk_level)
       VALUES ($1, $2, $3, $4)`,
      [student_id, attendance, avgMarks, risk]
    );

    res.json({
      student_id,
      attendance: attendance.toFixed(2),
      avgMarks: avgMarks.toFixed(2),
      risk
    });

  } catch (err) {
    console.error("RISK ERROR 👉", err.message);
    console.error(err);
    res.status(500).json({ error: "Risk calculation failed" });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
