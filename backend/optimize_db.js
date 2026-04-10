const pool = require('./src/config/db');

async function optimizeDatabase() {
    console.log('🚀 Starting Database Optimization & Indexing...');
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // 1. Clean up dangling data
        console.log('🧹 Cleaning up orphan data...');
        await client.query(`
            DELETE FROM attendance_records 
            WHERE session_id NOT IN (SELECT id FROM attendance_sessions);
        `);
        await client.query(`
            DELETE FROM marks 
            WHERE student_id NOT IN (SELECT id FROM students);
        `);

        // 2. Add System Indexes for drastic performance boots
        console.log('⚡ Constructing performance indices...');
        
        // Fast Quiz Log Lookup
        await client.query(`CREATE INDEX IF NOT EXISTS idx_tracking_quiz_id ON quiz_tracking_logs(quiz_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_tracking_student_id ON quiz_tracking_logs(student_id);`);
        
        // Fast Attendance Lookup
        await client.query(`CREATE INDEX IF NOT EXISTS idx_attd_student_id ON attendance_records(student_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_attd_session_id ON attendance_records(session_id);`);
        
        // Fast Student Analytics Lookup
        await client.query(`CREATE INDEX IF NOT EXISTS idx_marks_student_id ON marks(student_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_marks_subject_id ON marks(subject_id);`);
        
        // User Login Lookup
        await client.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);`);

        // Vacuum Analyze (Postgres specific maintenance, generally requires being out of transaction block, so we will commit first)
        await client.query('COMMIT');
        
        console.log('🌀 Running VACUUM ANALYZE to optimize query planner statistics...');
        await client.query('VACUUM ANALYZE;');

        console.log('✅ Optimization Complete. The Institutional Automation System is running at max performance!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Database Optimization Failed:', error);
    } finally {
        client.release();
        process.exit();
    }
}

optimizeDatabase();
