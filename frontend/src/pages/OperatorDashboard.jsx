import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Card, CardContent, AppBar, Toolbar, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, TextField, Alert, Snackbar
} from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function OperatorDashboard() {
  const [qrInput, setQrInput] = useState('');
  const [scannedTickets, setScannedTickets] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const user = JSON.parse(localStorage.getItem('campusgo_user'));

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const handleScan = async () => {
    if (!qrInput.trim()) return;
    try {
      const res = await axios.post('http://localhost:5000/api/tickets/scan', { qr_code: qrInput });
      setScannedTickets(prev => [res.data, ...prev]);
      setSnackbar({ open: true, message: '✅ Ticket validated successfully!', severity: 'success' });
      setQrInput('');
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || '❌ Invalid or already used ticket', severity: 'error' });
      setQrInput('');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#f9f9f9' }}>
      <AppBar position="static" sx={{ background: '#1F1F1F' }}>
        <Toolbar>
          <DirectionsBusIcon sx={{ mr: 1, color: '#2DBE60' }} />
          <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>Campus GO — Operator</Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>Welcome, {user?.full_name}</Typography>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 4 }}>
        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
          <Card sx={{ flex: 1, borderRadius: 3, borderLeft: '4px solid #2DBE60' }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Tickets Scanned Today</Typography>
              <Typography variant="h4" fontWeight="bold" color="#1F1F1F">{scannedTickets.length}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, borderRadius: 3, borderLeft: '4px solid #2DBE60' }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Operator</Typography>
              <Typography variant="h6" fontWeight="bold" color="#2DBE60">{user?.full_name}</Typography>
            </CardContent>
          </Card>
        </Box>

        {/* QR Scanner */}
        <Card sx={{ borderRadius: 3, mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <QrCodeScannerIcon sx={{ color: '#2DBE60', fontSize: 28 }} />
              <Typography variant="h6" fontWeight="bold">Scan Ticket</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Use a QR scanner device or manually enter the ticket code below.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                fullWidth
                label="Scan or enter QR code"
                value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleScan()}
                placeholder="Point scanner at QR code or type code here..."
              />
              <Button variant="contained" onClick={handleScan}
                sx={{ px: 4, background: '#2DBE60', fontWeight: 'bold', whiteSpace: 'nowrap', '&:hover': { background: '#1F1F1F' } }}>
                Validate
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Scanned Tickets */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CheckCircleIcon sx={{ color: '#2DBE60' }} />
              <Typography variant="h6" fontWeight="bold">Scanned Tickets</Typography>
            </Box>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: '#f9f9f9' }}>
                    <TableCell><strong>Ticket ID</strong></TableCell>
                    <TableCell><strong>Student</strong></TableCell>
                    <TableCell><strong>Route</strong></TableCell>
                    <TableCell><strong>Fare</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Scanned At</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {scannedTickets.map((ticket, i) => (
                    <TableRow key={i} hover>
                      <TableCell>#{ticket.id}</TableCell>
                      <TableCell>{ticket.student_name || '—'}</TableCell>
                      <TableCell>{ticket.route_name || '—'}</TableCell>
                      <TableCell>${parseFloat(ticket.fare).toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip label="Used" size="small"
                          sx={{ background: '#2DBE60', color: '#fff', fontWeight: 'bold' }} />
                      </TableCell>
                      <TableCell>{new Date(ticket.scanned_at).toLocaleTimeString()}</TableCell>
                    </TableRow>
                  ))}
                  {scannedTickets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No tickets scanned yet today
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
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