const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all buses for a company
router.get('/company/:company_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM buses WHERE company_id = $1 ORDER BY plate_number',
      [req.params.company_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a bus to a company
router.post('/', async (req, res) => {
  try {
    const { company_id, plate_number, capacity } = req.body;
    if (!company_id || !plate_number) {
      return res.status(400).json({ error: 'company_id and plate_number required' });
    }
    const result = await pool.query(
      'INSERT INTO buses (company_id, plate_number, capacity) VALUES ($1, $2, $3) RETURNING *',
      [company_id, plate_number.trim().toUpperCase(), parseInt(capacity) || 30]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a bus
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM buses WHERE id = $1', [req.params.id]);
    res.json({ message: 'Bus removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;