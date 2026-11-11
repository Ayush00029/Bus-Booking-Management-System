const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./config/swagger');
const { notFoundHandler, errorHandler } = require('./middleware/errorMiddleware');
const ApiResponse = require('./utils/apiResponse');

const app = express();

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false // Allows Swagger UI to render correctly
}));

// CORS Configuration
const allowedOriginEnv = process.env.CORS_ORIGIN;
app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests (Postman, curl, server-to-server) or same-origin
    if (!origin) return callback(null, true);
    // Allow localhost, all Vercel deployments, Render domain, or configured CORS_ORIGIN
    if (
      !allowedOriginEnv ||
      allowedOriginEnv === '*' ||
      allowedOriginEnv.split(',').map(s => s.trim()).includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.endsWith('.onrender.com') ||
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Fallback: allow for open API assessment
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-client-token', 'X-Requested-With']
}));

// Request Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Swagger Documentation Route
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, {
  customSiteTitle: 'Algions Bus Booking API Documentation',
  customCss: '.swagger-ui .topbar { display: none }'
}));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  return ApiResponse.success(res, {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  }, 'Service is operational');
});

// Root API Welcome Endpoint
app.get('/api', (req, res) => {
  return ApiResponse.success(res, {
    name: 'Algions Bus Booking Management API',
    version: '1.0.0',
    documentation: '/api-docs',
    health: '/api/health'
  }, 'Welcome to Algions Bus Booking API');
});

// Application Routes will be mounted here in subsequent steps
const apiRoutes = require('./routes');
app.use('/api', apiRoutes);

// Error Handling Middlewares
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

