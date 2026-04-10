const { pool } = require('./src/config/db');

async function migrate() {
    try {
        await pool.query('ALTER TABLE applications ADD COLUMN IF NOT EXISTS course_interested VARCHAR(255)');
        console.log('Migration successful: Added course_interested to applications.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
