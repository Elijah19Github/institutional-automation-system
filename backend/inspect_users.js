require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function inspect() {
    try {
        const data = await pool.query(`SELECT id, email, role FROM users LIMIT 10`);
        console.log("ALL EXISTING USERS:");
        console.table(data.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

inspect();
