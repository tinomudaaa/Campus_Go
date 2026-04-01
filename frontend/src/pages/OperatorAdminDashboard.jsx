import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Button, Card, CardContent,
  Alert, Chip, Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Snackbar, Tooltip,
  MenuItem, Select, FormControl, InputLabel, Avatar
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PeopleIcon from '@mui/icons-material/People';
import FeedbackIcon from '@mui/icons-material/Feedback';
import EventIcon from '@mui/icons-material/Event';
import RouteIcon from '@mui/icons-material/AltRoute';
import BarChartIcon from '@mui/icons-material/BarChart';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import CampusGoHeader from './CampusGoHeader';

export default function OperatorAdminDashboard() {
  const [tab, setTab] = useState(0);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [staff, setStaff] = useState([]);
  const [activeBuses, setActiveBuses] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [trips, setTrips] = useState([]);
  const [stats, setStats] = useState({ buses: 0, routes: 0, staff: 0, activeTrips: 0 });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [busDialog, setBusDialog] = useState(false);
  const [newBus, setNewBus] = useState({ plate_number: '', capacity: '' });
  const [routeDialog, setRouteDialog] = useState(false);
  const [newRoute, setNewRoute] = useState({ name: '', origin: '', destination: '', fare: '' });
  const [staffDialog, setStaffDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [inviteLinkDialog, setInviteLinkDialog] = useState(false);
  const [tripDialog, setTripDialog] = useState(false);
  const [newTrip, setNewTrip] = useState({ route_id: '', bus_id: '', trip_date: '', departure_time: '' });

  const user = JSON.parse(localStorage.getItem('campusgo_user'));
  const headers = { 'x-user-id': user?.id, 'x-company-id': user?.company_id };

  const fetchAll = async () => {
    try {
      const [busRes, routeRes, staffRes] = await Promise.all([
        axios.get(`https://campus-go-f21t.onrender.com/api/buses/company/${user?.company_id}`),
        axios.get(`https://campus-go-f21t.onrender.com/api/operator-admin/routes`, { headers }),
        axios.get(`https://campus-go-f21t.onrender.com/api/operator-admin/staff`, { headers }),
      ]);
      setBuses(busRes.data); setRoutes(routeRes.data); setStaff(staffRes.data);
      setStats({ buses: busRes.data.length, routes: routeRes.data.length, staff: staffRes.data.filter(s => s.status === 'active').length, activeTrips: 0 });
    } catch (err) { console.error(err); }
    try {
      const activeRes = await axios.get('https://campus-go-f21t.onrender.com/api/locations/active');
      setActiveBuses(activeRes.data);
      setStats(prev => ({ ...prev, activeTrips: activeRes.data.length }));
    } catch (err) { console.error('Active buses error:', err); }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('https://campus-go-f21t.onrender.com/api/operator-admin/analytics', { headers });
      setAnalytics(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchFeedback = async () => {
    try {
      const res = await axios.get('https://campus-go-f21t.onrender.com/api/feedback');
      setFeedback(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchTrips = async () => {
    try {
      const res = await axios.get('https://campus-go-f21t.onrender.com/api/operator-admin/trips', { headers });
      setTrips(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(() => {
      axios.get('https://campus-go-f21t.onrender.com/api/locations/active').then(res => setActiveBuses(res.data)).catch(console.error);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (tab === 5) fetchTrips();
    if (tab === 6) fetchAnalytics();
    if (tab === 7) fetchFeedback();
  }, [tab]);

  const handleAddBus = async () => {
    if (!newBus.plate_number.trim()) return;
    try {
      await axios.post('https://campus-go-f21t.onrender.com/api/buses', {
        company_id: user?.company_id,
        plate_number: newBus.plate_number.trim().toUpperCase(),
        capacity: parseInt(newBus.capacity) || 30,
      });
      setSnackbar({ open: true, message: 'Bus added!', severity: 'success' });
      setBusDialog(false); setNewBus({ plate_number: '', capacity: '' }); fetchAll();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to add bus.', severity: 'error' });
    }
  };

  const handleDeleteBus = async (id) => {
    try {
      await axios.delete(`https://campus-go-f21t.onrender.com/api/buses/${id}`);
      setSnackbar({ open: true, message: 'Bus removed.', severity: 'info' }); fetchAll();
    } catch (err) { setSnackbar({ open: true, message: 'Failed to remove bus.', severity: 'error' }); }
  };

  const handleAddRoute = async () => {
    if (!newRoute.name.trim()) return;
    try {
      await axios.post('https://campus-go-f21t.onrender.com/api/routes', {
        company_id: user?.company_id, name: newRoute.name.trim(),
        origin: newRoute.origin.trim() || 'TBD',
        destination: newRoute.destination.trim() || 'TBD',
        fare: parseFloat(newRoute.fare) || 1.00,
      });
      setSnackbar({ open: true, message: 'Route added!', severity: 'success' });
      setRouteDialog(false); setNewRoute({ name: '', origin: '', destination: '', fare: '' }); fetchAll();
    } catch (err) { setSnackbar({ open: true, message: 'Failed to add route.', severity: 'error' }); }
  };

  const handleDeleteRoute = async (id) => {
    try {
      await axios.delete(`https://campus-go-f21t.onrender.com/api/routes/${id}`);
      setSnackbar({ open: true, message: 'Route removed.', severity: 'info' }); fetchAll();
    } catch (err) { setSnackbar({ open: true, message: 'Failed to remove route.', severity: 'error' }); }
  };

  const handleInviteStaff = async () => {
    if (!inviteEmail.trim()) return;
    try {
      const res = await axios.post('https://campus-go-f21t.onrender.com/api/operator-admin/invite-staff', { email: inviteEmail.trim() }, { headers });
      setInviteLink(res.data.invite_url);
      setStaffDialog(false); setInviteLinkDialog(true); setInviteEmail(''); fetchAll();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to send invite.', severity: 'error' });
    }
  };

  const handleAddTrip = async () => {
    if (!newTrip.route_id || !newTrip.bus_id || !newTrip.trip_date || !newTrip.departure_time) return;
    try {
      await axios.post('https://campus-go-f21t.onrender.com/api/operator-admin/trips', newTrip, { headers });
      setSnackbar({ open: true, message: 'Trip scheduled!', severity: 'success' });
      setTripDialog(false);
      setNewTrip({ route_id: '', bus_id: '', trip_date: '', departure_time: '' });
      fetchTrips();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to add trip.', severity: 'error' });
    }
  };

  const handleDeleteTrip = async (id) => {
    try {
      await axios.delete(`https://campus-go-f21t.onrender.com/api/operator-admin/trips/${id}`, { headers });
      setSnackbar({ open: true, message: 'Trip removed.', severity: 'info' }); fetchTrips();
    } catch (err) { setSnackbar({ open: true, message: 'Failed to remove trip.', severity: 'error' }); }
  };

  const handleTripStatus = async (id, status) => {
    try {
      await axios.patch(`https://campus-go-f21t.onrender.com/api/operator-admin/trips/${id}/status`, { status }, { headers });
      setSnackbar({ open: true, message: `Trip marked as ${status}.`, severity: 'success' }); fetchTrips();
    } catch (err) { setSnackbar({ open: true, message: 'Failed to update trip.', severity: 'error' }); }
  };

  const copyLink = (link) => {
    navigator.clipboard.writeText(link);
    setSnackbar({ open: true, message: 'Invite link copied!', severity: 'success' });
  };

  const handleLogout = () => { localStorage.clear(); window.location.href = '/'; };

  const statCards = (items) => (
    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
      {items.map((s, i) => (
        <Card key={i} sx={{ flex: 1, minWidth: 160, borderRadius: 3, borderLeft: '4px solid #2DBE60' }}>
          <CardContent>
            {s.icon && <Box sx={{ mb: 0.5 }}>{s.icon}</Box>}
            <Typography color="text.secondary" variant="body2">{s.label}</Typography>
            <Typography variant="h4" fontWeight="bold" color="#1F1F1F">{s.value}</Typography>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  const statusColor = (status) => {
    if (status === 'scheduled') return { bg: '#2196f3', label: 'Scheduled' };
    if (status === 'active') return { bg: '#2DBE60', label: 'Active' };
    if (status === 'completed') return { bg: '#888', label: 'Completed' };
    if (status === 'cancelled') return { bg: '#f44336', label: 'Cancelled' };
    return { bg: '#aaa', label: status };
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <Box sx={{ minHeight: '100vh', background: '#f9f9f9' }}>
      <CampusGoHeader user={user} role="Operator Admin" />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', background: '#fff' }}>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
          sx={{ px: 3, '& .MuiTab-root.Mui-selected': { color: '#2DBE60' }, '& .MuiTabs-indicator': { background: '#2DBE60' } }}>
          <Tab label="Overview" />
          <Tab label="Buses" icon={<DirectionsBusIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Routes" icon={<RouteIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Live Trips" icon={<FiberManualRecordIcon fontSize="small" sx={{ color: '#2DBE60' }} />} iconPosition="start" />
          <Tab label="Staff" icon={<PeopleIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Trips" icon={<EventIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Analytics" icon={<BarChartIcon fontSize="small" />} iconPosition="start" />
          <Tab label="Feedback" icon={<FeedbackIcon fontSize="small" />} iconPosition="start" />
        </Tabs>
      </Box>

      <Box sx={{ p: 4 }}>

        {/* OVERVIEW */}
        {tab === 0 && (
          <Box>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Overview</Typography>
            {statCards([
              { label: 'Total Buses', value: stats.buses, icon: <DirectionsBusIcon sx={{ color: '#2DBE60' }} /> },
              { label: 'Routes', value: stats.routes, icon: <RouteIcon sx={{ color: '#2DBE60' }} /> },
              { label: 'Active Staff', value: stats.staff, icon: <PeopleIcon sx={{ color: '#2DBE60' }} /> },
              { label: 'Active Trips', value: stats.activeTrips, icon: <FiberManualRecordIcon sx={{ color: '#2DBE60' }} /> },
            ])}
            {activeBuses.length > 0 && (
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <FiberManualRecordIcon sx={{ color: '#2DBE60', fontSize: 16 }} />
                    <Typography variant="h6" fontWeight="bold">Buses Currently on Road</Typography>
                  </Box>
                  {activeBuses.map(bus => (
                    <Box key={bus.operator_id} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 2, mb: 1, borderRadius: 2, border: '1px solid #eee' }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DirectionsBusIcon sx={{ fontSize: 16, color: '#2DBE60' }} />
                          <Typography fontWeight="bold">{bus.route_name || 'Unknown Route'}</Typography>
                        </Box>
                        <Typography fontSize={13} color="text.secondary">{bus.number_plate || 'No plate'}</Typography>
                      </Box>
                      <Chip icon={<FiberManualRecordIcon style={{ fontSize: 10 }} />} label="Live" size="small" sx={{ background: '#2DBE60', color: '#fff', fontWeight: 'bold' }} />
                    </Box>
                  ))}
                </CardContent>
              </Card>
            )}
          </Box>
        )}

        {/* BUSES */}
        {tab === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold">Fleet Management</Typography>
              <Button variant="contained" startIcon={<AddIcon />} sx={{ background: '#2DBE60', '&:hover': { background: '#1F1F1F' } }} onClick={() => setBusDialog(true)}>Add Bus</Button>
            </Box>
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead><TableRow sx={{ background: '#f9f9f9' }}>
                  <TableCell><strong>Plate Number</strong></TableCell>
                  <TableCell><strong>Capacity</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Action</strong></TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {buses.map(bus => {
                    const isActive = activeBuses.some(a => a.number_plate === bus.plate_number);
                    return (
                      <TableRow key={bus.id} hover>
                        <TableCell><strong>{bus.plate_number}</strong></TableCell>
                        <TableCell>{bus.capacity || '—'}</TableCell>
                        <TableCell>
                          <Chip
                            icon={isActive ? <FiberManualRecordIcon style={{ fontSize: 10 }} /> : undefined}
                            label={isActive ? 'On Road' : 'Available'}
                            size="small"
                            sx={{ background: isActive ? '#2DBE60' : '#eee', color: isActive ? '#fff' : '#888', fontWeight: 'bold' }} />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={isActive ? "Can't remove active bus" : "Remove"}>
                            <span>
                              <IconButton size="small" disabled={isActive} onClick={() => handleDeleteBus(bus.id)} sx={{ color: '#f44336' }}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {buses.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>No buses registered yet</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* ROUTES */}
        {tab === 2 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold">Routes</Typography>
              <Button variant="contained" startIcon={<AddIcon />} sx={{ background: '#2DBE60', '&:hover': { background: '#1F1F1F' } }} onClick={() => setRouteDialog(true)}>Add Route</Button>
            </Box>
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead><TableRow sx={{ background: '#f9f9f9' }}>
                  <TableCell><strong>Route Name</strong></TableCell>
                  <TableCell><strong>Origin</strong></TableCell>
                  <TableCell><strong>Destination</strong></TableCell>
                  <TableCell><strong>Fare</strong></TableCell>
                  <TableCell><strong>Action</strong></TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {routes.map(route => (
                    <TableRow key={route.id} hover>
                      <TableCell><strong>{route.name}</strong></TableCell>
                      <TableCell>{route.origin}</TableCell>
                      <TableCell>{route.destination}</TableCell>
                      <TableCell><Chip label={`$${parseFloat(route.fare).toFixed(2)}`} size="small" sx={{ background: '#2DBE60', color: '#fff', fontWeight: 'bold' }} /></TableCell>
                      <TableCell><IconButton size="small" onClick={() => handleDeleteRoute(route.id)} sx={{ color: '#f44336' }}><DeleteIcon fontSize="small" /></IconButton></TableCell>
                    </TableRow>
                  ))}
                  {routes.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No routes yet</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* LIVE TRIPS */}
        {tab === 3 && (
          <Box>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Live Trips</Typography>
            {activeBuses.length > 0 ? activeBuses.map(bus => {
              const minsAgo = Math.floor((new Date() - new Date(bus.updated_at)) / 60000);
              return (
                <Card key={bus.operator_id} sx={{ borderRadius: 3, mb: 2, boxShadow: 'none', border: '1px solid #eee', borderLeft: '4px solid #2DBE60' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <DirectionsBusIcon sx={{ fontSize: 16, color: '#2DBE60' }} />
                          <Typography fontWeight="bold">{bus.route_name || 'Unknown Route'}</Typography>
                        </Box>
                        <Typography fontSize={14} color="text.secondary">{bus.number_plate || 'No plate'}</Typography>
                        <Typography fontSize={12} color="text.secondary">{parseFloat(bus.latitude).toFixed(5)}, {parseFloat(bus.longitude).toFixed(5)}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Chip icon={<FiberManualRecordIcon style={{ fontSize: 10 }} />} label="Live" size="small" sx={{ background: '#2DBE60', color: '#fff', fontWeight: 'bold', mb: 1 }} />
                        <Typography fontSize={12} color="text.secondary" display="block">Updated {minsAgo === 0 ? 'just now' : `${minsAgo}m ago`}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            }) : (
              <Box sx={{ textAlign: 'center', py: 8, background: '#f9f9f9', borderRadius: 3, border: '1px dashed #ccc' }}>
                <DirectionsBusIcon sx={{ fontSize: 48, color: '#ccc' }} />
                <Typography fontWeight="bold" color="text.secondary" mt={1}>No active trips right now</Typography>
                <Typography fontSize={13} color="text.secondary">When your staff start trips, they'll appear here live</Typography>
              </Box>
            )}
          </Box>
        )}

        {/* STAFF */}
        {tab === 4 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold">Staff Members</Typography>
              <Button variant="contained" startIcon={<PeopleIcon />} sx={{ background: '#2DBE60', '&:hover': { background: '#1F1F1F' } }} onClick={() => setStaffDialog(true)}>Invite Staff</Button>
            </Box>
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead><TableRow sx={{ background: '#f9f9f9' }}>
                  <TableCell><strong>Name</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Joined</strong></TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {staff.map((s, i) => (
                    <TableRow key={i} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 32, height: 32, background: s.status === 'active' ? '#2DBE60' : '#ddd', fontSize: 14 }}>
                            {s.full_name ? s.full_name[0].toUpperCase() : '?'}
                          </Avatar>
                          <strong>{s.full_name || '—'}</strong>
                        </Box>
                      </TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell>
                        <Chip
                          icon={s.status === 'active' ? <CheckIcon style={{ fontSize: 13 }} /> : <EventIcon style={{ fontSize: 13 }} />}
                          label={s.status === 'active' ? 'Active' : 'Invite Pending'}
                          size="small"
                          sx={{ background: s.status === 'active' ? '#2DBE60' : '#ff9800', color: '#fff', fontWeight: 'bold' }} />
                      </TableCell>
                      <TableCell>{s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}</TableCell>
                    </TableRow>
                  ))}
                  {staff.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>No staff yet — invite your first driver!</TableCell></TableRow>}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* TRIPS */}
        {tab === 5 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" fontWeight="bold">Trip Schedule</Typography>
              <Button variant="contained" startIcon={<AddIcon />} sx={{ background: '#2DBE60', '&:hover': { background: '#1F1F1F' } }} onClick={() => setTripDialog(true)}>Schedule Trip</Button>
            </Box>
            {trips.filter(t => t.trip_date === today).length > 0 && (
              <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                <strong>{trips.filter(t => t.trip_date === today).length} trip(s) scheduled for today.</strong> Your staff will see these when they log in.
              </Alert>
            )}
            <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3 }}>
              <Table>
                <TableHead><TableRow sx={{ background: '#f9f9f9' }}>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Time</strong></TableCell>
                  <TableCell><strong>Route</strong></TableCell>
                  <TableCell><strong>Bus</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Actions</strong></TableCell>
                </TableRow></TableHead>
                <TableBody>
                  {trips.map(trip => {
                    const s = statusColor(trip.status);
                    const isToday = trip.trip_date === today;
                    return (
                      <TableRow key={trip.id} hover sx={{ background: isToday ? '#f0fff4' : 'inherit' }}>
                        <TableCell>
                          <Box>
                            <Typography fontWeight={isToday ? 'bold' : 'normal'}>
                              {new Date(trip.trip_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                            </Typography>
                            {isToday && <Chip label="Today" size="small" sx={{ background: '#2DBE60', color: '#fff', fontSize: 10, height: 18 }} />}
                          </Box>
                        </TableCell>
                        <TableCell><strong>{trip.departure_time?.slice(0, 5)}</strong></TableCell>
                        <TableCell>
                          <Typography fontWeight="bold">{trip.route_name}</Typography>
                          <Typography fontSize={12} color="text.secondary">{trip.origin} → {trip.destination}</Typography>
                        </TableCell>
                        <TableCell>{trip.plate_number}</TableCell>
                        <TableCell><Chip label={s.label} size="small" sx={{ background: s.bg, color: '#fff', fontWeight: 'bold' }} /></TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {trip.status === 'scheduled' && (
                              <Tooltip title="Mark as Completed">
                                <IconButton size="small" onClick={() => handleTripStatus(trip.id, 'completed')} sx={{ color: '#888' }}><CheckIcon fontSize="small" /></IconButton>
                              </Tooltip>
                            )}
                            {trip.status === 'scheduled' && (
                              <Tooltip title="Cancel Trip">
                                <IconButton size="small" onClick={() => handleTripStatus(trip.id, 'cancelled')} sx={{ color: '#ff9800' }}><CloseIcon fontSize="small" /></IconButton>
                              </Tooltip>
                            )}
                            <Tooltip title="Delete">
                              <IconButton size="small" onClick={() => handleDeleteTrip(trip.id)} sx={{ color: '#f44336' }}><DeleteIcon fontSize="small" /></IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {trips.length === 0 && (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      <CalendarTodayIcon sx={{ fontSize: 36, color: '#ccc' }} />
                      <Typography fontWeight="bold" mt={1}>No trips scheduled yet</Typography>
                      <Typography fontSize={13}>Click "Schedule Trip" to create your first trip</Typography>
                    </TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}

        {/* ANALYTICS */}
        {tab === 6 && (
          <Box>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>Analytics</Typography>
            {analytics ? (
              <>
                {statCards([
                  { label: 'Total Tickets Sold', value: analytics.total_tickets, icon: <ConfirmationNumberIcon sx={{ color: '#2DBE60' }} /> },
                  { label: 'Total Revenue', value: `$${parseFloat(analytics.total_revenue).toFixed(2)}`, icon: <AttachMoneyIcon sx={{ color: '#2DBE60' }} /> },
                  { label: 'Total Buses', value: analytics.total_buses, icon: <DirectionsBusIcon sx={{ color: '#2DBE60' }} /> },
                  { label: 'Total Routes', value: analytics.total_routes, icon: <RouteIcon sx={{ color: '#2DBE60' }} /> },
                  { label: 'Active Staff', value: analytics.total_staff, icon: <PeopleIcon sx={{ color: '#2DBE60' }} /> },
                ])}
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <ConfirmationNumberIcon sx={{ color: '#2DBE60' }} />
                      <Typography variant="h6" fontWeight="bold">Recent Ticket Sales</Typography>
                    </Box>
                    <TableContainer>
                      <Table size="small">
                        <TableHead><TableRow sx={{ background: '#f9f9f9' }}>
                          <TableCell><strong>Ticket #</strong></TableCell>
                          <TableCell><strong>Student</strong></TableCell>
                          <TableCell><strong>Route</strong></TableCell>
                          <TableCell><strong>Fare</strong></TableCell>
                          <TableCell><strong>Date</strong></TableCell>
                        </TableRow></TableHead>
                        <TableBody>
                          {analytics.recent_tickets.map(t => (
                            <TableRow key={t.id} hover>
                              <TableCell>#{t.id}</TableCell>
                              <TableCell>{t.student_name}</TableCell>
                              <TableCell>{t.route_name}</TableCell>
                              <TableCell><Chip label={`$${parseFloat(t.fare).toFixed(2)}`} size="small" sx={{ background: '#2DBE60', color: '#fff' }} /></TableCell>
                              <TableCell>{new Date(t.created_at).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                          {analytics.recent_tickets.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>No tickets sold yet</TableCell></TableRow>}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </>
            ) : <Typography color="text.secondary">Loading analytics...</Typography>}
          </Box>
        )}

        {/* FEEDBACK */}
        {tab === 7 && (
          <Box>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>Student Feedback</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>Feedback submitted by students for your routes.</Typography>
            {feedback.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, background: '#f9f9f9', borderRadius: 3, border: '1px dashed #ccc' }}>
                <ChatBubbleOutlineIcon sx={{ fontSize: 48, color: '#ccc' }} />
                <Typography fontWeight="bold" color="text.secondary" mt={1}>No feedback yet</Typography>
                <Typography fontSize={13} color="text.secondary">Student feedback about your routes will appear here</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {feedback.map(f => (
                  <Card key={f.id} sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #eee', borderLeft: '4px solid #2DBE60' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, background: '#2DBE60', fontSize: 14 }}>
                            {f.student_name ? f.student_name[0].toUpperCase() : 'S'}
                          </Avatar>
                          <Box>
                            <Typography fontWeight="bold" fontSize={14}>{f.student_name}</Typography>
                            <Chip label={f.route_name} size="small" sx={{ background: '#f0f0f0', fontSize: 11, height: 20 }} />
                          </Box>
                        </Box>
                        <Typography fontSize={12} color="text.secondary">
                          {new Date(f.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </Typography>
                      </Box>
                      <Typography sx={{ mt: 1, pl: 0.5, color: '#333', lineHeight: 1.6 }}>{f.message}</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Add Bus Dialog */}
      <Dialog open={busDialog} onClose={() => setBusDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight="bold">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DirectionsBusIcon sx={{ color: '#2DBE60' }} /> Add New Bus
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Plate Number" value={newBus.plate_number} onChange={e => setNewBus({ ...newBus, plate_number: e.target.value.toUpperCase() })} placeholder="e.g. ABC 1234" sx={{ mb: 2, mt: 1 }} inputProps={{ maxLength: 15 }} />
          <TextField fullWidth label="Capacity (seats)" type="number" value={newBus.capacity} onChange={e => setNewBus({ ...newBus, capacity: e.target.value })} placeholder="e.g. 30" inputProps={{ min: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBusDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddBus} disabled={!newBus.plate_number.trim()} sx={{ background: '#1F1F1F', '&:hover': { background: '#2DBE60' } }}>Add Bus</Button>
        </DialogActions>
      </Dialog>

      {/* Add Route Dialog */}
      <Dialog open={routeDialog} onClose={() => setRouteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight="bold">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RouteIcon sx={{ color: '#2DBE60' }} /> Add New Route
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Route Name" value={newRoute.name} onChange={e => setNewRoute({ ...newRoute, name: e.target.value })} placeholder="e.g. Campus to Town" sx={{ mb: 2, mt: 1 }} />
          <TextField fullWidth label="Origin" value={newRoute.origin} onChange={e => setNewRoute({ ...newRoute, origin: e.target.value })} placeholder="e.g. Campus Gate" sx={{ mb: 2 }} />
          <TextField fullWidth label="Destination" value={newRoute.destination} onChange={e => setNewRoute({ ...newRoute, destination: e.target.value })} placeholder="e.g. Town Centre" sx={{ mb: 2 }} />
          <TextField fullWidth label="Fare ($)" type="number" value={newRoute.fare} onChange={e => setNewRoute({ ...newRoute, fare: e.target.value })} inputProps={{ min: 0, step: 0.5 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRouteDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddRoute} disabled={!newRoute.name.trim()} sx={{ background: '#1F1F1F', '&:hover': { background: '#2DBE60' } }}>Add Route</Button>
        </DialogActions>
      </Dialog>

      {/* Invite Staff Dialog */}
      <Dialog open={staffDialog} onClose={() => setStaffDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight="bold">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon sx={{ color: '#2DBE60' }} /> Invite Staff Member
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Enter the email of the driver to invite. They'll set up their account as Operator Staff.</Typography>
          <TextField fullWidth label="Staff Email" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="driver@example.com" sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStaffDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleInviteStaff} disabled={!inviteEmail.trim()} sx={{ background: '#1F1F1F', '&:hover': { background: '#2DBE60' } }}>Generate Invite</Button>
        </DialogActions>
      </Dialog>

      {/* Invite Link Dialog */}
      <Dialog open={inviteLinkDialog} onClose={() => setInviteLinkDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight="bold">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckIcon sx={{ color: '#2DBE60' }} /> Staff Invite Link Generated!
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Share this link with your staff member. They'll use it to create their Operator Staff account.</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, background: '#f5f5f5', borderRadius: 2 }}>
            <Typography fontSize={12} sx={{ flex: 1, wordBreak: 'break-all' }}>{inviteLink}</Typography>
            <IconButton onClick={() => copyLink(inviteLink)} size="small"><ContentCopyIcon fontSize="small" /></IconButton>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => { copyLink(inviteLink); setInviteLinkDialog(false); }} sx={{ background: '#2DBE60', '&:hover': { background: '#1F1F1F' } }}>Copy & Close</Button>
        </DialogActions>
      </Dialog>

      {/* Schedule Trip Dialog */}
      <Dialog open={tripDialog} onClose={() => setTripDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight="bold">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarTodayIcon sx={{ color: '#2DBE60' }} /> Schedule a Trip
          </Box>
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mb: 2, mt: 1 }}>
            <InputLabel>Route</InputLabel>
            <Select value={newTrip.route_id} label="Route" onChange={e => setNewTrip({ ...newTrip, route_id: e.target.value })}>
              {routes.map(r => <MenuItem key={r.id} value={r.id}>{r.name} — ${parseFloat(r.fare).toFixed(2)}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Bus</InputLabel>
            <Select value={newTrip.bus_id} label="Bus" onChange={e => setNewTrip({ ...newTrip, bus_id: e.target.value })}>
              {buses.map(b => <MenuItem key={b.id} value={b.id}>{b.plate_number} {b.capacity ? `(${b.capacity} seats)` : ''}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth label="Date" type="date" value={newTrip.trip_date}
            onChange={e => setNewTrip({ ...newTrip, trip_date: e.target.value })}
            InputLabelProps={{ shrink: true }} inputProps={{ min: today }} sx={{ mb: 2 }} />
          <TextField fullWidth label="Departure Time" type="time" value={newTrip.departure_time}
            onChange={e => setNewTrip({ ...newTrip, departure_time: e.target.value })}
            InputLabelProps={{ shrink: true }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTripDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddTrip}
            disabled={!newTrip.route_id || !newTrip.bus_id || !newTrip.trip_date || !newTrip.departure_time}
            sx={{ background: '#1F1F1F', '&:hover': { background: '#2DBE60' } }}>Schedule Trip</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
