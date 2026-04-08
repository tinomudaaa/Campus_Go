import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
  Box, Typography, Card, CardContent, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, Alert, Snackbar, MenuItem, Select, FormControl, InputLabel,
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, TextField
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import CloseIcon from '@mui/icons-material/Close';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CampusGoHeader from './CampusGoHeader';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SendIcon from '@mui/icons-material/Send';
import NotificationsIcon from '@mui/icons-material/Notifications';
import InfoIcon from '@mui/icons-material/Info';
import ErrorIcon from '@mui/icons-material/Error';
import { Html5Qrcode } from 'html5-qrcode';

const API = 'https://campus-go-f21t.onrender.com';

const ALERT_PRESETS = [
  {
    label: 'Bus Delay',
    icon: <DirectionsBusIcon fontSize="small" />,
    type: 'warning',
    getMessage: (plate, route) =>
      `Bus ${plate} on the ${route} route is currently delayed. We apologise for the inconvenience.`,
  },
  {
    label: 'Route Change',
    icon: <WarningAmberIcon fontSize="small" />,
    type: 'info',
    getMessage: (plate, route) =>
      `The route for bus ${plate} has been temporarily changed. Please check for updates.`,
  },
  {
    label: 'Trip Cancelled',
    icon: <ErrorIcon fontSize="small" />,
    type: 'urgent',
    getMessage: (plate, route) =>
      `The trip for bus ${plate} on the ${route} route has been cancelled. We apologise for the inconvenience.`,
  },
  {
    label: 'Bus Departing',
    icon: <PlayCircleIcon fontSize="small" />,
    type: 'info',
    getMessage: (plate, route) =>
      `Bus ${plate} on the ${route} route is now departing. Please make your way to the stop.`,
  },
];

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
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');

  // Alert state
  const [alertDialog, setAlertDialog] = useState(false);
  const [alertForm, setAlertForm] = useState({ title: '', message: '', type: 'warning' });
  const [sendingAlert, setSendingAlert] = useState(false);

  const watchIdRef = useRef(null);
  const plateRef = useRef('');
  const selectedRouteIdRef = useRef('');
  const selectedRouteNameRef = useRef('');
  const sessionIdRef = useRef(null); // tracks current trip session
  const scannerRef = useRef(null);
  const user = JSON.parse(localStorage.getItem('campusgo_user'));

  const fetchCompanyData = async () => {
    try {
      const routesRes = await axios.get(`${API}/api/routes`);
      setRoutes(routesRes.data);
      if (user?.company_id) {
        const platesRes = await axios.get(`${API}/api/buses/company/${user.company_id}`);
        setCompanyPlates(platesRes.data);
      }
      const activeRes = await axios.get(`${API}/api/locations/active`);
      setActivePlates(activeRes.data.map(b => b.number_plate).filter(Boolean));
    } catch (err) { console.error(err); }
  };

  // On mount: check if operator has an active session (handles refresh)
  const restoreSession = async () => {
    try {
      const res = await axios.get(`${API}/api/locations/active-session/${user.id}`);
      const session = res.data;
      if (!session) return;

      // Restore session state
      sessionIdRef.current = session.id;
      plateRef.current = session.number_plate;
      selectedRouteIdRef.current = session.route_id;
      selectedRouteNameRef.current = session.route_name;
      setSelectedPlate(session.number_plate);
      setSelectedRouteId(String(session.route_id));
      setTripActive(true);

      // Reload scanned tickets for this session
      const ticketsRes = await axios.get(`${API}/api/tickets/session/${session.id}`);
      setScannedTickets(ticketsRes.data);

      // Resume location tracking
      watchIdRef.current = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              await axios.post(`${API}/api/locations/update`, {
                operator_id: user.id,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                route_id: selectedRouteIdRef.current,
                number_plate: plateRef.current,
              });
            } catch (err) { console.error(err); }
          },
          (err) => console.error('GPS error:', err),
          { enableHighAccuracy: true, maximumAge: 3000 }
        );
      }, 5000);

      setSnackbar({ open: true, message: `Trip restored — Bus ${session.number_plate}`, severity: 'info' });
    } catch (err) {
      console.error('Session restore error:', err);
    }
  };

  useEffect(() => {
    fetchCompanyData();
    restoreSession();
    const interval = setInterval(() => {
      axios.get(`${API}/api/locations/active`)
        .then(res => setActivePlates(res.data.map(b => b.number_plate).filter(Boolean)))
        .catch(console.error);
    }, 10000);
    return () => {
      clearInterval(interval);
      if (watchIdRef.current) clearInterval(watchIdRef.current);
    };
  }, []);

  useEffect(() => {
    if (!cameraOpen) return;
    setCameraError('');
    const timer = setTimeout(async () => {
      try {
        const html5QrCode = new Html5Qrcode('qr-reader-direct');
        scannerRef.current = html5QrCode;
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) { setCameraError('No camera found on this device.'); return; }
        const backCamera = cameras.find(c =>
          c.label.toLowerCase().includes('back') ||
          c.label.toLowerCase().includes('rear') ||
          c.label.toLowerCase().includes('environment')
        ) || cameras[cameras.length - 1];
        await html5QrCode.start(
          backCamera.id,
          { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
          async (decodedText) => {
            await html5QrCode.stop().catch(() => {});
            scannerRef.current = null;
            setCameraOpen(false);
            setScanning(true);
            await validateTicket(decodedText);
            setScanning(false);
          },
          () => {}
        );
      } catch (err) {
        console.error('Camera error:', err);
        setCameraError('Could not access camera. Please allow camera permission and try again.');
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [cameraOpen]);

  const closeCamera = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      scannerRef.current = null;
    }
    setCameraOpen(false);
    setCameraError('');
  };

  const validateTicket = async (code) => {
    if (!code?.trim()) return;
    try {
      const res = await axios.post(`${API}/api/tickets/scan`, {
        qr_code: code.trim(),
        session_id: sessionIdRef.current,
        operator_id: user.id,
      });
      setScannedTickets(prev => [res.data, ...prev]);
      setSnackbar({ open: true, message: 'Ticket validated successfully!', severity: 'success' });
      setQrInput('');
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Invalid or already used ticket',
        severity: 'error'
      });
      setQrInput('');
    }
  };

  const sendLocation = (lat, lng) => {
    return axios.post(`${API}/api/locations/update`, {
      operator_id: user.id, latitude: lat, longitude: lng,
      route_id: selectedRouteIdRef.current, number_plate: plateRef.current
    });
  };

  const startTrip = async () => {
    if (!selectedRouteId) return setSnackbar({ open: true, message: 'Please select a route first.', severity: 'error' });
    if (!selectedPlate) return setSnackbar({ open: true, message: 'Please select a bus plate.', severity: 'error' });

    const routeName = routes.find(r => String(r.id) === String(selectedRouteId))?.name || '';
    plateRef.current = selectedPlate;
    selectedRouteIdRef.current = selectedRouteId;
    selectedRouteNameRef.current = routeName;

    try {
      // Create trip session in DB
      const sessionRes = await axios.post(`${API}/api/locations/start-session`, {
        operator_id: user.id,
        route_id: selectedRouteId,
        number_plate: selectedPlate,
      });
      sessionIdRef.current = sessionRes.data.id;
    } catch (err) {
      console.error('Failed to create session:', err);
    }

    navigator.geolocation.getCurrentPosition(
      (initialPos) => {
        setTripActive(true);
        setScannedTickets([]); // fresh list for new trip
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
      () => setSnackbar({ open: true, message: 'Location permission denied.', severity: 'error' })
    );
  };

  const stopTrip = async () => {
    setTripActive(false);
    if (watchIdRef.current) { clearInterval(watchIdRef.current); watchIdRef.current = null; }

    // End session in DB
    if (sessionIdRef.current) {
      try { await axios.post(`${API}/api/locations/end-session/${sessionIdRef.current}`); }
      catch (err) { console.error('Failed to end session:', err); }
      sessionIdRef.current = null;
    }

    try {
      await axios.delete(`${API}/api/locations/stop/${user.id}`);
      setSnackbar({ open: true, message: 'Trip ended.', severity: 'info' });
      const activeRes = await axios.get(`${API}/api/locations/active`);
      setActivePlates(activeRes.data.map(b => b.number_plate).filter(Boolean));
    } catch (err) { console.error(err); }
  };

  const openAlertDialog = (preset) => {
    setAlertForm({
      title: preset.label + (plateRef.current ? ` — ${plateRef.current}` : ''),
      message: preset.getMessage(plateRef.current || 'your bus', selectedRouteNameRef.current || 'your route'),
      type: preset.type,
    });
    setAlertDialog(true);
  };

  const handleSendAlert = async () => {
    if (!alertForm.title.trim() || !alertForm.message.trim()) return;
    setSendingAlert(true);
    try {
      await axios.post(`${API}/api/notifications`, {
        title: alertForm.title,
        message: alertForm.message,
        type: alertForm.type,
        target_role: 'student',
        company_id: user?.company_id,
      }, {
        headers: { 'x-user-id': user?.id, 'x-company-id': user?.company_id, 'x-user-role': 'operator' }
      });
      setSnackbar({ open: true, message: 'Alert sent to students!', severity: 'success' });
      setAlertDialog(false);
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.error || 'Failed to send alert.', severity: 'error' });
    } finally { setSendingAlert(false); }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#f9f9f9' }}>
      <CampusGoHeader user={user} role="Operator" />

      <Box sx={{ p: 4 }}>
        {/* Stats */}
        <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
          <Card sx={{ flex: 1, borderRadius: 3, borderLeft: '4px solid #2DBE60' }}>
            <CardContent>
              <Typography color="text.secondary" variant="body2">Tickets Scanned This Trip</Typography>
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
                          <MenuItem key={bus.id} value={bus.plate_number} disabled={inUse}>
                            {bus.plate_number}{inUse ? ' (In Use)' : ''}
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
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Bus {plateRef.current} is live — updating every 5 seconds.
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Route: <strong>{selectedRouteNameRef.current}</strong>
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

        {/* Send Alert — always visible */}
        <Card sx={{ borderRadius: 3, mb: 4, border: '1px solid #ff980033', borderLeft: '4px solid #ff9800' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <NotificationsIcon sx={{ color: '#ff9800' }} />
              <Typography variant="h6" fontWeight="bold">Send Alert to Students</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Notify students about delays or changes.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {ALERT_PRESETS.map((preset, i) => (
                <Button
                  key={i}
                  variant="outlined"
                  startIcon={preset.icon}
                  onClick={() => openAlertDialog(preset)}
                  sx={{
                    borderColor: preset.type === 'urgent' ? '#f44336' : preset.type === 'warning' ? '#ff9800' : '#2196f3',
                    color: preset.type === 'urgent' ? '#f44336' : preset.type === 'warning' ? '#ff9800' : '#2196f3',
                    fontWeight: 'bold',
                    '&:hover': {
                      background: preset.type === 'urgent' ? '#f44336' : preset.type === 'warning' ? '#ff9800' : '#2196f3',
                      borderColor: 'transparent',
                      color: '#fff',
                    }
                  }}>
                  {preset.label}
                </Button>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* QR Scanner */}
        <Card sx={{ borderRadius: 3, mb: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <QrCodeScannerIcon sx={{ color: '#2DBE60', fontSize: 28 }} />
              <Typography variant="h6" fontWeight="bold">Scan Ticket</Typography>
            </Box>
            <Button fullWidth variant="contained"
              startIcon={<CameraAltIcon />}
              onClick={() => setCameraOpen(true)}
              disabled={scanning}
              sx={{ mb: 2, py: 1.8, fontSize: 15, fontWeight: 'bold', background: '#1F1F1F', '&:hover': { background: '#2DBE60' } }}>
              {scanning ? 'Validating...' : 'Open Camera Scanner'}
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
              <Typography variant="caption" color="text.secondary">or enter manually</Typography>
              <Box sx={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField fullWidth label="Enter QR code manually" value={qrInput}
                onChange={e => setQrInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && validateTicket(qrInput)}
                placeholder="Type or paste ticket code..." size="small" />
              <Button variant="contained" onClick={() => validateTicket(qrInput)}
                disabled={!qrInput.trim()}
                sx={{ px: 3, background: '#2DBE60', fontWeight: 'bold', whiteSpace: 'nowrap', '&:hover': { background: '#1F1F1F' } }}>
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
              <Typography variant="h6" fontWeight="bold">Scanned Tickets This Trip</Typography>
              {scannedTickets.length > 0 && (
                <Chip label={scannedTickets.length} size="small"
                  sx={{ background: '#2DBE60', color: '#fff', fontWeight: 'bold', ml: 1 }} />
              )}
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
                        {tripActive ? 'No tickets scanned yet this trip' : 'Start a trip to begin scanning tickets'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

      {/* Camera Dialog */}
      <Dialog open={cameraOpen} onClose={closeCamera} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QrCodeScannerIcon sx={{ color: '#2DBE60' }} />
            <Typography fontWeight="bold">Scan Student Ticket</Typography>
          </Box>
          <IconButton onClick={closeCamera} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pb: 1 }}>
          {cameraError ? (
            <Alert severity="error" sx={{ mb: 2 }}>{cameraError}</Alert>
          ) : (
            <Alert severity="info" sx={{ mb: 2, fontSize: 13 }}>
              Camera will open automatically — point at student's QR code.
            </Alert>
          )}
          <Box
            id="qr-reader-direct"
            sx={{
              width: '100%', minHeight: 300, background: '#000', borderRadius: 2, overflow: 'hidden',
              '& video': { width: '100% !important', borderRadius: 2 },
              '& canvas': { display: 'none' },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeCamera} variant="outlined" fullWidth sx={{ borderColor: '#ccc', color: '#555' }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Alert Dialog */}
      <Dialog open={alertDialog} onClose={() => setAlertDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle fontWeight="bold">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <WarningAmberIcon sx={{ color: '#ff9800' }} />
            Send Alert to Students
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
            This alert will be sent immediately to all students.
          </Alert>
          <TextField
            fullWidth label="Title" value={alertForm.title}
            onChange={e => setAlertForm({ ...alertForm, title: e.target.value })}
            sx={{ mb: 2, mt: 1 }} />
          <TextField
            fullWidth multiline rows={3} label="Message" value={alertForm.message}
            onChange={e => setAlertForm({ ...alertForm, message: e.target.value })}
            sx={{ mb: 2 }} />
          <FormControl fullWidth>
            <InputLabel>Alert Type</InputLabel>
            <Select value={alertForm.type} label="Alert Type" onChange={e => setAlertForm({ ...alertForm, type: e.target.value })}>
              <MenuItem value="info"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><InfoIcon fontSize="small" sx={{ color: '#2196f3' }} /> Info</Box></MenuItem>
              <MenuItem value="warning"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><WarningAmberIcon fontSize="small" sx={{ color: '#ff9800' }} /> Warning</Box></MenuItem>
              <MenuItem value="urgent"><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><ErrorIcon fontSize="small" sx={{ color: '#f44336' }} /> Urgent</Box></MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAlertDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSendAlert}
            disabled={!alertForm.title.trim() || !alertForm.message.trim() || sendingAlert}
            sx={{ background: '#ff9800', fontWeight: 'bold', '&:hover': { background: '#e65100' } }}>
            {sendingAlert ? 'Sending...' : 'Send Alert'}
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
