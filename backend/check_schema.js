const pool = require('./src/config/db');
(async () => {
    try {
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        const tables = res.rows.map(r => r.table_name);
        for (const table of tables) {
            const cols = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`);
            console.log(`Table: ${table}`);
            console.log(cols.rows.map(r => r.column_name));
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();
