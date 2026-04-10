const axios = require('axios');

async function testDashboard() {
    try {
        const response = await axios.get('http://localhost:5000/api/admin/dashboard', {
            headers: { 'Authorization': 'Bearer YOUR_TOKEN_HERE' }
        });
        console.log('✅ Dashboard API Response:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('❌ Status:', error.response.status);
            console.error('❌ Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('❌ Network/Other Error:', error.message);
        }
    }
}

// Note: This script needs a token. 
// Since I don't have the token readily available in a copy-paste format, 
// I'll try to reach the endpoint with a browser subagent first.
