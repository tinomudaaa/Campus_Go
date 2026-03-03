import { useState } from 'react';
import axios from 'axios';
import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';

const borderAnimation = `
  @keyframes clockwise {
    from { stroke-dashoffset: 1200; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes counter {
    from { stroke-dashoffset: 0; }
    to   { stroke-dashoffset: 1200; }
  }

  .login-outer {
    position: relative;
    width: 400px;
    z-index: 1;
  }

  .login-border-svg {
    position: absolute;
    top: -3px;
    left: -3px;
    width: calc(100% + 6px);
    height: calc(100% + 6px);
    pointer-events: none;
    z-index: 2;
    overflow: visible;
  }

  /* Clockwise line */
  .trace-cw {
    fill: none;
    stroke: #2DBE60;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-dasharray: 120 1080;
    animation: clockwise 2.4s linear infinite;
    filter: drop-shadow(0 0 6px rgba(45,190,96,0.9));
  }

  /* Counter-clockwise line */
  .trace-ccw {
    fill: none;
    stroke: #2DBE60;
    stroke-width: 3;
    stroke-linecap: round;
    stroke-dasharray: 120 1080;
    animation: counter 2.4s linear infinite;
    filter: drop-shadow(0 0 6px rgba(45,190,96,0.9));
  }

  .login-card-inner {
    position: relative;
    z-index: 1;
    border-radius: 20px;
    overflow: hidden;
  }
`;

// Rounded rect SVG path — 400x(dynamic) with r=20
// We use a fixed height approx and let SVG scale
function RoundedRectPath({ className }) {
  const w = 406;
  const h = 536;
  const r = 22;
  const perimeter = 2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r;

  const d = `
    M ${r} 0
    L ${w - r} 0
    Q ${w} 0 ${w} ${r}
    L ${w} ${h - r}
    Q ${w} ${h} ${w - r} ${h}
    L ${r} ${h}
    Q 0 ${h} 0 ${h - r}
    L 0 ${r}
    Q 0 0 ${r} 0
    Z
  `;

  return (
    <svg
      className="login-border-svg"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
    >
      {/* Faint full border so you can see the shape */}
      <path d={d} fill="none" stroke="rgba(45,190,96,0.12)" strokeWidth="1.5" />
      {/* Clockwise chaser */}
      <path d={d} className="trace-cw" strokeDasharray={`120 ${Math.round(perimeter - 120)}`} />
      {/* Counter-clockwise chaser */}
      <path d={d} className="trace-ccw" strokeDasharray={`120 ${Math.round(perimeter - 120)}`} />
    </svg>
  );
}

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

      <div className="login-outer">
        {/* SVG border lines */}
        <RoundedRectPath />

        <div className="login-card-inner">
          <Card sx={{
            width: '100%',
            borderRadius: '20px',
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
