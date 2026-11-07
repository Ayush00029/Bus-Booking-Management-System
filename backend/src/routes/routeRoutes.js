const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const { createRouteValidator } = require('../validators/routeValidator');
const validate = require('../middleware/validateMiddleware');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Routes
 *   description: Route definitions, intermediate stops, and boarding/dropping points
 */

// Public endpoint for city lists (used for search suggestions)
router.get('/cities', routeController.getCities);

router.get('/', routeController.getRoutes);
router.get('/:id', routeController.getRouteById);
router.post('/', requireAuth, requireAdmin, createRouteValidator, validate, routeController.createRoute);
router.put('/:id', requireAuth, requireAdmin, routeController.updateRoute);
router.delete('/:id', requireAuth, requireAdmin, routeController.deleteRoute);

module.exports = router;

