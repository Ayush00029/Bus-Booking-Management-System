const swaggerJsDoc = require('swagger-jsdoc');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Algions Bus Booking Management System API',
      version: '1.0.0',
      description: 'Production-ready REST API for Bus Booking Management System featuring role-based access control, atomic seat reservation with double-booking prevention, automated cancellation & refund policies, and administrative analytics.',
      contact: {
        name: 'Algions Assessment Engineering Team',
        email: 'dev@algions.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development Server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Provide JWT token as: Bearer <token>'
        }
      }
    }
  },
  apis: ['./src/routes/*.js', './src/models/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

module.exports = swaggerDocs;

