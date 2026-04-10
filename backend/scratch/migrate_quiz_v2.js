require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        console.log('--- Migrating Quizzes Table ---');
        // Add new columns to quizzes if they don't exist
        await client.query(`
            ALTER TABLE quizzes 
            ADD COLUMN IF NOT EXISTS description TEXT,
            ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
            ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES batch_years(id) ON DELETE SET NULL,
            ADD COLUMN IF NOT EXISTS total_marks INT DEFAULT 100,
            ADD COLUMN IF NOT EXISTS attempt_type VARCHAR(20) DEFAULT 'Single',
            ADD COLUMN IF NOT EXISTS start_at TIMESTAMP,
            ADD COLUMN IF NOT EXISTS end_at TIMESTAMP;
        `);

        // Check columns to adjust defaults/types if needed
        await client.query(`
            ALTER TABLE quizzes 
            ALTER COLUMN difficulty SET DEFAULT 'Medium';
        `);

        console.log('--- Creating Quiz Attempts Table ---');
        await client.query(`
            CREATE TABLE IF NOT EXISTS quiz_attempts (
                id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                quiz_id      UUID REFERENCES quizzes(id) ON DELETE CASCADE,
                student_id   UUID REFERENCES students(id) ON DELETE CASCADE,
                score        NUMERIC(6,2),
                total_marks  NUMERIC(6,2),
                answers      JSONB NOT NULL DEFAULT '{}',
                started_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                submitted_at TIMESTAMP,
                status       VARCHAR(20) DEFAULT 'IN_PROGRESS'
            );
        `);

        // Add a partial unique index to allow multiple attempts if one is not in progress
        // But the requirement says "Single Attempt" vs "Multiple Attempts".
        // For now, let's just ensure we can track them.
        console.log('--- Adding Constraints ---');
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_unique_active_attempt') THEN
                    CREATE UNIQUE INDEX idx_unique_active_attempt ON quiz_attempts (quiz_id, student_id) WHERE (status = 'IN_PROGRESS');
                END IF;
            END $$;
        `);

        await client.query('COMMIT');
        console.log('✅ Migration complete!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
