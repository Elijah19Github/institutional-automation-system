require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        console.log('--- Current Users ---');
        const res = await pool.query("SELECT id, email, name, role FROM users");
        console.table(res.rows);
        
        console.log('\n--- Admin-specific check ---');
        const adminRes = await pool.query("SELECT * FROM users WHERE role IN ('ADMIN', 'SUPADMIN')");
        console.table(adminRes.rows);
    } catch (err) {
        console.error('Inspection failed:', err.message);
    } finally {
        await pool.end();
    }
}

check();
