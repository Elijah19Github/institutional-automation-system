require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function inspect() {
    try {
        console.log('--- TABLES ---');
        const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log(tables.rows.map(t => t.table_name));

        console.log('\n--- QUIZZES COLUMNS ---');
        const qCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'quizzes'");
        console.log(qCols.rows);

        console.log('\n--- QUESTIONS COLUMNS ---');
        const quesCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'questions'");
        console.log(quesCols.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

inspect();
