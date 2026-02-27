const pool = require('./db');

pool.query(`
  ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_by INTEGER;
  ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
  ALTER TABLE invites ADD COLUMN IF NOT EXISTS created_by INTEGER;
  ALTER TABLE invites ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
`)
.then(() => { console.log('Schema updated!'); process.exit(); })
.catch(e => { console.error(e.message); process.exit(1); });