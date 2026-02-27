const express = require('express');
const router = express.Router();
const pool = require('../db');
const crypto = require('crypto');

// Middleware: operator_admin only
const requireOperatorAdmin = async (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const result = await pool.query('SELECT role, company_id FROM users WHERE id = $1', [userId]);
  if (!result.rows[0] || result.rows[0].role !== 'operator_admin') {
    return res.status(403).json({ error: 'Operator admin access required' });
  }
  req.adminId = userId;
  req.companyId = result.rows[0].company_id;
  next();
};

// GET staff
router.get('/staff', requireOperatorAdmin, async (req, res) => {
  try {
    const staffResult = await pool.query(
      `SELECT id, full_name, email, 'active' as status, created_at
       FROM users
       WHERE company_id = $1 AND role = 'operator_staff'
       ORDER BY full_name`,
      [req.companyId]
    );
    const inviteResult = await pool.query(
      `SELECT id, email, NULL as full_name, 'pending' as status, created_at
       FROM invites
       WHERE company_id = $1 AND role = 'operator_staff' AND status = 'pending'
       ORDER BY created_at DESC`,
      [req.companyId]
    );
    res.json([...staffResult.rows, ...inviteResult.rows]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST invite staff member
router.post('/invite-staff', requireOperatorAdmin, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const existingInvite = await pool.query(
      "SELECT id FROM invites WHERE email = $1 AND status = 'pending'",
      [email]
    );
    if (existingInvite.rows.length > 0) {
      return res.status(400).json({ error: 'An invite has already been sent to this email' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    await pool.query(
      'INSERT INTO invites (email, token, company_id, created_by, role) VALUES ($1, $2, $3, $4, $5)',
      [email, token, req.companyId, req.adminId, 'operator_staff']
    );

    const invite_url = `${process.env.FRONTEND_URL}/invite/${token}`;
    res.json({ message: 'Invite created', invite_url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET analytics
router.get('/analytics', requireOperatorAdmin, async (req, res) => {
  try {
    const companyId = req.companyId;

    const [buses, routes, staff, tickets, revenue, recentTickets] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM buses WHERE company_id = $1', [companyId]),
      pool.query('SELECT COUNT(*) FROM routes WHERE company_id = $1', [companyId]),
      pool.query("SELECT COUNT(*) FROM users WHERE company_id = $1 AND role = 'operator_staff'", [companyId]),
      pool.query(`
        SELECT COUNT(*) FROM tickets t
        JOIN routes r ON r.id = t.route_id
        WHERE r.company_id = $1
      `, [companyId]),
      pool.query(`
        SELECT COALESCE(SUM(t.fare), 0) as total
        FROM tickets t
        JOIN routes r ON r.id = t.route_id
        WHERE r.company_id = $1
      `, [companyId]),
      pool.query(`
        SELECT t.id, t.fare, t.created_at, r.name as route_name, u.full_name as student_name
        FROM tickets t
        JOIN routes r ON r.id = t.route_id
        JOIN users u ON u.id = t.user_id
        WHERE r.company_id = $1
        ORDER BY t.created_at DESC
        LIMIT 10
      `, [companyId]),
    ]);

    res.json({
      total_buses: parseInt(buses.rows[0].count),
      total_routes: parseInt(routes.rows[0].count),
      total_staff: parseInt(staff.rows[0].count),
      total_tickets: parseInt(tickets.rows[0].count),
      total_revenue: parseFloat(revenue.rows[0].total),
      recent_tickets: recentTickets.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET feedback for this company's routes
router.get('/feedback', requireOperatorAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT f.id, f.message, f.created_at,
             r.name as route_name,
             u.full_name as student_name
      FROM feedback f
      JOIN routes r ON r.id = f.route_id
      JOIN users u ON u.id = f.user_id
      WHERE r.company_id = $1
      ORDER BY f.created_at DESC
    `, [req.companyId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET trips for this company
router.get('/trips', requireOperatorAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.id, t.trip_date, t.departure_time, t.status, t.created_at,
             r.name as route_name, r.origin, r.destination, r.fare,
             b.plate_number,
             u.full_name as created_by_name
      FROM trips t
      JOIN routes r ON r.id = t.route_id
      JOIN buses b ON b.id = t.bus_id
      JOIN users u ON u.id = t.created_by
      WHERE t.company_id = $1
      ORDER BY t.trip_date DESC, t.departure_time DESC
    `, [req.companyId]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create a trip
router.post('/trips', requireOperatorAdmin, async (req, res) => {
  try {
    const { route_id, bus_id, trip_date, departure_time } = req.body;
    if (!route_id || !bus_id || !trip_date || !departure_time) {
      return res.status(400).json({ error: 'route_id, bus_id, trip_date, departure_time are required' });
    }
    const result = await pool.query(`
      INSERT INTO trips (company_id, route_id, bus_id, departure_time, trip_date, created_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [req.companyId, route_id, bus_id, departure_time, trip_date, req.adminId]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a trip
router.delete('/trips/:id', requireOperatorAdmin, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM trips WHERE id = $1 AND company_id = $2',
      [req.params.id, req.companyId]
    );
    res.json({ message: 'Trip removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH update trip status
router.patch('/trips/:id/status', requireOperatorAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const result = await pool.query(
      'UPDATE trips SET status = $1 WHERE id = $2 AND company_id = $3 RETURNING *',
      [status, req.params.id, req.companyId]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET routes
router.get('/routes', requireOperatorAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM routes WHERE company_id = $1 ORDER BY created_at DESC',
      [req.companyId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add route
router.post('/routes', requireOperatorAdmin, async (req, res) => {
  try {
    const { name, origin, destination, fare } = req.body;
    const result = await pool.query(
      'INSERT INTO routes (company_id, name, origin, destination, fare) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.companyId, name, origin, destination, fare]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE route
router.delete('/routes/:id', requireOperatorAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM routes WHERE id = $1 AND company_id = $2', [req.params.id, req.companyId]);
    res.json({ message: 'Route deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;