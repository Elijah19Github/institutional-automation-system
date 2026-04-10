const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function test() {
    try {
        const formData = new FormData();
        formData.append('course_name', 'test');
        formData.append('subject', 'test');
        formData.append('topic', 'test');
        formData.append('difficulty', 'E');
        formData.append('num_questions', 2);
        formData.append('content', 'test');

        console.log('Sending request to Python...');
        const res = await axios.post('http://127.0.0.1:8000/api/quiz/generate', formData, {
            headers: formData.getHeaders()
        });
        console.log('Success:', res.data);
    } catch (e) {
        console.error('Error:', e.response ? e.response.data : e.message);
    }
}
test();
