const pool = require('./db');
pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'tickets' ORDER BY ordinal_position")
  .then(r => { console.log('Tickets columns:', r.rows.map(c => c.column_name)); process.exit(); })
  .catch(e => { console.error(e.message); process.exit(1); });