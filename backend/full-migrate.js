const pool = require('./db');
async function migrate() {
  await pool.query(`
    ALTER TABLE companies ADD COLUMN IF NOT EXISTS created_by INTEGER;
    ALTER TABLE companies ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS student_id VARCHAR(100);
    ALTER TABLE invites ADD COLUMN IF NOT EXISTS created_by INTEGER;
    CREATE TABLE IF NOT EXISTS routes (id SERIAL PRIMARY KEY, company_id INTEGER, name VARCHAR(255), origin VARCHAR(255), destination VARCHAR(255), fare DECIMAL(10,2), created_at TIMESTAMP DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS buses (id SERIAL PRIMARY KEY, company_id INTEGER REFERENCES companies(id), number_plate VARCHAR(50), route_id INTEGER, created_at TIMESTAMP DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS tickets (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), route_id INTEGER REFERENCES routes(id), fare DECIMAL(10,2), status VARCHAR(50) DEFAULT 'active', qr_code VARCHAR(255), created_at TIMESTAMP DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS feedback (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), route_id INTEGER, message TEXT, created_at TIMESTAMP DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS locations (id SERIAL PRIMARY KEY, operator_id INTEGER REFERENCES users(id), latitude DECIMAL(10,7), longitude DECIMAL(10,7), route_id INTEGER, number_plate VARCHAR(50), route_name VARCHAR(255), updated_at TIMESTAMP DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS trips (id SERIAL PRIMARY KEY, operator_id INTEGER REFERENCES users(id), route_id INTEGER REFERENCES routes(id), company_id INTEGER, status VARCHAR(50) DEFAULT 'scheduled', created_at TIMESTAMP DEFAULT NOW());
  `);
  console.log('All tables created!');
  pool.end();
}
migrate().catch(e => { console.error(e.message); pool.end(); });