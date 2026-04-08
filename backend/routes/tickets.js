const express = require('express');
const router = express.Router();
const pool = require('../db');
const QRCode = require('qrcode');
const crypto = require('crypto');

const generateTicketCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
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

    const routeResult = await pool.query('SELECT fare FROM routes WHERE id = $1', [route_id]);
    if (routeResult.rows.length === 0) return res.status(404).json({ error: 'Route not found' });
    const fare = routeResult.rows[0].fare;

    const userResult = await pool.query('SELECT balance FROM users WHERE id = $1', [student_id]);
    if (userResult.rows[0].balance < fare) return res.status(400).json({ error: 'Insufficient balance' });

    await pool.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [fare, student_id]);

    let ticket_code;
    let unique = false;
    while (!unique) {
      ticket_code = generateTicketCode();
      const existing = await pool.query('SELECT id FROM tickets WHERE ticket_code = $1', [ticket_code]);
      if (existing.rows.length === 0) unique = true;
    }

    const qrCode = await QRCode.toDataURL(ticket_code);

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

// Scan / validate a ticket
router.post('/scan', async (req, res) => {
  try {
    const { qr_code, session_id, operator_id } = req.body;
    if (!qr_code) return res.status(400).json({ error: 'No ticket data provided' });

    const isTicketCode = /^CGO-[A-Z0-9]{5}$/.test(qr_code.trim().toUpperCase());

    let result;
    if (isTicketCode) {
      result = await pool.query(
        `SELECT tickets.*, users.full_name as student_name, routes.name as route_name
         FROM tickets
         LEFT JOIN users ON tickets.user_id = users.id
         LEFT JOIN routes ON tickets.route_id = routes.id
         WHERE UPPER(tickets.ticket_code) = $1`,
        [qr_code.trim().toUpperCase()]
      );
    } else {
      result = await pool.query(
        `SELECT tickets.*, users.full_name as student_name, routes.name as route_name
         FROM tickets
         LEFT JOIN users ON tickets.user_id = users.id
         LEFT JOIN routes ON tickets.route_id = routes.id
         WHERE tickets.qr_code = $1`,
        [qr_code]
      );
    }

    if (result.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    const ticket = result.rows[0];
    if (ticket.status === 'used') return res.status(400).json({ error: 'Ticket already used' });
    if (ticket.status === 'expired') return res.status(400).json({ error: 'Ticket has expired' });

    const updated = await pool.query(
      `UPDATE tickets 
       SET status = 'used', scanned_at = NOW(), session_id = $2, scanned_by = $3
       WHERE id = $1 RETURNING *`,
      [ticket.id, session_id || null, operator_id || null]
    );

    res.json({ ...updated.rows[0], student_name: ticket.student_name, route_name: ticket.route_name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get scanned tickets for a specific session
router.get('/session/:session_id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tickets.*, users.full_name as student_name, routes.name as route_name
       FROM tickets
       LEFT JOIN users ON tickets.user_id = users.id
       LEFT JOIN routes ON tickets.route_id = routes.id
       WHERE tickets.session_id = $1
       ORDER BY tickets.scanned_at DESC`,
      [req.params.session_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;