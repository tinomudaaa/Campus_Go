const express = require('express');
const router = express.Router();
const pool = require('../db');
const QRCode = require('qrcode');

// Buy a ticket
router.post('/buy', async (req, res) => {
  try {
    const { student_id, route_id, bus_id } = req.body;

    // Get fare
    const routeResult = await pool.query('SELECT fare FROM routes WHERE id = $1', [route_id]);
    if (routeResult.rows.length === 0) return res.status(404).json({ error: 'Route not found' });
    const fare = routeResult.rows[0].fare;

    // Check balance
    const userResult = await pool.query('SELECT balance FROM users WHERE id = $1', [student_id]);
    if (userResult.rows[0].balance < fare) return res.status(400).json({ error: 'Insufficient balance' });

    // Deduct balance
    await pool.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [fare, student_id]);

    // Generate QR code
    const qrData = `campusgo-ticket-${student_id}-${route_id}-${Date.now()}`;
    const qrCode = await QRCode.toDataURL(qrData);

    // Create ticket
    const ticket = await pool.query(
      'INSERT INTO tickets (student_id, route_id, bus_id, qr_code, fare) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [student_id, route_id, bus_id, qrCode, fare]
    );

    res.json(ticket.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get student's tickets
router.get('/:student_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT tickets.*, routes.name as route_name, routes.origin, routes.destination FROM tickets LEFT JOIN routes ON tickets.route_id = routes.id WHERE tickets.student_id = $1',
      [req.params.student_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;