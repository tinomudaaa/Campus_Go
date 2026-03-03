import { useState } from 'react';
import axios from 'axios';
import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';

const borderAnimation = `
  @keyframes rotateBorder {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .login-card-wrapper {
    position: relative;
    width: 400px;
    border-radius: 20px;
    padding: 3px;
    z-index: 1;
  }

  .login-card-wrapper::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 22px;
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      transparent 270deg,
      #2DBE60 300deg,
      #7fffb2 340deg,
      transparent 360deg
    );
    animation: rotateBorder 3s linear infinite;
    z-index: -1;
  }

  .login-card-wrapper::after {
    content: '';
    position: absolute;
    inset: 2px;
    border-radius: 18px;
    background: #fff;
    z-index: -1;
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
      const msg = err.response?.data?.error || 'Invalid email or password';
      setError(msg);
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

      {/* Subtle green glow behind card */}
      <Box sx={{
        position: 'absolute',
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(45,190,96,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Faint grid pattern */}
      <Box sx={{
        position: 'absolute',
        inset: 0,
        backgroundImage: 'linear-gradient(rgba(45,190,96,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(45,190,96,0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        pointerEvents: 'none',
      }} />

      {/* Rotating border wrapper */}
      <div className="login-card-wrapper">
        <Card sx={{
          width: '100%',
          borderRadius: '18px',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          background: '#fff',
          position: 'relative',
          zIndex: 1,
        }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: 3,
                background: '#2DBE60',
                mb: 1.5,
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
              <TextField
                fullWidth label="Email" type="email" value={email}
                onChange={e => setEmail(e.target.value)} sx={{ mb: 2 }} required
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                fullWidth label="Password" type="password" value={password}
                onChange={e => setPassword(e.target.value)} sx={{ mb: 3 }} required
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Button fullWidth type="submit" variant="contained"
                sx={{
                  py: 1.5,
                  background: '#2DBE60',
                  borderRadius: 2,
                  fontSize: 16,
                  fontWeight: 'bold',
                  color: '#fff',
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
    </Box>
  );
}
