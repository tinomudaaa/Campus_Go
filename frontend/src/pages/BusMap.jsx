import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { Box, Typography, Chip, Button, Card, CardContent } from '@mui/material';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const busIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [32, 52],
  iconAnchor: [16, 52],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const defaultCenter = [-17.8292, 31.0522];
const NOTIFY_RADIUS_METERS = 500;
const AVG_SPEED_KMH = 30;

function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getETAMinutes(distanceMeters) {
  const distanceKm = distanceMeters / 1000;
  return Math.ceil((distanceKm / AVG_SPEED_KMH) * 60);
}

function formatETA(minutes) {
  if (minutes < 1) return 'Arriving now!';
  if (minutes === 1) return '~1 min away';
  if (minutes < 60) return `~${minutes} mins away`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `~${hrs}h ${mins}m away`;
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function AutoPan({ buses }) {
  const map = useMap();
  useEffect(() => {
    if (buses.length === 0) return;
    if (buses.length === 1) {
      map.flyTo(
        [parseFloat(buses[0].latitude), parseFloat(buses[0].longitude)],
        16,
        { animate: true, duration: 1.5 }
      );
    } else {
      const bounds = L.latLngBounds(
        buses.map(b => [parseFloat(b.latitude), parseFloat(b.longitude)])
      );
      map.flyToBounds(bounds, { padding: [50, 50], animate: true, duration: 1.5 });
    }
  }, [buses]);
  return null;
}

export default function BusMap() {
  const [buses, setBuses] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notifStatus, setNotifStatus] = useState('idle');
  const [busesWithETA, setBusesWithETA] = useState([]);
  const studentLocation = useRef(null);
  const notifiedBuses = useRef(new Set());

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => {
          studentLocation.current = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude
          };
        },
        (err) => console.error('Student location error:', err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const computeETAs = (busList) => {
    if (!studentLocation.current) {
      setBusesWithETA(busList.map(b => ({ ...b, distance: null, eta: null })));
      return;
    }
    const enriched = busList.map(bus => {
      const dist = getDistanceMeters(
        studentLocation.current.lat,
        studentLocation.current.lng,
        parseFloat(bus.latitude),
        parseFloat(bus.longitude)
      );
      return { ...bus, distance: dist, eta: getETAMinutes(dist) };
    });
    enriched.sort((a, b) => a.distance - b.distance);
    setBusesWithETA(enriched);
  };

  const enableNotifications = async () => {
    if (!('Notification' in window)) {
      alert('Your browser does not support notifications.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      setNotifStatus('enabled');
    } else {
      setNotifStatus('denied');
    }
  };

  const checkProximity = (busList) => {
    if (!notificationsEnabled || !studentLocation.current) return;
    busList.forEach(bus => {
      const dist = getDistanceMeters(
        studentLocation.current.lat,
        studentLocation.current.lng,
        parseFloat(bus.latitude),
        parseFloat(bus.longitude)
      );
      if (dist <= NOTIFY_RADIUS_METERS && !notifiedBuses.current.has(bus.operator_id)) {
        new Notification('🚌 Bus Nearby!', {
          body: `${bus.route_name} bus is ${Math.round(dist)}m away — Be sure to be at your respective bus stop!`,
          icon: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        });
        notifiedBuses.current.add(bus.operator_id);
        setTimeout(() => notifiedBuses.current.delete(bus.operator_id), 120000);
      }
    });
  };

  const fetchBuses = async () => {
    try {
      const res = await axios.get('https://campusgo-production-3b90.up.railway.app/api/locations/active');
      setBuses(res.data);
      setLastUpdated(new Date());
      checkProximity(res.data);
      computeETAs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchBuses();
    const interval = setInterval(fetchBuses, 5000);
    return () => clearInterval(interval);
  }, [notificationsEnabled]);

  const closestBus = busesWithETA.length > 0 ? busesWithETA[0] : null;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">🗺️ Live Bus Tracking</Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {lastUpdated && (
            <Typography variant="caption" color="text.secondary">
              Updated {lastUpdated.toLocaleTimeString()}
            </Typography>
          )}
          <Chip
            label={buses.length > 0 ? `${buses.length} bus${buses.length !== 1 ? 'es' : ''} active` : 'No buses active'}
            size="small"
            sx={{ background: buses.length > 0 ? '#2DBE60' : '#ccc', color: '#fff', fontWeight: 'bold' }}
          />
        </Box>
      </Box>

      {/* ETA Banner — closest bus */}
      {closestBus && closestBus.distance !== null && (
        <Box sx={{
          background: closestBus.distance <= 500
            ? 'linear-gradient(135deg, #2DBE60, #1a9e4e)'
            : 'linear-gradient(135deg, #1F1F1F, #3a3a3a)',
          borderRadius: 2, px: 2.5, py: 1.5, mb: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <Box>
            <Typography fontWeight="bold" color="#fff" fontSize={15}>
              🚌 {closestBus.route_name}
            </Typography>
            <Typography color="rgba(255,255,255,0.8)" fontSize={13}>
              🚗 {closestBus.number_plate || '—'}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography fontWeight="bold" color="#fff" fontSize={18}>
              {formatETA(closestBus.eta)}
            </Typography>
            <Typography color="rgba(255,255,255,0.7)" fontSize={12}>
              {formatDistance(closestBus.distance)} from you
            </Typography>
          </Box>
        </Box>
      )}

      {/* No location banner */}
      {buses.length > 0 && !studentLocation.current && (
        <Box sx={{
          background: '#fff8e1', border: '1px solid #ffc107',
          borderRadius: 2, px: 2, py: 1.2, mb: 2
        }}>
          <Typography variant="body2" color="#b45309">
            📍 Allow location access to see ETA estimates
          </Typography>
        </Box>
      )}

      {/* Notification banner */}
      {notifStatus === 'idle' && (
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: '#f0faf4', border: '1px solid #2DBE60',
          borderRadius: 2, px: 2, py: 1.2, mb: 2
        }}>
          <Typography variant="body2" color="#1F1F1F">
            🔔 Get notified when a bus is within 500m of you
          </Typography>
          <Button size="small" variant="contained" onClick={enableNotifications}
            sx={{ background: '#2DBE60', fontWeight: 'bold', '&:hover': { background: '#1F1F1F' } }}>
            Enable
          </Button>
        </Box>
      )}
      {notifStatus === 'enabled' && (
        <Box sx={{
          background: '#f0faf4', border: '1px solid #2DBE60',
          borderRadius: 2, px: 2, py: 1.2, mb: 2
        }}>
          <Typography variant="body2" color="#2DBE60" fontWeight="bold">
            🔔 Notifications enabled — you'll be alerted when a bus is within 500m
          </Typography>
        </Box>
      )}
      {notifStatus === 'denied' && (
        <Box sx={{
          background: '#fff3f3', border: '1px solid #f44336',
          borderRadius: 2, px: 2, py: 1.2, mb: 2
        }}>
          <Typography variant="body2" color="#f44336">
            ❌ Notifications blocked. Enable them in your browser settings and refresh.
          </Typography>
        </Box>
      )}

      {/* Map */}
      <MapContainer
        center={defaultCenter}
        zoom={14}
        style={{ width: '100%', height: '420px', borderRadius: '12px', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <AutoPan buses={buses} />
        {busesWithETA.map(bus => (
          <Marker
            key={bus.operator_id}
            position={[parseFloat(bus.latitude), parseFloat(bus.longitude)]}
            icon={busIcon}
          >
            <Popup>
              <Box sx={{ p: 0.5, minWidth: 160 }}>
                <Typography fontWeight="bold" color="#2DBE60" fontSize={14}>
                  🚌 {bus.route_name}
                </Typography>
                <Typography fontSize={13} fontWeight="bold">
                  🚗 {bus.number_plate || '—'}
                </Typography>
                {bus.distance !== null && (
                  <>
                    <Box sx={{
                      mt: 1, pt: 1, borderTop: '1px solid #eee',
                      display: 'flex', justifyContent: 'space-between'
                    }}>
                      <Typography fontSize={12} color="#555">📍 Distance</Typography>
                      <Typography fontSize={12} fontWeight="bold">{formatDistance(bus.distance)}</Typography>
                    </Box>
                    <Box sx={{ mt: 0.5, display: 'flex', justifyContent: 'space-between' }}>
                      <Typography fontSize={12} color="#555">⏱ ETA</Typography>
                      <Typography fontSize={12} fontWeight="bold" color="#2DBE60">
                        {formatETA(bus.eta)}
                      </Typography>
                    </Box>
                  </>
                )}
                <Typography fontSize={11} color="#aaa" sx={{ mt: 1 }}>
                  Updated: {new Date(bus.updated_at).toLocaleTimeString()}
                </Typography>
              </Box>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* ETA cards for all buses */}
      {busesWithETA.length > 0 && studentLocation.current && (
        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Typography variant="subtitle2" fontWeight="bold" color="text.secondary">
            ALL ACTIVE BUSES
          </Typography>
          {busesWithETA.map((bus, i) => (
            <Card key={bus.operator_id} sx={{
              borderRadius: 2, boxShadow: 'none', border: '1px solid #eee',
              borderLeft: `4px solid ${i === 0 ? '#2DBE60' : '#ccc'}`
            }}>
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography fontWeight="bold" fontSize={14}>
                      {i === 0 ? '🥇' : '🚌'} {bus.route_name}
                    </Typography>
                    <Typography fontSize={12} color="text.secondary">
                      🚗 {bus.number_plate || '—'} · {formatDistance(bus.distance)} away
                    </Typography>
                  </Box>
                  <Chip
                    label={formatETA(bus.eta)}
                    size="small"
                    sx={{
                      background: i === 0 ? '#2DBE60' : '#1F1F1F',
                      color: '#fff', fontWeight: 'bold', fontSize: 12
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {buses.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 1.5, fontSize: 13 }}>
          No buses currently active. When an operator starts a trip, they'll appear here.
        </Typography>
      )}
    </Box>
  );
}
