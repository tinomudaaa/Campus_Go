const pool = require('./db');

async function testBuy() {
  try {
    // Test 1: Check Victor's balance
    const user = await pool.query('SELECT id, full_name, balance FROM users WHERE id = 1');
    console.log('Victor:', user.rows[0]);

    // Test 2: Check route exists
    const route = await pool.query('SELECT * FROM routes WHERE id = 1');
    console.log('Route:', route.rows[0]);

    // Test 3: Try the exact INSERT
    const ticket_code = 'CGO-TEST1';
    const qrCode = 'test-qr';
    const fare = route.rows[0].fare;

    const ticket = await pool.query(
      'INSERT INTO tickets (user_id, route_id, bus_id, qr_code, fare, ticket_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [1, 1, null, qrCode, fare, ticket_code]
    );
    console.log('Ticket created:', ticket.rows[0]);

    // Clean up test ticket
    await pool.query('DELETE FROM tickets WHERE ticket_code = $1', ['CGO-TEST1']);
    console.log('Test passed! Ticket buy works.');
  } catch (err) {
    console.error('ERROR:', err.message);
  }
  process.exit();
}

testBuy();