require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function diagnostic() {
    try {
        console.log('--- Database Diagnostic ---');
        
        // 1. Table Counts
        const tables = [
            'users', 'students', 'courses', 'subjects', 
            'attendance_records', 'attendance_sessions', 'marks'
        ];
        
        for (const table of tables) {
            try {
                const res = await pool.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`${table}: ${res.rows[0].count} records`);
            } catch (err) {
                console.log(`${table}: Error fetching count - ${err.message}`);
            }
        }

        // 2. Check Department Performance Data
        console.log('\n--- Department Performance (Query Test) ---');
        const deptRes = await pool.query(`
            SELECT 
                c.course_name as department, 
                COUNT(m.id) as marks_count,
                AVG(m.score) as avg_score 
            FROM marks m 
            JOIN subjects s ON m.subject_id = s.id
            JOIN courses c ON s.course_id = c.id 
            GROUP BY c.course_name
        `);
        console.log('Results:', deptRes.rows);

        // 3. Check Attendance Trends Data
        console.log('\n--- Attendance Trends (Query Test) ---');
        const trendsRes = await pool.query(`
            SELECT 
                asess.session_date,
                COUNT(ar.id) as records_count
            FROM attendance_records ar
            JOIN attendance_sessions asess ON ar.session_id = asess.id
            GROUP BY asess.session_date
            ORDER BY asess.session_date DESC
            LIMIT 10
        `);
        console.log('Results:', trendsRes.rows);

    } catch (err) {
        console.error('Diagnostic error:', err);
    } finally {
        await pool.end();
    }
}

diagnostic();
