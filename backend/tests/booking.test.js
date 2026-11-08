const request = require('supertest');
const app = require('../src/app');
const BusOperator = require('../src/models/BusOperator');
const Bus = require('../src/models/Bus');
const Route = require('../src/models/Route');
const Trip = require('../src/models/Trip');
const BookedSeat = require('../src/models/BookedSeat');
const Booking = require('../src/models/Booking');
const { generateSeatConfiguration } = require('../src/services/busService');

describe('Booking API & Double-Booking Prevention (/api/bookings)', () => {
  let passenger1Token;
  let passenger2Token;
  let adminToken;
  let passenger1Id;
  let trip;

  beforeEach(async () => {
    // 1. Create Passenger 1
    const p1Res = await request(app).post('/api/auth/register').send({
      name: 'Amit Patel',
      email: 'amit@example.com',
      password: 'password123',
      phone: '9876543211',
      role: 'passenger'
    });
    passenger1Token = p1Res.body.data.token;
    passenger1Id = p1Res.body.data.user.id;

    // 2. Create Passenger 2
    const p2Res = await request(app).post('/api/auth/register').send({
      name: 'Sunita Rao',
      email: 'sunita@example.com',
      password: 'password123',
      phone: '9876543222',
      role: 'passenger'
    });
    passenger2Token = p2Res.body.data.token;

    // 3. Create Admin
    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'Fleet Admin',
      email: 'admin.booking@example.com',
      password: 'password123',
      role: 'admin',
      adminSecret: 'algions_admin_secret_key_2026'
    });
    adminToken = adminRes.body.data.token;

    // 4. Create Operator, Bus, Route & Scheduled Trip
    const operator = await BusOperator.create({
      name: 'KSRTC Swift',
      code: 'KSRTC',
      contactPhone: '080-44445555',
      rating: 4.8
    });

    const bus = await Bus.create({
      operator: operator._id,
      busNumber: 'KA-57-F-9900',
      busType: 'AC Seater (2+2)',
      layoutType: '2+2_seater',
      totalSeats: 40,
      seatConfiguration: generateSeatConfiguration('2+2_seater', 40)
    });

    const route = await Route.create({
      sourceCity: 'Bengaluru',
      destinationCity: 'Mysuru',
      distanceKm: 150,
      estimatedDurationMinutes: 180,
      boardingPoints: [{ pointName: 'Satellite Bus Stand', landmark: 'Bay 1', timeOffsetMinutes: 0 }],
      droppingPoints: [{ pointName: 'Suburban Bus Stand', landmark: 'Platform 3', timeOffsetMinutes: 0 }]
    });

    // Schedule trip 48 hours in future
    const depTime = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const arrTime = new Date(Date.now() + 51 * 60 * 60 * 1000);

    trip = await Trip.create({
      route: route._id,
      bus: bus._id,
      operator: operator._id,
      departureDateTime: depTime,
      arrivalDateTime: arrTime,
      baseFare: 300,
      totalSeats: 40,
      availableSeats: 40,
      status: 'SCHEDULED'
    });
  });

  const validBookingPayload = (seats = ['1A', '1B']) => ({
    tripId: trip._id.toString(),
    passengers: seats.map((seat, i) => ({
      name: `Passenger ${i + 1}`,
      age: 28 + i,
      gender: 'Male',
      seatNumber: seat
    })),
    boardingPoint: {
      pointName: 'Satellite Bus Stand',
      landmark: 'Bay 1',
      time: trip.departureDateTime
    },
    droppingPoint: {
      pointName: 'Suburban Bus Stand',
      landmark: 'Platform 3',
      time: trip.arrivalDateTime
    },
    contactEmail: 'amit@example.com',
    contactPhone: '9876543211'
  });

  it('should confirm booking, generate PNR, reserve seats, and decrement available count', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send(validBookingPayload(['1A', '1B']));

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.pnr).toMatch(/^ALG-[A-Z0-9]{6}$/);
    expect(res.body.data.bookingStatus).toBe('CONFIRMED');
    expect(res.body.data.seats).toEqual(['1A', '1B']);

    // Check database BookedSeat collection
    const bookedSeats = await BookedSeat.find({ tripId: trip._id });
    expect(bookedSeats.length).toBe(2);
    expect(bookedSeats.map(b => b.seatNumber).sort()).toEqual(['1A', '1B']);

    // Check Trip available seats count
    const updatedTrip = await Trip.findById(trip._id);
    expect(updatedTrip.availableSeats).toBe(38);
  });

  it('should prevent double booking with 409 Conflict when seat is already reserved', async () => {
    // 1. First user books seat 1A
    const res1 = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send(validBookingPayload(['1A']));

    expect(res1.statusCode).toBe(201);

    // 2. Second user attempts to book the same seat 1A
    const res2 = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passenger2Token}`)
      .send(validBookingPayload(['1A']));

    expect(res2.statusCode).toBe(409);
    expect(res2.body.success).toBe(false);
    expect(res2.body.message).toContain('already booked');
  });

  it('CRITICAL CONCURRENCY TEST: simultaneous booking requests for the exact same seat must never both succeed', async () => {
    const targetSeat = ['2A'];

    // Send two concurrent requests in parallel
    const [req1, req2] = await Promise.all([
      request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passenger1Token}`)
        .send(validBookingPayload(targetSeat)),
      request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${passenger2Token}`)
        .send(validBookingPayload(targetSeat))
    ]);

    const statusCodes = [req1.statusCode, req2.statusCode];

    // Exactly one must succeed (201) and one must be rejected (409)
    expect(statusCodes).toContain(201);
    expect(statusCodes).toContain(409);

    // Verify database integrity: exactly 1 BookedSeat document exists for seat 2A
    const activeSeats = await BookedSeat.find({ tripId: trip._id, seatNumber: '2A' });
    expect(activeSeats.length).toBe(1);
  });

  it('should reject booking if requested seat does not exist on bus layout', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send(validBookingPayload(['99Z']));

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('does not exist');
  });

  it('should prevent passenger from accessing another passenger booking (403 Forbidden)', async () => {
    // Passenger 1 creates a booking
    const bookingRes = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passenger1Token}`)
      .send(validBookingPayload(['3A']));

    const pnr = bookingRes.body.data.pnr;

    // Passenger 2 tries to access Passenger 1's booking
    const resPassenger2 = await request(app)
      .get(`/api/bookings/pnr/${pnr}`)
      .set('Authorization', `Bearer ${passenger2Token}`);

    expect(resPassenger2.statusCode).toBe(403);
    expect(resPassenger2.body.success).toBe(false);

    // Admin CAN access any booking
    const resAdmin = await request(app)
      .get(`/api/bookings/pnr/${pnr}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(resAdmin.statusCode).toBe(200);
    expect(resAdmin.body.data.pnr).toBe(pnr);
  });

  describe('Real-Time Pre-Checkout Seat Locking (/api/trips/:id/lock-seats)', () => {
    it('should temporarily lock a seat for 10 minutes', async () => {
      const res = await request(app)
        .post(`/api/trips/${trip._id}/lock-seats`)
        .set('x-client-token', 'client_session_1')
        .send({ seatNumbers: ['4A'], lockDurationMinutes: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.lockedSeats).toContain('4A');
      expect(res.body.data.expiresInSeconds).toBeGreaterThan(500);
    });

    it('should reject another passenger attempting to hold the same locked seat with 409 Conflict', async () => {
      // Client 1 locks 4A
      await request(app)
        .post(`/api/trips/${trip._id}/lock-seats`)
        .set('x-client-token', 'client_session_1')
        .send({ seatNumbers: ['4A'] });

      // Client 2 attempts to lock 4A
      const res2 = await request(app)
        .post(`/api/trips/${trip._id}/lock-seats`)
        .set('x-client-token', 'client_session_2')
        .send({ seatNumbers: ['4A'] });

      expect(res2.statusCode).toBe(409);
      expect(res2.body.success).toBe(false);
      expect(res2.body.message).toContain('held by another passenger');
    });

    it('should release seat when unlocked so another passenger can hold it', async () => {
      // Client 1 locks 4A
      await request(app)
        .post(`/api/trips/${trip._id}/lock-seats`)
        .set('x-client-token', 'client_session_1')
        .send({ seatNumbers: ['4A'] });

      // Client 1 releases 4A
      const unlockRes = await request(app)
        .post(`/api/trips/${trip._id}/unlock-seats`)
        .set('x-client-token', 'client_session_1')
        .send({ seatNumbers: ['4A'] });

      expect(unlockRes.statusCode).toBe(200);

      // Client 2 can now lock 4A
      const res2 = await request(app)
        .post(`/api/trips/${trip._id}/lock-seats`)
        .set('x-client-token', 'client_session_2')
        .send({ seatNumbers: ['4A'] });

      expect(res2.statusCode).toBe(200);
      expect(res2.body.data.lockedSeats).toContain('4A');
    });
  });
});

