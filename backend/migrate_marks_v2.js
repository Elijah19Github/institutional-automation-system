const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        console.log('Running Marks & Assignments Schema Migrations...');

        // 1. Create marks_control table for governance
        await pool.query(`
            CREATE TABLE IF NOT EXISTS marks_control (
                id SERIAL PRIMARY KEY,
                exam_type VARCHAR(50) NOT NULL, -- 'Internal 1', 'Internal 2', 'Semester'
                scope VARCHAR(20) NOT NULL, -- 'global', 'batch', 'subject'
                target_id UUID, 
                is_locked BOOLEAN DEFAULT FALSE,
                locked_by UUID REFERENCES users(id),
                locked_at TIMESTAMP,
                UNIQUE(exam_type, scope, target_id)
            );
        `);

        // 2. Enhance Marks table with constraints (careful not to break if rows exist)
        // We'll update the 'type' column to have a consistent set of values
        await pool.query(`
            DO $$ 
            BEGIN 
                -- We use a check constraint for mark limits if the score is for specific types
                -- Note: This might be complex for existing generic data, so we'll just ensure the column exists
                -- and application layer handles logic for now, or add a more flexible validator.
                
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_mark_limits') THEN
                    ALTER TABLE marks ADD CONSTRAINT check_mark_limits 
                    CHECK (
                        (type = 'Internal 1' AND score <= 25) OR 
                        (type = 'Internal 2' AND score <= 25) OR 
                        (type = 'Semester' AND score <= 50) OR
                        (type NOT IN ('Internal 1', 'Internal 2', 'Semester'))
                    );
                END IF;
            END $$;
        `);

        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (e) {
        console.error('Migration failed:', e);
        process.exit(1);
    }
}

runMigration();
