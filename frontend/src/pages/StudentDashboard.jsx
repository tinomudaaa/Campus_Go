import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Card, CardContent, Button,
  Chip, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  Alert, Snackbar, TextField
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import BusMap from './BusMap';
import CampusGoHeader from './CampusGoHeader';


export default function StudentDashboard() {
  const [tickets, setTickets] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('campusgo_user')));
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [activeTicket, setActiveTicket] = useState(null);
  const [feedbackRoute, setFeedbackRoute] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchData = async () => {
    try {
      const routesRes = await axios.get('https://campusgo-production-3b90.up.railway.app/api/routes');
      setRoutes(routesRes.data);
    } catch (err) { console.error('Routes error:', err); }

    try {
      const ticketsRes = await axios.get(`https://campusgo-production-3b90.up.railway.app/api/tickets/${user.id}`);
      setTickets(ticketsRes.data);
    } catch (err) { console.error('Tickets error:', err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleBuyTicket = async () => {
    try {
      await axios.post('https://campusgo-production-3b90.up.railway.app/api/tickets/buy', {
        student_id: user.id,
        route_id: selectedRoute.id,
        bus_id: null
      });
      const newBalance = parseFloat(user.balance) - parseFloat(selectedRoute.fare);
      const updatedUser = { ...user, balance: newBalance.toFixed(2) };
      setUser(updatedUser);
      localStorage.setItem('campusgo_user', JSON.stringify(updatedUser));
      setBuyDialogOpen(false);
      setSnackbar({ open: true, message: 'Ticket purchased successfully! 🎉', severity: 'success' });
      fetchData();
    } catch (err) {
      setBuyDialogOpen(false);
      setSnackbar({ open: true, message: err.response?.data?.error || 'Purchase failed. Check your balance.', severity: 'error' });
    }
  };

  const handleFeedback = async () => {
    try {
      await axios.post('https://campusgo-production-3b90.up.railway.app/api/feedback', {
        student_id: user.id,
        route_id: feedbackRoute,
        message: feedbackMessage
      });
      setFeedbackMessage('');
      setFeedbackRoute('');
      setSnackbar({ open: true, message: 'Feedback submitted! Thank you 🙏', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to submit feedback.', severity: 'error' });
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#f5f7f5' }}>
      <CampusGoHeader user={user} role="Student" showBalance={true} />

      {/* ── STATS ROW ── */}
      <div className="cgo-stats">
        <div className="cgo-stat-card">
          <div className="cgo-stat-icon"><ConfirmationNumberIcon sx={{ color: '#2DBE60', fontSize: 26 }} /></div>
          <div className="cgo-stat-value">{tickets.length}</div>
          <div className="cgo-stat-label">Tickets</div>
        </div>
        <div className="cgo-stat-card">
          <div className="cgo-stat-icon"><DirectionsBusIcon sx={{ color: '#2DBE60', fontSize: 26 }} /></div>
          <div className="cgo-stat-value">{routes.length}</div>
          <div className="cgo-stat-label">Routes</div>
        </div>
        <div className="cgo-stat-card">
          <div className="cgo-stat-icon"><CheckCircleOutlineIcon sx={{ color: '#2DBE60', fontSize: 26 }} /></div>
          <div className="cgo-stat-value">{tickets.filter(t => t.status === 'active').length}</div>
          <div className="cgo-stat-label">Active</div>
        </div>
      </div>

      <Box sx={{ p: 2 }}>

        {/* Live Bus Tracking */}
        <Box sx={{ mb: 3 }}>
          <BusMap />
        </Box>

        {/* Available Routes */}
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>🚌 Available Routes</Typography>
            {routes.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>No routes available yet</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {routes.map(route => (
                  <Box key={route.id} sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    p: 1.5, border: '1px solid #e0e0e0', borderRadius: 2,
                    '&:hover': { boxShadow: 2 }
                  }}>
                    <Box>
                      <Typography fontWeight="bold" fontSize={15}>{route.name}</Typography>
                      <Typography variant="body2" color="text.secondary">{route.origin} → {route.destination}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip label={`$${parseFloat(route.fare).toFixed(2)}`} size="small"
                        sx={{ background: '#2DBE60', color: '#fff', fontWeight: 'bold' }} />
                      <Button size="small" variant="contained" startIcon={<ShoppingCartIcon />}
                        sx={{ background: '#1F1F1F', color: '#fff', '&:hover': { background: '#2DBE60' } }}
                        onClick={() => { setSelectedRoute(route); setBuyDialogOpen(true); }}>
                        Buy
                      </Button>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Ticket History */}
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>🎫 My Tickets</Typography>
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ background: '#f9f9f9' }}>
                    <TableCell><strong>Route</strong></TableCell>
                    <TableCell><strong>From → To</strong></TableCell>
                    <TableCell><strong>Fare</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Date</strong></TableCell>
                    <TableCell><strong>QR</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tickets.map(ticket => (
                    <TableRow key={ticket.id} hover>
                      <TableCell>{ticket.route_name}</TableCell>
                      <TableCell>{ticket.origin} → {ticket.destination}</TableCell>
                      <TableCell>${parseFloat(ticket.fare).toFixed(2)}</TableCell>
                      <TableCell>
                        <Chip label={ticket.status} size="small"
                          sx={{
                            background: ticket.status === 'active' ? '#2DBE60' : ticket.status === 'used' ? '#ccc' : '#f44336',
                            color: '#fff', fontWeight: 'bold'
                          }} />
                      </TableCell>
                      <TableCell>{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {ticket.status === 'active' && (
                          <Button size="small" variant="outlined"
                            sx={{ borderColor: '#2DBE60', color: '#2DBE60' }}
                            onClick={() => { setActiveTicket(ticket); setQrDialogOpen(true); }}>
                            View QR
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {tickets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                        No tickets yet — buy one above!
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Spending Analytics */}
        <Card sx={{ borderRadius: 3, mb: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>📊 My Spending Analytics</Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
              <Card sx={{ flex: 1, minWidth: 140, borderRadius: 2, background: '#f9f9f9', border: '1px solid #e0e0e0' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Total Spent</Typography>
                  <Typography variant="h5" fontWeight="bold" color="#2DBE60">
                    ${tickets.reduce((sum, t) => sum + parseFloat(t.fare || 0), 0).toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, minWidth: 140, borderRadius: 2, background: '#f9f9f9', border: '1px solid #e0e0e0' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Active Tickets</Typography>
                  <Typography variant="h5" fontWeight="bold">{tickets.filter(t => t.status === 'active').length}</Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, minWidth: 140, borderRadius: 2, background: '#f9f9f9', border: '1px solid #e0e0e0' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Used Tickets</Typography>
                  <Typography variant="h5" fontWeight="bold">{tickets.filter(t => t.status === 'used').length}</Typography>
                </CardContent>
              </Card>
              <Card sx={{ flex: 1, minWidth: 140, borderRadius: 2, background: '#f9f9f9', border: '1px solid #e0e0e0' }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary">Most Used Route</Typography>
                  <Typography variant="h6" fontWeight="bold" color="#2DBE60" noWrap>
                    {tickets.length > 0
                      ? Object.entries(tickets.reduce((acc, t) => {
                          acc[t.route_name] = (acc[t.route_name] || 0) + 1; return acc;
                        }, {})).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'
                      : '—'}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>💰 Spending by Route</Typography>
            {tickets.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>No trip history yet</Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {Object.entries(tickets.reduce((acc, t) => {
                  if (!acc[t.route_name]) acc[t.route_name] = { count: 0, total: 0 };
                  acc[t.route_name].count += 1;
                  acc[t.route_name].total += parseFloat(t.fare || 0);
                  return acc;
                }, {})).map(([routeName, data]) => {
                  const totalSpent = tickets.reduce((sum, t) => sum + parseFloat(t.fare || 0), 0);
                  const percentage = totalSpent > 0 ? (data.total / totalSpent) * 100 : 0;
                  return (
                    <Box key={routeName}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight="bold">{routeName}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {data.count} trip{data.count > 1 ? 's' : ''} · ${data.total.toFixed(2)}
                        </Typography>
                      </Box>
                      <Box sx={{ background: '#e0e0e0', borderRadius: 4, height: 8 }}>
                        <Box sx={{ background: '#2DBE60', borderRadius: 4, height: 8, width: `${percentage}%`, transition: 'width 0.5s ease' }} />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Feedback */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>💬 Submit Feedback</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>Select Route</Typography>
                <select value={feedbackRoute} onChange={e => setFeedbackRoute(e.target.value)}
                  style={{ width: '100%', padding: '14px 12px', fontSize: '15px', border: '1px solid #ccc', borderRadius: '8px', background: '#fff', color: '#1F1F1F', cursor: 'pointer' }}>
                  <option value="">-- Select a route --</option>
                  {routes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </Box>
              <TextField fullWidth multiline rows={3} label="Your feedback" value={feedbackMessage} onChange={e => setFeedbackMessage(e.target.value)} />
              <Button variant="contained" onClick={handleFeedback} disabled={!feedbackRoute || !feedbackMessage}
                sx={{ alignSelf: 'flex-end', px: 4, background: '#2DBE60', '&:hover': { background: '#1F1F1F' } }}>
                Submit Feedback
              </Button>
            </Box>
          </CardContent>
        </Card>

      </Box>

      {/* Buy Dialog */}
      <Dialog open={buyDialogOpen} onClose={() => setBuyDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight="bold">Confirm Purchase</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Route: <strong>{selectedRoute?.name}</strong><br />
            {selectedRoute?.origin} → {selectedRoute?.destination}<br />
            Fare: <strong>${parseFloat(selectedRoute?.fare || 0).toFixed(2)}</strong><br />
            Your Balance: <strong>${parseFloat(user?.balance || 0).toFixed(2)}</strong>
          </Typography>
          {parseFloat(user?.balance) < parseFloat(selectedRoute?.fare) && (
            <Alert severity="error" sx={{ mt: 1 }}>Insufficient balance. Please ask admin to top up.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBuyDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleBuyTicket}
            disabled={parseFloat(user?.balance) < parseFloat(selectedRoute?.fare)}
            sx={{ background: '#2DBE60', '&:hover': { background: '#1F1F1F' } }}>
            Confirm Purchase
          </Button>
        </DialogActions>
      </Dialog>

      {/* QR Dialog */}
      <Dialog open={qrDialogOpen} onClose={() => setQrDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight="bold" sx={{ textAlign: 'center' }}>🎫 Your Ticket</DialogTitle>
        <DialogContent sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {activeTicket?.route_name} — {activeTicket?.origin} → {activeTicket?.destination}
          </Typography>
          {activeTicket?.qr_code && (
            <img src={activeTicket.qr_code} alt="QR Code" style={{ width: 220, height: 220, borderRadius: 8 }} />
          )}
          {activeTicket?.ticket_code && (
            <Box sx={{ mt: 2.5 }}>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5, letterSpacing: 1, textTransform: 'uppercase' }}>
                Ticket Code
              </Typography>
              <Box sx={{ display: 'inline-block', px: 3, py: 1.5, background: '#f5f5f5', border: '2px dashed #2DBE60', borderRadius: 2 }}>
                <Typography variant="h5" fontWeight="bold" sx={{ letterSpacing: 3, color: '#1F1F1F', fontFamily: 'monospace' }}>
                  {activeTicket.ticket_code}
                </Typography>
              </Box>
            </Box>
          )}
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
            Show this QR code to the operator when boarding
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button fullWidth variant="contained" onClick={() => setQrDialogOpen(false)}
            sx={{ background: '#2DBE60', '&:hover': { background: '#1F1F1F' } }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>

    </Box>
  );
}
