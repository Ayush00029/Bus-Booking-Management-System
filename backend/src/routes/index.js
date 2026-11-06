const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const busRoutes = require('./busRoutes');
const operatorRoutes = require('./operatorRoutes');
const routeRoutes = require('./routeRoutes');
const tripRoutes = require('./tripRoutes');
const bookingRoutes = require('./bookingRoutes');
const adminRoutes = require('./adminRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/buses', busRoutes);
router.use('/operators', operatorRoutes);
router.use('/routes', routeRoutes);
router.use('/trips', tripRoutes);
router.use('/bookings', bookingRoutes);
router.use('/admin', adminRoutes);

// Gateway status endpoint
router.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Bus Booking Management System API Gateway Ready'
  });
});

module.exports = router;
