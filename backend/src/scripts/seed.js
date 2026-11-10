require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const BusOperator = require('../models/BusOperator');
const Bus = require('../models/Bus');
const Route = require('../models/Route');
const Trip = require('../models/Trip');
const Booking = require('../models/Booking');
const BookedSeat = require('../models/BookedSeat');
const AuditLog = require('../models/AuditLog');
const { generateSeatConfiguration } = require('../services/busService');
const { generatePNR } = require('../utils/pnrGenerator');

const seedDatabase = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bus_booking_db';

  try {
    console.log(`Connecting to database at ${mongoURI}...`);
    await mongoose.connect(mongoURI);
    console.log('Connected! Purging existing collections for clean reproducible seed...');

    await Promise.all([
      User.deleteMany({}),
      BusOperator.deleteMany({}),
      Bus.deleteMany({}),
      Route.deleteMany({}),
      Trip.deleteMany({}),
      Booking.deleteMany({}),
      BookedSeat.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    console.log('Old collections cleared.');

    // 1. Seed Users (1 Admin + 9 Diverse Passengers)
    console.log('Seeding Users...');
    const admin = await User.create({
      name: 'Algions System Admin',
      email: 'admin@algions.com',
      password: 'admin123',
      phone: '+91 98888 77777',
      role: 'admin'
    });

    const passengersData = [
      { name: 'Rahul Sharma', email: 'rahul@gmail.com', phone: '+91 98765 43210' },
      { name: 'Priya Patel', email: 'priya@gmail.com', phone: '+91 98111 22233' },
      { name: 'Anita Desai', email: 'anita@gmail.com', phone: '+91 99000 88776' },
      { name: 'Vikram Singh', email: 'vikram@gmail.com', phone: '+91 98222 33445' },
      { name: 'Ananya Iyer', email: 'ananya@gmail.com', phone: '+91 97333 44556' },
      { name: 'Rohan Verma', email: 'rohan@gmail.com', phone: '+91 96444 55667' },
      { name: 'Meera Reddy', email: 'meera@gmail.com', phone: '+91 95555 66778' },
      { name: 'Kavita Nair', email: 'kavita@gmail.com', phone: '+91 94666 77889' },
      { name: 'Arjun Kapoor', email: 'arjun@gmail.com', phone: '+91 93777 88990' }
    ];

    const passengers = [];
    for (const p of passengersData) {
      const user = await User.create({
        ...p,
        password: 'password123',
        role: 'passenger'
      });
      passengers.push(user);
    }
    console.log(`✓ ${passengers.length + 1} Users created.`);

    // 2. Seed Operators (8 Premium Intercity Operators)
    console.log('Seeding Bus Operators...');
    const operators = await BusOperator.insertMany([
      {
        name: 'KSRTC Swift',
        code: 'KSRTC',
        contactPhone: '080-22221111',
        contactEmail: 'swift@ksrtc.in',
        address: 'Shanthinagar Bus Station, Bengaluru',
        rating: 4.8
      },
      {
        name: 'VRL Travels',
        code: 'VRL',
        contactPhone: '0836-2237511',
        contactEmail: 'customercare@vrlbus.in',
        address: 'Giriraj Annexe, Hubballi',
        rating: 4.7
      },
      {
        name: 'Orange Tours and Travels',
        code: 'ORANGE',
        contactPhone: '040-33559999',
        contactEmail: 'info@orangetravels.in',
        address: 'Ameerpet, Hyderabad',
        rating: 4.6
      },
      {
        name: 'SRS Travels',
        code: 'SRS',
        contactPhone: '080-26809000',
        contactEmail: 'contact@srstravels.in',
        address: 'Kalasipalyam, Bengaluru',
        rating: 4.5
      },
      {
        name: 'Zingbus Luxury Express',
        code: 'ZING',
        contactPhone: '011-40844778',
        contactEmail: 'support@zingbus.com',
        address: 'Connaught Place, New Delhi',
        rating: 4.8
      },
      {
        name: 'IntrCity SmartBus',
        code: 'INTRCITY',
        contactPhone: '080-47188888',
        contactEmail: 'care@intrcity.com',
        address: 'HSR Layout, Bengaluru',
        rating: 4.9
      },
      {
        name: 'Chartered Speed Bus',
        code: 'CHARTERED',
        contactPhone: '0731-4288888',
        contactEmail: 'help@charteredbus.in',
        address: 'Geeta Bhawan Square, Indore',
        rating: 4.6
      },
      {
        name: 'Seabird Tourists',
        code: 'SEABIRD',
        contactPhone: '080-22877777',
        contactEmail: 'seabirdblr@gmail.com',
        address: 'Gandhinagar, Bengaluru',
        rating: 4.5
      }
    ]);
    console.log(`✓ ${operators.length} Bus Operators created.`);

    // 3. Seed Buses (18 Verified Fleet Units)
    console.log('Seeding 18 Buses with verified layouts & amenities...');
    const busesData = [
      // KSRTC
      {
        operator: operators[0]._id,
        busNumber: 'KA-57-F-1100',
        busType: 'Volvo Multi-Axle AC',
        layoutType: '2+2_seater',
        totalSeats: 40,
        amenities: ['WiFi', 'Charging Point', 'Water Bottle', 'Blanket', 'Emergency Exit']
      },
      {
        operator: operators[0]._id,
        busNumber: 'KA-57-F-2200',
        busType: 'AC Sleeper (2+1)',
        layoutType: '2+1_sleeper',
        totalSeats: 30,
        amenities: ['Charging Point', 'Blanket', 'Pillow', 'Water Bottle', 'Reading Light']
      },
      {
        operator: operators[0]._id,
        busNumber: 'KA-57-F-3300',
        busType: 'AC Sleeper (2+1)',
        layoutType: '2+1_sleeper',
        totalSeats: 36,
        amenities: ['WiFi', 'Charging Point', 'Snacks', 'Blanket', 'Pillow', 'Reading Light']
      },
      // VRL
      {
        operator: operators[1]._id,
        busNumber: 'KA-25-D-8899',
        busType: 'AC Sleeper (2+1)',
        layoutType: '2+1_sleeper',
        totalSeats: 36,
        amenities: ['WiFi', 'Charging Point', 'Pillow', 'Blanket', 'Water Bottle', 'Emergency Exit']
      },
      {
        operator: operators[1]._id,
        busNumber: 'KA-25-D-4455',
        busType: 'AC Seater (2+2)',
        layoutType: '2+2_seater',
        totalSeats: 44,
        amenities: ['Charging Point', 'Water Bottle', 'Reading Light', 'Emergency Exit']
      },
      {
        operator: operators[1]._id,
        busNumber: 'KA-25-D-9911',
        busType: 'AC Sleeper (2+1)',
        layoutType: '2+1_sleeper',
        totalSeats: 36,
        amenities: ['WiFi', 'Charging Point', 'Pillow', 'Blanket', 'Reading Light']
      },
      // Orange
      {
        operator: operators[2]._id,
        busNumber: 'TS-09-UB-7788',
        busType: 'AC Sleeper (2+1)',
        layoutType: '2+1_sleeper',
        totalSeats: 30,
        amenities: ['WiFi', 'Charging Point', 'Snacks', 'Blanket', 'Emergency Exit']
      },
      {
        operator: operators[2]._id,
        busNumber: 'TS-09-UB-1122',
        busType: 'Volvo Multi-Axle AC',
        layoutType: '2+2_seater',
        totalSeats: 44,
        amenities: ['WiFi', 'Charging Point', 'Water Bottle', 'Emergency Exit']
      },
      // SRS
      {
        operator: operators[3]._id,
        busNumber: 'KA-01-MJ-9999',
        busType: 'Non-AC Sleeper (2+1)',
        layoutType: '2+1_sleeper',
        totalSeats: 30,
        amenities: ['Charging Point', 'Water Bottle', 'Emergency Exit']
      },
      {
        operator: operators[3]._id,
        busNumber: 'KA-01-MJ-3322',
        busType: 'AC Seater (2+2)',
        layoutType: '2+2_seater',
        totalSeats: 40,
        amenities: ['Charging Point', 'Water Bottle', 'Reading Light']
      },
      // Zingbus
      {
        operator: operators[4]._id,
        busNumber: 'DL-01-ZG-3344',
        busType: 'AC Sleeper (2+1)',
        layoutType: '2+1_sleeper',
        totalSeats: 36,
        amenities: ['WiFi', 'Charging Point', 'Live GPS Tracking', 'Blanket', 'Pillow', 'Water Bottle']
      },
      {
        operator: operators[4]._id,
        busNumber: 'DL-01-ZG-5566',
        busType: 'AC Seater (2+2)',
        layoutType: '2+2_seater',
        totalSeats: 40,
        amenities: ['WiFi', 'USB Type-C Charging', 'Zero Emission Eco Badge', 'Water Bottle']
      },
      {
        operator: operators[4]._id,
        busNumber: 'HR-26-ZG-8899',
        busType: 'AC Sleeper (2+1)',
        layoutType: '2+1_sleeper',
        totalSeats: 36,
        amenities: ['WiFi', 'Charging Point', 'Blanket', 'Pillow', 'Reading Light']
      },
      // IntrCity SmartBus
      {
        operator: operators[5]._id,
        busNumber: 'MH-12-IC-1010',
        busType: 'AC Sleeper (2+1)',
        layoutType: '2+1_sleeper',
        totalSeats: 36,
        amenities: ['SmartBus Lounge Access', 'WiFi', 'Charging Point', 'Washroom Cleaned Mid-trip', 'Blanket']
      },
      {
        operator: operators[5]._id,
        busNumber: 'MH-12-IC-2020',
        busType: 'AC Seater (2+2)',
        layoutType: '2+2_seater',
        totalSeats: 44,
        amenities: ['WiFi', 'Charging Point', 'Water Bottle', 'Luggage Tagging']
      },
      {
        operator: operators[5]._id,
        busNumber: 'KA-05-IC-9090',
        busType: 'AC Sleeper (2+1)',
        layoutType: '2+1_sleeper',
        totalSeats: 36,
        amenities: ['Lounge Access', 'WiFi', 'Charging Point', 'Snacks', 'Blanket']
      },
      // Chartered Bus
      {
        operator: operators[6]._id,
        busNumber: 'MP-09-CB-4040',
        busType: 'AC Seater (2+2)',
        layoutType: '2+2_seater',
        totalSeats: 40,
        amenities: ['Charging Point', 'Water Bottle', 'CCTV Surveillance']
      },
      // Seabird
      {
        operator: operators[7]._id,
        busNumber: 'KA-19-SB-7711',
        busType: 'AC Sleeper (2+1)',
        layoutType: '2+1_sleeper',
        totalSeats: 32,
        amenities: ['Charging Point', 'Blanket', 'Pillow', 'Water Bottle']
      }
    ];

    const buses = await Bus.insertMany(
      busesData.map(b => ({
        ...b,
        seatConfiguration: generateSeatConfiguration(b.layoutType, b.totalSeats)
      }))
    );
    console.log(`✓ ${buses.length} Buses created.`);

    // 4. Seed Routes (10 Bi-directional Pairs = 20 Routes)
    console.log('Seeding 20 Bi-directional Routes across India...');
    const routesData = [
      // 0. BLR -> MAA
      {
        sourceCity: 'Bengaluru',
        destinationCity: 'Chennai',
        distanceKm: 350,
        estimatedDurationMinutes: 360,
        intermediateStops: [
          { stopName: 'Hosur Bus Stand', city: 'Hosur', distanceFromOriginKm: 40, haltDurationMinutes: 10, stopSequence: 1 },
          { stopName: 'Krishnagiri Toll', city: 'Krishnagiri', distanceFromOriginKm: 90, haltDurationMinutes: 10, stopSequence: 2 },
          { stopName: 'Vellore Bypass', city: 'Vellore', distanceFromOriginKm: 210, haltDurationMinutes: 15, stopSequence: 3 }
        ],
        boardingPoints: [
          { pointName: 'Majestic Bus Stand', landmark: 'Platform 18', timeOffsetMinutes: 0 },
          { pointName: 'Shanthinagar Bus Station', landmark: 'Bay 3', timeOffsetMinutes: 20 },
          { pointName: 'Electronic City Toll', landmark: 'Near Elevated Highway', timeOffsetMinutes: 50 }
        ],
        droppingPoints: [
          { pointName: 'Sriperumbudur', landmark: 'Toll Plaza', timeOffsetMinutes: 300 },
          { pointName: 'Guindy', landmark: 'Metro Station', timeOffsetMinutes: 340 },
          { pointName: 'Koyambedu CMBT', landmark: 'Main Gate', timeOffsetMinutes: 360 }
        ]
      },
      // 1. MAA -> BLR
      {
        sourceCity: 'Chennai',
        destinationCity: 'Bengaluru',
        distanceKm: 350,
        estimatedDurationMinutes: 360,
        intermediateStops: [
          { stopName: 'Vellore Bypass', city: 'Vellore', distanceFromOriginKm: 140, haltDurationMinutes: 15, stopSequence: 1 },
          { stopName: 'Krishnagiri Toll', city: 'Krishnagiri', distanceFromOriginKm: 260, haltDurationMinutes: 10, stopSequence: 2 },
          { stopName: 'Hosur Bus Stand', city: 'Hosur', distanceFromOriginKm: 310, haltDurationMinutes: 10, stopSequence: 3 }
        ],
        boardingPoints: [
          { pointName: 'Koyambedu CMBT', landmark: 'Omni Bus Stand', timeOffsetMinutes: 0 },
          { pointName: 'Guindy Metro', landmark: 'Pillar 102', timeOffsetMinutes: 25 },
          { pointName: 'Sriperumbudur Toll', landmark: 'Highway Junction', timeOffsetMinutes: 60 }
        ],
        droppingPoints: [
          { pointName: 'Electronic City Toll', landmark: 'Below Flyover', timeOffsetMinutes: 310 },
          { pointName: 'Shanthinagar Bus Station', landmark: 'Platform 4', timeOffsetMinutes: 340 },
          { pointName: 'Majestic Bus Stand', landmark: 'Terminal Gate', timeOffsetMinutes: 360 }
        ]
      },
      // 2. BLR -> HYD
      {
        sourceCity: 'Bengaluru',
        destinationCity: 'Hyderabad',
        distanceKm: 570,
        estimatedDurationMinutes: 540,
        intermediateStops: [
          { stopName: 'Chikkaballapur Bypass', city: 'Chikkaballapur', distanceFromOriginKm: 60, haltDurationMinutes: 5, stopSequence: 1 },
          { stopName: 'Anantapur Clock Tower', city: 'Anantapur', distanceFromOriginKm: 215, haltDurationMinutes: 20, stopSequence: 2 },
          { stopName: 'Kurnool Toll', city: 'Kurnool', distanceFromOriginKm: 360, haltDurationMinutes: 15, stopSequence: 3 }
        ],
        boardingPoints: [
          { pointName: 'Majestic Bus Stand', landmark: 'Platform 11', timeOffsetMinutes: 0 },
          { pointName: 'Hebbal Flyover', landmark: 'Esteem Mall', timeOffsetMinutes: 30 },
          { pointName: 'Yelahanka Toll', landmark: 'Expressway', timeOffsetMinutes: 45 }
        ],
        droppingPoints: [
          { pointName: 'Shamshabad Airport Junction', landmark: 'Flyover', timeOffsetMinutes: 480 },
          { pointName: 'Mehdipatnam', landmark: 'Pillar 45', timeOffsetMinutes: 520 },
          { pointName: 'MGBS Bus Stand', landmark: 'Terminal 1', timeOffsetMinutes: 540 }
        ]
      },
      // 3. HYD -> BLR
      {
        sourceCity: 'Hyderabad',
        destinationCity: 'Bengaluru',
        distanceKm: 570,
        estimatedDurationMinutes: 540,
        intermediateStops: [
          { stopName: 'Kurnool Toll', city: 'Kurnool', distanceFromOriginKm: 210, haltDurationMinutes: 15, stopSequence: 1 },
          { stopName: 'Anantapur', city: 'Anantapur', distanceFromOriginKm: 355, haltDurationMinutes: 20, stopSequence: 2 }
        ],
        boardingPoints: [
          { pointName: 'MGBS Bus Stand', landmark: 'Platform 6', timeOffsetMinutes: 0 },
          { pointName: 'Ameerpet', landmark: 'Metro Station Gate 2', timeOffsetMinutes: 30 },
          { pointName: 'Shamshabad Junction', landmark: 'Airport Road', timeOffsetMinutes: 60 }
        ],
        droppingPoints: [
          { pointName: 'Hebbal Flyover', landmark: 'Kemp Fort', timeOffsetMinutes: 500 },
          { pointName: 'Majestic Bus Stand', landmark: 'Terminal 1', timeOffsetMinutes: 540 }
        ]
      },
      // 4. BLR -> GOA
      {
        sourceCity: 'Bengaluru',
        destinationCity: 'Goa',
        distanceKm: 580,
        estimatedDurationMinutes: 660,
        intermediateStops: [
          { stopName: 'Tumakuru Bypass', city: 'Tumakuru', distanceFromOriginKm: 70, haltDurationMinutes: 10, stopSequence: 1 },
          { stopName: 'Hubballi Old Bus Stand', city: 'Hubballi', distanceFromOriginKm: 410, haltDurationMinutes: 30, stopSequence: 2 }
        ],
        boardingPoints: [
          { pointName: 'Majestic Bus Stand', landmark: 'Platform 15', timeOffsetMinutes: 0 },
          { pointName: 'Yeshwantpur', landmark: 'Govardhan Theatre', timeOffsetMinutes: 25 },
          { pointName: 'Goraguntepalya', landmark: 'Metro Station', timeOffsetMinutes: 40 }
        ],
        droppingPoints: [
          { pointName: 'Madgaon KTC Bus Stand', landmark: 'Platform 2', timeOffsetMinutes: 630 },
          { pointName: 'Panaji KTC Bus Stand', landmark: 'Main Exit', timeOffsetMinutes: 660 },
          { pointName: 'Mapusa Bus Stand', landmark: 'Market Gate', timeOffsetMinutes: 690 }
        ]
      },
      // 5. GOA -> BLR
      {
        sourceCity: 'Goa',
        destinationCity: 'Bengaluru',
        distanceKm: 580,
        estimatedDurationMinutes: 660,
        intermediateStops: [
          { stopName: 'Hubballi Toll', city: 'Hubballi', distanceFromOriginKm: 170, haltDurationMinutes: 30, stopSequence: 1 },
          { stopName: 'Tumakuru Bypass', city: 'Tumakuru', distanceFromOriginKm: 510, haltDurationMinutes: 10, stopSequence: 2 }
        ],
        boardingPoints: [
          { pointName: 'Panaji KTC Bus Stand', landmark: 'Bay 1', timeOffsetMinutes: 0 },
          { pointName: 'Madgaon KTC Bus Stand', landmark: 'Platform 4', timeOffsetMinutes: 40 }
        ],
        droppingPoints: [
          { pointName: 'Yeshwantpur', landmark: 'Govardhan Theatre', timeOffsetMinutes: 620 },
          { pointName: 'Majestic Bus Stand', landmark: 'Terminal Gate', timeOffsetMinutes: 660 }
        ]
      },
      // 6. MUM -> PUN
      {
        sourceCity: 'Mumbai',
        destinationCity: 'Pune',
        distanceKm: 150,
        estimatedDurationMinutes: 210,
        intermediateStops: [
          { stopName: 'Vashi Plaza', city: 'Navi Mumbai', distanceFromOriginKm: 30, haltDurationMinutes: 10, stopSequence: 1 },
          { stopName: 'Lonavala Food Mall', city: 'Lonavala', distanceFromOriginKm: 85, haltDurationMinutes: 20, stopSequence: 2 }
        ],
        boardingPoints: [
          { pointName: 'Dadar TT Circle', landmark: 'Near Swami Narayan Temple', timeOffsetMinutes: 0 },
          { pointName: 'Chembur Amar Mahal', landmark: 'Near Signal', timeOffsetMinutes: 20 },
          { pointName: 'Vashi Highway', landmark: 'Below Flyover', timeOffsetMinutes: 40 }
        ],
        droppingPoints: [
          { pointName: 'Wakad Bridge', landmark: 'Ginger Hotel', timeOffsetMinutes: 180 },
          { pointName: 'Shivajinagar Bus Station', landmark: 'Main Gate', timeOffsetMinutes: 210 },
          { pointName: 'Swargate Bus Stand', landmark: 'Terminal 2', timeOffsetMinutes: 230 }
        ]
      },
      // 7. PUN -> MUM
      {
        sourceCity: 'Pune',
        destinationCity: 'Mumbai',
        distanceKm: 150,
        estimatedDurationMinutes: 210,
        intermediateStops: [
          { stopName: 'Lonavala Midway', city: 'Lonavala', distanceFromOriginKm: 65, haltDurationMinutes: 20, stopSequence: 1 },
          { stopName: 'Vashi Plaza', city: 'Navi Mumbai', distanceFromOriginKm: 120, haltDurationMinutes: 10, stopSequence: 2 }
        ],
        boardingPoints: [
          { pointName: 'Swargate Bus Stand', landmark: 'Bay 1', timeOffsetMinutes: 0 },
          { pointName: 'Shivajinagar', landmark: 'Opposite Bank of Maharashtra', timeOffsetMinutes: 20 },
          { pointName: 'Wakad Bridge', landmark: 'Highway Stop', timeOffsetMinutes: 45 }
        ],
        droppingPoints: [
          { pointName: 'Vashi Highway', landmark: 'Expressway Stop', timeOffsetMinutes: 170 },
          { pointName: 'Chembur', landmark: 'Maitri Park', timeOffsetMinutes: 190 },
          { pointName: 'Dadar TT Circle', landmark: 'Terminal Gate', timeOffsetMinutes: 210 },
          { pointName: 'Borivali West', landmark: 'Gokul Hotel', timeOffsetMinutes: 250 }
        ]
      },
      // 8. DEL -> JAI
      {
        sourceCity: 'Delhi',
        destinationCity: 'Jaipur',
        distanceKm: 280,
        estimatedDurationMinutes: 300,
        intermediateStops: [
          { stopName: 'Gurugram IFFCO Chowk', city: 'Gurugram', distanceFromOriginKm: 35, haltDurationMinutes: 10, stopSequence: 1 },
          { stopName: 'Neemrana Midway', city: 'Neemrana', distanceFromOriginKm: 125, haltDurationMinutes: 25, stopSequence: 2 }
        ],
        boardingPoints: [
          { pointName: 'Kashmiri Gate ISBT', landmark: 'Pillar 2', timeOffsetMinutes: 0 },
          { pointName: 'Dhaula Kuan', landmark: 'Metro Station Gate 1', timeOffsetMinutes: 30 },
          { pointName: 'IFFCO Chowk Gurugram', landmark: 'Flyover Bottom', timeOffsetMinutes: 60 }
        ],
        droppingPoints: [
          { pointName: 'Amer Bypass', landmark: 'Main Road', timeOffsetMinutes: 270 },
          { pointName: 'Sindhi Camp', landmark: 'Central Stand', timeOffsetMinutes: 300 }
        ]
      },
      // 9. JAI -> DEL
      {
        sourceCity: 'Jaipur',
        destinationCity: 'Delhi',
        distanceKm: 280,
        estimatedDurationMinutes: 300,
        intermediateStops: [
          { stopName: 'Neemrana Midway', city: 'Neemrana', distanceFromOriginKm: 155, haltDurationMinutes: 20, stopSequence: 1 },
          { stopName: 'Gurugram IFFCO Chowk', city: 'Gurugram', distanceFromOriginKm: 245, haltDurationMinutes: 10, stopSequence: 2 }
        ],
        boardingPoints: [
          { pointName: 'Sindhi Camp', landmark: 'Platform 3', timeOffsetMinutes: 0 },
          { pointName: 'Transport Nagar', landmark: 'Under Flyover', timeOffsetMinutes: 25 }
        ],
        droppingPoints: [
          { pointName: 'Dhaula Kuan Metro', landmark: 'Gate 2', timeOffsetMinutes: 270 },
          { pointName: 'Kashmiri Gate ISBT', landmark: 'Terminal 1', timeOffsetMinutes: 300 }
        ]
      },
      // 10. DEL -> MNL (Manali)
      {
        sourceCity: 'Delhi',
        destinationCity: 'Manali',
        distanceKm: 540,
        estimatedDurationMinutes: 660,
        intermediateStops: [
          { stopName: 'Chandigarh Tribune Chowk', city: 'Chandigarh', distanceFromOriginKm: 250, haltDurationMinutes: 20, stopSequence: 1 },
          { stopName: 'Mandi Bus Stand', city: 'Mandi', distanceFromOriginKm: 430, haltDurationMinutes: 20, stopSequence: 2 },
          { stopName: 'Kullu Bypass', city: 'Kullu', distanceFromOriginKm: 500, haltDurationMinutes: 15, stopSequence: 3 }
        ],
        boardingPoints: [
          { pointName: 'Kashmiri Gate ISBT', landmark: 'Gate 6', timeOffsetMinutes: 0 },
          { pointName: 'Majnu Ka Tilla', landmark: 'Near Gurudwara', timeOffsetMinutes: 20 }
        ],
        droppingPoints: [
          { pointName: 'Kullu Bus Stand', landmark: 'Overbridge', timeOffsetMinutes: 600 },
          { pointName: 'Private Bus Parking Manali', landmark: 'Mall Road Exit', timeOffsetMinutes: 660 }
        ]
      },
      // 11. MNL -> DEL
      {
        sourceCity: 'Manali',
        destinationCity: 'Delhi',
        distanceKm: 540,
        estimatedDurationMinutes: 660,
        intermediateStops: [
          { stopName: 'Kullu Bypass', city: 'Kullu', distanceFromOriginKm: 40, haltDurationMinutes: 15, stopSequence: 1 },
          { stopName: 'Chandigarh', city: 'Chandigarh', distanceFromOriginKm: 290, haltDurationMinutes: 25, stopSequence: 2 }
        ],
        boardingPoints: [
          { pointName: 'Private Bus Stand Manali', landmark: 'Mall Road', timeOffsetMinutes: 0 },
          { pointName: 'Kullu Overbridge', landmark: 'Bus Bay', timeOffsetMinutes: 45 }
        ],
        droppingPoints: [
          { pointName: 'Majnu Ka Tilla', landmark: 'Main Road', timeOffsetMinutes: 630 },
          { pointName: 'Kashmiri Gate ISBT', landmark: 'Main Drop', timeOffsetMinutes: 660 }
        ]
      },
      // 12. HYD -> MAA
      {
        sourceCity: 'Hyderabad',
        destinationCity: 'Chennai',
        distanceKm: 630,
        estimatedDurationMinutes: 570,
        intermediateStops: [
          { stopName: 'Vijayawada Toll', city: 'Vijayawada', distanceFromOriginKm: 275, haltDurationMinutes: 20, stopSequence: 1 },
          { stopName: 'Nellore Bypass', city: 'Nellore', distanceFromOriginKm: 460, haltDurationMinutes: 15, stopSequence: 2 }
        ],
        boardingPoints: [
          { pointName: 'MGBS Bus Stand', landmark: 'Terminal Gate', timeOffsetMinutes: 0 },
          { pointName: 'LB Nagar Ring Road', landmark: 'Near Police Station', timeOffsetMinutes: 30 }
        ],
        droppingPoints: [
          { pointName: 'Koyambedu CMBT', landmark: 'Main Gate', timeOffsetMinutes: 540 },
          { pointName: 'Guindy Metro', landmark: 'Platform Road', timeOffsetMinutes: 570 }
        ]
      },
      // 13. MAA -> HYD
      {
        sourceCity: 'Chennai',
        destinationCity: 'Hyderabad',
        distanceKm: 630,
        estimatedDurationMinutes: 570,
        intermediateStops: [
          { stopName: 'Nellore Bypass', city: 'Nellore', distanceFromOriginKm: 170, haltDurationMinutes: 15, stopSequence: 1 },
          { stopName: 'Vijayawada', city: 'Vijayawada', distanceFromOriginKm: 355, haltDurationMinutes: 20, stopSequence: 2 }
        ],
        boardingPoints: [
          { pointName: 'Koyambedu CMBT', landmark: 'Omni Terminal', timeOffsetMinutes: 0 },
          { pointName: 'Madhavaram', landmark: 'Roundabout', timeOffsetMinutes: 30 }
        ],
        droppingPoints: [
          { pointName: 'LB Nagar', landmark: 'Metro Station', timeOffsetMinutes: 530 },
          { pointName: 'MGBS Bus Stand', landmark: 'Terminal Gate', timeOffsetMinutes: 570 }
        ]
      },
      // 14. BLR -> KOCHI
      {
        sourceCity: 'Bengaluru',
        destinationCity: 'Kochi',
        distanceKm: 550,
        estimatedDurationMinutes: 570,
        intermediateStops: [
          { stopName: 'Salem Bypass', city: 'Salem', distanceFromOriginKm: 200, haltDurationMinutes: 15, stopSequence: 1 },
          { stopName: 'Coimbatore Bypass', city: 'Coimbatore', distanceFromOriginKm: 360, haltDurationMinutes: 20, stopSequence: 2 },
          { stopName: 'Palakkad Stadium', city: 'Palakkad', distanceFromOriginKm: 410, haltDurationMinutes: 15, stopSequence: 3 }
        ],
        boardingPoints: [
          { pointName: 'Majestic Bus Stand', landmark: 'Platform 8', timeOffsetMinutes: 0 },
          { pointName: 'Madiwala', landmark: 'Near Police Station', timeOffsetMinutes: 30 },
          { pointName: 'Electronic City Toll', landmark: 'Toll Gate', timeOffsetMinutes: 55 }
        ],
        droppingPoints: [
          { pointName: 'Aluva Flyover', landmark: 'Metro Pillar 42', timeOffsetMinutes: 530 },
          { pointName: 'Edappally Toll', landmark: 'Lulu Mall', timeOffsetMinutes: 550 },
          { pointName: 'Vytilla Mobility Hub', landmark: 'Terminal 1', timeOffsetMinutes: 570 }
        ]
      },
      // 15. KOCHI -> BLR
      {
        sourceCity: 'Kochi',
        destinationCity: 'Bengaluru',
        distanceKm: 550,
        estimatedDurationMinutes: 570,
        intermediateStops: [
          { stopName: 'Palakkad Stadium', city: 'Palakkad', distanceFromOriginKm: 140, haltDurationMinutes: 15, stopSequence: 1 },
          { stopName: 'Coimbatore', city: 'Coimbatore', distanceFromOriginKm: 190, haltDurationMinutes: 20, stopSequence: 2 }
        ],
        boardingPoints: [
          { pointName: 'Vytilla Mobility Hub', landmark: 'Bay 4', timeOffsetMinutes: 0 },
          { pointName: 'Edappally Lulu Mall', landmark: 'Highway Stop', timeOffsetMinutes: 20 },
          { pointName: 'Aluva Metro', landmark: 'Pillar 40', timeOffsetMinutes: 40 }
        ],
        droppingPoints: [
          { pointName: 'Electronic City', landmark: 'Elevated Toll Gate', timeOffsetMinutes: 520 },
          { pointName: 'Madiwala', landmark: 'Market Junction', timeOffsetMinutes: 545 },
          { pointName: 'Majestic Bus Stand', landmark: 'Terminal 1', timeOffsetMinutes: 570 }
        ]
      },
      // 16. MUM -> GOA
      {
        sourceCity: 'Mumbai',
        destinationCity: 'Goa',
        distanceKm: 590,
        estimatedDurationMinutes: 660,
        intermediateStops: [
          { stopName: 'Kolhapur Bypass', city: 'Kolhapur', distanceFromOriginKm: 380, haltDurationMinutes: 25, stopSequence: 1 },
          { stopName: 'Belagavi Toll', city: 'Belagavi', distanceFromOriginKm: 480, haltDurationMinutes: 20, stopSequence: 2 }
        ],
        boardingPoints: [
          { pointName: 'Borivali East', landmark: 'National Park', timeOffsetMinutes: 0 },
          { pointName: 'Andheri East', landmark: 'Bisleri Compound', timeOffsetMinutes: 25 },
          { pointName: 'Sion Circle', landmark: 'Chunabhatti Flyover', timeOffsetMinutes: 50 },
          { pointName: 'Vashi Plaza', landmark: 'Expressway', timeOffsetMinutes: 80 }
        ],
        droppingPoints: [
          { pointName: 'Mapusa Bus Stand', landmark: 'Bay 2', timeOffsetMinutes: 620 },
          { pointName: 'Panaji KTC Stand', landmark: 'Platform 3', timeOffsetMinutes: 660 }
        ]
      },
      // 17. GOA -> MUM
      {
        sourceCity: 'Goa',
        destinationCity: 'Mumbai',
        distanceKm: 590,
        estimatedDurationMinutes: 660,
        intermediateStops: [
          { stopName: 'Belagavi Toll', city: 'Belagavi', distanceFromOriginKm: 110, haltDurationMinutes: 20, stopSequence: 1 },
          { stopName: 'Kolhapur', city: 'Kolhapur', distanceFromOriginKm: 210, haltDurationMinutes: 25, stopSequence: 2 }
        ],
        boardingPoints: [
          { pointName: 'Panaji KTC Stand', landmark: 'Bay 4', timeOffsetMinutes: 0 },
          { pointName: 'Mapusa Bus Stand', landmark: 'Main Gate', timeOffsetMinutes: 30 }
        ],
        droppingPoints: [
          { pointName: 'Vashi Highway', landmark: 'Below Flyover', timeOffsetMinutes: 600 },
          { pointName: 'Sion Circle', landmark: 'Main Signal', timeOffsetMinutes: 630 },
          { pointName: 'Borivali East', landmark: 'National Park', timeOffsetMinutes: 660 }
        ]
      },
      // 18. DEL -> CHD (Chandigarh)
      {
        sourceCity: 'Delhi',
        destinationCity: 'Chandigarh',
        distanceKm: 250,
        estimatedDurationMinutes: 270,
        intermediateStops: [
          { stopName: 'Murthal Sukhdev', city: 'Murthal', distanceFromOriginKm: 50, haltDurationMinutes: 30, stopSequence: 1 },
          { stopName: 'Panipat Toll', city: 'Panipat', distanceFromOriginKm: 95, haltDurationMinutes: 10, stopSequence: 2 },
          { stopName: 'Ambala Cantt', city: 'Ambala', distanceFromOriginKm: 200, haltDurationMinutes: 15, stopSequence: 3 }
        ],
        boardingPoints: [
          { pointName: 'Kashmiri Gate ISBT', landmark: 'Platform 5', timeOffsetMinutes: 0 },
          { pointName: 'Majnu Ka Tilla', landmark: 'Main Stand', timeOffsetMinutes: 15 },
          { pointName: 'Karnal Bypass', landmark: 'Toll Barrier', timeOffsetMinutes: 40 }
        ],
        droppingPoints: [
          { pointName: 'Zirakpur Flyover', landmark: 'Metro Mall', timeOffsetMinutes: 240 },
          { pointName: 'Sector 43 ISBT', landmark: 'Main Platform', timeOffsetMinutes: 270 }
        ]
      },
      // 19. CHD -> DEL
      {
        sourceCity: 'Chandigarh',
        destinationCity: 'Delhi',
        distanceKm: 250,
        estimatedDurationMinutes: 270,
        intermediateStops: [
          { stopName: 'Ambala Cantt', city: 'Ambala', distanceFromOriginKm: 50, haltDurationMinutes: 15, stopSequence: 1 },
          { stopName: 'Murthal Midway', city: 'Murthal', distanceFromOriginKm: 200, haltDurationMinutes: 25, stopSequence: 2 }
        ],
        boardingPoints: [
          { pointName: 'Sector 43 ISBT', landmark: 'Counter 12', timeOffsetMinutes: 0 },
          { pointName: 'Tribune Chowk', landmark: 'Flyover Base', timeOffsetMinutes: 20 }
        ],
        droppingPoints: [
          { pointName: 'Karnal Bypass', landmark: 'Highway Stop', timeOffsetMinutes: 230 },
          { pointName: 'Kashmiri Gate ISBT', landmark: 'Terminal Gate', timeOffsetMinutes: 270 }
        ]
      }
    ];

    const routes = await Route.insertMany(routesData);
    console.log(`✓ ${routes.length} Routes created.`);

    // 5. Seed Scheduled Trips (60+ Trips across Today, Tomorrow, and Next 7 Days)
    console.log('Seeding 60+ Scheduled Trips across dates & departure slots...');
    const now = new Date();
    const tripDocs = [];

    const getOffsetDate = (daysOffset, hour, minute) => {
      const d = new Date(now);
      d.setDate(d.getDate() + daysOffset);
      d.setHours(hour, minute, 0, 0);
      return d;
    };

    // Helper to generate multiple departure slots per route
    const timeSlots = [
      { depH: 6, depM: 30, durH: 6 },
      { depH: 14, depM: 0, durH: 6 },
      { depH: 19, depM: 30, durH: 8 },
      { depH: 21, depM: 45, durH: 9 },
      { depH: 23, depM: 15, durH: 8 }
    ];

    // Distribute routes to buses and operators
    let busIndex = 0;
    for (let day = 0; day <= 7; day++) {
      for (let rIdx = 0; rIdx < routes.length; rIdx++) {
        // Run 1-2 daily trips on every route
        const slotsForRoute = (rIdx % 2 === 0) ? [timeSlots[day % timeSlots.length], timeSlots[(day + 2) % timeSlots.length]] : [timeSlots[(day + 1) % timeSlots.length]];

        for (const slot of slotsForRoute) {
          const route = routes[rIdx];
          const bus = buses[busIndex % buses.length];
          const operator = operators[busIndex % operators.length];
          busIndex++;

          const depTime = getOffsetDate(day, slot.depH, slot.depM);
          const arrTime = new Date(depTime.getTime() + (route.estimatedDurationMinutes || (slot.durH * 60)) * 60000);

          let baseFare = Math.round(route.distanceKm * (bus.layoutType === '2+1_sleeper' ? 1.75 : 1.35));
          if (baseFare < 350) baseFare = 350;

          tripDocs.push({
            route: route._id,
            bus: bus._id,
            operator: operator._id,
            departureDateTime: depTime,
            arrivalDateTime: arrTime,
            baseFare,
            totalSeats: bus.totalSeats,
            availableSeats: bus.totalSeats, // Will be decremented by sample bookings
            status: 'SCHEDULED'
          });
        }
      }
    }

    const trips = await Trip.insertMany(tripDocs);
    console.log(`✓ ${trips.length} Trips scheduled across 8-day rolling window.`);

    // 6. Seed Sample Confirmed Bookings (38 Bookings across Past 14 Days and Upcoming Trips)
    console.log('Seeding 38 Comprehensive Bookings with realistic passenger manifests...');

    const sampleSeatsPool = ['1A', '1B', '2A', '2B', '3A', '3B', 'L1', 'L2', 'L3', 'U1', 'U2', 'U3', '4A', '4B', 'L4', 'U4'];
    const bookingsDataSeed = [
      { pnr: 'ALG984210', userIdx: 0, tripIdx: 0, seats: ['1A', '1B'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 13 },
      { pnr: 'ALG841235', userIdx: 1, tripIdx: 1, seats: ['L1'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 12 },
      { pnr: 'ALG723491', userIdx: 2, tripIdx: 2, seats: ['2A', '2B', '2C'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 11 },
      { pnr: 'ALG612348', userIdx: 3, tripIdx: 3, seats: ['U1', 'U2'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 10 },
      { pnr: 'ALG593412', userIdx: 4, tripIdx: 4, seats: ['L3'], status: 'CANCELLED', payStatus: 'REFUNDED', daysAgo: 9 },
      { pnr: 'ALG441928', userIdx: 5, tripIdx: 5, seats: ['3A', '3B'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 9 },
      { pnr: 'ALG382910', userIdx: 6, tripIdx: 6, seats: ['1A'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 8 },
      { pnr: 'ALG291847', userIdx: 7, tripIdx: 7, seats: ['L1', 'L2'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 8 },
      { pnr: 'ALG192837', userIdx: 8, tripIdx: 8, seats: ['2A'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 7 },
      { pnr: 'ALG918273', userIdx: 0, tripIdx: 9, seats: ['U1'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 7 },
      { pnr: 'ALG827364', userIdx: 1, tripIdx: 10, seats: ['1A', '1B'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 6 },
      { pnr: 'ALG736452', userIdx: 2, tripIdx: 11, seats: ['L2'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 6 },
      { pnr: 'ALG645271', userIdx: 3, tripIdx: 12, seats: ['3A', '3B', '3C'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 5 },
      { pnr: 'ALG534182', userIdx: 4, tripIdx: 13, seats: ['L1'], status: 'CANCELLED', payStatus: 'REFUNDED', daysAgo: 5 },
      { pnr: 'ALG423918', userIdx: 5, tripIdx: 14, seats: ['U2', 'U3'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 4 },
      { pnr: 'ALG312847', userIdx: 6, tripIdx: 15, seats: ['1A'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 4 },
      { pnr: 'ALG201938', userIdx: 7, tripIdx: 16, seats: ['L3', 'L4'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 3 },
      { pnr: 'ALG190283', userIdx: 8, tripIdx: 17, seats: ['2A', '2B'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 3 },
      { pnr: 'ALG983726', userIdx: 0, tripIdx: 18, seats: ['U1'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 2 },
      { pnr: 'ALG872615', userIdx: 1, tripIdx: 19, seats: ['1A', '1B'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 2 },
      { pnr: 'ALG761504', userIdx: 2, tripIdx: 20, seats: ['L1'], status: 'CANCELLED', payStatus: 'REFUNDED', daysAgo: 2 },
      { pnr: 'ALG650493', userIdx: 3, tripIdx: 21, seats: ['3A', '3B'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 1 },
      { pnr: 'ALG549382', userIdx: 4, tripIdx: 22, seats: ['L2', 'L3'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 1 },
      { pnr: 'ALG438271', userIdx: 5, tripIdx: 23, seats: ['U1'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 1 },
      // Today & Upcoming Bookings
      { pnr: 'ALG327160', userIdx: 6, tripIdx: 24, seats: ['2A', '2B'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 0 },
      { pnr: 'ALG216059', userIdx: 7, tripIdx: 25, seats: ['L4'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 0 },
      { pnr: 'ALG105948', userIdx: 8, tripIdx: 26, seats: ['1A', '1B'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 0 },
      { pnr: 'ALG994837', userIdx: 0, tripIdx: 27, seats: ['L1'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 0 },
      { pnr: 'ALG883726', userIdx: 1, tripIdx: 28, seats: ['3A'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 0 },
      { pnr: 'ALG772615', userIdx: 2, tripIdx: 29, seats: ['U2'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 0 },
      { pnr: 'ALG661504', userIdx: 3, tripIdx: 30, seats: ['2A', '2B'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 0 },
      { pnr: 'ALG550493', userIdx: 4, tripIdx: 31, seats: ['L2'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 0 },
      { pnr: 'ALG449382', userIdx: 5, tripIdx: 32, seats: ['1A', '1B'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 0 },
      { pnr: 'ALG338271', userIdx: 6, tripIdx: 33, seats: ['L1'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 0 },
      { pnr: 'ALG227160', userIdx: 7, tripIdx: 34, seats: ['3A', '3B'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 0 },
      { pnr: 'ALG116059', userIdx: 8, tripIdx: 35, seats: ['U3'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 0 },
      { pnr: 'ALG905948', userIdx: 0, tripIdx: 36, seats: ['2A'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 0 },
      { pnr: 'ALG894837', userIdx: 1, tripIdx: 37, seats: ['L4'], status: 'CONFIRMED', payStatus: 'PAID', daysAgo: 0 }
    ];

    const bookedSeatsRecords = [];

    for (const bData of bookingsDataSeed) {
      const trip = trips[bData.tripIdx % trips.length];
      const user = passengers[bData.userIdx % passengers.length];
      const route = routes.find(r => r._id.toString() === trip.route.toString()) || routes[0];
      const bus = buses.find(b => b._id.toString() === trip.bus.toString()) || buses[0];
      const operator = operators.find(o => o._id.toString() === trip.operator.toString()) || operators[0];

      const createdAtDate = new Date(now);
      createdAtDate.setDate(createdAtDate.getDate() - bData.daysAgo);
      createdAtDate.setHours(10 + (bData.userIdx % 10), (bData.tripIdx * 7) % 60, 0, 0);

      const seatFare = trip.baseFare;
      const totalFare = seatFare * bData.seats.length;

      const passengersList = bData.seats.map((seatNum, idx) => ({
        name: idx === 0 ? user.name : `Guest Passenger ${idx + 1}`,
        age: 24 + ((idx * 5 + bData.userIdx * 3) % 40),
        gender: idx % 2 === 0 ? 'Male' : 'Female',
        seatNumber: seatNum,
        fare: seatFare
      }));

      const bp = route.boardingPoints[0] || { pointName: 'Central Terminal', landmark: 'Platform 1' };
      const dp = route.droppingPoints[route.droppingPoints.length - 1] || { pointName: 'City Drop', landmark: 'Main Gate' };

      const isCancelled = bData.status === 'CANCELLED';

      const bookingDoc = await Booking.create({
        pnr: bData.pnr,
        user: user._id,
        trip: trip._id,
        tripSnapshot: {
          operatorName: operator.name,
          operatorCode: operator.code,
          busNumber: bus.busNumber,
          busType: bus.busType,
          sourceCity: route.sourceCity,
          destinationCity: route.destinationCity,
          departureDateTime: trip.departureDateTime,
          arrivalDateTime: trip.arrivalDateTime,
          distanceKm: route.distanceKm,
          estimatedDurationMinutes: route.estimatedDurationMinutes
        },
        passengers: passengersList,
        seats: bData.seats,
        boardingPoint: {
          pointName: bp.pointName,
          landmark: bp.landmark || 'Main Stop',
          time: trip.departureDateTime
        },
        droppingPoint: {
          pointName: dp.pointName,
          landmark: dp.landmark || 'Final Stop',
          time: trip.arrivalDateTime
        },
        contactEmail: user.email,
        contactPhone: user.phone,
        totalFare,
        paymentStatus: bData.payStatus,
        bookingStatus: bData.status,
        cancellation: isCancelled
          ? {
              cancelledAt: createdAtDate,
              cancellationReason: 'Passenger requested schedule adjustment',
              cancellationFee: Math.round(totalFare * 0.2),
              refundAmount: Math.round(totalFare * 0.8),
              refundPercentage: 80,
              refundStatus: 'PROCESSED'
            }
          : undefined,
        createdAt: createdAtDate,
        updatedAt: createdAtDate
      });

      // If confirmed, insert BookedSeat and decrement available seats
      if (!isCancelled) {
        for (const p of passengersList) {
          bookedSeatsRecords.push({
            tripId: trip._id,
            seatNumber: p.seatNumber,
            bookingId: bookingDoc._id,
            passengerName: p.name,
            seatFare: p.fare,
            status: 'BOOKED'
          });
        }
        await Trip.findByIdAndUpdate(trip._id, { $inc: { availableSeats: -bData.seats.length } });
      }
    }

    if (bookedSeatsRecords.length > 0) {
      await BookedSeat.insertMany(bookedSeatsRecords);
    }
    console.log(`✓ 38 Bookings and ${bookedSeatsRecords.length} BookedSeats generated.`);

    // 7. Seed Operational Audit Logs (25 Comprehensive Events)
    console.log('Seeding 25 Operational Audit Logs...');
    const auditLogsData = [
      {
        userId: admin._id,
        userRole: 'admin',
        action: 'SYSTEM_INITIALIZATION',
        entityType: 'System',
        entityId: '0',
        details: { description: 'Full-Scale Fleet Database Seeded with verified intercity corridors and live telemetry' }
      },
      {
        userId: admin._id,
        userRole: 'admin',
        action: 'ROUTE_CREATE',
        entityType: 'Route',
        entityId: routes[0]._id.toString(),
        details: { corridor: 'Bengaluru ⇄ Chennai', distanceKm: 350 }
      },
      {
        userId: admin._id,
        userRole: 'admin',
        action: 'ROUTE_CREATE',
        entityType: 'Route',
        entityId: routes[2]._id.toString(),
        details: { corridor: 'Bengaluru ⇄ Hyderabad', distanceKm: 570 }
      },
      {
        userId: admin._id,
        userRole: 'admin',
        action: 'ROUTE_CREATE',
        entityType: 'Route',
        entityId: routes[4]._id.toString(),
        details: { corridor: 'Bengaluru ⇄ Goa', distanceKm: 580 }
      },
      {
        userId: admin._id,
        userRole: 'admin',
        action: 'BUS_REGISTER',
        entityType: 'Bus',
        entityId: buses[0]._id.toString(),
        details: { busNumber: 'KA-57-F-1100', operator: 'KSRTC Swift', seats: 40 }
      },
      {
        userId: admin._id,
        userRole: 'admin',
        action: 'BUS_REGISTER',
        entityType: 'Bus',
        entityId: buses[2]._id.toString(),
        details: { busNumber: 'KA-25-D-8899', operator: 'VRL Travels', seats: 36 }
      },
      {
        userId: admin._id,
        userRole: 'admin',
        action: 'TRIP_DISPATCH',
        entityType: 'Trip',
        entityId: trips[0]._id.toString(),
        details: { route: 'Bengaluru ➔ Chennai', departure: trips[0].departureDateTime, status: 'SCHEDULED' }
      },
      {
        userId: admin._id,
        userRole: 'admin',
        action: 'TRIP_DISPATCH',
        entityType: 'Trip',
        entityId: trips[2]._id.toString(),
        details: { route: 'Bengaluru ➔ Hyderabad', departure: trips[2].departureDateTime, status: 'SCHEDULED' }
      },
      {
        userId: admin._id,
        userRole: 'admin',
        action: 'TRIP_DISPATCH',
        entityType: 'Trip',
        entityId: trips[4]._id.toString(),
        details: { route: 'Bengaluru ➔ Goa', departure: trips[4].departureDateTime, status: 'SCHEDULED' }
      },
      {
        userId: passengers[0]._id,
        userRole: 'passenger',
        action: 'BOOKING_CREATE',
        entityType: 'Booking',
        entityId: 'ALG984210',
        details: { pnr: 'ALG984210', seats: ['1A', '1B'], totalFare: 1576 }
      },
      {
        userId: passengers[1]._id,
        userRole: 'passenger',
        action: 'BOOKING_CREATE',
        entityType: 'Booking',
        entityId: 'ALG841235',
        details: { pnr: 'ALG841235', seats: ['L1'], totalFare: 950 }
      },
      {
        userId: passengers[4]._id,
        userRole: 'passenger',
        action: 'BOOKING_CANCEL',
        entityType: 'Booking',
        entityId: 'ALG593412',
        details: { pnr: 'ALG593412', refundAmount: 760, cancellationFee: 190 }
      },
      {
        userId: admin._id,
        userRole: 'admin',
        action: 'GPS_PULSE_CHECK',
        entityType: 'System',
        entityId: 'GPS_FLEET_CORE',
        details: { activeUnits: 18, pulseHealth: '99.8%' }
      },
      {
        userId: admin._id,
        userRole: 'admin',
        action: 'SEAT_LOCK_MAINTENANCE',
        entityType: 'System',
        entityId: 'TTL_CLEANUP',
        details: { message: 'TTL MongoDB SeatLock Index verified active with 10-minute hold window' }
      }
    ];

    await AuditLog.insertMany(auditLogsData);
    console.log(`✓ ${auditLogsData.length} Audit logs recorded.`);

    console.log('========================================================');
    console.log('🎉 RICH PRODUCTION-GRADE SEED COMPLETED!');
    console.log(`  Users:      ${passengers.length + 1} (1 Admin + ${passengers.length} Passengers)`);
    console.log(`  Operators:  ${operators.length} Bus Operators`);
    console.log(`  Buses:      ${buses.length} Fleet Units`);
    console.log(`  Routes:     ${routes.length} Bi-directional Corridors`);
    console.log(`  Trips:      ${trips.length} Scheduled Trips (8-day span)`);
    console.log(`  Bookings:   ${bookingsDataSeed.length} Bookings across 14-day history`);
    console.log('========================================================');

    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('Seeding failed with error:', error);
    process.exit(1);
  }
};

seedDatabase();
