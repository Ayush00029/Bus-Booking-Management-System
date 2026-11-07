const Trip = require('../models/Trip');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const BookedSeat = require('../models/BookedSeat');
const SeatLock = require('../models/SeatLock');
const { logAuditEvent } = require('./auditService');

const createTrip = async (data, user, ipAddress) => {
  const [route, bus] = await Promise.all([
    Route.findById(data.route),
    Bus.findById(data.bus).populate('operator')
  ]);

  if (!route) {
    const error = new Error('Route not found');
    error.statusCode = 404;
    throw error;
  }

  if (!bus) {
    const error = new Error('Bus not found');
    error.statusCode = 404;
    throw error;
  }

  const dep = new Date(data.departureDateTime);
  const arr = new Date(data.arrivalDateTime);

  if (isNaN(dep.getTime()) || isNaN(arr.getTime())) {
    const error = new Error('Invalid departure or arrival date/time');
    error.statusCode = 400;
    throw error;
  }

  if (arr <= dep) {
    const error = new Error('Arrival date and time must be after departure date and time');
    error.statusCode = 400;
    throw error;
  }

  const totalSeats = bus.totalSeats;
  const availableSeats = totalSeats;

  const trip = await Trip.create({
    ...data,
    operator: bus.operator._id,
    totalSeats,
    availableSeats,
    status: data.status || 'SCHEDULED'
  });

  await logAuditEvent({
    userId: user?._id,
    userRole: user?.role,
    action: 'TRIP_CREATE',
    entityType: 'Trip',
    entityId: trip._id,
    details: {
      route: `${route.sourceCity} -> ${route.destinationCity}`,
      busNumber: bus.busNumber,
      departure: dep.toISOString(),
      baseFare: trip.baseFare
    },
    ipAddress
  });

  return trip.populate(['route', 'bus', 'operator']);
};

const getAllTrips = async (query = {}) => {
  const filter = {};
  if (query.route) filter.route = query.route;
  if (query.operator) filter.operator = query.operator;
  if (query.status) filter.status = query.status;
  if (query.date) {
    const targetDate = new Date(query.date);
    const start = new Date(targetDate.setHours(0, 0, 0, 0));
    const end = new Date(targetDate.setHours(23, 59, 59, 999));
    filter.departureDateTime = { $gte: start, $lte: end };
  }

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 20;
  const skip = (page - 1) * limit;

  const [trips, total] = await Promise.all([
    Trip.find(filter)
      .populate('route')
      .populate('bus')
      .populate('operator')
      .sort({ departureDateTime: 1 })
      .skip(skip)
      .limit(limit),
    Trip.countDocuments(filter)
  ]);

  return {
    trips,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

const getTripById = async (id, currentLockedBy = '') => {
  const trip = await Trip.findById(id)
    .populate('route')
    .populate('bus')
    .populate('operator');

  if (!trip) {
    const error = new Error('Trip not found');
    error.statusCode = 404;
    throw error;
  }

  // 1. Fetch currently active booked seats
  const activeBookedSeats = await BookedSeat.find({
    tripId: trip._id,
    status: 'BOOKED'
  }).select('seatNumber -_id');

  const bookedSeatNumbers = new Set(activeBookedSeats.map(s => s.seatNumber));

  // 2. Fetch currently active temporary seat locks (expiresAt > now)
  const now = new Date();
  const activeSeatLocks = await SeatLock.find({
    tripId: trip._id,
    expiresAt: { $gt: now }
  }).select('seatNumber lockedBy expiresAt -_id');

  const activeLockMap = new Map();
  let userLockExpiresAt = null;
  const userLockedSeats = [];

  activeSeatLocks.forEach(lock => {
    activeLockMap.set(lock.seatNumber, lock);
    if (currentLockedBy && String(lock.lockedBy) === String(currentLockedBy)) {
      userLockedSeats.push(lock.seatNumber);
      if (!userLockExpiresAt || new Date(lock.expiresAt) < new Date(userLockExpiresAt)) {
        userLockExpiresAt = lock.expiresAt;
      }
    }
  });

  // 3. Augment seat layout with live status
  const seatLayout = trip.bus.seatConfiguration.map(seat => {
    const isBooked = bookedSeatNumbers.has(seat.seatNumber);
    const calculatedFare = Math.round(trip.baseFare * (seat.basePriceMultiplier || 1.0));

    let status = 'available';
    let lockedByMe = false;

    if (isBooked) {
      status = 'booked';
    } else if (activeLockMap.has(seat.seatNumber)) {
      const lock = activeLockMap.get(seat.seatNumber);
      if (currentLockedBy && String(lock.lockedBy) === String(currentLockedBy)) {
        status = 'selected';
        lockedByMe = true;
      } else {
        status = 'locked';
      }
    }

    return {
      seatNumber: seat.seatNumber,
      deck: seat.deck,
      row: seat.row,
      column: seat.column,
      seatType: seat.seatType,
      isWindow: seat.isWindow,
      fare: calculatedFare,
      status,
      lockedByMe
    };
  });

  const lockedSeatsCount = activeLockMap.size;
  const remainingSeconds = userLockExpiresAt
    ? Math.max(0, Math.floor((new Date(userLockExpiresAt).getTime() - Date.now()) / 1000))
    : 0;

  return {
    ...trip.toObject(),
    bookedSeatsCount: bookedSeatNumbers.size,
    lockedSeatsCount,
    liveAvailableSeats: Math.max(0, trip.totalSeats - bookedSeatNumbers.size - lockedSeatsCount),
    userLockExpiresAt,
    userLockedSeats,
    lockRemainingSeconds: remainingSeconds,
    seatLayout
  };
};

/**
 * Temporarily lock seats for a passenger during seat selection
 */
const lockSeats = async ({ tripId, seatNumbers, lockedBy, lockDurationMinutes = 10 }) => {
  if (!tripId || !seatNumbers || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    const error = new Error('Trip ID and seat numbers array are required');
    error.statusCode = 400;
    throw error;
  }

  if (!lockedBy) {
    const error = new Error('Client identifier (lockedBy) is required to hold seats');
    error.statusCode = 400;
    throw error;
  }

  const trip = await Trip.findById(tripId).populate('bus');
  if (!trip) {
    const error = new Error('Trip not found');
    error.statusCode = 404;
    throw error;
  }

  if (trip.status !== 'SCHEDULED') {
    const error = new Error(`Cannot reserve seats on trip with status: ${trip.status}`);
    error.statusCode = 400;
    throw error;
  }

  const normalizedSeats = seatNumbers.map(s => String(s).toUpperCase().trim());
  const now = new Date();

  // 1. Verify seats exist on this bus
  const validSeats = new Set(trip.bus.seatConfiguration.map(s => s.seatNumber.toUpperCase()));
  for (const s of normalizedSeats) {
    if (!validSeats.has(s)) {
      const error = new Error(`Seat ${s} does not exist on this bus`);
      error.statusCode = 400;
      throw error;
    }
  }

  // 2. Check if any seat is already booked permanently
  const alreadyBooked = await BookedSeat.find({
    tripId: trip._id,
    seatNumber: { $in: normalizedSeats },
    status: 'BOOKED'
  }).select('seatNumber');

  if (alreadyBooked.length > 0) {
    const bookedNums = alreadyBooked.map(b => b.seatNumber);
    const error = new Error(`Seat(s) ${bookedNums.join(', ')} are already booked permanently.`);
    error.statusCode = 409;
    error.conflicts = bookedNums;
    throw error;
  }

  // 3. Check if any seat is currently held/locked by ANOTHER passenger
  const activeOtherLocks = await SeatLock.find({
    tripId: trip._id,
    seatNumber: { $in: normalizedSeats },
    lockedBy: { $ne: String(lockedBy) },
    expiresAt: { $gt: now }
  }).select('seatNumber expiresAt');

  if (activeOtherLocks.length > 0) {
    const lockedNums = activeOtherLocks.map(l => l.seatNumber);
    const error = new Error(`Berth(s) ${lockedNums.join(', ')} are currently held by another passenger. Please select another berth.`);
    error.statusCode = 409;
    error.conflicts = lockedNums;
    throw error;
  }

  // 4. Acquire or refresh lock for each seat
  const expiresAt = new Date(now.getTime() + lockDurationMinutes * 60 * 1000);
  const lockOps = normalizedSeats.map(seatNumber => {
    return SeatLock.findOneAndUpdate(
      { tripId: trip._id, seatNumber },
      {
        tripId: trip._id,
        seatNumber,
        lockedBy: String(lockedBy),
        expiresAt
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  });

  await Promise.all(lockOps);

  return {
    tripId: trip._id,
    lockedSeats: normalizedSeats,
    expiresAt,
    expiresInSeconds: Math.floor((expiresAt.getTime() - Date.now()) / 1000)
  };
};

/**
 * Explicitly release locked seats (e.g. user unselects a berth or navigates away)
 */
const unlockSeats = async ({ tripId, seatNumbers, lockedBy }) => {
  if (!tripId || !seatNumbers || !Array.isArray(seatNumbers)) {
    const error = new Error('Trip ID and seat numbers are required');
    error.statusCode = 400;
    throw error;
  }

  const normalizedSeats = seatNumbers.map(s => String(s).toUpperCase().trim());
  const query = {
    tripId,
    seatNumber: { $in: normalizedSeats }
  };
  if (lockedBy) {
    query.lockedBy = String(lockedBy);
  }

  const deleteResult = await SeatLock.deleteMany(query);

  return {
    tripId,
    unlockedSeats: normalizedSeats,
    deletedCount: deleteResult.deletedCount
  };
};

const updateTrip = async (id, data, user, ipAddress) => {
  const trip = await Trip.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  }).populate(['route', 'bus', 'operator']);

  if (!trip) {
    const error = new Error('Trip not found');
    error.statusCode = 404;
    throw error;
  }

  await logAuditEvent({
    userId: user?._id,
    userRole: user?.role,
    action: 'TRIP_UPDATE',
    entityType: 'Trip',
    entityId: trip._id,
    details: data,
    ipAddress
  });

  return trip;
};

const deleteTrip = async (id, user, ipAddress) => {
  // Check if trip has confirmed bookings
  const existingSeats = await BookedSeat.countDocuments({ tripId: id, status: 'BOOKED' });
  if (existingSeats > 0) {
    const error = new Error('Cannot delete a trip with active passenger bookings. Cancel the trip instead.');
    error.statusCode = 400;
    throw error;
  }

  const trip = await Trip.findByIdAndDelete(id);
  if (!trip) {
    const error = new Error('Trip not found');
    error.statusCode = 404;
    throw error;
  }

  await logAuditEvent({
    userId: user?._id,
    userRole: user?.role,
    action: 'TRIP_DELETE',
    entityType: 'Trip',
    entityId: id,
    details: {},
    ipAddress
  });

  return trip;
};

/**
 * Passenger Search Engine: Find trips by Origin, Destination, Travel Date & Filters
 */
const searchTrips = async ({
  origin,
  destination,
  travelDate,
  busType,
  operator,
  minPrice,
  maxPrice,
  sortBy = 'departure',
  sortOrder = 'asc',
  page = 1,
  limit = 20
}) => {
  if (!origin || !destination) {
    const error = new Error('Origin and destination cities are required for search');
    error.statusCode = 400;
    throw error;
  }

  // 1. Find matching active routes
  const routeFilter = {
    sourceCity: { $regex: new RegExp(`^${origin.trim()}$`, 'i') },
    destinationCity: { $regex: new RegExp(`^${destination.trim()}$`, 'i') },
    isActive: true
  };

  const matchingRoutes = await Route.find(routeFilter);
  if (!matchingRoutes || matchingRoutes.length === 0) {
    return {
      trips: [],
      pagination: { total: 0, page: 1, limit: parseInt(limit, 10), totalPages: 0 }
    };
  }

  const routeIds = matchingRoutes.map(r => r._id);

  // 2. Build Trip filters
  const tripFilter = {
    route: { $in: routeIds },
    status: 'SCHEDULED'
  };

  // Date filtering (Timezone-agnostic UTC day matching)
  if (travelDate) {
    if (travelDate.includes('-')) {
      const parts = travelDate.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const startOfDay = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(y, m, d, 23, 59, 59, 999));
      tripFilter.departureDateTime = { $gte: startOfDay, $lte: endOfDay };
    } else {
      const target = new Date(travelDate);
      if (!isNaN(target.getTime())) {
        const startOfDay = new Date(target);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(target);
        endOfDay.setUTCHours(23, 59, 59, 999);
        tripFilter.departureDateTime = { $gte: startOfDay, $lte: endOfDay };
      }
    }
  }

  if (operator) {
    tripFilter.operator = operator;
  }

  if (minPrice || maxPrice) {
    tripFilter.baseFare = {};
    if (minPrice) tripFilter.baseFare.$gte = Number(minPrice);
    if (maxPrice) tripFilter.baseFare.$lte = Number(maxPrice);
  }

  // 3. Query trips with population
  let query = Trip.find(tripFilter)
    .populate('route')
    .populate('bus')
    .populate('operator');

  let trips = await query.exec();

  // 4. In-memory filter for busType if requested
  if (busType) {
    trips = trips.filter(t => t.bus && t.bus.busType === busType);
  }

  // 5. Sorting
  trips.sort((a, b) => {
    let comp = 0;
    if (sortBy === 'fare' || sortBy === 'price') {
      comp = a.baseFare - b.baseFare;
    } else if (sortBy === 'duration') {
      const durA = (a.arrivalDateTime - a.departureDateTime) || 0;
      const durB = (b.arrivalDateTime - b.departureDateTime) || 0;
      comp = durA - durB;
    } else if (sortBy === 'seats') {
      comp = a.availableSeats - b.availableSeats;
    } else {
      // Default: departure time
      comp = new Date(a.departureDateTime) - new Date(b.departureDateTime);
    }
    return sortOrder === 'desc' ? -comp : comp;
  });

  const total = trips.length;
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 20;
  const paginatedTrips = trips.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  return {
    trips: paginatedTrips,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

module.exports = {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  searchTrips,
  lockSeats,
  unlockSeats
};
