require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        console.log('🚀 Creating attendance_control table...');
        
        await pool.query(`
            CREATE TABLE IF NOT EXISTS attendance_control (
                id SERIAL PRIMARY KEY,
                scope VARCHAR(20) NOT NULL CHECK (scope IN ('global', 'course', 'subject')),
                target_id INTEGER, 
                is_locked BOOLEAN DEFAULT FALSE,
                locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                locked_by UUID REFERENCES users(id),
                UNIQUE(scope, target_id)
            );
        `);

        // Seed global record if not exists
        await pool.query(`
            INSERT INTO attendance_control (scope, target_id, is_locked)
            VALUES ('global', NULL, FALSE)
            ON CONFLICT (scope, target_id) DO NOTHING;
        `);

        console.log('✅ Migration successful!');
    } catch (err) {
        console.error('❌ Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
