import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Card, CardContent, AppBar, Toolbar, Button,
  Chip, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper
} from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import LogoutIcon from '@mui/icons-material/Logout';

export default function StudentDashboard() {
  const [tickets, setTickets] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('campusgo_user')));

  const fetchData = async () => {
    try {
      const [ticketsRes, routesRes] = await Promise.all([
        axios.get(`http://localhost:5000/api/tickets/${user.id}`),
        axios.get('http://localhost:5000/api/routes')
      ]);
      setTickets(ticketsRes.data);
      setRoutes(routesRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#f9f9f9' }}>
      <AppBar position="static" sx={{ background: '#1F1F1F' }}>
        <Toolbar>
          <DirectionsBusIcon sx={{ mr: 1, color: '#2DBE60' }} />
          <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>Campus GO</Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>Welcome, {user?.full_name}</Typography>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 4 }}>
        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
          <Card sx={{ flex: 1, borderRadius: 3, borderLeft: '4px solid #2DBE60' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AccountBalanceWalletIcon sx={{ color: '#2DBE60' }} />
                <Typography color="text.secondary" variant="body2">Wallet Balance</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="#2DBE60">
                ${parseFloat(user?.balance || 0).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, borderRadius: 3, borderLeft: '4px solid #2DBE60' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ConfirmationNumberIcon sx={{ color: '#2DBE60' }} />
                <Typography color="text.secondary" variant="body2">Total Tickets</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="#1F1F1F">{tickets.length}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, borderRadius: 3, borderLeft: '4px solid #2DBE60' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <DirectionsBusIcon sx={{ color: '#2DBE60' }} />
                <Typography color="text.secondary" variant="body2">Available Routes</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="#1F1F1F">{routes.length}</Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Available Routes */}
        <Card sx={{ borderRadius: 3, mb: 4 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#1F1F1F' }}>
              🚌 Available Routes
            </Typography>
            {routes.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                No routes available yet
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                {routes.map(route => (
                  <Card key={route.id} sx={{ minWidth: 200, borderRadius: 2, border: '1px solid #e0e0e0' }}>
                    <CardContent sx={{ pb: '16px !important' }}>
                      <Typography fontWeight="bold" color="#1F1F1F">{route.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{route.origin} → {route.destination}</Typography>
                      <Chip label={`$${parseFloat(route.fare).toFixed(2)}`} size="small" sx={{ mt: 1, background: '#2DBE60', color: '#fff', fontWeight: 'bold' }} />
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Ticket History */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#1F1F1F' }}>
              🎫 My Tickets
            </Typography>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: '#f9f9f9' }}>
                    <TableCell><strong>Route</strong></TableCell>
                    <TableCell><strong>From → To</strong></TableCell>
                    <TableCell><strong>Fare</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tickets.map(ticket => (
                    <TableRow key={ticket.id} hover>
                      <TableCell>{ticket.route_name}</TableCell>
                      <TableCell>{ticket.origin} → {ticket.destination}</TableCell>
                      <TableCell>${parseFloat(ticket.fare).toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip
                          label={ticket.status}
                          size="small"
                          sx={{
                            background: ticket.status === 'active' ? '#2DBE60' : ticket.status === 'used' ? '#ccc' : '#f44336',
                            color: '#fff', fontWeight: 'bold'
                          }}
                        />
                      </TableCell>
                      <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {tickets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No tickets yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}