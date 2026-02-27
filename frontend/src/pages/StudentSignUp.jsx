import { useState } from 'react';
import axios from 'axios';
import { Box, Card, CardContent, TextField, Button, Typography, Alert } from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';

export default function StudentSignUp() {
  const [form, setForm] = useState({ full_name: '', surname: '', student_id: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://campusgo-production-3b90.up.railway.app/api/auth/register', {
        full_name: `${form.full_name} ${form.surname}`,
        email: form.email,
        password: form.password,
        role: 'student',
        student_id: form.student_id
      });
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => window.location.href = '/', 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#1F1F1F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card sx={{ width: 420, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <DirectionsBusIcon sx={{ fontSize: 48, color: '#2DBE60' }} />
            <Typography variant="h5" fontWeight="bold" color="#1F1F1F">Create Student Profile</Typography>
            <Typography variant="body2" color="text.secondary">Campus GO — Smart Campus Transit</Typography>
          </Box>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <TextField fullWidth label="Name" name="full_name" value={form.full_name} onChange={handleChange} required />
              <TextField fullWidth label="Surname" name="surname" value={form.surname} onChange={handleChange} required />
            </Box>
            <TextField fullWidth label="School ID" name="student_id" value={form.student_id} onChange={handleChange} sx={{ mb: 2 }} required />
            <TextField fullWidth label="Email" type="email" name="email" value={form.email} onChange={handleChange} sx={{ mb: 2 }} required />
            <TextField fullWidth label="Password" type="password" name="password" value={form.password} onChange={handleChange} sx={{ mb: 3 }} required />
            <Button fullWidth type="submit" variant="contained"
              sx={{ py: 1.5, background: '#2DBE60', borderRadius: 2, fontSize: 16, fontWeight: 'bold', '&:hover': { background: '#1F1F1F' } }}>
              Create Profile
            </Button>
            <Button fullWidth sx={{ mt: 1, color: '#1F1F1F' }} onClick={() => window.location.href = '/'}>
              Already have an account? Login
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
