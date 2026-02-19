import { useState } from 'react';
import axios from 'axios';
import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      localStorage.setItem('campusgo_token', res.data.token);
      localStorage.setItem('campusgo_user', JSON.stringify(res.data.user));
      if (res.data.user.role === 'admin') window.location.href = '/admin';
      else if (res.data.user.role === 'student') window.location.href = '/student';
      else if (res.data.user.role === 'operator') window.location.href = '/operator';
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#1F1F1F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card sx={{ width: 380, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <DirectionsBusIcon sx={{ fontSize: 48, color: '#2DBE60' }} />
            <Typography variant="h4" fontWeight="bold" color="#1F1F1F">Campus GO</Typography>
            <Typography variant="body2" color="text.secondary">Smart Campus Transit</Typography>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleLogin}>
            <TextField fullWidth label="Email" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              sx={{ mb: 2 }} required
            />
            <TextField fullWidth label="Password" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              sx={{ mb: 3 }} required
            />
            <Button fullWidth type="submit" variant="contained"
              sx={{ py: 1.5, background: '#2DBE60', borderRadius: 2, fontSize: 16, fontWeight: 'bold', color: '#fff', '&:hover': { background: '#1F1F1F' } }}>
              Login
            </Button>
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Don't have an account?</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button fullWidth variant="outlined" onClick={() => window.location.href = '/signup/student'}
                  sx={{ borderColor: '#2DBE60', color: '#2DBE60', '&:hover': { background: '#2DBE60', color: '#fff' } }}>
                  Student Sign Up
                </Button>
                <Button fullWidth variant="outlined" onClick={() => window.location.href = '/signup/operator'}
                  sx={{ borderColor: '#1F1F1F', color: '#1F1F1F', '&:hover': { background: '#1F1F1F', color: '#fff' } }}>
                  Operator Sign Up
                </Button>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}