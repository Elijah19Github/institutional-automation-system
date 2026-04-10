require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function migrate() {
    try {
        console.log("Connecting to database...");
        await pool.connect();
        
        console.log("Adding profile_pic_url to faculty table...");
        await pool.query(`
            ALTER TABLE faculty 
            ADD COLUMN IF NOT EXISTS profile_pic_url TEXT,
            ADD COLUMN IF NOT EXISTS designation VARCHAR(150);
        `);

        console.log("Migration successful.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        await pool.end();
    }
}

migrate();
