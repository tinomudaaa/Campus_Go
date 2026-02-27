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

  // Step 2 — plates auto-expand based on numBuses
  const [plates, setPlates] = useState(['']);

  // Step 3
  const [routeNames, setRouteNames] = useState(['']);

  // Operator account
  const [account, setAccount] = useState({ full_name: '', email: '', password: '' });

  const handleNext = () => {
    if (activeStep === 0) {
      if (!companyName || !numBuses) return setError('Please fill in all fields');
      // Auto-set number of plate fields based on numBuses
      const count = parseInt(numBuses);
      if (count > 0) setPlates(Array(count).fill(''));
    }
    if (activeStep === 1 && plates.some(p => !p.trim())) return setError('Please fill in all plate numbers');
    if (activeStep === 2 && routeNames.some(r => !r.trim())) return setError('Please fill in all route names');
    setError('');
    setActiveStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    if (!account.full_name || !account.email || !account.password)
      return setError('Please fill in all account fields');
    if (account.password.length < 6)
      return setError('Password must be at least 6 characters');

    try {
      await axios.post('https://campusgo-production-3b90.up.railway.app/api/auth/register', {
        full_name: account.full_name,
        email: account.email,
        password: account.password,
        role: 'operator',
        companyName,
        plates: plates.filter(p => p.trim()),
        routeNames: routeNames.filter(r => r.trim())
      });
      setSuccess('Setup complete! Your company, buses and routes have been registered. Redirecting to login...');
      setTimeout(() => window.location.href = '/', 2500);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.');
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#1F1F1F', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
      <Card sx={{ width: 500, borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
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
                onChange={e => setCompanyName(e.target.value)} sx={{ mb: 2 }} required
                placeholder="e.g. Campus Transit Co" />
              <TextField fullWidth label="Number of Buses" type="number" value={numBuses}
                onChange={e => setNumBuses(e.target.value)} sx={{ mb: 3 }} required inputProps={{ min: 1, max: 50 }}
                helperText="This determines how many plate fields you'll fill in next" />
              <Button fullWidth variant="contained" onClick={handleNext}
                sx={{ py: 1.5, background: '#2DBE60', fontWeight: 'bold', '&:hover': { background: '#1F1F1F' } }}>
                Continue
              </Button>
              <Button fullWidth sx={{ mt: 1, color: '#1F1F1F' }} onClick={() => window.location.href = '/'}>
                Already have an account? Login
              </Button>
            </Box>
          )}

          {/* Step 2 — Bus Registration */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter the number plate for each of your <strong>{numBuses}</strong> buses.
              </Typography>
              <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1 }}>
                {plates.map((plate, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <TextField fullWidth label={`Bus ${i + 1} Plate`} value={plate}
                      onChange={e => {
                        const updated = [...plates];
                        updated[i] = e.target.value.toUpperCase();
                        setPlates(updated);
                      }}
                      placeholder="e.g. ABC 1234" />
                    {plates.length > 1 && (
                      <IconButton onClick={() => setPlates(plates.filter((_, idx) => idx !== i))}>
                        <RemoveCircleOutlineIcon color="error" />
                      </IconButton>
                    )}
                  </Box>
                ))}
              </Box>
              <Button startIcon={<AddCircleOutlineIcon />} onClick={() => setPlates([...plates, ''])}
                sx={{ color: '#2DBE60', mb: 3, mt: 1 }}>
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

          {/* Step 3 — Routes + Account */}
          {activeStep === 2 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter your route names (e.g. "Town", "Macs", "Campus Loop").
              </Typography>
              {routeNames.map((route, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <TextField fullWidth label={`Route #${i + 1}`} value={route}
                    onChange={e => {
                      const updated = [...routeNames];
                      updated[i] = e.target.value;
                      setRouteNames(updated);
                    }}
                    placeholder="e.g. Town, Macs, Campus" />
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

              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, mt: 1 }}>
                Your Admin Account
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                This is the account you'll use to manage everything.
              </Typography>
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
                  disabled={!account.full_name || !account.email || !account.password}
                  sx={{ background: '#2DBE60', fontWeight: 'bold', '&:hover': { background: '#1F1F1F' } }}>
                  Finish Setup
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
