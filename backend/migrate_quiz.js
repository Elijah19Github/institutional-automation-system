require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Supabase
});

async function migrate_quiz() {
    try {
        console.log('Connecting to database...');

        const quizSchemaSql = `
        CREATE TABLE IF NOT EXISTS quizzes (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            course_name VARCHAR(255) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            topic VARCHAR(255) NOT NULL,
            difficulty VARCHAR(50) NOT NULL,
            created_by UUID REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS questions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
            question TEXT NOT NULL,
            option_a TEXT NOT NULL,
            option_b TEXT NOT NULL,
            option_c TEXT NOT NULL,
            option_d TEXT NOT NULL,
            correct_answer VARCHAR(10) NOT NULL,
            explanation TEXT
        );
        `;

        console.log('Executing quiz schema...');
        await pool.query(quizSchemaSql);

        console.log('Quiz Migration successful!');
    } catch (err) {
        console.error('Quiz Migration failed:', err);
    } finally {
        await pool.end();
    }
}

migrate_quiz();
