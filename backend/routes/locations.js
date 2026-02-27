const express = require('express');
const router = express.Router();
const pool = require('../db');

// Operator updates their location
router.post('/update', async (req, res) => {
  try {
    const { operator_id, latitude, longitude, route_id, number_plate } = req.body;

    // Get route name
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

// Stop sharing location (operator logs off)
router.delete('/stop/:operator_id', async (req, res) => {
  try {
    await pool.query('DELETE FROM locations WHERE operator_id = $1', [req.params.operator_id]);
    res.json({ message: 'Location removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;