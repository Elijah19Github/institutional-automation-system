const { pool } = require('./src/config/db');

async function listTables() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('--- TABLES IN PUBLIC SCHEMA ---');
    console.table(res.rows);
    await pool.end();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

listTables();
