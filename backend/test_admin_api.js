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

        // The authRoutes.js returns { success, token, user: { id, name, email, role } }
        const { token, user } = loginRes.data;
        const { role, name } = user;
        console.log(`✅ Login Success! Role: ${role}, Name: ${name}`);

        console.log('\n📊 Fetching Dashboard Metrics...');
        const dashboardRes = await axios.get(`${API_URL}/admin/dashboard`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Dashboard Data:', JSON.stringify(dashboardRes.data, null, 2));

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
