const { pool } = require('./src/config/db');

async function checkSections() {
  try {
    const res = await pool.query(`
      SELECT s.name, b.name as batch, sem.name as semester
      FROM sections s
      JOIN batch_years b ON s.batch_id = b.id
      JOIN semesters sem ON s.semester_id = sem.id
    `);
    console.log('--- SECTIONS DATA ---');
    console.table(res.rows);
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSections();
