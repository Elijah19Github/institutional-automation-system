const { pool } = require('./src/config/db');

async function checkSchema() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'applications'
    `);
    console.log('--- APPLICATIONS TABLE COLUMNS ---');
    console.table(res.rows);
    
    const provRes = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'provisional_admissions'
    `);
    console.log('--- PROVISIONAL_ADMISSIONS TABLE COLUMNS ---');
    console.table(provRes.rows);

    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
