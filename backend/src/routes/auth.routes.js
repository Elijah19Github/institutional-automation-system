const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const pool = require("../config/db");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0)
      return res.status(401).json({ message: "User not found" });

    const user = result.rows[0];
    const isMatch = bcrypt.compareSync(password, user.password);

    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      role: user.role,
      name: user.name,
      id: user.id
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  try {
    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ message: "User with this email does not exist." });
    }
    
    const token = crypto.randomBytes(32).toString("hex");
    
    await pool.query(
      "INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '1 hour')",
      [userRes.rows[0].id, token]
    );

    res.json({
      success: true,
      message: "Reset link generated successfully. (Developer Mode)",
      resetLink: `http://localhost:5173/reset-password/${token}`
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const resetRecord = await pool.query(
      "SELECT * FROM password_resets WHERE token = $1 AND expires_at > NOW()",
      [token]
    );
    
    if (resetRecord.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired reset token." });
    }
    
    const userId = resetRecord.rows[0].user_id;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await pool.query("UPDATE users SET password = $1 WHERE id = $2", [hashedPassword, userId]);
    await pool.query("DELETE FROM password_resets WHERE user_id = $1", [userId]);
    
    res.json({ success: true, message: "Password updated successfully!" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
