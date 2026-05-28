const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'blogify', password: '123456789', port: 5432 });
(async () => {
  try {
    const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('subscribed','posts')");
    console.log('tables', tables.rows);
    const cols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='subscribed'");
    console.log('sub columns', cols.rows);
    const sample = await pool.query('SELECT * FROM subscribed LIMIT 2');
    console.log('sample', sample.rows);
  } catch (e) {
    console.error('ERR', e.message);
  } finally {
    await pool.end();
  }
})();
