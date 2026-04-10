const pool = require('./src/config/db');
(async () => {
    try {
        await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id)');
        await pool.query("ALTER TABLE students ADD COLUMN IF NOT EXISTS department VARCHAR(255)");
        
        // Auto-assign MCA course if it exists to existing students for testing
        const mcaCourse = await pool.query("SELECT id FROM courses WHERE course_name ILIKE '%MCA%' LIMIT 1");
        if (mcaCourse.rows.length > 0) {
            await pool.query("UPDATE students SET course_id = $1, department = 'Computer Applications' WHERE course_id IS NULL", [mcaCourse.rows[0].id]);
            console.log('Migrated existing students to MCA course.');
        }
        
        console.log('Columns added/updated successfully');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
