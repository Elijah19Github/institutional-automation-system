require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function verify() {
    try {
        console.log('--- Database Verification ---');
        const tables = ['users', 'students', 'faculty', 'courses', 'attendance', 'marks', 'assignments', 'submissions'];
        for (const table of tables) {
            const res = await pool.query(`SELECT COUNT(*) FROM ${table}`);
            console.log(`${table.padEnd(15)}: ${res.rows[0].count}`);
        }
        
        console.log('\n--- Sample Metrics ---');
        const metricsRes = await pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM students) as students,
                (SELECT ROUND(AVG(score), 2) FROM marks) as avg_marks,
                (SELECT ROUND(COUNT(CASE WHEN status='present' THEN 1 END) * 100.0 / COUNT(*), 2) FROM attendance) as att_rate
        `);
        console.log(metricsRes.rows[0]);
        
    } catch (err) {
        console.error('Verification failed:', err.message);
    } finally {
        await pool.end();
    }
}

verify();
