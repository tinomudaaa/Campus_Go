const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/', async (req, res) => {
  try {
    const { student_id, route_id, message } = req.body;
    const result = await pool.query(
      'INSERT INTO feedback (student_id, route_id, message) VALUES ($1, $2, $3) RETURNING *',
      [student_id, route_id, message]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT feedback.*, users.full_name as student_name, routes.name as route_name
      FROM feedback
      LEFT JOIN users ON feedback.student_id = users.id
      LEFT JOIN routes ON feedback.route_id = routes.id
      ORDER BY feedback.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;