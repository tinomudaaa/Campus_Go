import { useState } from 'react';
import axios from 'axios';
import {
  Box, Typography, Card, CardContent, AppBar, Toolbar, Button,
  TextField, Alert, Snackbar, Divider
} from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import LogoutIcon from '@mui/icons-material/Logout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function Settings() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('campusgo_user')));
  const [profileForm, setProfileForm] = useState({ full_name: user?.full_name || '', email: user?.email || '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleProfileUpdate = async () => {
    try {
      const res = await axios.put(`http://localhost:5000/api/auth/profile/${user.id}`, profileForm);
      const updatedUser = { ...user, ...res.data };
      setUser(updatedUser);
      localStorage.setItem('campusgo_user', JSON.stringify(updatedUser));
      setSnackbar({ open: true, message: 'Profile updated successfully!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update profile.', severity: 'error' });
    }
  };

  const handlePasswordChange = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      return setSnackbar({ open: true, message: 'New passwords do not match.', severity: 'error' });
    }
    try {
      await axios.put(`http://localhost:5000/api/auth/password/${user.id}`, {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setSnackbar({ open: true, message: 'Password changed successfully!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to change password.', severity: 'error' });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const goBack = () => {
    if (user.role === 'admin') window.location.href = '/admin';
    else if (user.role === 'student') window.location.href = '/student';
    else window.location.href = '/operator';
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#f9f9f9' }}>
      <AppBar position="static" sx={{ background: '#1F1F1F' }}>
        <Toolbar>
          <DirectionsBusIcon sx={{ mr: 1, color: '#2DBE60' }} />
          <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>Campus GO — Settings</Typography>
          <Button color="inherit" startIcon={<ArrowBackIcon />} onClick={goBack} sx={{ mr: 1 }}>Back</Button>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        {/* Profile Info */}
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 1 }}>👤 Profile Information</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Role: <strong style={{ textTransform: 'capitalize' }}>{user?.role}</strong>
              {user?.student_id && <> &nbsp;|&nbsp; Student ID: <strong>{user.student_id}</strong></>}
            </Typography>
            <TextField fullWidth label="Full Name" value={profileForm.full_name}
              onChange={e => setProfileForm({ ...profileForm, full_name: e.target.value })}
              sx={{ mb: 2 }} />
            <TextField fullWidth label="Email" type="email" value={profileForm.email}
              onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
              sx={{ mb: 3 }} />
            <Button variant="contained" onClick={handleProfileUpdate}
              sx={{ background: '#2DBE60', '&:hover': { background: '#1F1F1F' } }}>
              Save Changes
            </Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>🔒 Change Password</Typography>
            <TextField fullWidth label="Current Password" type="password"
              value={passwordForm.current_password}
              onChange={e => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              sx={{ mb: 2 }} />
            <TextField fullWidth label="New Password" type="password"
              value={passwordForm.new_password}
              onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              sx={{ mb: 2 }} />
            <TextField fullWidth label="Confirm New Password" type="password"
              value={passwordForm.confirm_password}
              onChange={e => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              sx={{ mb: 3 }} />
            <Button variant="contained" onClick={handlePasswordChange}
              disabled={!passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password}
              sx={{ background: '#1F1F1F', '&:hover': { background: '#2DBE60' } }}>
              Change Password
            </Button>
          </CardContent>
        </Card>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}