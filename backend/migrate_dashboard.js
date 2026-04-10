require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    try {
        console.log('🚀 Starting Admin Dashboard Migration...');
        const sqlPath = path.join(__dirname, 'src', 'config', 'dashboard_migration.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📦 Executing SQL schema...');
        await pool.query(sql);

        console.log('✅ Admin Dashboard Migration successful!');
    } catch (err) {
        console.error('❌ Migration failed:', err.message);
    } finally {
        await pool.end();
    }
}

migrate();
