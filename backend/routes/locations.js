const express = require('express');
const router = express.Router();
const pool = require('../db');

// Start a trip session — called when operator clicks Start Trip
router.post('/start-session', async (req, res) => {
  try {
    const { operator_id, route_id, number_plate } = req.body;

    // Close any existing active session for this operator first
    await pool.query(
      `UPDATE trip_sessions SET status = 'ended', ended_at = NOW()
       WHERE operator_id = $1 AND status = 'active'`,
      [operator_id]
    );

    // Get route name
    let route_name = null;
    if (route_id) {
      const r = await pool.query('SELECT name FROM routes WHERE id = $1', [route_id]);
      if (r.rows.length > 0) route_name = r.rows[0].name;
    }

    // Create new session
    const result = await pool.query(
      `INSERT INTO trip_sessions (operator_id, route_id, number_plate, route_name, status)
       VALUES ($1, $2, $3, $4, 'active') RETURNING *`,
      [operator_id, route_id || null, number_plate, route_name]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get active session for an operator (called on page load to restore state)
router.get('/active-session/:operator_id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM trip_sessions
       WHERE operator_id = $1 AND status = 'active'
       ORDER BY started_at DESC LIMIT 1`,
      [req.params.operator_id]
    );
    res.json(result.rows[0] || null);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// End a trip session — called when operator clicks Stop Trip
router.post('/end-session/:session_id', async (req, res) => {
  try {
    await pool.query(
      `UPDATE trip_sessions SET status = 'ended', ended_at = NOW()
       WHERE id = $1`,
      [req.params.session_id]
    );
    res.json({ message: 'Session ended' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Operator updates their location
router.post('/update', async (req, res) => {
  try {
    const { operator_id, latitude, longitude, route_id, number_plate } = req.body;

    let route_name = null;
    if (route_id) {
      const r = await pool.query('SELECT name FROM routes WHERE id = $1', [route_id]);
      if (r.rows.length > 0) route_name = r.rows[0].name;
    }

    await pool.query(`
      INSERT INTO locations (operator_id, latitude, longitude, route_id, number_plate, route_name, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (operator_id)
      DO UPDATE SET
        latitude = $2,
        longitude = $3,
        route_id = $4,
        number_plate = $5,
        route_name = $6,
        updated_at = NOW()
    `, [operator_id, latitude, longitude, route_id, number_plate, route_name]);

    res.json({ message: 'Location updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all active buses (updated in last 2 minutes)
router.get('/active', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM locations
      WHERE updated_at > NOW() - INTERVAL '2 minutes'
      ORDER BY updated_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Stop sharing location
router.delete('/stop/:operator_id', async (req, res) => {
  try {
    await pool.query('DELETE FROM locations WHERE operator_id = $1', [req.params.operator_id]);
    res.json({ message: 'Location removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;