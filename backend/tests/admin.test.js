const request = require('supertest');
const app = require('../src/app');
const BusOperator = require('../src/models/BusOperator');
const Bus = require('../src/models/Bus');
const Route = require('../src/models/Route');
const Trip = require('../src/models/Trip');
const Booking = require('../src/models/Booking');
const BookedSeat = require('../src/models/BookedSeat');
const AuditLog = require('../src/models/AuditLog');
const { generateSeatConfiguration } = require('../src/services/busService');

describe('Admin Management & Analytics API (/api/admin)', () => {
  let adminToken;
  let passengerToken;
  let tripId;

  beforeEach(async () => {
    // 1. Create Admin
    const adminRes = await request(app).post('/api/auth/register').send({
      name: 'Super Admin',
      email: 'admin.mgmt@example.com',
      password: 'adminPassword123',
      role: 'admin',
      adminSecret: 'algions_admin_secret_key_2026'
    });
    adminToken = adminRes.body.data.token;

    // 2. Create Passenger
    const pRes = await request(app).post('/api/auth/register').send({
      name: 'Regular Passenger',
      email: 'regular.passenger@example.com',
      password: 'password123',
      phone: '9876543299',
      role: 'passenger'
    });
    passengerToken = pRes.body.data.token;

    // 3. Create Bus, Route, Operator, Trip & Booking for realistic analytics
    const operator = await BusOperator.create({
      name: 'VRL Logistics Fleet',
      code: 'VRL',
      contactPhone: '080-22223333',
      rating: 4.7
    });

    const bus = await Bus.create({
      operator: operator._id,
      busNumber: 'KA-25-AA-1234',
      busType: 'AC Sleeper (2+1)',
      layoutType: '2+1_sleeper',
      totalSeats: 30,
      seatConfiguration: generateSeatConfiguration('2+1_sleeper', 30)
    });

    const route = await Route.create({
      sourceCity: 'Hubballi',
      destinationCity: 'Bengaluru',
      distanceKm: 410,
      estimatedDurationMinutes: 450,
      boardingPoints: [{ pointName: 'Old Bus Stand', timeOffsetMinutes: 0 }],
      droppingPoints: [{ pointName: 'Anand Rao Circle', timeOffsetMinutes: 0 }]
    });

    const dep = new Date(Date.now() + 48 * 60 * 60 * 1000);
    const arr = new Date(Date.now() + 56 * 60 * 60 * 1000);

    const trip = await Trip.create({
      route: route._id,
      bus: bus._id,
      operator: operator._id,
      departureDateTime: dep,
      arrivalDateTime: arr,
      baseFare: 800,
      totalSeats: 30,
      availableSeats: 30,
      status: 'SCHEDULED'
    });
    tripId = trip._id.toString();

    // Make a booking
    await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${passengerToken}`)
      .send({
        tripId,
        passengers: [
          { name: 'Suresh Patil', age: 29, gender: 'Male', seatNumber: 'L1' },
          { name: 'Deepa Patil', age: 26, gender: 'Female', seatNumber: 'L2' }
        ],
        boardingPoint: { pointName: 'Old Bus Stand', time: dep },
        droppingPoint: { pointName: 'Anand Rao Circle', time: arr },
        contactEmail: 'suresh@example.com',
        contactPhone: '9876543299'
      });
  });

  describe('GET /api/admin/dashboard', () => {
    it('should return aggregated real-time database KPIs for admin', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.overview).toBeDefined();
      expect(res.body.data.overview.totalBuses).toBeGreaterThanOrEqual(1);
      expect(res.body.data.overview.totalRoutes).toBeGreaterThanOrEqual(1);
      expect(res.body.data.overview.totalTrips).toBeGreaterThanOrEqual(1);
      expect(res.body.data.overview.totalBookings).toBeGreaterThanOrEqual(1);
      expect(res.body.data.overview.grossRevenue).toBeGreaterThan(0);
      expect(res.body.data.overview.occupancyPercentage).toBeDefined();
    });

    it('should reject passenger accessing dashboard with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${passengerToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/analytics', () => {
    it('should return trend arrays for Recharts visualization', async () => {
      const res = await request(app)
        .get('/api/admin/analytics')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.bookingTrends)).toBe(true);
      expect(Array.isArray(res.body.data.popularRoutes)).toBe(true);
      expect(Array.isArray(res.body.data.busTypeOccupancy)).toBe(true);
    });
  });

  describe('GET /api/admin/manifest/:tripId', () => {
    it('should generate accurate passenger manifest for scheduled trip', async () => {
      const res = await request(app)
        .get(`/api/admin/manifest/${tripId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tripDetails).toBeDefined();
      expect(res.body.data.passengers).toBeDefined();
      expect(res.body.data.passengers.length).toBe(2);
      expect(res.body.data.passengers[0].seatNumber).toBeDefined();
      expect(res.body.data.passengers[0].passengerName).toBeDefined();
    });

    it('should return 404 if trip does not exist', async () => {
      const nonExistentId = '654321000000000000000000';
      const res = await request(app)
        .get(`/api/admin/manifest/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/audit-logs', () => {
    it('should return recorded audit events with filtering', async () => {
      const res = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.logs)).toBe(true);
      expect(res.body.data.pagination).toBeDefined();
    });
  });

  describe('Admin Operators Management (/api/operators)', () => {
    it('should allow admin to create and list bus operators', async () => {
      const createRes = await request(app)
        .post('/api/operators')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Greenline Travels',
          code: 'GLT',
          contactPhone: '080-88889999',
          contactEmail: 'contact@greenline.example.com',
          rating: 4.6
        });

      expect(createRes.statusCode).toBe(201);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.data.name).toBe('Greenline Travels');

      const listRes = await request(app)
        .get('/api/operators')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(listRes.statusCode).toBe(200);
      expect(listRes.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should reject passenger creating bus operator with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/operators')
        .set('Authorization', `Bearer ${passengerToken}`)
        .send({
          name: 'Unauthorized Operator',
          code: 'UNAUTH',
          contactPhone: '080-00000000'
        });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });
});
