import { useState } from 'react';
import axios from 'axios';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert,
  Stepper, Step, StepLabel, IconButton
} from '@mui/material';
import DirectionsBusIcon from '@mui/icons-material/DirectionsBus';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

const steps = ['Company Details', 'Bus Registration', 'Routes Setup'];

export default function OperatorSignUp() {
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Step 1
  const [companyName, setCompanyName] = useState('');
  const [numBuses, setNumBuses] = useState('');

  // Step 2
  const [plates, setPlates] = useState(['']);

  // Step 3
  const [routeNames, setRouteNames] = useState(['']);

  // Operator account
  const [account, setAccount] = useState({ full_name: '', email: '', password: '' });

  const handleNext = () => {
    if (activeStep === 0 && (!companyName || !numBuses)) return setError('Please fill in all fields');
    if (activeStep === 1 && plates.some(p => !p)) return setError('Please fill in all plate numbers');
    setError('');
    setActiveStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    if (!account.full_name || !account.email || !account.password) return setError('Please fill in all account fields');
    try {
      await axios.post('http://localhost:5000/api/auth/register', {
        full_name: account.full_name,
        email: account.email,
        password: account.password,
        role: 'operator'
      });
      setSuccess('Operator account created! Bus numbers and routes can be edited later in Settings. Redirecting...');
      setTimeout(() => window.location.href = '/', 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#1F1F1F', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
      <Card sx={{ width: 480, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <DirectionsBusIcon sx={{ fontSize: 48, color: '#2DBE60' }} />
            <Typography variant="h5" fontWeight="bold" color="#1F1F1F">Operator Sign Up</Typography>
            <Typography variant="body2" color="text.secondary">Campus GO — Smart Campus Transit</Typography>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map(label => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {/* Step 1 — Company Details */}
          {activeStep === 0 && (
            <Box>
              <TextField fullWidth label="Bus Company Name" value={companyName}
                onChange={e => setCompanyName(e.target.value)} sx={{ mb: 2 }} required />
              <TextField fullWidth label="Number of Buses" type="number" value={numBuses}
                onChange={e => setNumBuses(e.target.value)} sx={{ mb: 3 }} required inputProps={{ min: 1 }} />
              <Button fullWidth variant="contained" onClick={handleNext}
                sx={{ py: 1.5, background: '#2DBE60', fontWeight: 'bold', '&:hover': { background: '#1F1F1F' } }}>
                Continue
              </Button>
            </Box>
          )}

          {/* Step 2 — Bus Registration */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter your bus plate numbers. These can be edited later in Settings.
              </Typography>
              {plates.map((plate, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TextField fullWidth label={`Bus Plate #${i + 1}`} value={plate}
                    onChange={e => { const updated = [...plates]; updated[i] = e.target.value; setPlates(updated); }} />
                  {plates.length > 1 && (
                    <IconButton onClick={() => setPlates(plates.filter((_, idx) => idx !== i))}>
                      <RemoveCircleOutlineIcon color="error" />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button startIcon={<AddCircleOutlineIcon />} onClick={() => setPlates([...plates, ''])}
                sx={{ color: '#2DBE60', mb: 3 }}>
                Add another bus
              </Button>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button fullWidth variant="outlined" onClick={() => setActiveStep(0)}
                  sx={{ borderColor: '#1F1F1F', color: '#1F1F1F' }}>Back</Button>
                <Button fullWidth variant="contained" onClick={handleNext}
                  sx={{ background: '#2DBE60', fontWeight: 'bold', '&:hover': { background: '#1F1F1F' } }}>
                  Continue
                </Button>
              </Box>
            </Box>
          )}

          {/* Step 3 — Routes Setup */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter your route names. These can be edited later in Settings.
              </Typography>
              {routeNames.map((route, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TextField fullWidth label={`Route #${i + 1}`} value={route}
                    onChange={e => { const updated = [...routeNames]; updated[i] = e.target.value; setRouteNames(updated); }} />
                  {routeNames.length > 1 && (
                    <IconButton onClick={() => setRouteNames(routeNames.filter((_, idx) => idx !== i))}>
                      <RemoveCircleOutlineIcon color="error" />
                    </IconButton>
                  )}
                </Box>
              ))}
              <Button startIcon={<AddCircleOutlineIcon />} onClick={() => setRouteNames([...routeNames, ''])}
                sx={{ color: '#2DBE60', mb: 3 }}>
                Add another route
              </Button>

              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>Your Account Details</Typography>
              <TextField fullWidth label="Full Name" value={account.full_name}
                onChange={e => setAccount({ ...account, full_name: e.target.value })} sx={{ mb: 2 }} />
              <TextField fullWidth label="Email" type="email" value={account.email}
                onChange={e => setAccount({ ...account, email: e.target.value })} sx={{ mb: 2 }} />
              <TextField fullWidth label="Password" type="password" value={account.password}
                onChange={e => setAccount({ ...account, password: e.target.value })} sx={{ mb: 3 }} />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button fullWidth variant="outlined" onClick={() => setActiveStep(1)}
                  sx={{ borderColor: '#1F1F1F', color: '#1F1F1F' }}>Back</Button>
                <Button fullWidth variant="contained" onClick={handleSubmit}
                  sx={{ background: '#2DBE60', fontWeight: 'bold', '&:hover': { background: '#1F1F1F' } }}>
                  Finish Setup
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === 0 && (
            <Button fullWidth sx={{ mt: 1, color: '#1F1F1F' }} onClick={() => window.location.href = '/'}>
              Already have an account? Login
            </Button>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}