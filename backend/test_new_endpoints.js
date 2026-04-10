const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@college.com';
const ADMIN_PASSWORD = 'admin123';

async function test() {
    try {
        console.log('🔑 Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
        });

        const { token } = loginRes.data;
        console.log(`✅ Login Success!`);

        // 1. Test Attendance Breakdown
        console.log('\n📊 Testing Attendance Breakdown...');
        const attRes = await axios.get(`${API_URL}/admin/metrics/attendance-breakdown`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Attendance Breakdown:', JSON.stringify(attRes.data.data, null, 2));

        // 2. Test Performance Breakdown
        console.log('\n📈 Testing Performance Breakdown...');
        const perfRes = await axios.get(`${API_URL}/admin/metrics/performance-breakdown`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ Performance Breakdown:', JSON.stringify(perfRes.data.data, null, 2));

        // 3. Test Course Details
        // Get a course ID first
        const coursesRes = await axios.get(`${API_URL}/admin/courses`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const courseId = coursesRes.data.data[0]?.id;
        
        if (courseId) {
            console.log(`\n📚 Testing Course Details for ID: ${courseId}...`);
            const courseDetailsRes = await axios.get(`${API_URL}/admin/courses/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('✅ Course Details:', JSON.stringify(courseDetailsRes.data.data, null, 2));
        } else {
            console.log('\n❌ No courses found to test details.');
        }

    } catch (error) {
        console.error('❌ Test Failed!');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Message:', error.message);
        }
    }
}

test();
