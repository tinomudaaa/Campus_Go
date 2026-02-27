const express = require('express');
const router = express.Router();
const pool = require('../db');

router.post('/update', async (req, res) => {
  console.log('📦 Body received:', req.body);
  try {
    const { operator_id, latitude, longitude, route_id, number_plate } = req.body;
    await pool.query(`
      INSERT INTO bus_locations (operator_id, latitude, longitude, route_id, number_plate, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      ON CONFLICT (operator_id)
      DO UPDATE SET 
        latitude = $2, 
        longitude = $3, 
        route_id = $4, 
        number_plate = $5, 
        updated_at = NOW()
    `, [operator_id, latitude, longitude, route_id, number_plate]);
    res.json({ message: 'Location updated' });
  } catch (err) {
    console.error('❌ Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/active', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT bus_locations.*, routes.name as route_name
      FROM bus_locations
      LEFT JOIN routes ON bus_locations.route_id = routes.id
      WHERE bus_locations.updated_at > NOW() - INTERVAL '10 minutes'
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/stop/:operator_id', async (req, res) => {
  try {
    await pool.query('DELETE FROM bus_locations WHERE operator_id = $1', [req.params.operator_id]);
    res.json({ message: 'Trip stopped' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;