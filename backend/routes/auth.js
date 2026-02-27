const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');

router.post('/register', async (req, res) => {
  try {
    const { full_name, email, password, role } = req.body;
    if (role !== 'student') {
      return res.status(400).json({ error: 'Operator accounts are created via invite only' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userResult = await pool.query(
      'INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [full_name, email, hashedPassword, 'student']
    );
    await pool.query('INSERT INTO wallets (user_id, balance) VALUES ($1, 0)', [userResult.rows[0].id]);
    return res.json({ message: 'Student registered successfully' });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: err.message });
  }
});

router.post('/accept-invite', async (req, res) => {
  try {
    const { token, full_name, password } = req.body;
    if (!token || !full_name || !password) {
      return res.status(400).json({ error: 'Token, name, and password required' });
    }
    const inviteResult = await pool.query(
      "SELECT * FROM invites WHERE token = $1 AND status = 'pending'",
      [token]
    );
    if (inviteResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired invite' });
    }
    const invite = inviteResult.rows[0];
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [invite.email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const role = invite.role || 'operator_admin';
    await pool.query(
      'INSERT INTO users (full_name, email, password, role, company_id) VALUES ($1, $2, $3, $4, $5)',
      [full_name, invite.email, hashedPassword, role, invite.company_id]
    );
    await pool.query("UPDATE invites SET status = 'accepted' WHERE id = $1", [invite.id]);
    res.json({ message: 'Account created successfully. You can now log in.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/invite/:token', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT i.email, i.role, c.name as company_name 
       FROM invites i JOIN companies c ON c.id = i.company_id 
       WHERE i.token = $1 AND i.status = 'pending'`,
      [req.params.token]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired invite' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.role === 'operator_admin' || user.role === 'operator_staff') {
      if (user.company_id) {
        const companyResult = await pool.query('SELECT status FROM companies WHERE id = $1', [user.company_id]);
        const company = companyResult.rows[0];
        if (company && company.status !== 'active') {
          return res.status(403).json({
            error: company.status === 'pending'
              ? 'Your company is pending approval by the platform admin.'
              : 'Your company has been suspended. Please contact support.',
            company_status: company.status
          });
        }
      }
    }
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;