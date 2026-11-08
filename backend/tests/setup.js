const mongoose = require('mongoose');
const { MongoMemoryReplSet, MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

/**
 * Setup in-memory MongoDB before running test suite
 */
beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret_algions_123456';
  process.env.JWT_EXPIRES_IN = '1h';

  try {
    mongoServer = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' }
    });
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  } catch (err) {
    console.warn('Replica set creation fallback to standard MongoMemoryServer:', err.message);
    try {
      mongoServer = await MongoMemoryServer.create({
        instance: { storageEngine: 'wiredTiger' }
      });
      const uri = mongoServer.getUri();
      await mongoose.connect(uri);
    } catch (memErr) {
      console.warn('MongoMemoryServer unavailable, connecting to local test instance on 27017:', memErr.message);
      const testDbUri = process.env.TEST_MONGODB_URI || 'mongodb://127.0.0.1:27017/bus_booking_test_db';
      await mongoose.connect(testDbUri);
    }
  }
}, 60000);

/**
 * Clear all collections between individual tests
 */
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

/**
 * Teardown and close connections after test suite completes
 */
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    if (!mongoServer && mongoose.connection.name === 'bus_booking_test_db') {
      try {
        await mongoose.connection.dropDatabase();
      } catch (e) {}
    }
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});

