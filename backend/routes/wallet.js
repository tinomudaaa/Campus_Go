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

module.exports = router;