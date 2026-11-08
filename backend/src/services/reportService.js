const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const Booking = require('../models/Booking');
const BookedSeat = require('../models/BookedSeat');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

/**
 * Get comprehensive executive dashboard statistics aggregated from real DB data
 */
const getDashboardStats = async () => {
  const [
    totalBuses,
    totalRoutes,
    totalTrips,
    totalPassengers,
    bookingStats,
    auditCount
  ] = await Promise.all([
    Bus.countDocuments(),
    Route.countDocuments({ isActive: true }),
    Trip.countDocuments(),
    User.countDocuments({ role: 'passenger' }),
    Booking.aggregate([
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          confirmedBookings: {
            $sum: { $cond: [{ $eq: ['$bookingStatus', 'CONFIRMED'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$bookingStatus', 'CANCELLED'] }, 1, 0] }
          },
          grossRevenue: {
            $sum: {
              $cond: [{ $eq: ['$bookingStatus', 'CONFIRMED'] }, '$totalFare', 0]
            }
          },
          netRefunds: {
            $sum: {
              $cond: [
                { $eq: ['$bookingStatus', 'CANCELLED'] },
                { $ifNull: ['$cancellation.refundAmount', 0] },
                0
              ]
            }
          },
          cancellationPenaltiesRetained: {
            $sum: {
              $cond: [
                { $eq: ['$bookingStatus', 'CANCELLED'] },
                { $ifNull: ['$cancellation.cancellationFee', 0] },
                0
              ]
            }
          },
          totalSeatsSold: {
            $sum: {
              $cond: [{ $eq: ['$bookingStatus', 'CONFIRMED'] }, { $size: '$seats' }, 0]
            }
          }
        }
      }
    ]),
    AuditLog.countDocuments()
  ]);

  const stats = bookingStats[0] || {
    totalBookings: 0,
    confirmedBookings: 0,
    cancelledBookings: 0,
    grossRevenue: 0,
    netRefunds: 0,
    cancellationPenaltiesRetained: 0,
    totalSeatsSold: 0
  };

  // Calculate fleet-wide occupancy rate
  const tripCapacity = await Trip.aggregate([
    {
      $group: {
        _id: null,
        totalCapacity: { $sum: '$totalSeats' },
        totalAvailable: { $sum: '$availableSeats' }
      }
    }
  ]);

  const capacity = tripCapacity[0] || { totalCapacity: 0, totalAvailable: 0 };
  const bookedSeatsCount = capacity.totalCapacity - capacity.totalAvailable;
  const occupancyPercentage = capacity.totalCapacity > 0
    ? Number(((bookedSeatsCount / capacity.totalCapacity) * 100).toFixed(1))
    : 0;

  const netRevenue = stats.grossRevenue + stats.cancellationPenaltiesRetained;

  return {
    overview: {
      totalBuses,
      totalRoutes,
      totalTrips,
      totalUsers: totalPassengers,
      totalBookings: stats.totalBookings,
      confirmedBookings: stats.confirmedBookings,
      cancelledBookings: stats.cancelledBookings,
      totalSeatsSold: stats.totalSeatsSold,
      grossRevenue: stats.grossRevenue,
      netRevenue,
      totalRefunds: stats.netRefunds,
      cancellationFeesRetained: stats.cancellationPenaltiesRetained,
      occupancyPercentage,
      auditEventsCount: auditCount
    }
  };
};

/**
 * Get visual chart analytics for Recharts UI: Booking trends, Revenue trends, Popular routes
 */
const getChartAnalytics = async () => {
  // 1. Daily Booking & Revenue trends (last 14 days or all confirmed bookings)
  const bookingTrends = await Booking.aggregate([
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        bookingsCount: { $sum: 1 },
        confirmedCount: {
          $sum: { $cond: [{ $eq: ['$bookingStatus', 'CONFIRMED'] }, 1, 0] }
        },
        cancelledCount: {
          $sum: { $cond: [{ $eq: ['$bookingStatus', 'CANCELLED'] }, 1, 0] }
        },
        dailyRevenue: {
          $sum: {
            $cond: [{ $eq: ['$bookingStatus', 'CONFIRMED'] }, '$totalFare', 0]
          }
        }
      }
    },
    { $sort: { _id: 1 } },
    { $limit: 14 },
    {
      $project: {
        date: '$_id',
        bookings: '$bookingsCount',
        confirmed: '$confirmedCount',
        cancelled: '$cancelledCount',
        revenue: '$dailyRevenue',
        _id: 0
      }
    }
  ]);

  // 2. Popular Routes by confirmed booking revenue & volume
  const popularRoutes = await Booking.aggregate([
    { $match: { bookingStatus: 'CONFIRMED' } },
    {
      $group: {
        _id: {
          source: '$tripSnapshot.sourceCity',
          destination: '$tripSnapshot.destinationCity'
        },
        bookingCount: { $sum: 1 },
        passengerCount: { $sum: { $size: '$seats' } },
        totalRevenue: { $sum: '$totalFare' }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: 5 },
    {
      $project: {
        route: { $concat: ['$_id.source', ' → ', '$_id.destination'] },
        bookings: '$bookingCount',
        passengers: '$passengerCount',
        revenue: '$totalRevenue',
        _id: 0
      }
    }
  ]);

  // 3. Occupancy breakdown by bus type
  const busTypeOccupancy = await Trip.aggregate([
    {
      $lookup: {
        from: 'buses',
        localField: 'bus',
        foreignField: '_id',
        as: 'busDetails'
      }
    },
    { $unwind: '$busDetails' },
    {
      $group: {
        _id: '$busDetails.busType',
        totalCapacity: { $sum: '$totalSeats' },
        totalAvailable: { $sum: '$availableSeats' },
        tripsCount: { $sum: 1 }
      }
    },
    {
      $project: {
        busType: '$_id',
        capacity: '$totalCapacity',
        bookedSeats: { $subtract: ['$totalCapacity', '$totalAvailable'] },
        occupancyRate: {
          $cond: [
            { $gt: ['$totalCapacity', 0] },
            {
              $round: [
                {
                  $multiply: [
                    { $divide: [{ $subtract: ['$totalCapacity', '$totalAvailable'] }, '$totalCapacity'] },
                    100
                  ]
                },
                1
              ]
            },
            0
          ]
        },
        _id: 0
      }
    }
  ]);

  return {
    bookingTrends,
    popularRoutes,
    busTypeOccupancy
  };
};

/**
 * Generate Passenger Manifest for a specific trip
 */
const getPassengerManifest = async (tripId) => {
  const trip = await Trip.findById(tripId)
    .populate('route')
    .populate('bus')
    .populate('operator');

  if (!trip) {
    const error = new Error('Trip not found');
    error.statusCode = 404;
    throw error;
  }

  // Find all confirmed bookings for this trip
  const bookings = await Booking.find({
    trip: tripId,
    bookingStatus: 'CONFIRMED'
  }).populate('user', 'name email phone');

  // Flatten into seat-by-seat passenger manifest
  const manifest = [];
  bookings.forEach(b => {
    b.passengers.forEach(p => {
      manifest.push({
        seatNumber: p.seatNumber,
        passengerName: p.name,
        age: p.age,
        gender: p.gender,
        pnr: b.pnr,
        bookingId: b._id,
        bookedBy: b.user ? b.user.name : 'Guest',
        contactPhone: b.contactPhone,
        contactEmail: b.contactEmail,
        boardingPoint: b.boardingPoint.pointName,
        droppingPoint: b.droppingPoint.pointName,
        fare: p.fare,
        paymentStatus: b.paymentStatus
      });
    });
  });

  // Sort manifest by seatNumber
  manifest.sort((a, b) => a.seatNumber.localeCompare(b.seatNumber, undefined, { numeric: true }));

  return {
    tripDetails: {
      tripId: trip._id,
      operator: trip.operator.name,
      busNumber: trip.bus.busNumber,
      busType: trip.bus.busType,
      route: `${trip.route.sourceCity} → ${trip.route.destinationCity}`,
      departureDateTime: trip.departureDateTime,
      arrivalDateTime: trip.arrivalDateTime,
      totalCapacity: trip.totalSeats,
      totalBooked: manifest.length,
      availableSeats: trip.availableSeats
    },
    passengers: manifest
  };
};

/**
 * Retrieve Audit Logs with pagination & filtering
 */
const getAuditLogs = async (query = {}) => {
  const filter = {};
  if (query.action) filter.action = query.action;
  if (query.entityType) filter.entityType = query.entityType;

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 25;
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    AuditLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit),
    AuditLog.countDocuments(filter)
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

module.exports = {
  getDashboardStats,
  getChartAnalytics,
  getPassengerManifest,
  getAuditLogs
};

