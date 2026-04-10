const { pool } = require('./src/config/db');

async function checkSchema() {
  try {
    const usersRes = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
    `);
    console.log('--- USERS TABLE COLUMNS ---');
    console.table(usersRes.rows);
    
    const studentsRes = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'students'
    `);
    console.log('--- STUDENTS TABLE COLUMNS ---');
    console.table(studentsRes.rows);

    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkSchema();
