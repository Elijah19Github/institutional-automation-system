require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'src', 'config', 'interactive_migration.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('🚀 Running interactive dashboard migration...');
        await pool.query(sql);
        console.log('✅ Migration completed successfully!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await pool.end();
    }
}

runMigration();
