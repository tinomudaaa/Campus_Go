const pool = require('./db'); pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS balance DECIMAL(10,2) DEFAULT 0").then(r => { console.log('done'); pool.end(); })
