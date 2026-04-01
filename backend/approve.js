const pool = require('./db'); pool.query("UPDATE companies SET status='active' WHERE id=1").then(r => { console.log('done'); pool.end(); })
