const { pool } = require('./src/config/db');

async function migrate() {
    try {
        await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS system_id VARCHAR(50) UNIQUE');

        const users = await pool.query('SELECT id, role, email FROM users');
        let adminCount = 1;
        let facCount = 1;
        
        for (let user of users.rows) {
            const role = user.role ? user.role.toUpperCase() : 'UNKNOWN';
            
            if (role === 'ADMIN' || role === 'SUPADMIN') {
                const sysId = `26ADM${String(adminCount).padStart(2, '0')}`;
                // Set system_id and change their password to their new ID for easy login mapping
                const bcrypt = require('bcryptjs');
                const hash = await bcrypt.hash(sysId, 10);
                await pool.query('UPDATE users SET system_id = $1, password = $2 WHERE id = $3', [sysId, hash, user.id]);
                console.log(`Updated Admin [${user.email}] ID & Pass: ${sysId}`);
                adminCount++;
            } else if (role === 'FACULTY') {
                const sysId = `26FAC${String(facCount).padStart(2, '0')}`;
                const bcrypt = require('bcryptjs');
                const hash = await bcrypt.hash(sysId, 10);
                await pool.query('UPDATE users SET system_id = $1, password = $2 WHERE id = $3', [sysId, hash, user.id]);
                await pool.query('UPDATE faculty SET employee_id = $1 WHERE user_id = $2', [sysId, user.id]);
                console.log(`Updated Faculty [${user.email}] ID & Pass: ${sysId}`);
                facCount++;
            } else if (role === 'STUDENT') {
                // Keep students mapped properly if they were already created 
                const student = await pool.query('SELECT enrollment_number FROM students WHERE user_id = $1', [user.id]);
                if (student.rows.length > 0) {
                    await pool.query('UPDATE users SET system_id = $1 WHERE id = $2', [student.rows[0].enrollment_number, user.id]);
                }
            }
        }
        
        console.log('✅ Staff & Universal IDs successfully normalized.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
migrate();
