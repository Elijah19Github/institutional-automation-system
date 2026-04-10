require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
    try {
        console.log("Connecting to database...");
        await pool.connect();
        
        console.log("Creating faculty_registration_tokens table...");
        await pool.query(`
            CREATE TABLE IF NOT EXISTS faculty_registration_tokens (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                token VARCHAR(255) UNIQUE NOT NULL,
                expiry_date TIMESTAMP NOT NULL,
                is_used BOOLEAN DEFAULT FALSE,
                created_by UUID REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        console.log("Migration successful.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

migrate();
