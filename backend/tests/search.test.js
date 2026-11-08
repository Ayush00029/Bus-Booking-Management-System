const request = require('supertest');
const app = require('../src/app');
const BusOperator = require('../src/models/BusOperator');
const Bus = require('../src/models/Bus');
const Route = require('../src/models/Route');
const Trip = require('../src/models/Trip');
const { generateSeatConfiguration } = require('../src/services/busService');

describe('Passenger Trip Search API (/api/trips/search)', () => {
  let operator;
  let bus1;
  let bus2;
  let routeBLR_MAA;
  let routeDEL_JAI;
  let trip1;
  let trip2;

  beforeEach(async () => {
    // 1. Create Operator
    operator = await BusOperator.create({
      name: 'VRL Travels',
      code: 'VRL',
      contactPhone: '080-22223333',
      rating: 4.6
    });

    // 2. Create Buses (AC Sleeper and AC Seater)
    bus1 = await Bus.create({
      operator: operator._id,
      busNumber: 'KA-01-AB-1001',
      busType: 'AC Sleeper (2+1)',
      layoutType: '2+1_sleeper',
      totalSeats: 30,
      seatConfiguration: generateSeatConfiguration('2+1_sleeper', 30)
    });

    bus2 = await Bus.create({
      operator: operator._id,
      busNumber: 'KA-01-AB-2002',
      busType: 'AC Seater (2+2)',
      layoutType: '2+2_seater',
      totalSeats: 40,
      seatConfiguration: generateSeatConfiguration('2+2_seater', 40)
    });

    // 3. Create Routes
    routeBLR_MAA = await Route.create({
      sourceCity: 'Bengaluru',
      destinationCity: 'Chennai',
      distanceKm: 350,
      estimatedDurationMinutes: 360,
      boardingPoints: [{ pointName: 'Majestic Bus Stand', landmark: 'Platform 12', timeOffsetMinutes: 0 }],
      droppingPoints: [{ pointName: 'Koyambedu CMBT', landmark: 'Gate 4', timeOffsetMinutes: 0 }]
    });

    routeDEL_JAI = await Route.create({
      sourceCity: 'Delhi',
      destinationCity: 'Jaipur',
      distanceKm: 280,
      estimatedDurationMinutes: 300,
      boardingPoints: [{ pointName: 'ISBT Kashmiri Gate', landmark: 'Pillar 4', timeOffsetMinutes: 0 }],
      droppingPoints: [{ pointName: 'Sindhi Camp', landmark: 'Main Stand', timeOffsetMinutes: 0 }]
    });

    // 4. Create Trips for 2026-11-10
    const dep1 = new Date('2026-11-10T22:00:00.000Z');
    const arr1 = new Date('2026-11-11T05:00:00.000Z');
    trip1 = await Trip.create({
      route: routeBLR_MAA._id,
      bus: bus1._id,
      operator: operator._id,
      departureDateTime: dep1,
      arrivalDateTime: arr1,
      baseFare: 800,
      totalSeats: 30,
      availableSeats: 30,
      status: 'SCHEDULED'
    });

    const dep2 = new Date('2026-11-10T23:30:00.000Z');
    const arr2 = new Date('2026-11-11T06:00:00.000Z');
    trip2 = await Trip.create({
      route: routeBLR_MAA._id,
      bus: bus2._id,
      operator: operator._id,
      departureDateTime: dep2,
      arrivalDateTime: arr2,
      baseFare: 600,
      totalSeats: 40,
      availableSeats: 40,
      status: 'SCHEDULED'
    });
  });

  it('should find trips matching origin, destination and date', async () => {
    const res = await request(app)
      .get('/api/trips/search')
      .query({
        origin: 'Bengaluru',
        destination: 'Chennai',
        travelDate: '2026-11-10'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trips.length).toBe(2);
    expect(res.body.data.pagination.total).toBe(2);
  });

  it('should support case-insensitive city search', async () => {
    const res = await request(app)
      .get('/api/trips/search')
      .query({
        origin: 'bengaluru',
        destination: 'CHENNAI'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trips.length).toBe(2);
  });

  it('should return empty list when no route matches origin and destination', async () => {
    const res = await request(app)
      .get('/api/trips/search')
      .query({
        origin: 'Bengaluru',
        destination: 'Kolkata'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trips.length).toBe(0);
    expect(res.body.data.pagination.total).toBe(0);
  });

  it('should filter search results by busType', async () => {
    const res = await request(app)
      .get('/api/trips/search')
      .query({
        origin: 'Bengaluru',
        destination: 'Chennai',
        busType: 'AC Sleeper (2+1)'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trips.length).toBe(1);
    expect(res.body.data.trips[0].bus.busType).toBe('AC Sleeper (2+1)');
  });

  it('should sort results by fare ascending and descending', async () => {
    // Ascending
    const resAsc = await request(app)
      .get('/api/trips/search')
      .query({
        origin: 'Bengaluru',
        destination: 'Chennai',
        sortBy: 'fare',
        sortOrder: 'asc'
      });

    expect(resAsc.body.data.trips[0].baseFare).toBe(600);
    expect(resAsc.body.data.trips[1].baseFare).toBe(800);

    // Descending
    const resDesc = await request(app)
      .get('/api/trips/search')
      .query({
        origin: 'Bengaluru',
        destination: 'Chennai',
        sortBy: 'fare',
        sortOrder: 'desc'
      });

    expect(resDesc.body.data.trips[0].baseFare).toBe(800);
    expect(resDesc.body.data.trips[1].baseFare).toBe(600);
  });

  it('should reject search without origin or destination with 400 Bad Request', async () => {
    const res = await request(app)
      .get('/api/trips/search')
      .query({ origin: 'Bengaluru' });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

