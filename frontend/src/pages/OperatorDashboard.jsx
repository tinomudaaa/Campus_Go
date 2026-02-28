import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Box, Typography, Card, CardContent, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Alert, Snackbar, MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import TextField from '@mui/material/TextField';
import CampusGoHeader from './CampusGoHeader';

export default function OperatorDashboard() {
  const [qrInput, setQrInput] = useState('');
  const [scannedTickets, setScannedTickets] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [companyPlates, setCompanyPlates] = useState([]);
  const [activePlates, setActivePlates] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedPlate, setSelectedPlate] = useState('');
  const [tripActive, setTripActive] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const watchIdRef = useRef(null);
  const plateRef = useRef('');
  const selectedRouteIdRef = useRef('');
  const user = JSON.parse(localStorage.getItem('campusgo_user'));

  const fetchCompanyData = async () => {
    try {
      const routesRes = await axios.get('https://campusgo-production-3b90.up.railway.app/api/routes');
      setRoutes(routesRes.data);
      if (user?.company_id) {
        const platesRes = await axios.get(`https://campusgo-production-3b90.up.railway.app/api/buses/company/${user.company_id}`);
        setCompanyPlates(platesRes.data);
      }
      const activeRes = await axios.get('https://campusgo-production-3b90.up.railway.app/api/locations/active');
      setActivePlates(activeRes.data.map(b => b.number_plate).filter(Boolean));
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchCompanyData();
    const interval = setInterval(() => {
      axios.get('https://campusgo-production-3b90.up.railway.app/api/locations/active')
        .then(res => setActivePlates(res.data.map(b => b.number_plate).filter(Boolean)))
        .catch(console.error);
    }, 10000);
    return () => {
      clearInterval(interval);
      if (watchIdRef.current) clearInterval(watchIdRef.current);
    };
  }, []);

  const sendLocation = (lat, lng) => {
    return axios.post('https://campusgo-production-3b90.up.railway.app/api/locations/update', {
      operator_id: user.id, latitude: lat, longitude: lng,
      route_id: selectedRouteIdRef.current, number_plate: plateRef.current
    });
  };

  const startTrip = () => {
    if (!selectedRouteId) return setSnackbar({ open: true, message: 'Please select a route first.', severity: 'error' });
    if (!selectedPlate) return setSnackbar({ open: true, message: 'Please select a bus plate.', severity: 'error' });

    plateRef.current = selectedPlate;
    selectedRouteIdRef.current = selectedRouteId;

    navigator.geolocation.getCurrentPosition(
      (initialPos) => {
        setTripActive(true);
        sendLocation(initialPos.coords.latitude, initialPos.coords.longitude);
        watchIdRef.current = setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              try { await sendLocation(pos.coords.latitude, pos.coords.longitude); }
              catch (err) { console.error(err); }
            },
            (err) => console.error('GPS error:', err),
            { enableHighAccuracy: true, maximumAge: 3000 }
          );
        }, 5000);
        setSnackbar({ open: true, message: `Trip started! Bus ${selectedPlate} is now live.`, severity: 'success' });
      },
      () => setSnackbar({ open: true, message: 'Location permission denied. Please allow location access.', severity: 'error' })
    );
  };

  const stopTrip = async () => {
    setTripActive(false);
    if (watchIdRef.current) { clearInterval(watchIdRef.current); watchIdRef.current = null; }
    try {
      await axios.delete(`https://campusgo-production-3b90.up.railway.app/api/locations/stop/${user.id}`);
      setSnackbar({ open: true, message: 'Trip ended.', severity: 'info' });
      const activeRes = await axios.get('https://campusgo-production-3b90.up.railway.app/api/locations/active');
      setActivePlates(activeRes.data.map(b => b.number_plate).filter(Boolean));
    } catch (err) { console.error(err); }
  };

  const handleScan = async () => {
    if (!qrInput.trim()) return;
    try {
      const res = await axios.post('https://campusgo-production-3b90.up.railway.app/api/tickets/scan', { qr_code: qrInput });
      setScannedTickets(prev => [res.data, ...prev]);
      setSnackbar({ open: true, message: 'Ticket validated successfully!', severity: 'success' });
      setQrInput('');
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Invalid or already used ticket', severity: 'error' });
      setQrInput('');
    }
  };

  const handleLogout = () => {
    if (tripActive) stopTrip();
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#f9f9f9' }}>
      <CampusGoHeader user={user} role="Operator" />

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

        {/* Trip Control */}
        <Card sx={{ borderRadius: 3, mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <DirectionsBusIcon sx={{ color: '#2DBE60' }} />
              <Typography variant="h6" fontWeight="bold">Trip Control</Typography>
            </Box>
            {!tripActive ? (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Select your route and bus, then start your trip.
                </Typography>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Select Route</InputLabel>
                  <Select value={selectedRouteId} label="Select Route" onChange={e => setSelectedRouteId(e.target.value)}>
                    <MenuItem value="">-- Select your route --</MenuItem>
                    {routes.map(r => <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>)}
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Select Bus Plate</InputLabel>
                  <Select value={selectedPlate} label="Select Bus Plate" onChange={e => setSelectedPlate(e.target.value)}>
                    <MenuItem value="">-- Select your bus --</MenuItem>
                    {companyPlates.length > 0 ? (
                      companyPlates.map(bus => {
                        const inUse = activePlates.includes(bus.plate_number) && bus.plate_number !== plateRef.current;
                        return (
                          <MenuItem key={bus.id} value={bus.plate_number} disabled={inUse} sx={{ color: inUse ? '#aaa' : 'inherit' }}>
                            {bus.plate_number} {inUse ? '(In Use)' : ''}
                          </MenuItem>
                        );
                      })
                    ) : (
                      <MenuItem disabled>No buses registered — contact admin</MenuItem>
                    )}
                  </Select>
                </FormControl>
                <Button fullWidth variant="contained" onClick={startTrip}
                  disabled={!selectedRouteId || !selectedPlate}
                  startIcon={<PlayCircleIcon />}
                  sx={{ py: 1.5, background: '#2DBE60', fontWeight: 'bold', '&:hover': { background: '#1F1F1F' } }}>
                  Start Trip
                </Button>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center' }}>
                <Chip
                  icon={<FiberManualRecordIcon style={{ fontSize: 12 }} />}
                  label={`Active — ${plateRef.current}`}
                  sx={{ background: '#2DBE60', color: '#fff', fontWeight: 'bold', mb: 2, fontSize: 14 }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Bus {plateRef.current} is live — updating every 5 seconds.
                </Typography>
                <Button fullWidth variant="contained" onClick={stopTrip}
                  startIcon={<StopCircleIcon />}
                  sx={{ py: 1.5, background: '#f44336', fontWeight: 'bold', '&:hover': { background: '#1F1F1F' } }}>
                  Stop Trip
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

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
                fullWidth label="Scan or enter QR code" value={qrInput}
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
                        <Chip icon={<CheckCircleIcon style={{ fontSize: 14 }} />} label="Used" size="small"
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
