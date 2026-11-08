const request = require('supertest');
const app = require('../src/app');
const BusOperator = require('../src/models/BusOperator');
const Bus = require('../src/models/Bus');
const Route = require('../src/models/Route');
const Trip = require('../src/models/Trip');
const BookedSeat = require('../src/models/BookedSeat');
const Booking = require('../src/models/Booking');
const { generateSeatConfiguration } = require('../src/services/busService');

describe('Cancellation & Refund API (/api/bookings/:id/cancel)', () => {
  let passenger1Token;
  let passenger2Token;
  let trip;
  let bookingId;
  let pnr;

  beforeEach(async () => {
    // 1. Create Passenger 1
    const p1 = await request(app).post('/api/auth/register').send({
      name: 'Kavita Nair',
      email: 'kavita@example.com',
      password: 'password123',
      phone: '9876543233',
      role: 'passenger'
    });
    passenger1Token = p1.body.data.token;

    // 2. Create Passenger 2
    const p2 = await request(app).post('/api/auth/register').send({
      name: 'Manoj Kumar',
      email: 'manoj@example.com',
      password: 'password123',
      phone: '9876543244',
      role: 'passenger'
    });
    passenger2Token = p2.body.data.token;

    // 3. Create Bus, Route, Operator
    const operator = await BusOperator.create({
      name: 'SRS Travels',
      code: 'SRS',
      contactPhone: '080-12345678',
      rating: 4.5
    });

    const bus = await Bus.create({
      operator: operator._id,
      busNumber: 'KA-01-MJ-5566',
      busType: 'AC Seater (2+2)',
      layoutType: '2+2_seater',
      totalSeats: 40,
      seatConfiguration: generateSeatConfiguration('2+2_seater', 40)
    });

    const route = await Route.create({
      sourceCity: 'Bengaluru',
      destinationCity: 'Coimbatore',
      distanceKm: 360,
      estimatedDurationMinutes: 400,
      boardingPoints: [{ pointName: 'Majestic', timeOffsetMinutes: 0 }],
      droppingPoints: [{ pointName: 'Gandhipuram', timeOffsetMinutes: 0 }]
    });

    // Schedule trip 36 hours ahead (eligible for 80% refund)
    const depTime = new Date(Date.now() + 36 * 60 * 60 * 1000);
    const arrTime = new Date(Date.now() + 43 * 60 * 60 * 1000);

    trip = await Trip.create({
      route: route._id,
      bus: bus._id,
      operator: operator._id,
      departureDateTime: depTime,
      arrivalDateTime: arrTime,
      baseFare: 500,
      totalSeats: 40,
      availableSeats: 40,
      status: 'SCHEDULED'
    });

    // Book seats 1A and 1B (totalFare = 500 * 1.05 + 500 * 1.0 = 525 + 500 = 1025)
    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send({
        tripId: trip._id.toString(),
        passengers: [
          { name: 'Kavita Nair', age: 30, gender: 'Female', seatNumber: '1A' },
          { name: 'Aarav Nair', age: 8, gender: 'Male', seatNumber: '1B' }
        ],
        boardingPoint: { pointName: 'Majestic', time: depTime },
        droppingPoint: { pointName: 'Gandhipuram', time: arrTime },
        contactEmail: 'kavita@example.com',
        contactPhone: '9876543233'
      });

    bookingId = bookingRes.body.data._id;
    pnr = bookingRes.body.data.pnr;
  });

  it('should cancel booking, calculate 80% refund (>24h), release seats, and increment available count', async () => {
    // Pre-cancellation verification: seats 1A and 1B are booked
    const bookedBefore = await BookedSeat.find({ tripId: trip._id });
    expect(bookedBefore.length).toBe(2);

    const res = await request(app)
      .post(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send({ cancellationReason: 'Change of travel plans' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bookingStatus).toBe('CANCELLED');
    expect(res.body.data.paymentStatus).toBe('REFUNDED');
    expect(res.body.data.cancellation.refundPercentage).toBe(80);
    expect(res.body.data.cancellation.refundStatus).toBe('PROCESSED');
    expect(res.body.data.cancellation.refundAmount).toBeGreaterThan(0);

    // CRITICAL VERIFICATION: Seats 1A and 1B are released from BookedSeat
    const bookedAfter = await BookedSeat.find({ tripId: trip._id });
    expect(bookedAfter.length).toBe(0);

    // Trip available seats restored to 40
    const updatedTrip = await Trip.findById(trip._id);
    expect(updatedTrip.availableSeats).toBe(40);

    // Now another user CAN immediately book seat 1A!
    const rebookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passenger2Token}`)
      .send({
        tripId: trip._id.toString(),
        passengers: [{ name: 'Manoj Kumar', age: 32, gender: 'Male', seatNumber: '1A' }],
        boardingPoint: { pointName: 'Majestic', time: trip.departureDateTime },
        droppingPoint: { pointName: 'Gandhipuram', time: trip.arrivalDateTime },
        contactEmail: 'manoj@example.com',
        contactPhone: '9876543244'
      });

    expect(rebookRes.statusCode).toBe(201);
    expect(rebookRes.body.data.seats).toContain('1A');
  });

  it('should reject duplicate cancellation on already cancelled booking (Idempotency test)', async () => {
    // First cancellation
    await request(app)
      .post(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send({ cancellationReason: 'Plans changed' });

    // Second cancellation attempt
    const res2 = await request(app)
      .post(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send({ cancellationReason: 'Cancel again' });

    expect(res2.statusCode).toBe(400);
    expect(res2.body.success).toBe(false);
    expect(res2.body.message).toContain('already been cancelled');
  });

  it('should reject unauthorized cancellation attempt by another passenger (403 Forbidden)', async () => {
    // Passenger 2 attempts to cancel Passenger 1's booking
    const res = await request(app)
      .post(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${passenger2Token}`)
      .send({ cancellationReason: 'Malicious cancellation' });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Access denied');
  });

  it('should calculate 50% refund when cancelling between 12 and 24 hours before departure', async () => {
    // Create a trip 18 hours in the future (eligible for 50% refund)
    const depTime18h = new Date(Date.now() + 18 * 60 * 60 * 1000);
    const arrTime18h = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const trip18h = await Trip.create({
      route: trip.route,
      bus: trip.bus,
      operator: trip.operator,
      departureDateTime: depTime18h,
      arrivalDateTime: arrTime18h,
      baseFare: 1000,
      totalSeats: 40,
      availableSeats: 40,
      status: 'SCHEDULED'
    });

    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send({
        tripId: trip18h._id.toString(),
        passengers: [{ name: 'Kavita Nair', age: 30, gender: 'Female', seatNumber: '2A' }],
        boardingPoint: { pointName: 'Majestic', time: depTime18h },
        droppingPoint: { pointName: 'Gandhipuram', time: arrTime18h },
        contactEmail: 'kavita@example.com',
        contactPhone: '9876543233'
      });

    const bId = bookRes.body.data._id;
    const cancelRes = await request(app)
      .post(`/api/bookings/${bId}/cancel`)
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send({ cancellationReason: 'Rescheduling' });

    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.body.data.cancellation.refundPercentage).toBe(50);
    expect(cancelRes.body.data.cancellation.refundStatus).toBe('PROCESSED');
    expect(cancelRes.body.data.cancellation.refundAmount).toBe(Math.round(bookRes.body.data.totalFare * 0.5));
  });

  it('should calculate 0% refund (NONE) when cancelling less than 12 hours before departure', async () => {
    // Create a trip 4 hours in the future (eligible for 0% refund)
    const depTime4h = new Date(Date.now() + 4 * 60 * 60 * 1000);
    const arrTime4h = new Date(Date.now() + 10 * 60 * 60 * 1000);

    const trip4h = await Trip.create({
      route: trip.route,
      bus: trip.bus,
      operator: trip.operator,
      departureDateTime: depTime4h,
      arrivalDateTime: arrTime4h,
      baseFare: 1000,
      totalSeats: 40,
      availableSeats: 40,
      status: 'SCHEDULED'
    });

    const bookRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send({
        tripId: trip4h._id.toString(),
        passengers: [{ name: 'Kavita Nair', age: 30, gender: 'Female', seatNumber: '3A' }],
        boardingPoint: { pointName: 'Majestic', time: depTime4h },
        droppingPoint: { pointName: 'Gandhipuram', time: arrTime4h },
        contactEmail: 'kavita@example.com',
        contactPhone: '9876543233'
      });

    const bId = bookRes.body.data._id;
    const cancelRes = await request(app)
      .post(`/api/bookings/${bId}/cancel`)
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send({ cancellationReason: 'Emergency cancel' });

    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.body.data.cancellation.refundPercentage).toBe(0);
    expect(cancelRes.body.data.cancellation.refundStatus).toBe('NONE');
    expect(cancelRes.body.data.cancellation.refundAmount).toBe(0);
    expect(cancelRes.body.data.cancellation.cancellationFee).toBe(bookRes.body.data.totalFare);
  });
});

