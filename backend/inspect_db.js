require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function inspect() {
    try {
        const result = await pool.query(`
            SELECT pg_get_constraintdef(oid) as cdef FROM pg_constraint WHERE conname = 'users_role_check';
        `);
        console.log(result.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

inspect();
