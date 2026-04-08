import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';

const borderAnimation = `
  @keyframes clockwise {
    from { stroke-dashoffset: var(--perimeter); }
    to   { stroke-dashoffset: 0; }
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

  .trace-line {
    fill: none;
    stroke: #2DBE60;
    stroke-width: 3;
    stroke-linecap: round;
    filter: drop-shadow(0 0 6px rgba(45,190,96,0.9));
    animation: clockwise 4s linear infinite;
  }

  .trace-line-2 {
    animation-delay: -1.2s;
  }

  .login-card-inner {
    position: relative;
    z-index: 1;
    border-radius: 20px;
    overflow: hidden;
  }
`;

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [svgDims, setSvgDims] = useState({ w: 406, h: 600 });
  const cardRef = useRef(null);

  useEffect(() => {
    if (!cardRef.current) return;
    const measure = () => {
      const rect = cardRef.current.getBoundingClientRect();
      setSvgDims({ w: rect.width + 6, h: rect.height + 6 });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(cardRef.current);
    return () => ro.disconnect();
  }, []);

  const { w, h } = svgDims;
  const r = 22;
  const perimeter = Math.round(2 * (w - 2 * r) + 2 * (h - 2 * r) + 2 * Math.PI * r);
  const lineLen = 100;
  const gap = perimeter - lineLen;

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post('https://campus-go-f21t.onrender.com/api/auth/login', { email, password });
      localStorage.setItem('campusgo_user', JSON.stringify(res.data));
      localStorage.setItem('campusgo_login_time', Date.now().toString()); // 2hr session clock starts here
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

      <div className="login-outer" ref={cardRef}>
        {/* Dynamic SVG border */}
        <svg
          className="login-border-svg"
          viewBox={`0 0 ${w} ${h}`}
          preserveAspectRatio="none"
          style={{ '--perimeter': perimeter }}
        >
          <path d={d} fill="none" stroke="rgba(45,190,96,0.15)" strokeWidth="1.5" />
          <path
            d={d}
            className="trace-line"
            strokeDasharray={`${lineLen} ${gap}`}
            strokeDashoffset={perimeter}
          />
          <path
            d={d}
            className="trace-line trace-line-2"
            strokeDasharray={`${lineLen} ${gap}`}
            strokeDashoffset={perimeter}
          />
        </svg>

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
