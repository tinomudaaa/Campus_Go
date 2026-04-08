const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/routes', require('./routes/routes'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/wallet', require('./routes/wallet'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/operators', require('./routes/operators'));
app.use('/api/buses', require('./routes/buses'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/operator-admin', require('./routes/operator-admin'));
app.use('/api/notifications', require('./routes/notifications'));

app.get('/', (req, res) => {
  res.json({ message: 'Campus GO API is running! 🚌' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Campus GO server running on port ${PORT}`);
});