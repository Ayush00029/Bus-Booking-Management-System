const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');
const { createOperatorValidator, createBusValidator } = require('../validators/busValidator');
const validate = require('../middleware/validateMiddleware');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Buses & Operators
 *   description: Bus operator and vehicle inventory management
 */

// Operator Routes
router.get('/operators', busController.getOperators);
router.get('/operators/:id', busController.getOperatorById);
router.post('/operators', requireAuth, requireAdmin, createOperatorValidator, validate, busController.createOperator);
router.put('/operators/:id', requireAuth, requireAdmin, busController.updateOperator);

// Bus Routes
router.get('/', busController.getBuses);
router.get('/:id', busController.getBusById);
router.post('/', requireAuth, requireAdmin, createBusValidator, validate, busController.createBus);
router.put('/:id', requireAuth, requireAdmin, busController.updateBus);
router.delete('/:id', requireAuth, requireAdmin, busController.deleteBus);

module.exports = router;

