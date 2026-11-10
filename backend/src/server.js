require('dotenv').config();
const app = require('./app');
const { connectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Bind HTTP server immediately so cloud platforms (Render, Railway, Fly) detect the open port
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`===============================================`);
    console.log(`🚌 Bus Booking System Backend Server Running`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📚 Swagger Docs: http://localhost:${PORT}/api-docs`);
    console.log(`💚 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });

  try {
    console.log('[MongoDB] Initializing database connection...');
    if (!process.env.MONGODB_URI) {
      console.warn('[MongoDB] WARNING: MONGODB_URI is not set! Using localhost fallback.');
    } else {
      console.log('[MongoDB] MONGODB_URI detected from environment.');
    }

    await connectDB();
  } catch (error) {
    console.error('[MongoDB] Connection error on startup:', error.message);
  }

  // Graceful Shutdown
  const shutdown = () => {
    console.log('\nShutting down gracefully...');
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

startServer();

