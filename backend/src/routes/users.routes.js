const express = require("express");
const router = express.Router();
const pool = require("../config/db");

const { authenticate, authorize } = require('../middleware/authMiddleware');

router.get("/", authenticate, authorize(['admin', 'supadmin']), async (req, res) => {
  try {
    const users = await pool.query("SELECT id, name, email, role FROM users");
    res.json(users.rows);
  } catch (error) {
    console.error("Users API error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/:id/profile", authenticate, async (req, res) => {
    try {
        const { id } = req.params;
        // Admins can view ANY profile. Users can only view their OWN profile.
        if (req.user.role !== 'admin' && req.user.role !== 'supadmin' && req.user.id !== id) {
             return res.status(403).json({ success: false, message: "Unauthorized profile access." });
        }

        const userRes = await pool.query("SELECT id, name, email, role, system_id FROM users WHERE id = $1", [id]);
        if (userRes.rows.length === 0) return res.status(404).json({ success: false, message: "User not found" });

        const userData = userRes.rows[0];

        if (userData.role === 'student') {
            const studentRes = await pool.query(`
                SELECT s.enrollment_number, s.phone_number, a.previous_degree, a.previous_cgpa, s.department
                FROM students s 
                LEFT JOIN applications a ON s.application_id = a.id
                WHERE s.user_id = $1
            `, [id]);
            userData.profile = studentRes.rows[0] || {};
        } else if (userData.role === 'faculty') {
            const facultyRes = await pool.query(`
                SELECT f.employee_id, f.phone_number, f.department, f.designation
                FROM faculty f
                WHERE f.user_id = $1
            `, [id]);
            userData.profile = facultyRes.rows[0] || {};
        }

        res.json({ success: true, data: userData });
    } catch (e) {
        console.error(e);
        res.status(500).json({ success: false, message: "Server error" });
    }
});

router.patch("/:id/profile", authenticate, authorize(['admin', 'supadmin']), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone_number, department, previous_degree, previous_cgpa, designation } = req.body;

        const userRes = await pool.query("SELECT role FROM users WHERE id = $1", [id]);
        if(userRes.rows.length === 0) return res.status(404).json({ success: false });

        const role = userRes.rows[0].role;
        
        await pool.query('BEGIN');

        // Update core user
        if (name || email) {
            await pool.query("UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email) WHERE id = $3", [name, email, id]);
        }

        // Update specific role tables
        if (role === 'student') {
            await pool.query("UPDATE students SET phone_number = COALESCE($1, phone_number), department = COALESCE($2, department) WHERE user_id = $3", [phone_number, department, id]);
            // Attempt to update application if it exists
            const appCheck = await pool.query("SELECT application_id FROM students WHERE user_id = $1", [id]);
            if (appCheck.rows.length > 0 && appCheck.rows[0].application_id) {
                await pool.query("UPDATE applications SET previous_degree = COALESCE($1, previous_degree), previous_cgpa = COALESCE($2, previous_cgpa) WHERE id = $3", [previous_degree, previous_cgpa, appCheck.rows[0].application_id]);
            }
        } else if (role === 'faculty') {
            await pool.query("UPDATE faculty SET phone_number = COALESCE($1, phone_number), department = COALESCE($2, department), designation = COALESCE($3, designation) WHERE user_id = $4", [phone_number, department, designation, id]);
        }

        await pool.query('COMMIT');
        res.json({ success: true, message: "Profile updated successfully."});
    } catch(e) {
        await pool.query('ROLLBACK');
        console.error(e);
        res.status(500).json({ success: false, message: "Failed to update profile."});
    }
});

module.exports = router;
