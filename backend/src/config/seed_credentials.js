const { pool } = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('--- Cleaning up existing test users ---');
        // Delete previous student/faculty profile records with specific emails OR system_ids to avoid secondary constraint issues
        await client.query(`
            DELETE FROM users 
            WHERE email LIKE 'student%@college.com' 
            OR email IN ('faculty@college.com', 'fac_mca@college.com', 'fac_msc@college.com', 'elijah.test.unique@example.com')
            OR system_id IN ('FAC001', 'FAC_MCA', 'FAC_MSC', 'ADM_GLOBAL', '26MCA910A')
            OR system_id LIKE '26MCA%'
        `);

        const saltRounds = 10;
        const defaultPassword = await bcrypt.hash('password123', saltRounds);
        const adminPassword = await bcrypt.hash('admin123', saltRounds);
        const elijahPassword = await bcrypt.hash('26MCA910A', saltRounds);

        // 1. Ensure Admin exists (admin123)
        await client.query(`
            INSERT INTO users (email, password, name, role, system_id)
            VALUES ('admin@college.com', $1, 'System Administrator', 'ADMIN', 'ADM_GLOBAL')
            ON CONFLICT (email) DO UPDATE SET password = $1
        `, [adminPassword]);
        console.log('✅ Admin credentials verified.');

        // 2. Insert Faculty
        const faculties = [
            { email: 'faculty@college.com', name: 'General Faculty', dept: 'General', id: 'FAC001' },
            { email: 'fac_mca@college.com', name: 'MCA Professor', dept: 'Computer Applications', id: 'FAC_MCA' },
            { email: 'fac_msc@college.com', name: 'MSC Professor', dept: 'Computer Science', id: 'FAC_MSC' }
        ];

        for (const fac of faculties) {
            const userRes = await client.query(
                "INSERT INTO users (email, password, name, role, system_id) VALUES ($1, $2, $3, 'FACULTY', $4) RETURNING id",
                [fac.email, defaultPassword, fac.name, fac.id]
            );
            await client.query(
                "INSERT INTO faculty (user_id, employee_id, department) VALUES ($1, $2, $3)",
                [userRes.rows[0].id, fac.id, fac.dept]
            );
        }
        console.log('✅ Faculty credentials seeded.');

        // 3. IDs for Students Mapping (Fetched from check command)
        const MCA_COURSE = 'd8214791-796d-4217-9dba-d01079314a24';
        const MSC_COURSE = '374ffe07-d7ec-4b75-a799-e29fc5d996c3';
        const BATCH_2025 = '2e5b1d54-4a80-434a-a7d4-d569809406a1';
        const BATCH_2026 = '99fd6f51-b8c3-4b0d-96e8-8c21deb8e737';
        const SEM_1 = '83ae7de9-a021-47fc-bcc6-72fb04964770';
        const SEC_MCA_2025 = '7100ae55-7820-4323-9c1b-e9e8e53b84be';
        const SEC_MSC_2025 = 'cdfb49ac-4b7c-4aab-b582-aec36955f004';
        const SEC_MCA_2026 = 'd69fe829-6455-48b6-a501-16d481bd404c';

        // 4. Seed 50 Students
        console.log('--- Seeding 50 Students ---');
        for (let i = 1; i <= 50; i++) {
            const email = `student${i}@college.com`;
            const name = `Student ${i}`;
            const regno = `26MCA${i.toString().padStart(3, '0')}`;
            
            const isMCA = i <= 25;
            const courseId = isMCA ? MCA_COURSE : MSC_COURSE;
            const sectionId = isMCA ? SEC_MCA_2025 : SEC_MSC_2025;

            const userRes = await client.query(
                "INSERT INTO users (email, password, name, role, system_id) VALUES ($1, $2, $3, 'STUDENT', $4) RETURNING id",
                [email, defaultPassword, name, regno]
            );
            await client.query(
                "INSERT INTO students (user_id, enrollment_number, course_id, batch_id, current_semester_id, current_section_id, department) VALUES ($1, $2, $3, $4, $5, $6, $7)",
                [userRes.rows[0].id, regno, courseId, BATCH_2025, SEM_1, sectionId, isMCA ? 'Computer Applications' : 'Computer Science']
            );
        }

        // 5. Seed Test Student
        console.log('--- Seeding Test Student ---');
        const testEmail = 'elijah.test.unique@example.com';
        const testReg = '26MCA910A';
        const testUserRes = await client.query(
            "INSERT INTO users (email, password, name, role, system_id) VALUES ($1, $2, $3, 'STUDENT', $4) RETURNING id",
            [testEmail, elijahPassword, 'Elijah Test', testReg]
        );
        await client.query(
            "INSERT INTO students (user_id, enrollment_number, course_id, batch_id, current_semester_id, current_section_id, department) VALUES ($1, $2, $3, $4, $5, $6, 'Computer Applications')",
            [testUserRes.rows[0].id, testReg, MCA_COURSE, BATCH_2026, SEM_1, SEC_MCA_2026]
        );

        await client.query('COMMIT');
        console.log('🚀 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ ERROR DURING SEEDING:', err);
        process.exit(1);
    } finally {
        client.release();
    }
}

seed();
