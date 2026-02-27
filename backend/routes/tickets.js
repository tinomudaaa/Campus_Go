const express = require('express');
const router = express.Router();
const pool = require('../db');
const QRCode = require('qrcode');
const crypto = require('crypto');

// Generate a short readable ticket code like CGO-4X7K2
const generateTicketCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no O/0/I/1 confusion
  let code = 'CGO-';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

// Buy a ticket
router.post('/buy', async (req, res) => {
  try {
    const { student_id, route_id, bus_id } = req.body;
    const user_id = student_id;

    // Get fare
    const routeResult = await pool.query('SELECT fare FROM routes WHERE id = $1', [route_id]);
    if (routeResult.rows.length === 0) return res.status(404).json({ error: 'Route not found' });
    const fare = routeResult.rows[0].fare;

    // Check balance
    const userResult = await pool.query('SELECT balance FROM users WHERE id = $1', [student_id]);
    if (userResult.rows[0].balance < fare) return res.status(400).json({ error: 'Insufficient balance' });

    // Deduct balance
    await pool.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [fare, student_id]);

    // Generate unique ticket code
    let ticket_code;
    let unique = false;
    while (!unique) {
      ticket_code = generateTicketCode();
      const existing = await pool.query('SELECT id FROM tickets WHERE ticket_code = $1', [ticket_code]);
      if (existing.rows.length === 0) unique = true;
    }

    // Generate QR code (encode the ticket_code, not raw data)
    const qrCode = await QRCode.toDataURL(ticket_code);

    // Create ticket
    const ticket = await pool.query(
      'INSERT INTO tickets (user_id, route_id, bus_id, qr_code, fare, ticket_code) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [student_id, route_id, bus_id, qrCode, fare, ticket_code]
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
      `SELECT tickets.*, routes.name as route_name, routes.origin, routes.destination 
       FROM tickets 
       LEFT JOIN routes ON tickets.route_id = routes.id 
       WHERE tickets.user_id = $1
       ORDER BY tickets.created_at DESC`,
      [req.params.student_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Scan / validate a ticket — supports both qr_code (base64) and ticket_code (CGO-XXXXX)
router.post('/scan', async (req, res) => {
  try {
    const { qr_code } = req.body;
    if (!qr_code) return res.status(400).json({ error: 'No ticket data provided' });

    // Determine if this is a short ticket code or full QR data
    const isTicketCode = /^CGO-[A-Z0-9]{6}$/.test(qr_code.trim().toUpperCase());

    let result;
    if (isTicketCode) {
      // Manual code entry
      result = await pool.query(
        `SELECT tickets.*, users.full_name as student_name, routes.name as route_name
         FROM tickets
         LEFT JOIN users ON tickets.student_id = users.id
         LEFT JOIN routes ON tickets.route_id = routes.id
         WHERE UPPER(tickets.ticket_code) = $1`,
        [qr_code.trim().toUpperCase()]
      );
    } else {
      // QR scan (full base64 or legacy qr_data string)
      result = await pool.query(
        `SELECT tickets.*, users.full_name as student_name, routes.name as route_name
         FROM tickets
         LEFT JOIN users ON tickets.student_id = users.id
         LEFT JOIN routes ON tickets.route_id = routes.id
         WHERE tickets.qr_code = $1`,
        [qr_code]
      );
    }

    if (result.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    const ticket = result.rows[0];
    if (ticket.status === 'used') return res.status(400).json({ error: 'Ticket already used' });
    if (ticket.status === 'expired') return res.status(400).json({ error: 'Ticket has expired' });

    // Mark as used
    const updated = await pool.query(
      `UPDATE tickets SET status = 'used', scanned_at = NOW() WHERE id = $1 RETURNING *`,
      [ticket.id]
    );

    res.json({ ...updated.rows[0], student_name: ticket.student_name, route_name: ticket.route_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;