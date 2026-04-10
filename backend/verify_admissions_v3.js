const { pool } = require('./src/config/db');
const axios = require('axios');

async function verifyAutomation() {
    try {
        console.log('🧹 Cleaning up old test data...');
        await pool.query("DELETE FROM students WHERE enrollment_number LIKE '26MCA%'");
        await pool.query("DELETE FROM users WHERE system_id LIKE '26MCA%'");
        await pool.query("DELETE FROM applications WHERE email = 'elijah.auto@example.com'");

        const API_URL = 'http://localhost:5000/api';
        
        // 1. Submit Application
        console.log('📝 Submitting Application...');
        const appRes = await axios.post(`${API_URL}/auth/apply`, {
            firstName: 'Elijah',
            lastName: 'Auto',
            email: 'elijah.auto@example.com',
            phone: '9876543211',
            course: 'MCA',
            previousDegree: 'BCA',
            previousCgpa: 98
        });
        const appId = appRes.data.applicationId;
        console.log(`✅ Application Submitted. ID: ${appId}`);

        // 2. Login as Admin
        console.log('🔑 Logging in as Admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@college.com',
            password: 'admin123'
        });
        const token = loginRes.data.token;

        // 3. Approve Application (This should trigger Auto-Enrollment)
        console.log('🎯 Approving Application (Auto-Enroll Trigger)...');
        const approveRes = await axios.put(`${API_URL}/admissions/applications/${appId}/status`, 
            { status: 'accepted', fee_amount: 85000 },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('✅ Approval Response:', approveRes.data.message);

        // 4. Verify Database
        console.log('🔍 Verifying Enrollment in Database...');
        const studentRes = await pool.query(
            "SELECT * FROM students s JOIN users u ON s.user_id = u.id WHERE u.email = 'elijah.auto@example.com'"
        );
        
        if (studentRes.rows.length > 0) {
            const student = studentRes.rows[0];
            console.log('✨ SUCCESS! Student found in enrollment table.');
            console.log(`- RegNo: ${student.enrollment_number}`);
            console.log(`- Batch ID: ${student.batch_id}`);
            console.log(`- Section ID: ${student.current_section_id}`);
            console.log(`- Password Hash Present: ${!!student.password}`);
        } else {
            console.error('❌ FAILED: Student not found in students table.');
        }

        const provRes = await pool.query(
            "SELECT * FROM provisional_admissions WHERE application_id = $1", [appId]
        );
        console.log(`- Provisional Admission is_paid: ${provRes.rows[0]?.is_paid}`);

    } catch (error) {
        console.error('❌ Verification Error:', error.response?.data || error.message);
    } finally {
        await pool.end();
    }
}

verifyAutomation();
