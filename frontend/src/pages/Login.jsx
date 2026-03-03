import { useState } from 'react';
import axios from 'axios';
import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';

const borderAnimation = `
  @keyframes chase1 {
    0%   { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  @keyframes chase2 {
    0%   { transform: rotate(120deg); }
    100% { transform: rotate(480deg); }
  }
  @keyframes chase3 {
    0%   { transform: rotate(240deg); }
    100% { transform: rotate(600deg); }
  }

  .login-outer {
    position: relative;
    width: 400px;
    border-radius: 20px;
    z-index: 1;
    padding: 3px;
    background: transparent;
  }

  .chaser {
    position: absolute;
    inset: -3px;
    border-radius: 22px;
    pointer-events: none;
  }

  /* Line 1 — bright green, fast */
  .chaser-1 {
    animation: chase1 1.6s linear infinite;
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      transparent 260deg,
      #2DBE60 300deg,
      #afffcf 340deg,
      transparent 360deg
    );
  }

  /* Line 2 — lighter green, medium */
  .chaser-2 {
    animation: chase2 2.2s linear infinite;
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      transparent 270deg,
      rgba(45,190,96,0.6) 310deg,
      rgba(175,255,207,0.7) 345deg,
      transparent 360deg
    );
  }

  /* Line 3 — faint, slow */
  .chaser-3 {
    animation: chase3 3s linear infinite;
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      transparent 280deg,
      rgba(45,190,96,0.35) 320deg,
      rgba(175,255,207,0.4) 350deg,
      transparent 360deg
    );
  }

  /* White fill keeps card interior clean */
  .login-inner-fill {
    position: absolute;
    inset: 3px;
    border-radius: 18px;
    background: #fff;
    z-index: 0;
  }

  .login-card-inner {
    position: relative;
    z-index: 1;
    border-radius: 18px;
    overflow: hidden;
  }
`;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('https://campusgo-production-3b90.up.railway.app/api/auth/login', { email, password });
      localStorage.setItem('campusgo_user', JSON.stringify(res.data));
      const role = res.data.role;
      if (role === 'platform_admin') window.location.href = '/admin';
      else if (role === 'student') window.location.href = '/student';
      else if (role === 'operator_staff') window.location.href = '/operator';
      else if (role === 'operator_admin') window.location.href = '/operator-admin';
      else window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(145deg, #2a2a2a 0%, #323232 50%, #2a2a2a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <style>{borderAnimation}</style>

      {/* Green glow blob */}
      <Box sx={{
        position: 'absolute',
        width: 500, height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(45,190,96,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Grid pattern */}
      <Box sx={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(45,190,96,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(45,190,96,0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Chasing border wrapper */}
      <div className="login-outer">
        <div className="chaser chaser-1" />
        <div className="chaser chaser-2" />
        <div className="chaser chaser-3" />
        <div className="login-inner-fill" />

        <div className="login-card-inner">
          <Card sx={{
            width: '100%',
            borderRadius: '18px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            background: '#fff',
          }}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Box sx={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 64, height: 64, borderRadius: 3, background: '#2DBE60', mb: 1.5,
                  boxShadow: '0 8px 24px rgba(45,190,96,0.35)',
                }}>
                  <DirectionsBusIcon sx={{ fontSize: 36, color: '#fff' }} />
                </Box>
                <Typography variant="h4" fontWeight="bold" color="#1a1a1a">Campus GO</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ letterSpacing: 1, textTransform: 'uppercase', fontSize: 11, mt: 0.5 }}>
                  Smart Campus Transit
                </Typography>
              </Box>

              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

              <Box component="form" onSubmit={handleLogin}>
                <TextField fullWidth label="Email" type="email" value={email}
                  onChange={e => setEmail(e.target.value)} sx={{ mb: 2 }} required
                  slotProps={{ inputLabel: { shrink: true } }} />
                <TextField fullWidth label="Password" type="password" value={password}
                  onChange={e => setPassword(e.target.value)} sx={{ mb: 3 }} required
                  slotProps={{ inputLabel: { shrink: true } }} />
                <Button fullWidth type="submit" variant="contained" sx={{
                  py: 1.5, background: '#2DBE60', borderRadius: 2,
                  fontSize: 16, fontWeight: 'bold', color: '#fff',
                  boxShadow: '0 4px 16px rgba(45,190,96,0.35)',
                  '&:hover': { background: '#25a653', boxShadow: '0 6px 20px rgba(45,190,96,0.45)' }
                }}>
                  Login
                </Button>

                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Don't have an account?</Typography>
                  <Button fullWidth variant="outlined" onClick={() => window.location.href = '/signup/student'}
                    sx={{ borderColor: '#2DBE60', color: '#2DBE60', '&:hover': { background: '#2DBE60', color: '#fff' } }}>
                    Student Sign Up
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </div>
      </div>
    </Box>
  );
}
