const { pool } = require('./src/config/db');

async function migrate() {
    try {
        console.log("Connecting using pre-configured pool...");
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
        console.log("Tokens Table created successfully.");
    } catch(err) {
        console.error("Failed to create tokens table", err);
    } finally {
        pool.end();
    }
}
migrate();
