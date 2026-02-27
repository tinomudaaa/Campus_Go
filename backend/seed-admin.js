const pool = require('./db');
const bcrypt = require('bcrypt');

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  await pool.query(
    'INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
    ['Admin', 'admin@campusgo.com', hash, 'admin']
  );
  console.log('Admin created!');
  process.exit();
}

main().catch(e => { console.error(e.message); process.exit(1); });