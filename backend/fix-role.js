const pool = require('./db'); pool.query("UPDATE users SET role='platform_admin' WHERE email='admin@campusgo.com'").then(r => { console.log('done'); pool.end(); })
