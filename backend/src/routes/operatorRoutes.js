const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');
const { createOperatorValidator } = require('../validators/busValidator');
const validate = require('../middleware/validateMiddleware');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Bus Operators
 *   description: Management of partner bus operating companies
 */

router.get('/', busController.getOperators);
router.get('/:id', busController.getOperatorById);
router.post('/', requireAuth, requireAdmin, createOperatorValidator, validate, busController.createOperator);
router.put('/:id', requireAuth, requireAdmin, busController.updateOperator);

module.exports = router;

