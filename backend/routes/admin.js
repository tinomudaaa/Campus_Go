const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');

// Middleware: platform_admin only
const requirePlatformAdmin = async (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const result = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
  if (!result.rows[0] || result.rows[0].role !== 'platform_admin') {
    return res.status(403).json({ error: 'Platform admin access required' });
  }
  req.adminId = userId;
  next();
};

// GET all companies
router.get('/companies', requirePlatformAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*,
        u.full_name as admin_name,
        u.email as admin_email,
        i.token as invite_token,
        i.status as invite_status,
        (SELECT COUNT(*) FROM users WHERE company_id = c.id AND role = 'operator_staff') as staff_count,
        (SELECT COUNT(*) FROM buses WHERE company_id = c.id) as bus_count
      FROM companies c
      LEFT JOIN users u ON u.company_id = c.id AND u.role = 'operator_admin'
      LEFT JOIN LATERAL (
        SELECT token, status FROM invites
        WHERE company_id = c.id
        ORDER BY created_at DESC LIMIT 1
      ) i ON true
      ORDER BY c.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create company + invite
router.post('/companies', requirePlatformAdmin, async (req, res) => {
  try {
    const { name, inviteEmail } = req.body;
    if (!name || !inviteEmail) return res.status(400).json({ error: 'Company name and email required' });

    // Create company
    const companyResult = await pool.query(
      'INSERT INTO companies (name, status, created_by) VALUES ($1, $2, $3) RETURNING *',
      [name, 'pending', req.adminId]
    );
    const company = companyResult.rows[0];

    // Generate invite token
    const token = crypto.randomBytes(32).toString('hex');
    await pool.query(
      'INSERT INTO invites (email, token, company_id, created_by) VALUES ($1, $2, $3, $4)',
      [inviteEmail, token, company.id, req.adminId]
    );

    res.json({
      company,
      inviteToken: token,
      invite_url: `http://localhost:5173/invite/${token}`,
      message: 'Company created and invite generated'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update company status (approve/suspend)
router.put('/companies/:id/status', requirePlatformAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'active', 'suspended'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    await pool.query('UPDATE companies SET status = $1 WHERE id = $2', [status, req.params.id]);
    res.json({ message: `Company ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all invites
router.get('/invites', requirePlatformAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT i.*, c.name as company_name
      FROM invites i
      LEFT JOIN companies c ON c.id = i.company_id
      ORDER BY i.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET system stats
router.get('/stats', requirePlatformAdmin, async (req, res) => {
  try {
    const [companies, operators, students, tickets] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM companies WHERE status = 'active'"),
      pool.query("SELECT COUNT(*) FROM users WHERE role IN ('operator_admin', 'operator_staff')"),
      pool.query("SELECT COUNT(*) FROM users WHERE role = 'student'"),
      pool.query("SELECT COUNT(*), COALESCE(SUM(fare), 0) as revenue FROM tickets"),
    ]);
    res.json({
      active_companies: companies.rows[0].count,
      total_operators: operators.rows[0].count,
      total_students: students.rows[0].count,
      total_tickets: tickets.rows[0].count,
      total_revenue: tickets.rows[0].revenue,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;