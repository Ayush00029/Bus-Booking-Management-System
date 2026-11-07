const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { createBookingValidator } = require('../validators/bookingValidator');
const validate = require('../middleware/validateMiddleware');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Bookings
 *   description: Seat booking, ticket lookup, PNR tracking, and cancellation
 */

// Public: PNR Lookup with optional contact verification
router.get('/lookup', bookingController.lookupTicket);

// All subsequent booking operations require an authenticated user
router.use(requireAuth);

// Passenger: Book Seats (Atomic double-booking prevention)
router.post('/', createBookingValidator, validate, bookingController.createBooking);

// Passenger: View their own booking history
router.get('/my-bookings', bookingController.getMyBookings);

// Lookup ticket by PNR (Accessible by owner or admin)
router.get('/pnr/:pnr', bookingController.getBookingByPnr);

// Get single booking by ID
router.get('/:id', bookingController.getBookingById);

// Passenger or Admin: Cancel booking with simulated refund
router.post('/:id/cancel', bookingController.cancelBooking);

// Admin: View all system bookings
router.get('/', requireAdmin, bookingController.getAllBookings);

module.exports = router;

