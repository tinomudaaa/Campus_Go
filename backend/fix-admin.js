const pool = require('./db');

pool.query("UPDATE users SET role = 'platform_admin' WHERE email = 'admin@campusgo.com'")
  .then(() => { console.log('Done!'); process.exit(); })
  .catch(e => { console.error(e.message); process.exit(1); });