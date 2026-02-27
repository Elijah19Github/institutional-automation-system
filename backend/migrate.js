require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Supabase
});

async function migrate() {
    try {
        console.log('Connecting to database...');
        const schemaPath = path.join(__dirname, 'src', 'config', 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        console.log('Executing schema...');
        await pool.query(schemaSql);

        // Let's create a default admin user for testing
        const bcrypt = require('bcryptjs');
        const hash = await bcrypt.hash('admin123', 10);

        console.log('Creating default admin user (admin@campus.edu / admin123)...');

        // Check if admin exists
        const adminCheck = await pool.query("SELECT id FROM users WHERE email = 'admin@campus.edu'");
        if (adminCheck.rows.length === 0) {
            // Using 'password' instead of 'password_hash' due to the pre-existing structure
            // Using 'ADMIN' instead of 'admin' due to existing check constraint on users.role
            await pool.query(
                "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'ADMIN')",
                ['System Admin', 'admin@campus.edu', hash]
            );
            console.log('Default admin created.');
        } else {
            console.log('Admin already exists. We will forcibly update the password to admin123 for testing.');
            await pool.query(
                "UPDATE users SET password = $1 WHERE email = 'admin@campus.edu'",
                [hash]
            );
        }

        console.log('Migration successful!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate();
