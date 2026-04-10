const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// Initialize table on boot
const setupTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'Unread',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.error("Failed to create contact_messages schema:", err);
  }
};
setupTable();

// Receive contact form payloads
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required." });
    }

    // Insert into contact messages
    const newContact = await pool.query(
      `INSERT INTO contact_messages (name, email, subject, message) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, email, subject || 'No Subject', message]
    );

    // Blast notification to the Admin Panel
    await pool.query(
      `INSERT INTO notifications (user_id, message, risk_level, type)
       VALUES (1, $1, 'Low', 'Contact')
       ON CONFLICT DO NOTHING`,
      [`New Contact Form Subject: ${subject || 'Inquiry'} from ${name}`]
    ).catch(async () => {
      // Fallback if existing notifications table doesn't have strict user_id mapping
      try {
        await pool.query(
          `INSERT INTO notifications (message, risk_level) VALUES ($1, 'Low')`,
          [`New Contact Subject: ${subject || 'Inquiry'} from ${name}`]
        );
      } catch (fallbackErr) {
        console.error("Notification emission failed:", fallbackErr);
      }
    });

    res.status(201).json({ success: true, message: "Your message has been sent successfully." });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to process contact submission." });
  }
});

// Fetch contact messages (For Admin End Use)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM contact_messages ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

module.exports = router;
