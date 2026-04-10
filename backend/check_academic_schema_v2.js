const { pool } = require('./src/config/db');

async function checkAcademicSchema() {
  try {
    const tables = ['batch_years', 'semesters', 'sections', 'courses'];
    for (const table of tables) {
      const res = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${table}'
      `);
      console.log(`--- ${table.toUpperCase()} TABLE COLUMNS ---`);
      console.table(res.rows);
    }

    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkAcademicSchema();
