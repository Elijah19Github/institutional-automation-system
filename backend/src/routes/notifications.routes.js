const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Fetch notifications for a user
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT message, risk_level, created_at
       FROM notifications
       ORDER BY created_at DESC`
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

module.exports = router;
