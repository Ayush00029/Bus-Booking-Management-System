const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');
const reportController = require('../controllers/reportController');
const ApiResponse = require('../utils/apiResponse');

// All routes under /api/admin require authentication and admin role
router.use(requireAuth, requireAdmin);

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Administrative analytics, passenger manifests, audit logs, and settings
 */

/**
 * @swagger
 * /admin/verify:
 *   get:
 *     summary: Verify admin privileges
 *     tags: [Admin]
 */
router.get('/verify', (req, res) => {
  return ApiResponse.success(res, {
    adminId: req.user._id,
    adminEmail: req.user.email,
    role: req.user.role
  }, 'Admin authorization confirmed');
});

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get high-level system dashboard metrics
 *     tags: [Admin]
 */
router.get('/dashboard', reportController.getDashboard);

/**
 * @swagger
 * /admin/analytics:
 *   get:
 *     summary: Get analytics charts data (trends, popular routes, occupancy)
 *     tags: [Admin]
 */
router.get('/analytics', reportController.getCharts);

/**
 * @swagger
 * /admin/manifest/{tripId}:
 *   get:
 *     summary: Get passenger manifest for a specific trip
 *     tags: [Admin]
 */
router.get('/manifest/:tripId', reportController.getManifest);

/**
 * @swagger
 * /admin/audit-logs:
 *   get:
 *     summary: View system audit trail with filtering and pagination
 *     tags: [Admin]
 */
router.get('/audit-logs', reportController.getAuditLogs);

module.exports = router;
