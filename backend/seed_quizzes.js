const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function seedQuizzes() {
    const client = await pool.connect();
    try {
        console.log('Seeding sample quizzes into the library...');
        
        // 1. Get an admin or faculty user to be the creator
        const userRes = await pool.query("SELECT id FROM users WHERE role IN ('ADMIN', 'FACULTY') LIMIT 1");
        if (userRes.rows.length === 0) {
            console.log('No admin/faculty user found to assign as creator.');
            return;
        }
        const creatorId = userRes.rows[0].id;

        await client.query('BEGIN');

        // Quiz 1: Operating Systems
        const quiz1 = await client.query(`
            INSERT INTO quizzes (title, course_name, subject, topic, difficulty, created_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, ['OS Architecture Fundamentals', 'Computer Science', 'Operating Systems', 'Kernel & Shell', 'Medium', creatorId]);
        
        const qid1 = quiz1.rows[0].id;
        const questions1 = [
            { question: 'What is the main function of the operating system kernel?', a: 'User interface', b: 'Resource management', c: 'Compiling code', d: 'Graphics rendering', correct: 'b' },
            { question: 'Which of the following is NOT a type of kernel?', a: 'Monolithic', b: 'Microkernel', c: 'Exokernel', d: 'Polykernel', correct: 'd' },
            { question: 'What is a system call?', a: 'A function call in a user program', b: 'An interface between a process and the OS', c: 'A hardware interrupt', d: 'A type of signal', correct: 'b' }
        ];

        for (const q of questions1) {
            await client.query(`
                INSERT INTO questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [qid1, q.question, q.a, q.b, q.c, q.d, q.correct]);
        }

        // Quiz 2: Professional Ethics
        const quiz2 = await client.query(`
            INSERT INTO quizzes (title, course_name, subject, topic, difficulty, created_by)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `, ['Ethics in AI & Computing', 'Computer Science', 'Universal Human Values', 'AI Ethics', 'Easy', creatorId]);
        
        const qid2 = quiz2.rows[0].id;
        const questions2 = [
            { question: 'Which principle ensures AI systems are fair and unbiased?', a: 'Transparency', b: 'Equity', c: 'Efficiency', d: 'Privacy', correct: 'b' },
            { question: 'What is "Algorithmic Bias"?', a: 'Faster processing', b: 'Systematic errors in computer systems that create unfair outcomes', c: 'A type of sorting algorithm', d: 'Natural language processing', correct: 'b' }
        ];

        for (const q of questions2) {
            await client.query(`
                INSERT INTO questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_answer)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [qid2, q.question, q.a, q.b, q.c, q.d, q.correct]);
        }

        await client.query('COMMIT');
        console.log('Successfully seeded 2 sample quizzes.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Seeding failed:', e);
    } finally {
        client.release();
        process.exit();
    }
}

seedQuizzes();
