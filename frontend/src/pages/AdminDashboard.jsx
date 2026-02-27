import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, Card, CardContent, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Button, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, AppBar, Toolbar,
  Chip, Alert, Snackbar, Tabs, Tab, Tooltip
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import RouteIcon from '@mui/icons-material/AltRoute';
import FeedbackIcon from '@mui/icons-material/Feedback';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const busIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [32, 52], iconAnchor: [16, 52], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const warningIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [32, 52], iconAnchor: [16, 52], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const defaultCenter = [-17.8292, 31.0522];

function AutoFitBounds({ buses }) {
  const map = useMap();
  useEffect(() => {
    if (buses.length === 0) return;
    if (buses.length === 1) {
      map.flyTo([parseFloat(buses[0].latitude), parseFloat(buses[0].longitude)], 15, { animate: true, duration: 1.5 });
    } else {
      const bounds = L.latLngBounds(buses.map(b => [parseFloat(b.latitude), parseFloat(b.longitude)]));
      map.flyToBounds(bounds, { padding: [60, 60], animate: true, duration: 1.5 });
    }
  }, [buses]);
  return null;
}

const statusColors = {
  active: { bg: '#2DBE60', color: '#fff', label: 'Active' },
  pending: { bg: '#ff9800', color: '#fff', label: 'Pending' },
  suspended: { bg: '#f44336', color: '#fff', label: 'Suspended' },
};

export default function AdminDashboard() {
  const [tab, setTab] = useState(0);
  const [students, setStudents] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeBuses, setActiveBuses] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupDialogOpen, setTopupDialogOpen] = useState(false);

  const [routeDialogOpen, setRouteDialogOpen] = useState(false);
  const [newRoute, setNewRoute] = useState({ name: '', origin: '', destination: '', fare: '' });

  const [createCompanyDialog, setCreateCompanyDialog] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: '', inviteEmail: '' });
  const [createCompanyLoading, setCreateCompanyLoading] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(null);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [lastFleetUpdate, setLastFleetUpdate] = useState(null);
  const [user] = useState(() => JSON.parse(localStorage.getItem('campusgo_user')));

  const fetchStudents = async () => {
    try { const res = await axios.get('https://campusgo-production-3b90.up.railway.app/api/wallet/students'); setStudents(res.data); }
    catch (err) { console.error(err); }
  };
  const fetchRoutes = async () => {
    try { const res = await axios.get('https://campusgo-production-3b90.up.railway.app/api/routes'); setRoutes(res.data); }
    catch (err) { console.error(err); }
  };
  const fetchFeedback = async () => {
    try { const res = await axios.get('https://campusgo-production-3b90.up.railway.app/api/feedback'); setFeedback(res.data); }
    catch (err) { console.error(err); }
  };
  const fetchAnalytics = async () => {
    try { const res = await axios.get('https://campusgo-production-3b90.up.railway.app/api/wallet/analytics'); setAnalytics(res.data); }
    catch (err) { console.error(err); }
  };
  const fetchActiveBuses = async () => {
    try {
      const res = await axios.get('https://campusgo-production-3b90.up.railway.app/api/locations/active');
      setActiveBuses(res.data);
      setLastFleetUpdate(new Date());
    } catch (err) { console.error(err); }
  };
  const fetchCompanies = async () => {
    try {
      const res = await axios.get('https://campusgo-production-3b90.up.railway.app/api/admin/companies', {
        headers: { 'x-user-id': user?.id }
      });
      setCompanies(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchStudents();
    fetchRoutes();
    fetchFeedback();
    fetchAnalytics();
    fetchActiveBuses();
    fetchCompanies();
    const interval = setInterval(fetchActiveBuses, 5000);
    return () => clearInterval(interval);
  }, []);

  const getLastSeenMinutes = (updatedAt) => Math.floor((new Date() - new Date(updatedAt)) / 60000);

  const handleTopup = async () => {
    try {
      await axios.post('https://campusgo-production-3b90.up.railway.app/api/wallet/topup', {
        student_id: selectedStudent.id, amount: parseFloat(topupAmount)
      });
      setSnackbar({ open: true, message: `Topped up $${topupAmount} for ${selectedStudent.full_name}`, severity: 'success' });
      setTopupDialogOpen(false);
      setTopupAmount('');
      fetchStudents();
      fetchAnalytics();
    } catch (err) {
      setSnackbar({ open: true, message: 'Top up failed.', severity: 'error' });
    }
  };

  const handleAddRoute = async () => {
    try {
      await axios.post('https://campusgo-production-3b90.up.railway.app/api/routes', {
        company_id: 1, name: newRoute.name, origin: newRoute.origin,
        destination: newRoute.destination, fare: parseFloat(newRoute.fare)
      });
      setSnackbar({ open: true, message: 'Route added!', severity: 'success' });
      setRouteDialogOpen(false);
      setNewRoute({ name: '', origin: '', destination: '', fare: '' });
      fetchRoutes();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to add route.', severity: 'error' });
    }
  };

  const handleDeleteRoute = async (routeId) => {
    try {
      await axios.delete(`https://campusgo-production-3b90.up.railway.app/api/routes/${routeId}`);
      setSnackbar({ open: true, message: 'Route removed!', severity: 'success' });
      fetchRoutes();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to remove route.', severity: 'error' });
    }
  };

  const handleCreateCompany = async () => {
    setCreateCompanyLoading(true);
    try {
      const res = await axios.post('https://campusgo-production-3b90.up.railway.app/api/admin/companies', {
        name: newCompany.name,
        inviteEmail: newCompany.inviteEmail,
      }, { headers: { 'x-user-id': user?.id } });

      setSnackbar({ open: true, message: `Company created! Invite sent to ${newCompany.inviteEmail}`, severity: 'success' });
      setCreateCompanyDialog(false);
      setNewCompany({ name: '', inviteEmail: '' });
      fetchCompanies();

      if (res.data.inviteToken) {
        const link = `${window.location.origin}/invite/${res.data.inviteToken}`;
        await navigator.clipboard.writeText(link).catch(() => {});
        setSnackbar({ open: true, message: `Invite link copied to clipboard!`, severity: 'success' });
      }
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to create company.', severity: 'error' });
    }
    setCreateCompanyLoading(false);
  };

  const handleCompanyStatus = async (companyId, status) => {
    try {
      await axios.put(`https://campusgo-production-3b90.up.railway.app/api/admin/companies/${companyId}/status`,
        { status },
        { headers: { 'x-user-id': user?.id } }
      );
      setSnackbar({ open: true, message: `Company ${status === 'active' ? 'approved' : 'suspended'}!`, severity: 'success' });
      fetchCompanies();
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to update company status.', severity: 'error' });
    }
  };

  const handleCopyInviteLink = async (token) => {
    const link = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(link).catch(() => {});
    setInviteCopied(token);
    setTimeout(() => setInviteCopied(null), 2000);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#f9f9f9' }}>
      <AppBar position="static" sx={{ background: '#1F1F1F' }}>
        <Toolbar>
          <DirectionsBusIcon sx={{ mr: 1, color: '#2DBE60' }} />
          <Typography variant="h6" fontWeight="bold" sx={{ flexGrow: 1 }}>Campus GO — Platform Admin</Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>Welcome, {user?.full_name}</Typography>
          <Button color="inherit" startIcon={<SettingsIcon />} onClick={() => window.location.href = '/settings'} sx={{ mr: 1 }}>Settings</Button>
          <Button color="inherit" startIcon={<LogoutIcon />} onClick={handleLogout}>Logout</Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: 4 }}>
        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
          <Card sx={{ flex: 1, borderRadius: 3, borderLeft: '4px solid #2DBE60' }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Total Students</Typography>
              <Typography variant="h4" fontWeight="bold">{students.length}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, borderRadius: 3, borderLeft: '4px solid #2DBE60' }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Companies</Typography>
              <Typography variant="h4" fontWeight="bold">{companies.length}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, borderRadius: 3, borderLeft: '4px solid #2DBE60' }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Total Routes</Typography>
              <Typography variant="h4" fontWeight="bold">{routes.length}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, borderRadius: 3, borderLeft: '4px solid #2DBE60' }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Total Tickets Sold</Typography>
              <Typography variant="h4" fontWeight="bold" color="#2DBE60">{analytics?.totalTickets || 0}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, borderRadius: 3, borderLeft: '4px solid #2DBE60' }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Total Revenue</Typography>
              <Typography variant="h4" fontWeight="bold" color="#2DBE60">${parseFloat(analytics?.totalRevenue || 0).toFixed(2)}</Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, borderRadius: 3, borderLeft: '4px solid #2DBE60' }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Active Buses</Typography>
              <Typography variant="h4" fontWeight="bold" color={activeBuses.length > 0 ? '#2DBE60' : '#ccc'}>
                {activeBuses.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Tabs */}
        <Card sx={{ borderRadius: 3 }}>
          <CardContent>
            <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{
              mb: 3,
              '& .MuiTab-root.Mui-selected': { color: '#2DBE60' },
              '& .MuiTabs-indicator': { background: '#2DBE60' }
            }}>
              <Tab label="Companies" icon={<BusinessIcon />} iconPosition="start" />
              <Tab label="Wallets" icon={<AccountBalanceWalletIcon />} iconPosition="start" />
              <Tab label="Routes" icon={<RouteIcon />} iconPosition="start" />
              <Tab label="Feedback" icon={<FeedbackIcon />} iconPosition="start" />
              <Tab label="Analytics" icon={<BarChartIcon />} iconPosition="start" />
              <Tab label="Fleet Monitor" icon={<LocationOnIcon />} iconPosition="start" />
            </Tabs>

            {/* Companies Tab */}
            {tab === 0 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">Operator Companies</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Create companies and send invites to operator admins
                    </Typography>
                  </Box>
                  <Button variant="contained" startIcon={<AddIcon />}
                    sx={{ background: '#2DBE60', '&:hover': { background: '#1F1F1F' } }}
                    onClick={() => setCreateCompanyDialog(true)}>
                    Create Company
                  </Button>
                </Box>

                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ background: '#f9f9f9' }}>
                        <TableCell><strong>Company Name</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        <TableCell><strong>Operator Admin</strong></TableCell>
                        <TableCell><strong>Pending Invite</strong></TableCell>
                        <TableCell><strong>Created</strong></TableCell>
                        <TableCell><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {companies.map(company => {
                        const s = statusColors[company.status] || statusColors.pending;
                        return (
                          <TableRow key={company.id} hover>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <BusinessIcon sx={{ fontSize: 18, color: '#2DBE60' }} />
                                <Typography fontWeight="bold">{company.name}</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={s.label}
                                size="small"
                                icon={
                                  company.status === 'active' ? <CheckCircleIcon style={{ fontSize: 14 }} /> :
                                  company.status === 'suspended' ? <BlockIcon style={{ fontSize: 14 }} /> :
                                  <HourglassEmptyIcon style={{ fontSize: 14 }} />
                                }
                                sx={{ background: s.bg, color: s.color, fontWeight: 'bold' }}
                              />
                            </TableCell>
                            <TableCell>
                              {company.admin_name ? (
                                <Box>
                                  <Typography fontSize={13} fontWeight="bold">{company.admin_name}</Typography>
                                  <Typography fontSize={12} color="text.secondary">{company.admin_email}</Typography>
                                </Box>
                              ) : (
                                <Typography fontSize={13} color="text.secondary" fontStyle="italic">No admin yet</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              {company.invite_token && company.invite_status === 'pending' ? (
                                <Button
                                  size="small"
                                  variant="outlined"
                                  startIcon={<SendIcon />}
                                  onClick={() => handleCopyInviteLink(company.invite_token)}
                                  sx={{
                                    borderColor: inviteCopied === company.invite_token ? '#2DBE60' : '#1F1F1F',
                                    color: inviteCopied === company.invite_token ? '#2DBE60' : '#1F1F1F',
                                    fontSize: 12
                                  }}
                                >
                                  {inviteCopied === company.invite_token ? 'Copied!' : 'Copy Invite Link'}
                                </Button>
                              ) : (
                                <Typography fontSize={12} color="text.secondary">—</Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography fontSize={12} color="text.secondary">
                                {company.created_at ? new Date(company.created_at).toLocaleDateString() : '—'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                {company.status !== 'active' && (
                                  <Tooltip title="Approve Company">
                                    <Button size="small" variant="outlined"
                                      startIcon={<CheckCircleIcon />}
                                      onClick={() => handleCompanyStatus(company.id, 'active')}
                                      sx={{ borderColor: '#2DBE60', color: '#2DBE60', fontSize: 11,
                                        '&:hover': { background: '#2DBE60', color: '#fff' } }}>
                                      Approve
                                    </Button>
                                  </Tooltip>
                                )}
                                {company.status !== 'suspended' && (
                                  <Tooltip title="Suspend Company">
                                    <Button size="small" variant="outlined"
                                      startIcon={<BlockIcon />}
                                      onClick={() => handleCompanyStatus(company.id, 'suspended')}
                                      sx={{ borderColor: '#f44336', color: '#f44336', fontSize: 11,
                                        '&:hover': { background: '#f44336', color: '#fff' } }}>
                                      Suspend
                                    </Button>
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {companies.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                            <BusinessIcon sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
                            <Typography color="text.secondary" fontWeight="bold">No companies yet</Typography>
                            <Typography color="text.secondary" fontSize={13}>Click "Create Company" to onboard an operator</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Wallets Tab */}
            {tab === 1 && (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ background: '#f9f9f9' }}>
                      <TableCell><strong>Name</strong></TableCell>
                      <TableCell><strong>Email</strong></TableCell>
                      <TableCell><strong>Student ID</strong></TableCell>
                      <TableCell><strong>Balance</strong></TableCell>
                      <TableCell><strong>Action</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map(student => (
                      <TableRow key={student.id} hover>
                        <TableCell>{student.full_name}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>{student.student_id || '—'}</TableCell>
                        <TableCell>
                          <Chip label={`$${parseFloat(student.balance).toFixed(2)}`} size="small"
                            sx={{ background: student.balance > 0 ? '#2DBE60' : '#eee', color: student.balance > 0 ? '#fff' : '#1F1F1F', fontWeight: 'bold' }} />
                        </TableCell>
                        <TableCell>
                          <Button size="small" variant="contained" startIcon={<AddIcon />}
                            sx={{ background: '#2DBE60', '&:hover': { background: '#1F1F1F' } }}
                            onClick={() => { setSelectedStudent(student); setTopupDialogOpen(true); }}>
                            Top Up
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {students.length === 0 && (
                      <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No students yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Routes Tab */}
            {tab === 2 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button variant="contained" startIcon={<AddIcon />}
                    sx={{ background: '#2DBE60', '&:hover': { background: '#1F1F1F' } }}
                    onClick={() => setRouteDialogOpen(true)}>
                    Add Route
                  </Button>
                </Box>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ background: '#f9f9f9' }}>
                        <TableCell><strong>Route Name</strong></TableCell>
                        <TableCell><strong>Origin</strong></TableCell>
                        <TableCell><strong>Destination</strong></TableCell>
                        <TableCell><strong>Fare</strong></TableCell>
                        <TableCell><strong>Action</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {routes.map(route => (
                        <TableRow key={route.id} hover>
                          <TableCell>{route.name}</TableCell>
                          <TableCell>{route.origin}</TableCell>
                          <TableCell>{route.destination}</TableCell>
                          <TableCell>
                            <Chip label={`$${parseFloat(route.fare).toFixed(2)}`} size="small"
                              sx={{ background: '#2DBE60', color: '#fff', fontWeight: 'bold' }} />
                          </TableCell>
                          <TableCell>
                            <Button size="small" variant="outlined"
                              sx={{ borderColor: '#f44336', color: '#f44336', '&:hover': { background: '#f44336', color: '#fff' } }}
                              onClick={() => handleDeleteRoute(route.id)}>
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {routes.length === 0 && (
                        <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>No routes yet</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* Feedback Tab */}
            {tab === 3 && (
              <TableContainer component={Paper} elevation={0}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ background: '#f9f9f9' }}>
                      <TableCell><strong>Student</strong></TableCell>
                      <TableCell><strong>Route</strong></TableCell>
                      <TableCell><strong>Message</strong></TableCell>
                      <TableCell><strong>Date</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {feedback.map(f => (
                      <TableRow key={f.id} hover>
                        <TableCell>{f.student_name}</TableCell>
                        <TableCell>{f.route_name || '—'}</TableCell>
                        <TableCell>{f.message}</TableCell>
                        <TableCell>{new Date(f.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                    {feedback.length === 0 && (
                      <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>No feedback yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Analytics Tab */}
            {tab === 4 && (
              <Box>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>🚌 Tickets by Route</Typography>
                {analytics?.ticketsByRoute?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.ticketsByRoute}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="ticket_count" fill="#2DBE60" name="Tickets Sold" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No ticket data yet</Typography>
                )}
                <Typography variant="h6" fontWeight="bold" sx={{ mt: 4, mb: 2 }}>📈 Tickets Over Time</Typography>
                {analytics?.ticketsByDay?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.ticketsByDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="count" stroke="#2DBE60" strokeWidth={3} dot={{ fill: '#2DBE60' }} name="Tickets" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No data yet</Typography>
                )}
                <Typography variant="h6" fontWeight="bold" sx={{ mt: 4, mb: 2 }}>💰 Revenue by Route</Typography>
                {analytics?.ticketsByRoute?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.ticketsByRoute}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip />
                      <Bar dataKey="revenue" fill="#1F1F1F" name="Revenue ($)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No revenue data yet</Typography>
                )}
              </Box>
            )}

            {/* Fleet Monitor Tab */}
            {tab === 5 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6" fontWeight="bold">🛡️ Live Fleet Monitor</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {lastFleetUpdate && (
                      <Typography variant="caption" color="text.secondary">
                        Last updated: {lastFleetUpdate.toLocaleTimeString()}
                      </Typography>
                    )}
                    <Chip
                      label={activeBuses.length > 0 ? `${activeBuses.length} bus${activeBuses.length !== 1 ? 'es' : ''} on road` : 'No active buses'}
                      sx={{ background: activeBuses.length > 0 ? '#2DBE60' : '#ccc', color: '#fff', fontWeight: 'bold' }}
                    />
                  </Box>
                </Box>

                <MapContainer center={defaultCenter} zoom={13}
                  style={{ width: '100%', height: '450px', borderRadius: '12px', zIndex: 0, marginBottom: '24px' }}>
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <AutoFitBounds buses={activeBuses} />
                  {activeBuses.map(bus => {
                    const minsAgo = getLastSeenMinutes(bus.updated_at);
                    const isStale = minsAgo >= 2;
                    return (
                      <Marker key={bus.operator_id}
                        position={[parseFloat(bus.latitude), parseFloat(bus.longitude)]}
                        icon={isStale ? warningIcon : busIcon}>
                        <Popup>
                          <Box sx={{ p: 0.5, minWidth: 190 }}>
                            <Typography fontWeight="bold" fontSize={14} color="#2DBE60">🚌 {bus.route_name}</Typography>
                            <Typography fontSize={13} fontWeight="bold">🚗 {bus.number_plate || 'No plate'}</Typography>
                            <Typography fontSize={12} color="#555">📍 {parseFloat(bus.latitude).toFixed(5)}, {parseFloat(bus.longitude).toFixed(5)}</Typography>
                            <Typography fontSize={12} fontWeight="bold" color={isStale ? '#f44336' : '#2DBE60'} sx={{ mt: 0.5 }}>
                              {isStale ? `⚠️ Last seen ${minsAgo} min ago` : '✅ Live — updating'}
                            </Typography>
                          </Box>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>

                {activeBuses.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">Bus Details</Typography>
                    {activeBuses.map(bus => {
                      const minsAgo = getLastSeenMinutes(bus.updated_at);
                      const isStale = minsAgo >= 2;
                      return (
                        <Card key={bus.operator_id} sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid #eee', borderLeft: `4px solid ${isStale ? '#ff9800' : '#2DBE60'}` }}>
                          <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <Box>
                                <Typography fontWeight="bold" fontSize={15}>🚌 {bus.route_name}</Typography>
                                <Typography fontSize={13} fontWeight="bold" color="#1F1F1F">🚗 {bus.number_plate || 'No plate'}</Typography>
                                <Typography fontSize={12} color="text.secondary">📍 {parseFloat(bus.latitude).toFixed(5)}, {parseFloat(bus.longitude).toFixed(5)}</Typography>
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Chip label={isStale ? `⚠️ ${minsAgo}m ago` : '● Live'} size="small"
                                  sx={{ background: isStale ? '#ff9800' : '#2DBE60', color: '#fff', fontWeight: 'bold', mb: 0.5 }} />
                                <Typography fontSize={11} color="text.secondary" display="block">
                                  {new Date(bus.updated_at).toLocaleTimeString()}
                                </Typography>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 6, background: '#f9f9f9', borderRadius: 3, border: '1px dashed #ccc' }}>
                    <Typography fontSize={40}>🚌</Typography>
                    <Typography color="text.secondary" fontWeight="bold" mt={1}>No buses currently on the road</Typography>
                    <Typography color="text.secondary" fontSize={13}>When operators start trips, they'll appear here in real time</Typography>
                  </Box>
                )}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Create Company Dialog */}
      <Dialog open={createCompanyDialog} onClose={() => setCreateCompanyDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight="bold">🏢 Create Operator Company</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create a company and send an invite to the operator admin. They'll receive a link to set up their account.
          </Typography>
          <TextField
            fullWidth label="Company Name" value={newCompany.name}
            onChange={e => setNewCompany({ ...newCompany, name: e.target.value })}
            sx={{ mb: 2, mt: 1 }} autoFocus placeholder="e.g. City Transit Ltd"
          />
          <TextField
            fullWidth label="Operator Admin Email" type="email" value={newCompany.inviteEmail}
            onChange={e => setNewCompany({ ...newCompany, inviteEmail: e.target.value })}
            placeholder="e.g. admin@citytransit.com"
            helperText="An invite link will be generated for this email"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateCompanyDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateCompany}
            disabled={!newCompany.name || !newCompany.inviteEmail || createCompanyLoading}
            sx={{ background: '#2DBE60', '&:hover': { background: '#1F1F1F' } }}>
            {createCompanyLoading ? 'Creating...' : 'Create & Get Invite Link'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Top Up Dialog */}
      <Dialog open={topupDialogOpen} onClose={() => setTopupDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight="bold">Top Up Wallet</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Student: <strong>{selectedStudent?.full_name}</strong><br />
            Current Balance: <strong>${parseFloat(selectedStudent?.balance || 0).toFixed(2)}</strong>
          </Typography>
          <TextField fullWidth label="Amount ($)" type="number"
            value={topupAmount} onChange={e => setTopupAmount(e.target.value)}
            inputProps={{ min: 1 }} autoFocus />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTopupDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleTopup} disabled={!topupAmount || topupAmount <= 0}
            sx={{ background: '#2DBE60', '&:hover': { background: '#1F1F1F' } }}>Top Up</Button>
        </DialogActions>
      </Dialog>

      {/* Add Route Dialog */}
      <Dialog open={routeDialogOpen} onClose={() => setRouteDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight="bold">Add New Route</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Route Name" value={newRoute.name}
            onChange={e => setNewRoute({ ...newRoute, name: e.target.value })} sx={{ mb: 2, mt: 1 }} />
          <TextField fullWidth label="Origin" value={newRoute.origin}
            onChange={e => setNewRoute({ ...newRoute, origin: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Destination" value={newRoute.destination}
            onChange={e => setNewRoute({ ...newRoute, destination: e.target.value })} sx={{ mb: 2 }} />
          <TextField fullWidth label="Fare ($)" type="number" value={newRoute.fare}
            onChange={e => setNewRoute({ ...newRoute, fare: e.target.value })} inputProps={{ min: 0 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRouteDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddRoute}
            disabled={!newRoute.name || !newRoute.origin || !newRoute.destination || !newRoute.fare}
            sx={{ background: '#2DBE60', '&:hover': { background: '#1F1F1F' } }}>Add Route</Button>
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
