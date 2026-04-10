const pool = require('../config/db');
const axios = require('axios');
const bcrypt = require('bcryptjs');

exports.getDashboardMetrics = async (req, res) => {
    try {
        // 1. Total Students
        const studentsRes = await pool.query('SELECT COUNT(*) FROM students');
        
        // 2. Total Faculty
        const facultyRes = await pool.query('SELECT COUNT(*) FROM faculty');
        
        // 3. Active Courses
        const coursesRes = await pool.query('SELECT COUNT(*) FROM courses');
        
        // 4. Attendance Rate
        const attendanceRes = await pool.query(`
            SELECT 
                CASE 
                    WHEN COUNT(*) = 0 THEN 0 
                    ELSE ROUND(COUNT(CASE WHEN status='P' THEN 1 END) * 100.0 / COUNT(*), 1) 
                END as rate 
            FROM attendance_records
        `);

        // 5. Avg Performance (Marks — percentage of max_score)
        const marksRes = await pool.query(`
            SELECT ROUND(AVG(score * 100.0 / NULLIF(max_score, 0)), 1) as avg FROM marks
        `);

        // 6. 🤖 Risk Distribution — from academic_risk table (DB-driven)
        const riskDistRes = await pool.query(`
            SELECT
                COUNT(CASE WHEN ar.risk_level = 'HIGH'   THEN 1 END) AS high,
                COUNT(CASE WHEN ar.risk_level = 'MEDIUM' THEN 1 END) AS medium,
                COUNT(CASE WHEN ar.risk_level = 'LOW'    THEN 1 END) AS safe,
                COUNT(CASE WHEN ar.risk_level IN ('HIGH','MEDIUM') THEN 1 END) AS at_risk
            FROM academic_risk ar
            INNER JOIN (
                SELECT student_id, MAX(calculated_at) AS latest
                FROM academic_risk GROUP BY student_id
            ) latest ON ar.student_id = latest.student_id AND ar.calculated_at = latest.latest
        `);
        const rd = riskDistRes.rows[0];
        const aiRiskData = {
            at_risk_students: parseInt(rd.at_risk) || 0,
            risk_distribution: {
                high:   parseInt(rd.high)   || 0,
                medium: parseInt(rd.medium) || 0,
                safe:   parseInt(rd.safe)   || 0
            }
        };

        // 7. Departmental Performance
        const deptPerfRes = await pool.query(`
            SELECT 
                c.course_name as department, 
                ROUND(AVG(m.score), 1) as avg_score 
            FROM marks m 
            JOIN subjects s ON m.subject_id = s.id
            JOIN courses c ON s.course_id = c.id 
            GROUP BY c.course_name
            ORDER BY avg_score DESC
        `);

        // 8. Attendance Trends (Last 7 Days)
        const trendsRes = await pool.query(`
            SELECT 
                TO_CHAR(asess.session_date, 'DD Mon') as date_label,
                ROUND(COUNT(CASE WHEN ar.status='P' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as rate 
            FROM attendance_records ar
            JOIN attendance_sessions asess ON ar.session_id = asess.id
            WHERE asess.session_date >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY asess.session_date
            ORDER BY asess.session_date ASC;
        `);

        // 9. Recent At-Risk Students (Top 5 using simple logic for now, but count comes from AI)
        const recentRiskRes = await pool.query(`
            WITH StudentMetrics AS (
                SELECT 
                    s.id,
                    u.name,
                    COALESCE(AVG(CASE WHEN ar.status = 'P' THEN 100 ELSE 0 END), 0) as attendance_score,
                    COALESCE(AVG(m.score), 0) as marks_score
                FROM students s
                JOIN users u ON s.user_id = u.id
                LEFT JOIN attendance_records ar ON s.id = ar.student_id
                LEFT JOIN marks m ON s.id = m.student_id
                GROUP BY s.id, u.name
            )
            SELECT name, ROUND((0.5 * attendance_score) + (0.5 * marks_score), 1) as score
            FROM StudentMetrics
            WHERE attendance_score < 60 OR marks_score < 50
            ORDER BY score ASC
            LIMIT 5;
        `);

        res.json({
            success: true,
            data: {
                total_students: parseInt(studentsRes.rows[0].count),
                total_faculty: parseInt(facultyRes.rows[0].count),
                active_courses: parseInt(coursesRes.rows[0].count),
                attendance_rate: parseFloat(attendanceRes.rows[0].rate || 0),
                avg_marks: parseFloat(marksRes.rows[0].avg || 0),
                at_risk_students: aiRiskData.at_risk_students,
                risk_distribution: aiRiskData.risk_distribution,
                department_performance: deptPerfRes.rows,
                attendance_trends: trendsRes.rows,
                recent_at_risk: recentRiskRes.rows
            }
        });


    } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// GET /api/admin/faculty-metrics
exports.getFacultyDashboardMetrics = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 1. Get Faculty ID
        const facultyRes = await pool.query('SELECT id FROM faculty WHERE user_id = $1', [userId]);
        if (facultyRes.rows.length === 0) return res.status(403).json({ success: false, message: 'Faculty profile not found.' });
        const facultyId = facultyRes.rows[0].id;

        // 2. Get Assigned Subjects & Sections
        const mappingRes = await pool.query(`
            SELECT DISTINCT section_id, subject_id FROM faculty_subject_mapping WHERE faculty_id = $1
        `, [facultyId]);
        
        const sectionIds = mappingRes.rows.map(r => r.section_id);
        const subjectIds = mappingRes.rows.map(r => r.subject_id);

        if (sectionIds.length === 0) {
            return res.json({
                success: true,
                data: {
                    total_students: 0,
                    attendance_rate: 0,
                    avg_marks: 0,
                    at_risk_students: 0,
                    risk_distribution: { high: 0, medium: 0, safe: 0 },
                    department_performance: [],
                    attendance_trends: [],
                    recent_at_risk: []
                }
            });
        }

        // 3. Total Students in assigned sections
        const studentsRes = await pool.query('SELECT COUNT(DISTINCT id) FROM students WHERE current_section_id = ANY($1)', [sectionIds]);
        
        // 4. Attendance Rate for sessions taken by this faculty
        const attendanceRes = await pool.query(`
            SELECT 
                CASE 
                    WHEN COUNT(*) = 0 THEN 0 
                    ELSE ROUND(COUNT(CASE WHEN ar.status='P' THEN 1 END) * 100.0 / COUNT(*), 1) 
                END as rate 
            FROM attendance_records ar
            JOIN attendance_sessions asess ON ar.session_id = asess.id
            WHERE asess.faculty_id = $1
        `, [facultyId]);

        // 5. Avg Performance (Marks) as percentage of max_score
        const marksRes = await pool.query(`
            SELECT ROUND(AVG(m.score * 100.0 / NULLIF(m.max_score,0)), 1) as avg 
            FROM marks m
            WHERE m.subject_id = ANY($1) AND m.student_id IN (SELECT id FROM students WHERE current_section_id = ANY($2))
        `, [subjectIds, sectionIds]);

        // Risk distribution for this faculty's sections (from academic_risk)
        const facRiskRes = await pool.query(`
            SELECT
                COUNT(CASE WHEN ar.risk_level = 'HIGH'   THEN 1 END) AS high,
                COUNT(CASE WHEN ar.risk_level = 'MEDIUM' THEN 1 END) AS medium,
                COUNT(CASE WHEN ar.risk_level = 'LOW'    THEN 1 END) AS safe,
                COUNT(CASE WHEN ar.risk_level IN ('HIGH','MEDIUM') THEN 1 END) AS at_risk
            FROM academic_risk ar
            WHERE ar.student_id IN (SELECT id FROM students WHERE current_section_id = ANY($1))
        `, [sectionIds]);
        const frd = facRiskRes.rows[0];

        res.json({
            success: true,
            data: {
                total_students:    parseInt(studentsRes.rows[0].count),
                total_faculty:     1,
                active_courses:    subjectIds.length,
                attendance_rate:   parseFloat(attendanceRes.rows[0].rate || 0),
                avg_marks:         parseFloat(marksRes.rows[0].avg || 0),
                at_risk_students:  parseInt(frd.at_risk) || 0,
                risk_distribution: {
                    high:   parseInt(frd.high)   || 0,
                    medium: parseInt(frd.medium) || 0,
                    safe:   parseInt(frd.safe)   || 0
                },
                department_performance: [],
                attendance_trends: [],
                recent_at_risk: []
            }
        });

    } catch (error) {
        console.error('Error fetching faculty dashboard metrics:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// GET /api/admin/students
exports.getStudentsList = async (req, res) => {
    try {
        const { search = '', department = '', course_id = '', batch_id = '', sort = 'ASC' } = req.query;
        
        let query = `
            SELECT 
                s.id as id,
                u.name,
                s.enrollment_number as regno,
                s.batch_id,
                b.name as batch_name,
                s.current_section_id as section_id,
                sec.name as section_name,
                c.course_name as course_name,
                s.department as department,
                COALESCE(ROUND(AVG(
                    CASE 
                        WHEN ar.status = 'P' THEN 100 
                        WHEN ar.status = 'A' THEN 0 
                        ELSE NULL 
                    END
                ), 1), 0) as attendance_rate,
                COALESCE(ROUND(AVG(m.score), 1), 0) as avg_marks
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN batch_years b ON s.batch_id = b.id
            LEFT JOIN sections sec ON s.current_section_id = sec.id
            LEFT JOIN courses c ON s.course_id = c.id
            LEFT JOIN attendance_records ar ON s.id = ar.student_id
            LEFT JOIN marks m ON s.id = m.student_id
            WHERE 1=1
        `;
        
        const params = [];
        let pIndex = 1;

        if (search) {
            query += ` AND (u.name ILIKE $${pIndex} OR s.enrollment_number ILIKE $${pIndex})`;
            params.push(`%${search}%`);
            pIndex++;
        }

        if (department && department !== 'all') {
            query += ` AND s.department = $${pIndex}`;
            params.push(department);
            pIndex++;
        }

        if (course_id && course_id !== 'all') {
            query += ` AND s.course_id = $${pIndex}`;
            params.push(course_id);
            pIndex++;
        }

        if (batch_id && batch_id !== 'all') {
            query += ` AND s.batch_id = $${pIndex}`;
            params.push(batch_id);
            pIndex++;
        }
        
        query += `
            GROUP BY s.id, u.name, s.enrollment_number, s.batch_id, b.name, s.current_section_id, sec.name, c.course_name, s.department
            ORDER BY u.name ${sort === 'DESC' ? 'DESC' : 'ASC'}
        `;
        
        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching students list:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// GET /api/admin/faculty
exports.getFacultyList = async (req, res) => {
    try {
        const { search, department } = req.query;
        let query = `
            SELECT 
                f.id,
                u.name,
                f.employee_id,
                f.department,
                f.designation,
                f.phone_number,
                f.profile_pic_url
            FROM faculty f
            JOIN users u ON f.user_id = u.id
            WHERE 1=1
        `;
        const values = [];

        if (search) {
            values.push(`%${search}%`);
            query += ` AND (u.name ILIKE $${values.length} OR f.employee_id ILIKE $${values.length})`;
        }

        if (department) {
            values.push(department);
            query += ` AND f.department = $${values.length}`;
        }

        query += ` ORDER BY u.name ASC`;
        
        const result = await pool.query(query, values);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching faculty list:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// POST /api/admin/faculty - Create new faculty profile
exports.createFaculty = async (req, res) => {
    const client = await pool.connect();
    try {
        const { name, email, password, employee_id, department, designation, phone_number } = req.body;
        const profile_pic_url = req.file ? `/uploads/faculty/${req.file.filename}` : null;

        if (!name || !email || !password || !employee_id) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        await client.query('BEGIN');

        // 1. Create User
        const hashedPassword = await bcrypt.hash(password, 10);
        const userRes = await client.query(
            "INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, 'FACULTY') RETURNING id",
            [name, email, hashedPassword]
        );
        const userId = userRes.rows[0].id;

        // 2. Create Faculty Profile
        await client.query(
            `INSERT INTO faculty (user_id, employee_id, department, designation, phone_number, profile_pic_url) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [userId, employee_id, department, designation, phone_number, profile_pic_url]
        );

        await client.query('COMMIT');
        res.status(201).json({ success: true, message: 'Faculty profile created successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating faculty:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal Server Error' });
    } finally {
        client.release();
    }
};

// GET /api/admin/courses
exports.getCoursesList = async (req, res) => {
    try {
        const { search = '', department = '' } = req.query;
        let query = `
            SELECT 
                id,
                course_name as name,
                course_code,
                description,
                true as is_active,
                duration_years * 20 as credits
            FROM courses
            WHERE 1=1
        `;
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (course_name ILIKE $${params.length} OR course_code ILIKE $${params.length})`;
        }
        
        if (department) {
            params.push(`%${department}%`);
            query += ` AND course_name ILIKE $${params.length}`;
        }
        
        query += ` ORDER BY course_name ASC`;
        
        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching courses list:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// GET /api/admin/courses/:id
exports.getCourseDetails = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. Basic Course Info
        const courseRes = await pool.query('SELECT * FROM courses WHERE id = $1', [id]);
        if (courseRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Course not found' });
        
        // 2. Aggregate Stats for this course
        const statsRes = await pool.query(`
            SELECT 
                COUNT(DISTINCT student_id) as student_count,
                ROUND(AVG(CASE WHEN status = 'P' THEN 100 ELSE 0 END), 1) as avg_attendance,
                (SELECT ROUND(AVG(m.score), 1) FROM marks m JOIN subjects s ON m.subject_id = s.id WHERE s.course_id = $1) as avg_marks
            FROM attendance_records ar
            JOIN attendance_sessions asess ON ar.session_id = asess.id
            JOIN subjects s ON asess.subject_id = s.id
            WHERE s.course_id = $1
        `, [id]);
        
        // 3. Student List in this course
        const studentsRes = await pool.query(`
            SELECT DISTINCT s.id, u.name, s.enrollment_number
            FROM students s
            JOIN users u ON s.user_id = u.id
            JOIN attendance_records ar ON s.id = ar.student_id
            JOIN attendance_sessions asess ON ar.session_id = asess.id
            JOIN subjects subj ON asess.subject_id = subj.id
            WHERE subj.course_id = $1
            LIMIT 50
        `, [id]);

        res.json({
            success: true,
            data: {
                ...courseRes.rows[0],
                stats: statsRes.rows[0],
                students: studentsRes.rows
            }
        });
    } catch (error) {
        console.error('Error fetching course details:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// GET /api/admin/metrics/attendance-breakdown
exports.getAttendanceBreakdown = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                c.course_name as department,
                ROUND(COUNT(CASE WHEN ar.status = 'P' THEN 1 END) * 100.0 / COUNT(*), 1) as rate
            FROM attendance_records ar
            JOIN attendance_sessions asess ON ar.session_id = asess.id
            JOIN subjects s ON asess.subject_id = s.id
            JOIN courses c ON s.course_id = c.id
            GROUP BY c.course_name
            ORDER BY rate DESC
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching attendance breakdown:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// GET /api/admin/metrics/performance-breakdown
exports.getPerformanceBreakdown = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                c.course_name as department,
                ROUND(AVG(m.score), 1) as avg_score
            FROM marks m
            JOIN subjects s ON m.subject_id = s.id
            JOIN courses c ON s.course_id = c.id
            GROUP BY c.course_name
            ORDER BY avg_score DESC
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching performance breakdown:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// GET /api/admin/student-risk/:id
exports.getStudentRiskReport = async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. Basic Info (removed date_of_birth — not in schema)
        const studentRes = await pool.query(`
            SELECT u.name, s.enrollment_number, s.department,
                   c.course_name, sem.name as semester_name
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN courses c ON s.course_id = c.id
            LEFT JOIN semesters sem ON s.current_semester_id = sem.id
            WHERE s.id = $1
        `, [id]);
        
        if (studentRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // 2. Attendance Breakdown per Subject
        const attendanceRes = await pool.query(`
            SELECT 
                s.name as course_name,
                ROUND(COUNT(CASE WHEN ar.status = 'P' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0), 1) as rate
            FROM attendance_records ar
            JOIN attendance_sessions asess ON ar.session_id = asess.id
            JOIN subjects s ON asess.subject_id = s.id
            WHERE ar.student_id = $1
            GROUP BY s.name
            ORDER BY rate ASC
        `, [id]);

        // 3. Performance Breakdown per Subject
        const marksRes = await pool.query(`
            SELECT 
                s.name as course_name,
                ROUND(AVG(m.score * 100.0 / NULLIF(m.max_score, 0)), 1) as avg_score
            FROM marks m
            JOIN subjects s ON m.subject_id = s.id
            WHERE m.student_id = $1
            GROUP BY s.name
            ORDER BY avg_score ASC
        `, [id]);

        // 4. Compute risk metrics from DB for guaranteed fallback
        const metricsRes = await pool.query(`
            SELECT 
                COALESCE(ROUND(COUNT(CASE WHEN ar.status = 'P' THEN 1 END) * 100.0 / NULLIF(COUNT(ar.id), 0), 1), 0) as avg_attendance,
                COALESCE(ROUND(AVG(m.score * 100.0 / NULLIF(m.max_score, 0)), 1), 0) as avg_marks
            FROM students s
            LEFT JOIN attendance_records ar ON s.id = ar.student_id
            LEFT JOIN marks m ON s.id = m.student_id
            WHERE s.id = $1
        `, [id]);

        const metrics = metricsRes.rows[0];
        const avgAtt = parseFloat(metrics.avg_attendance || 0);
        const avgMarks = parseFloat(metrics.avg_marks || 0);

        // DB-driven fallback risk logic
        let dbRiskLevel = 'LOW';
        let dbProbability = 0.1;
        const dbReasons = [];
        if (avgAtt < 60) { dbReasons.push('Critical attendance shortage (< 60%)'); dbProbability += 0.4; }
        else if (avgAtt < 75) { dbReasons.push('Attendance below recommended threshold (< 75%)'); dbProbability += 0.2; }
        if (avgMarks < 50) { dbReasons.push('Academic performance below pass threshold (< 50%)'); dbProbability += 0.35; }
        else if (avgMarks < 65) { dbReasons.push('Below-average academic performance'); dbProbability += 0.15; }
        if (dbProbability > 0.6) dbRiskLevel = 'HIGH';
        else if (dbProbability > 0.35) dbRiskLevel = 'MEDIUM';

        // 5. Try AI service — fall back to DB logic if unavailable
        let aiRiskAnalysis = {
            prediction: dbRiskLevel === 'HIGH' ? 1 : 0,
            probability: Math.min(dbProbability, 0.99),
            risk_level: dbRiskLevel,
            reasons: dbReasons,
            avg_attendance: avgAtt,
            avg_marks: avgMarks
        };
        try {
            const aiRes = await axios.get(`http://localhost:8001/api/ai/predict-student-risk/${id}`, { timeout: 5000 });
            if (aiRes.data && !aiRes.data.error) {
                // Merge AI reasons with DB reasons for richer output
                const mergedReasons = [...new Set([...aiRes.data.reasons, ...dbReasons])];
                aiRiskAnalysis = { ...aiRes.data, reasons: mergedReasons, avg_attendance: avgAtt, avg_marks: avgMarks };
            }
        } catch (err) {
            console.warn('AI service unavailable, using DB-computed risk (fallback active):', err.message);
        }

        const riskEmoji = aiRiskAnalysis.risk_level === 'HIGH' ? '🔴' : aiRiskAnalysis.risk_level === 'MEDIUM' ? '🟡' : '🟢';
        const summary = `${riskEmoji} ${studentRes.rows[0].name} has a risk probability of ${(aiRiskAnalysis.probability * 100).toFixed(1)}% — classified as ${aiRiskAnalysis.risk_level} RISK. Attendance: ${avgAtt}% | Academic Score: ${avgMarks}%. ${
            aiRiskAnalysis.reasons.length > 0
                ? 'Primary concerns: ' + aiRiskAnalysis.reasons.join('; ') + '.'
                : 'No significant risk factors detected — student is performing well.'
        }`;

        res.json({
            success: true,
            data: {
                student: studentRes.rows[0],
                attendance: attendanceRes.rows,
                marks: marksRes.rows,
                reasons: aiRiskAnalysis.reasons,
                summary,
                ai_analysis: aiRiskAnalysis
            }
        });

    } catch (error) {
        console.error('Error fetching student risk report:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error', detail: error.message });
    }
};

// GET /api/admin/student-directory-rich
// GET /api/admin/student-directory-rich
exports.getRichStudentDirectory = async (req, res) => {
    try {
        let queryString = `
            WITH AssessmentData AS (
                SELECT
                    m.student_id,
                    ROUND(AVG(CASE WHEN m.type = 'Internal 1' THEN m.score * 100.0 / NULLIF(m.max_score,0) END), 1) AS internal1_pct,
                    ROUND(AVG(CASE WHEN m.type = 'Internal 2' THEN m.score * 100.0 / NULLIF(m.max_score,0) END), 1) AS internal2_pct,
                    ROUND(AVG(CASE WHEN m.type = 'Semester'   THEN m.score * 100.0 / NULLIF(m.max_score,0) END), 1) AS semester_pct
                FROM marks m
                GROUP BY m.student_id
            ),
            SubjectStats AS (
                SELECT 
                    m.student_id,
                    s.id as subject_id,
                    s.name as subject_name,
                    ROUND(AVG(m.score), 1) as avg_marks,
                    ROUND(COUNT(CASE WHEN ar.status = 'P' THEN 1 END) * 100.0 / NULLIF(COUNT(ar.id), 0), 1) as attd_rate
                FROM marks m
                JOIN subjects s ON m.subject_id = s.id
                LEFT JOIN attendance_sessions asess ON asess.subject_id = s.id
                LEFT JOIN attendance_records ar ON ar.session_id = asess.id AND ar.student_id = m.student_id
                GROUP BY m.student_id, s.id, s.name
            ),
            StudentAggregates AS (
                SELECT 
                    ss.student_id,
                    json_agg(
                        json_build_object(
                            'id', ss.subject_id,
                            'name', ss.subject_name,
                            'marks', COALESCE(ss.avg_marks, 0),
                            'attendance', COALESCE(ss.attd_rate, 0)
                        )
                    ) as subjects
                FROM SubjectStats ss
                GROUP BY ss.student_id
            )
            SELECT 
                s.id,
                u.id as user_id,
                u.name,
                s.enrollment_number as regno,
                c.course_code as course,
                b.name as batch,
                sem.name as semester,
                ROUND(
                    (SELECT COUNT(CASE WHEN status='P' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0) FROM attendance_records WHERE student_id = s.id),
                    1
                ) as overall_attendance,
                ROUND(
                    (SELECT AVG(score) FROM marks WHERE student_id = s.id), 1
                ) as avg_marks,
                COALESCE(sa.subjects, '[]'::json) as subjects,
            COALESCE(ad.internal1_pct, 0) AS internal1_pct,
            COALESCE(ad.internal2_pct, 0) AS internal2_pct,
            COALESCE(ad.semester_pct, 0)  AS semester_pct
            FROM students s
            JOIN users u ON s.user_id = u.id
            LEFT JOIN courses c ON s.course_id = c.id
            LEFT JOIN batch_years b ON s.batch_id = b.id
            LEFT JOIN semesters sem ON s.current_semester_id = sem.id
            LEFT JOIN StudentAggregates sa ON sa.student_id = s.id
            LEFT JOIN AssessmentData ad ON ad.student_id = s.id
            WHERE 1=1
        `;
        const values = [];
        const { course_id, batch_id, semester_id } = req.query;

        if (course_id) {
            values.push(course_id);
            queryString += ` AND s.course_id = $${values.length}`;
        }
        if (batch_id) {
            values.push(batch_id);
            queryString += ` AND s.batch_id = $${values.length}`;
        }
        if (semester_id) {
            values.push(semester_id);
            queryString += ` AND s.current_semester_id = $${values.length}`;
        }

        queryString += ` ORDER BY u.name ASC`;
        
        const finalResult = await pool.query(queryString, values);

        // Real assessment data from marks table (percentages of max_score)
        const enrichedData = finalResult.rows.map(row => ({
            ...row,
            overall_attendance: parseFloat(row.overall_attendance || 0),
            avg_marks:          parseFloat(row.avg_marks || 0),
            assessments: {
                quiz: parseFloat(row.internal1_pct || 0),
                cia:  parseFloat(row.internal2_pct || 0),
                sem:  parseFloat(row.semester_pct  || 0),
            }
        }));

        res.json({ success: true, data: enrichedData });
    } catch (error) {
        console.error('Error fetching rich student directory:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

// PATCH /api/admin/students/:id/enrollment
exports.updateStudentEnrollment = async (req, res) => {
    try {
        const { id } = req.params;
        const { semester_id, section_id } = req.body;

        if (!semester_id || !section_id) {
            return res.status(400).json({ success: false, message: 'Semester and Section are required.' });
        }

        const result = await pool.query(
            'UPDATE students SET current_semester_id = $1, current_section_id = $2 WHERE id = $3 RETURNING id',
            [semester_id, section_id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Student not found.' });
        }

        res.json({ success: true, message: 'Student academic placement updated successfully.' });
    } catch (error) {
        console.error('Error updating student enrollment:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

