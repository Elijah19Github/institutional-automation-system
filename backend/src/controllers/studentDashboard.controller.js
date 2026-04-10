const pool = require('../config/db');

exports.getStudentDashboardMetrics = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Get Student ID & Profile Info
        const studentRes = await pool.query('SELECT id, enrollment_number, current_section_id, batch_id FROM students WHERE user_id = $1', [userId]);
        
        // Handle case where student profile is not yet created/linked
        if (studentRes.rows.length === 0) {
            return res.json({ 
                success: true, 
                data: {
                    is_profile_incomplete: true,
                    attendance_rate: 0,
                    attendance_distribution: [{ name: 'Present', value: 0 }, { name: 'Absent', value: 0 }],
                    avg_marks: 0,
                    subject_performance: [],
                    marks_over_time: [],
                    risk: { risk_level: 'NONE', score: 0 },
                    notifications: []
                }
            });
        }
        const student = studentRes.rows[0];
        const studentId = student.id;

        // 2. Attendance Summary & Distribution
        const attendanceRes = await pool.query(`
            SELECT 
                COUNT(*) as total_classes,
                COUNT(CASE WHEN status = 'P' THEN 1 END) as attended,
                COUNT(CASE WHEN status = 'A' THEN 1 END) as absent
            FROM attendance_records
            WHERE student_id = $1
        `, [studentId]);
        const attData = attendanceRes.rows[0];
        const totalClasses = parseInt(attData.total_classes) || 0;
        const attended = parseInt(attData.attended) || 0;
        const absent = parseInt(attData.absent) || 0;
        const attendanceRate = totalClasses > 0 ? parseFloat((attended * 100 / totalClasses).toFixed(1)) : 0;

        // 3. Average Marks & Subject-wise Performance
        const marksRes = await pool.query(`
            SELECT 
                s.name as subject_name,
                ROUND(AVG(m.score * 100.0 / NULLIF(m.max_score, 0)), 1) as avg_score
            FROM marks m
            JOIN subjects s ON m.subject_id = s.id
            WHERE m.student_id = $1
            GROUP BY s.name
            ORDER BY avg_score DESC
        `, [studentId]);
        const subjectPerformance = marksRes.rows.map(r => ({
            subject: r.subject_name,
            avg_score: parseFloat(r.avg_score || 0)
        }));
        
        let overallAvgMarks = 0;
        if (subjectPerformance.length > 0) {
            overallAvgMarks = subjectPerformance.reduce((acc, curr) => acc + curr.avg_score, 0) / subjectPerformance.length;
            overallAvgMarks = parseFloat(overallAvgMarks.toFixed(1));
        }

        // 4. Marks Over Time (Assuming timeline based on created_at or type)
        const marksOverTimeRes = await pool.query(`
            SELECT 
                type || ' - ' || s.name as label,
                (score * 100.0 / NULLIF(max_score, 0)) as percentage,
                m.created_at
            FROM marks m
            JOIN subjects s ON m.subject_id = s.id
            WHERE m.student_id = $1
            ORDER BY m.created_at ASC
            LIMIT 10
        `, [studentId]);
        const marksOverTime = marksOverTimeRes.rows.map(r => ({
            date_label: new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            score: parseFloat(r.percentage).toFixed(1),
            type: r.label
        }));

        // 5. Risk Level
        const riskRes = await pool.query(`
            SELECT risk_level, score, calculated_at 
            FROM academic_risk 
            WHERE student_id = $1 
            ORDER BY calculated_at DESC 
            LIMIT 1
        `, [studentId]);
        const currentRisk = riskRes.rows.length > 0 ? riskRes.rows[0] : { risk_level: 'LOW', score: 0 };

        // 6. Recent Notifications (related to this user or global)
        const notificationsRes = await pool.query(`
            SELECT message, risk_level, created_at
            FROM notifications
            ORDER BY created_at DESC
            LIMIT 5
        `);
        const notifications = notificationsRes.rows;

        res.json({
            success: true,
            data: {
                attendance_rate: attendanceRate,
                attendance_distribution: [
                    { name: 'Present', value: attended },
                    { name: 'Absent', value: absent }
                ],
                avg_marks: overallAvgMarks,
                subject_performance: subjectPerformance,
                marks_over_time: marksOverTime,
                risk: currentRisk,
                notifications: notifications
            }
        });

    } catch (error) {
        console.error('Error fetching student dashboard metrics:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
