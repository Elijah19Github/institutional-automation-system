const { pool } = require('./src/config/db');

async function checkAcademicSchema() {
  try {
    const tables = ['batches', 'semesters', 'sections', 'courses'];
    for (const table of tables) {
      const res = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = '${table}'
      `);
      console.log(`--- ${table.toUpperCase()} TABLE COLUMNS ---`);
      console.table(res.rows);
    }
    
    const activeData = await pool.query(`
      SELECT 'batch' as type, name FROM batch_years LIMIT 1;
    `);
    console.log('--- DATA SAMPLE ---');
    console.table(activeData.rows);

    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkAcademicSchema();
