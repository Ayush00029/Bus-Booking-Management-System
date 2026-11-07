const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { createTripValidator } = require('../validators/tripValidator');
const validate = require('../middleware/validateMiddleware');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Trips
 *   description: Scheduled trip management and passenger search
 */

// Public: Passenger Trip Search
router.get('/search', tripController.searchTrips);

// Trip Details (with live seat availability layout)
router.get('/:id', tripController.getTripById);

// Public / Passenger: Real-time Temporary Seat Locking & Releasing
router.post('/:id/lock-seats', tripController.lockSeats);
router.post('/:id/unlock-seats', tripController.unlockSeats);

// List Trips
router.get('/', tripController.getTrips);

// Admin Trip Management
router.post('/', requireAuth, requireAdmin, createTripValidator, validate, tripController.createTrip);
router.put('/:id', requireAuth, requireAdmin, tripController.updateTrip);
router.delete('/:id', requireAuth, requireAdmin, tripController.deleteTrip);

module.exports = router;

