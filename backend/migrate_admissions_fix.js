const { pool } = require('./src/config/db');

async function migrateAdmissions() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('--- MIGRATING ADMISSIONS SCHEMA ---');

    // 1. Add course_interested to applications if missing
    await client.query(`
      ALTER TABLE applications 
      ADD COLUMN IF NOT EXISTS course_interested VARCHAR(255),
      ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
      ADD COLUMN IF NOT EXISTS decision_date TIMESTAMP;
    `);
    console.log('Added missing columns to applications table.');

    // 2. Ensure applications.status is 'pending' by default if not set
    await client.query(`
      ALTER TABLE applications 
      ALTER COLUMN status SET DEFAULT 'pending';
    `);

    // 3. Ensure provisional_admissions has generated_at
    await client.query(`
      ALTER TABLE provisional_admissions 
      ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);

    // 4. Update any null statuses to pending
    await client.query(`
      UPDATE applications SET status = 'pending' WHERE status IS NULL;
    `);

    await client.query('COMMIT');
    console.log('Admissions Migration completed successfully 🚀');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateAdmissions();
