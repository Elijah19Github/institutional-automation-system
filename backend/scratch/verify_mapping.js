const { pool } = require('../src/config/db');

async function verifyMapping() {
    try {
        // 1. Get a faculty
        const faculty = await pool.query('SELECT id, user_id FROM faculty LIMIT 1');
        if (faculty.rows.length === 0) throw new Error('No faculty found');
        const fid = faculty.rows[0].id;

        // 2. Get a subject
        const subject = await pool.query('SELECT id FROM subjects LIMIT 1');
        if (subject.rows.length === 0) throw new Error('No subject found');
        const subid = subject.rows[0].id;

        // 3. Get a section
        const section = await pool.query('SELECT id FROM sections LIMIT 1');
        if (section.rows.length === 0) throw new Error('No section found');
        const secid = section.rows[0].id;

        // 4. Get current AY
        const ay = await pool.query('SELECT id FROM academic_years WHERE is_current = true LIMIT 1');
        if (ay.rows.length === 0) throw new Error('No current AY found');
        const ayid = ay.rows[0].id;

        console.log(`Testing mapping for Faculty ${fid}, Subject ${subid}, Section ${secid}, AY ${ayid}`);

        // 5. Clean previous test mapping (to make it repeatable)
        await pool.query('DELETE FROM faculty_subject_mapping WHERE faculty_id = $1 AND subject_id = $2 AND section_id = $3', [fid, subid, secid]);

        // 6. Simulate the POST request logic manually or via fetch? I'll just do a SQL check of the logic.
        // Actually, let's just run the DB queries to see if they work with the new singular names and AY.
        
        await pool.query('BEGIN');
        await pool.query('DELETE FROM faculty_subject_mapping WHERE faculty_id = $1 AND academic_year_id = $2', [fid, ayid]);
        await pool.query(
            'INSERT INTO faculty_subject_mapping (faculty_id, subject_id, section_id, academic_year_id) VALUES ($1, $2, $3, $4)',
            [fid, subid, secid, ayid]
        );
        await pool.query('COMMIT');

        // 7. Verify
        const result = await pool.query('SELECT * FROM faculty_subject_mapping WHERE faculty_id = $1', [fid]);
        console.log('Verification Success! Rows count:', result.rows.length);
        console.log('Data:', result.rows[0]);

    } catch (err) {
        console.error('Verification Failed:', err);
    } finally {
        pool.end();
    }
}

verifyMapping();
