const mongoose = require('mongoose');

/**
 * Connect to MongoDB with robust error handling and event logging
 */
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bus_booking_db';

  try {
    const conn = await mongoose.connect(mongoURI, {
      autoIndex: true, // Build indexes defined in schemas
    });

    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);

    mongoose.connection.on('error', (err) => {
      console.error(`[MongoDB] Connection error:`, err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[MongoDB] Disconnected from database');
    });

    return conn;
  } catch (error) {
    console.error(`[MongoDB] Initial connection failed:`, error.message);
    // Don't crash immediately in test environments
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
};

module.exports = {
  connectDB,
  disconnectDB
};

