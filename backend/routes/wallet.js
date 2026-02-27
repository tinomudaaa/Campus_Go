const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all students with balances
router.get('/students', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, student_id, balance FROM users WHERE role = $1 ORDER BY full_name',
      ['student']
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Top up a student's balance
router.post('/topup', async (req, res) => {
  try {
    const { student_id, amount } = req.body;
    if (amount <= 0) return res.status(400).json({ error: 'Amount must be greater than 0' });

    const result = await pool.query(
      'UPDATE users SET balance = balance + $1 WHERE id = $2 RETURNING id, full_name, email, balance',
      [amount, student_id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found' });

    res.json({ message: 'Balance topped up successfully', user: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const totalTickets = await pool.query('SELECT COUNT(*) FROM tickets');
    const totalRevenue = await pool.query('SELECT SUM(fare) FROM tickets');
    const totalStudents = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'student'");
    const ticketsByRoute = await pool.query(`
      SELECT routes.name, COUNT(tickets.id) as ticket_count, SUM(tickets.fare) as revenue
      FROM tickets
      LEFT JOIN routes ON tickets.route_id = routes.id
      GROUP BY routes.name
      ORDER BY ticket_count DESC
    `);
    const ticketsByDay = await pool.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM tickets
      GROUP BY DATE(created_at)
      ORDER BY date ASC
      LIMIT 7
    `);

    res.json({
      totalTickets: totalTickets.rows[0].count,
      totalRevenue: totalRevenue.rows[0].sum || 0,
      totalStudents: totalStudents.rows[0].count,
      ticketsByRoute: ticketsByRoute.rows,
      ticketsByDay: ticketsByDay.rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;