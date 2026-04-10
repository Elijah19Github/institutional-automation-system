require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function seed() {
    const client = await pool.connect();
    try {
        console.log('🌱 Starting Schema-Correct Mapping Seed...');
        await client.query('BEGIN');

        // 1. Academic Years
        let ayId;
        const existingAY = await client.query("SELECT id FROM academic_years WHERE name = '2024-2025' LIMIT 1");
        if (existingAY.rows.length > 0) {
            ayId = existingAY.rows[0].id;
        } else {
            const res = await client.query(`
                INSERT INTO academic_years (name, start_date, end_date, is_current) 
                VALUES ('2024-2025', '2024-06-01', '2025-05-31', true) 
                RETURNING id
            `);
            ayId = res.rows[0].id;
        }

        // 2. Batch Years
        let batchId;
        const existingBatch = await client.query("SELECT id FROM batch_years WHERE name = 'Batch 2024' LIMIT 1");
        if (existingBatch.rows.length > 0) {
            batchId = existingBatch.rows[0].id;
        } else {
            const res = await client.query("INSERT INTO batch_years (name, entry_year) VALUES ('Batch 2024', 2024) RETURNING id");
            batchId = res.rows[0].id;
        }

        // 3. Semesters
        let semId;
        const existingSem = await client.query("SELECT id FROM semesters WHERE semester_number = 1 LIMIT 1");
        if (existingSem.rows.length > 0) {
            semId = existingSem.rows[0].id;
        } else {
            const res = await client.query("INSERT INTO semesters (semester_number, name) VALUES (1, 'Semester 1') RETURNING id");
            semId = res.rows[0].id;
        }

        // 4. Subjects
        const subjects = [
            { code: 'MCA101', name: 'Data Structures', sem_id: semId },
            { code: 'MCA102', name: 'Advanced Java', sem_id: semId },
            { code: 'MCA103', name: 'Database Systems', sem_id: semId }
        ];
        const subjectIds = [];
        for (const s of subjects) {
            const existingSub = await client.query("SELECT id FROM subjects WHERE code = $1 LIMIT 1", [s.code]);
            if (existingSub.rows.length > 0) {
                subjectIds.push(existingSub.rows[0].id);
            } else {
                const res = await client.query("INSERT INTO subjects (code, name, semester_id) VALUES ($1, $2, $3) RETURNING id", [s.code, s.name, s.sem_id]);
                subjectIds.push(res.rows[0].id);
            }
        }

        // 5. Sections
        let sectionId;
        const existingSec = await client.query("SELECT id FROM sections WHERE name = 'MCA-A' LIMIT 1");
        if (existingSec.rows.length > 0) {
            sectionId = existingSec.rows[0].id;
        } else {
            const res = await client.query("INSERT INTO sections (name, batch_id, semester_id) VALUES ('MCA-A', $1, $2) RETURNING id", [batchId, semId]);
            sectionId = res.rows[0].id;
        }

        // 6. Faculty Mapping (Dr. Smith)
        const faculty = await client.query("SELECT id FROM faculty LIMIT 1"); // Grab any faculty if Dr. Smith not found
        if (faculty.rows.length > 0) {
            const fId = faculty.rows[0].id;
            for (const subId of subjectIds) {
                await client.query(`
                    INSERT INTO faculty_subject_mapping (faculty_id, subject_id, section_id, academic_year_id)
                    VALUES ($1, $2, $3, $4)
                    ON CONFLICT DO NOTHING
                `, [fId, subId, sectionId, ayId]);
            }
            console.log('✅ Faculty Mappings created.');
        }

        // 7. Link Students
        const studentsCount = await client.query("UPDATE students SET batch_id = $1, current_semester_id = $2, current_section_id = $3 WHERE current_section_id IS NULL", [batchId, semId, sectionId]);
        console.log(`✅ ${studentsCount.rowCount} students linked to sections.`);

        await client.query('COMMIT');
        console.log('🎉 Seeding Successful!');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Seeding Failed:', err.stack);
    } finally {
        client.release();
        await pool.end();
    }
}

seed();
