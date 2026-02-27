require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runWipeAndMigrate() {
    try {
        console.log('Connecting to database...');
        const schemaPath = path.join(__dirname, 'src', 'config', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing completely new ERP schema (dropping old tables)...');
        await pool.query(schemaSql);

        console.log('Migration to Institutional ERP Schema successful! 🎉');
        console.log('Test Admin: admin@college.com / admin123');

    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await pool.end();
    }
}

runWipeAndMigrate();
