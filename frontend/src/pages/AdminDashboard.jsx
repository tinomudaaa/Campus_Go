import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, AppBar, Toolbar,
  Chip, Alert, Snackbar
} from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';

export default function AdminDashboard() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const user = JSON.parse(localStorage.getItem('campusgo_user'));
  const token = localStorage.getItem('campusgo_token');

  const fetchStudents = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/wallet/students');
      setStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchStudents(); }, []);

  const handleTopup = async () => {
    try {
      await axios.post('http://localhost:5000/api/wallet/topup', {
        student_id: selectedStudent.id,
        amount: parseFloat(topupAmount)
      });
      setSnackbar({ open: true, message: `Successfully topped up $${topupAmount} for ${selectedStudent.full_name}`, severity: 'success' });
      setDialogOpen(false);
      setTopupAmount('');
      fetchStudents();
    } catch (err) {
      setSnackbar({ open: true, message: 'Top up failed. Try again.', severity: 'error' });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#f1f8e9' }}>
      {/* Navbar */}
      <AppBar position="static" sx={{ background: '#2e7d32' }}>
        <Toolbar>
          <DirectionsBusIcon sx={{ mr: 1 }} />
          <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>Campus GO — Admin</Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>Welcome, {user?.full_name}</Typography>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 4 }}>
        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
          <Card sx={{ flex: 1, borderRadius: 3, borderLeft: '4px solid #2e7d32' }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Total Students</Typography>
              <Typography variant="h4" fontWeight="bold" color="#2e7d32">{students.length}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, borderRadius: 3, borderLeft: '4px solid #388e3c' }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Total Wallet Balance</Typography>
              <Typography variant="h4" fontWeight="bold" color="#388e3c">
                ${students.reduce((sum, s) => sum + parseFloat(s.balance || 0), 0).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Students Table */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                <AccountBalanceWalletIcon sx={{ mr: 1, verticalAlign: 'middle', color: '#2e7d32' }} />
                Student Wallets
              </Typography>
            </Box>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: '#f1f8e9' }}>
                    <TableCell fontWeight="bold">Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Student ID</TableCell>
                    <TableCell>Balance</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map(student => (
                    <TableRow key={student.id} hover>
                      <TableCell>{student.full_name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{student.student_id || '—'}</TableCell>
                      <TableCell>
                        <Chip
                          label={`$${parseFloat(student.balance).toFixed(2)}`}
                          color={student.balance > 0 ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small" variant="contained" startIcon={<AddIcon />}
                          sx={{ background: '#2e7d32', '&:hover': { background: '#1b5e20' } }}
                          onClick={() => { setSelectedStudent(student); setDialogOpen(true); }}
                        >
                          Top Up
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {students.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No students registered yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Top Up Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Top Up Wallet</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Student: <strong>{selectedStudent?.full_name}</strong><br />
            Current Balance: <strong>${parseFloat(selectedStudent?.balance || 0).toFixed(2)}</strong>
          </Typography>
          <TextField
            fullWidth label="Amount ($)" type="number"
            value={topupAmount} onChange={e => setTopupAmount(e.target.value)}
            inputProps={{ min: 1 }} autoFocus
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleTopup}
            disabled={!topupAmount || topupAmount <= 0}
            sx={{ background: '#2e7d32', '&:hover': { background: '#1b5e20' } }}>
            Top Up
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}