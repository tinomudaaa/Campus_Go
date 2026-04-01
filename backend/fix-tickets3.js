const pool = require('./db'); pool.query("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS bus_id INTEGER").then(r => { console.log('done'); pool.end(); })
