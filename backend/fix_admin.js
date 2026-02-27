require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/db');

async function run() {
    try {
        console.log("Checking DB...");
        const res = await pool.query('SELECT id, email, is_active FROM users WHERE email = $1', ['admin@college.com']);
        console.log("Found:", res.rows);
        if (res.rows.length > 0) {
            const hash = await bcrypt.hash('admin123', 10);
            await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hash, 'admin@college.com']);
            console.log("Password updated for admin@college.com");
        } else {
            // Reinsert the admin if it was deleted
            const hash = await bcrypt.hash('admin123', 10);
            await pool.query(
                "INSERT INTO users (id, email, password, name, role, is_active) VALUES ('gen_uuid_here', 'admin@college.com', $1, 'System Admin', 'ADMIN', true)",
                [hash]
            );
            console.log("Admin inserted since it was missing.");
        }
    } catch (e) {
        console.error("DB Error:", e);
    } finally {
        await pool.end(); // close connection!
        process.exit(0);
    }
}

run();
