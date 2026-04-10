const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        console.log('Running Quiz & Risk Schema Migrations...');

        // 1. Quizzes table enhancements
        await pool.query(`
            ALTER TABLE quizzes 
            ADD COLUMN IF NOT EXISTS title VARCHAR(255),
            ADD COLUMN IF NOT EXISTS target_course_id UUID REFERENCES courses(id),
            ADD COLUMN IF NOT EXISTS target_batch_id UUID REFERENCES batch_years(id),
            ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP,
            ADD COLUMN IF NOT EXISTS time_limit_minutes INT DEFAULT 30,
            ADD COLUMN IF NOT EXISTS show_results BOOLEAN DEFAULT true;
        `);

        // 2. Anti-Cheat Tracking Logs
        await pool.query(`
            CREATE TABLE IF NOT EXISTS quiz_tracking_logs (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                quiz_id INTEGER, -- Need to check what type quiz id is
                student_id UUID REFERENCES students(id) ON DELETE CASCADE,
                event_type VARCHAR(50), -- 'FULLSCREEN_EXIT', 'FOCUS_LOST', 'SUBMITTED'
                event_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                details TEXT
            );
        `);

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

runMigration();
