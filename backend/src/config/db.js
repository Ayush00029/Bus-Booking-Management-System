const mongoose = require('mongoose');

const DEFAULT_MONGODB_URI = 'mongodb+srv://yt:9WUIHYgSM0XqpIa6@backend.zcc0sc8.mongodb.net/bus_booking_db?retryWrites=true&w=majority';

/**
 * Connect to MongoDB with robust error handling and event logging
 */
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || DEFAULT_MONGODB_URI;

  try {
    const conn = await mongoose.connect(mongoURI, {
      autoIndex: true, // Build indexes defined in schemas
      serverSelectionTimeoutMS: 10000
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

