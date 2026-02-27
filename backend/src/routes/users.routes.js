const express = require("express");
const router = express.Router();
const pool = require("../config/db");

router.get("/", async (req, res) => {
  try {
    const users = await pool.query("SELECT id, name, email, role FROM users");
    res.json(users.rows);
  } catch (error) {
    console.error("Users API error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

module.exports = router;
