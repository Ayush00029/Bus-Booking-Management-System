const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const BookedSeat = require('../models/BookedSeat');
const SeatLock = require('../models/SeatLock');
const Trip = require('../models/Trip');
const { generatePNR } = require('../utils/pnrGenerator');
const { calculateRefund } = require('../utils/cancellationPolicy');
const { logAuditEvent } = require('./auditService');

/**
 * Create a new booking with ACID double-booking prevention
 */
const createBooking = async ({
  userId,
  tripId,
  passengers,
  boardingPoint,
  droppingPoint,
  contactEmail,
  contactPhone,
  ipAddress = ''
}) => {
  // 1. Fetch and validate Trip
  const trip = await Trip.findById(tripId)
    .populate('route')
    .populate('bus')
    .populate('operator');

  if (!trip) {
    const error = new Error('Trip not found');
    error.statusCode = 404;
    throw error;
  }

  if (trip.status !== 'SCHEDULED') {
    const error = new Error(`Cannot book seats on a trip with status: ${trip.status}`);
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  if (new Date(trip.departureDateTime) <= now) {
    const error = new Error('Cannot book seats on a trip that has already departed');
    error.statusCode = 400;
    throw error;
  }

  if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
    const error = new Error('At least one passenger is required for booking');
    error.statusCode = 400;
    throw error;
  }

  // 2. Validate seat selection
  const selectedSeatNumbers = passengers.map(p => p.seatNumber.toUpperCase().trim());
  const uniqueSeatNumbers = new Set(selectedSeatNumbers);
  if (uniqueSeatNumbers.size !== selectedSeatNumbers.length) {
    const error = new Error('Duplicate seats specified within the same booking request');
    error.statusCode = 400;
    throw error;
  }

  // Verify that all requested seats exist on this bus
  const busSeatsMap = new Map();
  trip.bus.seatConfiguration.forEach(s => {
    busSeatsMap.set(s.seatNumber.toUpperCase(), s);
  });

  for (const seatNum of selectedSeatNumbers) {
    if (!busSeatsMap.has(seatNum)) {
      const error = new Error(`Seat ${seatNum} does not exist on this bus configuration`);
      error.statusCode = 400;
      throw error;
    }
  }

  // 3. Calculate individual fares and total fare
  const processedPassengers = passengers.map(p => {
    const seatInfo = busSeatsMap.get(p.seatNumber.toUpperCase());
    const fare = Math.round(trip.baseFare * (seatInfo.basePriceMultiplier || 1.0));
    return {
      name: p.name.trim(),
      age: p.age,
      gender: p.gender,
      seatNumber: p.seatNumber.toUpperCase().trim(),
      fare
    };
  });

  const totalFare = processedPassengers.reduce((sum, p) => sum + p.fare, 0);

  // 4. Generate unique PNR
  let pnr = generatePNR();
  let existingPnr = await Booking.findOne({ pnr });
  while (existingPnr) {
    pnr = generatePNR();
    existingPnr = await Booking.findOne({ pnr });
  }

  // 5. Build Trip Snapshot
  const tripSnapshot = {
    operatorName: trip.operator.name,
    operatorCode: trip.operator.code,
    busNumber: trip.bus.busNumber,
    busType: trip.bus.busType,
    sourceCity: trip.route.sourceCity,
    destinationCity: trip.route.destinationCity,
    departureDateTime: trip.departureDateTime,
    arrivalDateTime: trip.arrivalDateTime,
    distanceKm: trip.route.distanceKm,
    estimatedDurationMinutes: trip.route.estimatedDurationMinutes
  };

  // 6. ATOMIC DOUBLE-BOOKING PREVENTION
  // Check if transactions are supported (replica set)
  let session = null;
  const isReplicaSet = mongoose.connection.client.topology &&
    mongoose.connection.client.topology.description.type.includes('ReplicaSet');

  if (isReplicaSet) {
    session = await mongoose.startSession();
    session.startTransaction();
  }

  const tempBookingId = new mongoose.Types.ObjectId();

  try {
    // Fast-path availability check
    const existingBooked = await BookedSeat.find({
      tripId: trip._id,
      seatNumber: { $in: selectedSeatNumbers },
      status: 'BOOKED'
    }).session(session || null);

    if (existingBooked.length > 0) {
      const conflicts = existingBooked.map(b => b.seatNumber);
      const error = new Error(`One or more selected seats (${conflicts.join(', ')}) are already booked. Please choose different seats.`);
      error.statusCode = 409;
      error.conflicts = conflicts;
      throw error;
    }

    // Atomic Insertion into BookedSeat with Compound Unique Constraint (tripId, seatNumber)
    const bookedSeatDocs = processedPassengers.map(p => ({
      tripId: trip._id,
      seatNumber: p.seatNumber,
      bookingId: tempBookingId,
      passengerName: p.name,
      seatFare: p.fare,
      status: 'BOOKED'
    }));

    // If another concurrent request wrote the exact same seat in parallel,
    // MongoDB raises an E11000 duplicate key error right here!
    await BookedSeat.insertMany(bookedSeatDocs, session ? { session } : {});

    // Clear temporary seat locks for these seats now that they are permanently booked
    await SeatLock.deleteMany({
      tripId: trip._id,
      seatNumber: { $in: selectedSeatNumbers }
    }, session ? { session } : {});

    // Create Booking Document
    const bookingDoc = new Booking({
      _id: tempBookingId,
      pnr,
      user: userId,
      trip: trip._id,
      tripSnapshot,
      passengers: processedPassengers,
      seats: selectedSeatNumbers,
      boardingPoint,
      droppingPoint,
      contactEmail: contactEmail.toLowerCase().trim(),
      contactPhone: contactPhone.trim(),
      totalFare,
      paymentStatus: 'PAID',
      bookingStatus: 'CONFIRMED'
    });

    await bookingDoc.save(session ? { session } : {});

    // Decrement Trip available seats
    await Trip.findByIdAndUpdate(
      trip._id,
      { $inc: { availableSeats: -selectedSeatNumbers.length } },
      session ? { session } : {}
    );

    if (session) {
      await session.commitTransaction();
    }

    await logAuditEvent({
      userId,
      userRole: 'passenger',
      action: 'BOOKING_CREATE',
      entityType: 'Booking',
      entityId: bookingDoc._id,
      details: {
        pnr: bookingDoc.pnr,
        seats: bookingDoc.seats,
        totalFare: bookingDoc.totalFare,
        tripId: trip._id
      },
      ipAddress
    });

    return bookingDoc;

  } catch (error) {
    if (session) {
      await session.abortTransaction();
    } else {
      // In standalone non-replica-set mode: clean up any inserted BookedSeat records for this tempBookingId
      await BookedSeat.deleteMany({ bookingId: tempBookingId });
    }

    // Handle MongoDB duplicate key error code 11000 and transaction write conflicts
    const isConflict = error.code === 11000 ||
      (error.writeErrors && error.writeErrors.some(e => e.code === 11000)) ||
      (error.message && error.message.includes('E11000')) ||
      (error.hasErrorLabel && error.hasErrorLabel('TransientTransactionError')) ||
      (error.errorLabels && error.errorLabels.includes('TransientTransactionError')) ||
      (error.message && (error.message.includes('WriteConflict') || error.message.includes('multi-document transaction')));

    if (isConflict) {
      const conflictError = new Error('One or more selected seats are no longer available. Please select different seats.');
      conflictError.statusCode = 409;
      throw conflictError;
    }

    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

/**
 * Public PNR verification: Look up ticket by PNR and matching contact email or phone
 */
const lookupTicket = async (pnr, emailOrPhone = '') => {
  const normalizedPnr = pnr.toUpperCase().trim();
  const booking = await Booking.findOne({ pnr: normalizedPnr }).populate('trip');

  if (!booking) {
    const error = new Error(`No booking found with PNR: ${normalizedPnr}`);
    error.statusCode = 404;
    throw error;
  }

  // If emailOrPhone provided, verify it matches for security
  if (emailOrPhone) {
    const contact = emailOrPhone.toLowerCase().trim();
    const emailMatch = booking.contactEmail.toLowerCase() === contact;
    const cleanedContactPhone = booking.contactPhone.replace(/\D/g, '');
    const cleanedInput = contact.replace(/\D/g, '');
    const phoneMatch = cleanedContactPhone.length > 5 && cleanedInput.length > 5 && (cleanedContactPhone.includes(cleanedInput) || cleanedInput.includes(cleanedContactPhone));

    if (!emailMatch && !phoneMatch) {
      const error = new Error('Contact email or phone number does not match booking records.');
      error.statusCode = 403;
      throw error;
    }
  }

  return booking;
};

/**
 * Get all bookings placed by a specific user
 */
const getUserBookings = async (userId, query = {}) => {
  const filter = { user: userId };
  if (query.status) {
    filter.bookingStatus = query.status;
  }

  return Booking.find(filter)
    .populate('trip')
    .sort({ createdAt: -1 });
};

/**
 * Get single booking by PNR with owner / admin authorization
 */
const getBookingByPnr = async (pnr, user) => {
  const normalizedPnr = pnr.toUpperCase().trim();
  const booking = await Booking.findOne({ pnr: normalizedPnr }).populate('trip');

  if (!booking) {
    const error = new Error(`No booking found with PNR: ${normalizedPnr}`);
    error.statusCode = 404;
    throw error;
  }

  // Authorization check: User must be either the owner or an admin
  if (user.role !== 'admin' && !booking.user.equals(user._id)) {
    const error = new Error('Access denied: You are not authorized to view this booking');
    error.statusCode = 403;
    throw error;
  }

  return booking;
};

/**
 * Get single booking by ID with authorization check
 */
const getBookingById = async (id, user) => {
  const booking = await Booking.findById(id).populate('trip');

  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.role !== 'admin' && !booking.user.equals(user._id)) {
    const error = new Error('Access denied: You are not authorized to view this booking');
    error.statusCode = 403;
    throw error;
  }

  return booking;
};

/**
 * Cancel a booking and process simulated refund with atomic seat release
 */
const cancelBooking = async (bookingId, user, { cancellationReason = '' }, ipAddress = '') => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  // Authorization check
  if (user.role !== 'admin' && !booking.user.equals(user._id)) {
    const error = new Error('Access denied: You are not authorized to cancel this booking');
    error.statusCode = 403;
    throw error;
  }

  // Idempotency check: Cannot cancel an already cancelled booking
  if (booking.bookingStatus === 'CANCELLED') {
    const error = new Error('This booking has already been cancelled');
    error.statusCode = 400;
    throw error;
  }

  // Calculate refund policy based on departure time
  const departureTime = booking.tripSnapshot?.departureDateTime;
  const refundDetails = calculateRefund(departureTime, booking.totalFare);

  let session = null;
  const isReplicaSet = mongoose.connection.client.topology &&
    mongoose.connection.client.topology.description.type.includes('ReplicaSet');

  if (isReplicaSet) {
    session = await mongoose.startSession();
    session.startTransaction();
  }

  try {
    // 1. Release reserved seats only if the trip is scheduled in the future
    if (refundDetails.hoursUntilDeparture > 0) {
      await BookedSeat.deleteMany(
        { bookingId: booking._id },
        session ? { session } : {}
      );

      // 2. Increment Trip available seats
      await Trip.findByIdAndUpdate(
        booking.trip,
        { $inc: { availableSeats: booking.seats.length } },
        session ? { session } : {}
      );
    }

    // 3. Update Booking document
    booking.bookingStatus = 'CANCELLED';
    booking.paymentStatus = refundDetails.refundAmount > 0 ? 'REFUNDED' : 'PAID';
    booking.cancellation = {
      cancelledAt: new Date(),
      cancellationReason: cancellationReason || 'Cancelled by passenger',
      cancellationFee: refundDetails.cancellationFee,
      refundAmount: refundDetails.refundAmount,
      refundPercentage: refundDetails.refundPercentage,
      refundStatus: refundDetails.refundStatus
    };

    await booking.save(session ? { session } : {});

    if (session) {
      await session.commitTransaction();
    }

    await logAuditEvent({
      userId: user._id,
      userRole: user.role,
      action: 'BOOKING_CANCEL',
      entityType: 'Booking',
      entityId: booking._id,
      details: {
        pnr: booking.pnr,
        refundAmount: refundDetails.refundAmount,
        cancellationFee: refundDetails.cancellationFee,
        seatsReleased: booking.seats
      },
      ipAddress
    });

    return booking;

  } catch (error) {
    if (session) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
};

/**
 * Admin: List all bookings with filters and search
 */
const getAllBookings = async (query = {}) => {
  const filter = {};
  if (query.status) filter.bookingStatus = query.status;
  if (query.pnr) filter.pnr = new RegExp(query.pnr.trim(), 'i');
  if (query.tripId) filter.trip = query.tripId;

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .populate('user', 'name email phone')
      .populate('trip')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Booking.countDocuments(filter)
  ]);

  return {
    bookings,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  createBooking,
  lookupTicket,
  getUserBookings,
  getBookingByPnr,
  getBookingById,
  cancelBooking,
  getAllBookings
};
