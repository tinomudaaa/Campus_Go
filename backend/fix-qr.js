const pool = require('./db'); pool.query("ALTER TABLE tickets ALTER COLUMN qr_code TYPE TEXT; ALTER TABLE tickets ALTER COLUMN ticket_code TYPE TEXT").then(r => { console.log('done'); pool.end(); })
