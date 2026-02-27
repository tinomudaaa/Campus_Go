const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all operators
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.full_name, u.email,
        bl.number_plate, bl.route_id, r.name as route_name,
        bl.updated_at as last_active
      FROM users u
      LEFT JOIN bus_locations bl ON bl.operator_id = u.id
      LEFT JOIN routes r ON r.id = bl.route_id
      WHERE u.role = 'operator'
      ORDER BY u.full_name
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update operator name/email
router.put('/:id', async (req, res) => {
  try {
    const { full_name, email } = req.body;
    await pool.query(
      'UPDATE users SET full_name = $1, email = $2 WHERE id = $3',
      [full_name, email, req.params.id]
    );
    res.json({ message: 'Operator updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update bus plate - only updates existing row, or inserts with old timestamp so it won't show as active
router.put('/:id/plate', async (req, res) => {
  try {
    const { number_plate } = req.body;
    const operatorId = req.params.id;

    const existing = await pool.query(
      'SELECT operator_id FROM bus_locations WHERE operator_id = $1',
      [operatorId]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE bus_locations SET number_plate = $1 WHERE operator_id = $2',
        [number_plate, operatorId]
      );
    } else {
      // Insert with old timestamp so it won't appear as an active bus
      await pool.query(`
        INSERT INTO bus_locations (operator_id, number_plate, latitude, longitude, updated_at)
        VALUES ($1, $2, 0, 0, '2000-01-01'::timestamp)
      `, [operatorId, number_plate]);
    }

    res.json({ message: 'Plate updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;