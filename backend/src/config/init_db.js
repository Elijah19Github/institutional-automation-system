require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function init() {
    try {
        console.log('🚀 Initializing Database Schema...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Split by semicolons, but be careful with multi-line statements like DO blocks
        // Actually, for a clean script, we can just run the whole blob
        await pool.query(schemaSql);
        
        console.log('✅ Schema executed successfully.');
    } catch (err) {
        console.error('❌ Schema initialization failed:', err.message);
    } finally {
        await pool.end();
    }
}

init();
