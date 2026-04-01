const pool = require('./db'); pool.query("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_code VARCHAR(255)").then(r => { console.log('done'); pool.end(); })
