const pool = require('./db');

async function fix() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id SERIAL PRIMARY KEY,
        company_id INTEGER,
        route_id INTEGER,
        bus_id INTEGER,
        trip_date DATE,
        departure_time TIME,
        status VARCHAR(50) DEFAULT 'scheduled',
        created_by INTEGER,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('trips table OK');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        operator_id INTEGER,
        route_id INTEGER,
        latitude DECIMAL(10,7),
        longitude DECIMAL(10,7),
        number_plate VARCHAR(50),
        route_name VARCHAR(255),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('locations table OK');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        student_id INTEGER UNIQUE,
        balance DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('wallets table OK');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        student_id INTEGER,
        route_id INTEGER,
        fare DECIMAL(10,2),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('tickets table OK');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id SERIAL PRIMARY KEY,
        student_id INTEGER,
        route_id INTEGER,
        message TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('feedback table OK');

    console.log('All done!');
    process.exit();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

fix();