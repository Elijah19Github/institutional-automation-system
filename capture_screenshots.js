const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, 'docs', 'screenshots');

if (!fs.existsSync(SCREENSHOT_DIR)) {
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
    console.log('Starting Puppeteer...');
    const browser = await puppeteer.launch({ 
        executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        headless: 'new',
        defaultViewport: { width: 1440, height: 900 }
    });
    const page = await browser.newPage();
    
    // We will navigate to the running frontend app
    const baseUrl = 'http://localhost:5173';

    try {
        console.log('Taking Login Page screenshot...');
        await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle2' });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_LoginPage.png') });

        // Admin Login
        console.log('Logging in as Admin...');
        await page.type('input[placeholder="name@campus.edu or 26MCA01"]', 'admin@college.com');
        await page.type('input[placeholder="••••••••••••"]', 'admin123');
        await page.click('button[type="submit"]');
        await delay(5000); // Wait for dashboard to load
        
        console.log('Taking Admin Dashboard screenshot...');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_AdminDashboard.png') });

        // Logout
        await page.evaluate(() => {
            localStorage.clear();
        });
        await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle2' });

        // Faculty Login
        console.log('Logging in as Faculty...');
        await page.type('input[placeholder="name@campus.edu or 26MCA01"]', 'fac_mca@college.com');
        await page.type('input[placeholder="••••••••••••"]', 'password123');
        await page.click('button[type="submit"]');
        await delay(5000);

        console.log('Taking Faculty Dashboard screenshot...');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_FacultyDashboard.png') });

        console.log('Taking Attendance Entry screenshot...');
        await page.goto(`${baseUrl}/faculty/attendance-control`, { waitUntil: 'networkidle2' });
        await delay(2000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_AttendanceEntry.png') });

        console.log('Taking Marks Entry screenshot...');
        await page.goto(`${baseUrl}/faculty/marks`, { waitUntil: 'networkidle2' });
        await delay(2000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_MarksEntry.png') });

        // Logout
        await page.evaluate(() => {
            localStorage.clear();
        });
        await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle2' });

        // Student Login
        console.log('Logging in as Student...');
        await page.type('input[placeholder="name@campus.edu or 26MCA01"]', 'student1@college.com');
        await page.type('input[placeholder="••••••••••••"]', 'password123');
        await page.click('button[type="submit"]');
        await delay(5000);

        console.log('Taking Student Dashboard screenshot...');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_StudentDashboard.png') });

        console.log('Taking Quiz Interface screenshot...');
        await page.goto(`${baseUrl}/student/quiz-library`, { waitUntil: 'networkidle2' });
        await delay(2000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_QuizInterface.png') });

        // Admin Risk Dashboard
        console.log('Logging in as Admin again for Risk Dashboard...');
        await page.evaluate(() => {
            localStorage.clear();
        });
        await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle2' });
        await page.type('input[placeholder="name@campus.edu or 26MCA01"]', 'admin@college.com');
        await page.type('input[placeholder="••••••••••••"]', 'admin123');
        await page.click('button[type="submit"]');
        await delay(5000);

        console.log('Taking AI Risk Dashboard screenshot...');
        await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle2' });
        await delay(2000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_AIRiskDashboard.png') });

        console.log('All screenshots captured successfully.');
    } catch (e) {
        console.error('Error taking screenshots:', e);
    } finally {
        await browser.close();
    }
})();
