const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get all routes
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT routes.*, companies.name as company_name 
      FROM routes 
      LEFT JOIN companies ON routes.company_id = companies.id
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a route (admin/operator only)
router.post('/', async (req, res) => {
  try {
    const { company_id, name, origin, destination, fare } = req.body;
    const result = await pool.query(
      'INSERT INTO routes (company_id, name, origin, destination, fare) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [company_id, name, origin, destination, fare]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a route
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tickets WHERE route_id = $1', [req.params.id]);
    await pool.query('DELETE FROM routes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Route deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;