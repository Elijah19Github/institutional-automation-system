require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        console.log('🚀 Running Courses Refinement Migration...');
        await pool.query(`
            ALTER TABLE courses 
            ADD COLUMN IF NOT EXISTS description TEXT,
            ADD COLUMN IF NOT EXISTS course_code VARCHAR(50) UNIQUE;
        `);
        console.log('✅ Courses table refined with description and course_code.');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await pool.end();
    }
}

migrate();
