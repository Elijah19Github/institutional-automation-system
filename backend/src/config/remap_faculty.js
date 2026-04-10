const { pool } = require('./db');

async function remap() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('🔄 Remapping Faculty Assignments...');
        
        // 1. Get all faculty 
        const facultyRes = await client.query("SELECT id FROM faculty");
        const facultyIds = facultyRes.rows.map(r => r.id);

        // 2. Get all subjects
        const subjectRes = await client.query("SELECT id, semester_id FROM subjects");
        const subjectData = subjectRes.rows;

        // 3. Get all sections (linked to those semesters)
        const sectionRes = await client.query("SELECT id, name, semester_id FROM sections");
        const sections = sectionRes.rows;

        // 4. Get Current Academic Year
        const ayRes = await client.query("SELECT id FROM academic_years WHERE is_current = true LIMIT 1");
        const ayId = ayRes.rows[0]?.id;

        if (!ayId) throw new Error("No current academic year found.");

        // Clean existing mappings to avoid confusion
        await client.query("TRUNCATE TABLE faculty_subject_mapping CASCADE");

        console.log(`Mapping ${facultyIds.length} faculty to ${subjectData.length} subjects across ${sections.length} sections...`);

        for (const facultyId of facultyIds) {
            for (const subject of subjectData) {
                // Find sections that belong to the SAME semester as the subject
                const relevantSections = sections.filter(sec => sec.semester_id === subject.semester_id);
                
                for (const section of relevantSections) {
                    await client.query(
                        "INSERT INTO faculty_subject_mapping (faculty_id, subject_id, section_id, academic_year_id) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING",
                        [facultyId, subject.id, section.id, ayId]
                    );
                }
            }
        }

        await client.query('COMMIT');
        console.log('✅ All subjects assigned to all faculty successfully.');
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Remapping Failed:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

remap();
