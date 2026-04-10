const { pool } = require('./src/config/db');

async function checkAcademicYears() {
    try {
        const res = await pool.query('SELECT * FROM academic_years');
        console.log('Academic Years:', res.rows);
        const current = res.rows.find(ay => ay.is_current);
        console.log('Current Academic Year:', current);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

checkAcademicYears();
