const express = require('express');
const router = express.Router();
const pool = require('../db');

// Get notifications for a user (unread count + list)
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];
    const companyId = req.headers['x-company-id'];

    const result = await pool.query(`
      SELECT n.*, 
        CASE WHEN nr.id IS NOT NULL THEN true ELSE false END as is_read
      FROM notifications n
      LEFT JOIN notification_reads nr ON nr.notification_id = n.id AND nr.user_id = $1
      WHERE n.target_role = $2 OR n.target_role = 'all'
      ORDER BY n.created_at DESC
      LIMIT 50
    `, [userId, userRole]);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark notification as read
router.post('/:id/read', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    await pool.query(`
      INSERT INTO notification_reads (notification_id, user_id)
      VALUES ($1, $2) ON CONFLICT DO NOTHING
    `, [req.params.id, userId]);
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin/operator sends a notification
router.post('/', async (req, res) => {
  try {
    const { title, message, type, target_role, company_id } = req.body;
    const createdBy = req.headers['x-user-id'];
    const result = await pool.query(`
      INSERT INTO notifications (title, message, type, target_role, company_id, created_by)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
    `, [title, message, type || 'info', target_role || 'student', company_id || null, createdBy]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a notification (admin only)
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM notifications WHERE id = $1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;