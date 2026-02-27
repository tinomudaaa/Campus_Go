import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';

export default function AcceptInvite() {
  const { token } = useParams();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/auth/invite/${token}`)
      .then(res => { setInvite(res.data); setLoading(false); })
      .catch(() => { setError('This invite link is invalid or has already been used.'); setLoading(false); });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setError('Passwords do not match');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    setSubmitting(true);
    setError('');
    try {
      await axios.post('http://localhost:5000/api/auth/accept-invite', { token, full_name: fullName, password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  // Human-readable role label
  const roleLabel = invite?.role === 'operator_staff' ? 'Operator Staff (Driver)' : 'Operator Admin';

  return (
    <Box sx={{ minHeight: '100vh', background: '#1F1F1F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card sx={{ width: 420, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <DirectionsBusIcon sx={{ fontSize: 48, color: '#2DBE60' }} />
            <Typography variant="h5" fontWeight="bold" color="#1F1F1F">Campus GO</Typography>
            <Typography variant="body2" color="text.secondary">
              {invite?.role === 'operator_staff' ? 'Staff Invite' : 'Operator Invite'}
            </Typography>
          </Box>

          {loading && <Box sx={{ textAlign: 'center' }}><CircularProgress color="success" /></Box>}

          {!loading && error && !invite && (
            <Alert severity="error">{error}</Alert>
          )}

          {!loading && success && (
            <Box sx={{ textAlign: 'center' }}>
              <Alert severity="success" sx={{ mb: 3 }}>Account created successfully!</Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                You can now log in with your email and password.
              </Typography>
              <Button fullWidth variant="contained" onClick={() => window.location.href = '/'}
                sx={{ background: '#2DBE60', fontWeight: 'bold', '&:hover': { background: '#1F1F1F' } }}>
                Go to Login
              </Button>
            </Box>
          )}

          {!loading && invite && !success && (
            <>
              <Alert severity="info" sx={{ mb: 3 }}>
                You've been invited to join <strong>{invite.company_name}</strong> as <strong>{roleLabel}</strong>.<br />
                <Typography variant="caption">Account email: {invite.email}</Typography>
              </Alert>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Box component="form" onSubmit={handleSubmit}>
                <TextField fullWidth label="Your Full Name" value={fullName}
                  onChange={e => setFullName(e.target.value)} sx={{ mb: 2 }} required />
                <TextField fullWidth label="Password" type="password" value={password}
                  onChange={e => setPassword(e.target.value)} sx={{ mb: 2 }} required />
                <TextField fullWidth label="Confirm Password" type="password" value={confirm}
                  onChange={e => setConfirm(e.target.value)} sx={{ mb: 3 }} required />
                <Button fullWidth type="submit" variant="contained" disabled={submitting}
                  sx={{ py: 1.5, background: '#2DBE60', fontWeight: 'bold', '&:hover': { background: '#1F1F1F' } }}>
                  {submitting ? 'Creating Account...' : 'Create Account'}
                </Button>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
