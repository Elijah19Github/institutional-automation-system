require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function seed() {
    try {
        console.log('🌱 Seeding Admin Dashboard Data...');

        // 1. Clear existing data in a safe order
        await pool.query('DELETE FROM results');
        await pool.query('DELETE FROM marks');
        await pool.query('DELETE FROM submissions');
        await pool.query('DELETE FROM assignments');
        await pool.query('DELETE FROM attendance');
        await pool.query('DELETE FROM courses');
        await pool.query('DELETE FROM students');
        await pool.query('DELETE FROM faculty');
        await pool.query('DELETE FROM users WHERE email NOT LIKE \'admin@college.com\''); // Keep super admin

        // 2. Create Faculty
        const facultyUser = await pool.query(`
            INSERT INTO users (email, password, name, role) 
            VALUES ('faculty@college.com', '$2b$10$Ep76Jeb6vK.p.fR.I9A76.uPZ6DkG5tFmS6D.H7.B.M.Z.Z.Z.Z', 'Dr. Smith', 'FACULTY')
            RETURNING id
        `);
        const facultyId = (await pool.query(`
            INSERT INTO faculty (user_id, employee_id, designation, department, phone_number) 
            VALUES ($1, 'FAC001', 'Senior Professor', 'Computer Science', '+91 9876543210')
            RETURNING id
        `, [facultyUser.rows[0].id])).rows[0].id;

        // 3. Create Courses
        const courseResult = await pool.query(`
            INSERT INTO courses (name, department, credits) VALUES 
            ('Introduction to Computer Science', 'Computer Science', 4),
            ('Data Structures and Algorithms', 'Computer Science', 4),
            ('Database Management Systems', 'Information Technology', 3)
            RETURNING id
        `);
        const courseIds = courseResult.rows.map(r => r.id);

        // 4. Create Students (50 students)
        const studentIds = [];
        for (let i = 1; i <= 50; i++) {
            const user = await pool.query(`
                INSERT INTO users (email, password, name, role) 
                VALUES ('student${i}@college.com', 'password123', 'Student ${i}', 'STUDENT')
                RETURNING id
            `);
            
            const year = 2000 + Math.floor(Math.random() * 7);
            const month = 1 + Math.floor(Math.random() * 12);
            const day = 1 + Math.floor(Math.random() * 28);
            const dob = `${year}-${month}-${day}`;

            const departments = ['Computer Science', 'Electronic Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Business Admin'];
            const dept = departments[Math.floor(Math.random() * departments.length)];

            const student = await pool.query(`
                INSERT INTO students (user_id, enrollment_number, date_of_birth, department) 
                VALUES ($1, 'STU${1000 + i}', $2, $3)
                RETURNING id
            `, [user.rows[0].id, dob, dept]);
            studentIds.push(student.rows[0].id);
        }

        // 5. Create Assignments
        const assignmentResult = await pool.query(`
            INSERT INTO assignments (course_id, title, total_marks) VALUES 
            ($1, 'Data Structures Homework 1', 100),
            ($2, 'Algorithms Project', 100)
            RETURNING id
        `, [courseIds[0], courseIds[1]]);
        const assignmentIds = assignmentResult.rows.map(r => r.id);

        // 6. Create Attendance & Marks & Submissions for each student
        console.log('📊 Generating metrics for students...');
        for (const studentId of studentIds) {
            // Attendance (avg 80%)
            for (const courseId of courseIds) {
                const isPresent = Math.random() > 0.2 ? 'present' : 'absent';
                await pool.query(`
                    INSERT INTO attendance (student_id, course_id, status, date) 
                    VALUES ($1, $2, $3, CURRENT_DATE)
                `, [studentId, courseId, isPresent]);

                // Marks (avg 70)
                const score = 40 + Math.floor(Math.random() * 60);
                await pool.query(`
                    INSERT INTO marks (student_id, course_id, score, type) 
                    VALUES ($1, $2, $3, 'Midterm')
                `, [studentId, courseId, score]);
            }

            // Submissions
            for (const assignmentId of assignmentIds) {
                const score = 50 + Math.floor(Math.random() * 50);
                await pool.query(`
                    INSERT INTO submissions (assignment_id, student_id, score) 
                    VALUES ($1, $2, $3)
                `, [assignmentId, studentId, score]);
            }

            // Results (GPA)
            for (const courseId of courseIds) {
                const gpa = (2.0 + Math.random() * 2.0).toFixed(2); // 2.0 to 4.0
                await pool.query(`
                    INSERT INTO results (student_id, course_id, gpa, semester) 
                    VALUES ($1, $2, $3, 1)
                `, [studentId, courseId, gpa]);
            }
        }

        console.log('✅ Seeding complete! 50 students, 1 faculty, 3 courses created.');
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
    } finally {
        await pool.end();
    }
}

seed();
