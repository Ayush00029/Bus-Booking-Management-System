const reportService = require('../services/reportService');
const ApiResponse = require('../utils/apiResponse');

const getDashboard = async (req, res, next) => {
  try {
    const stats = await reportService.getDashboardStats();
    return ApiResponse.success(res, stats, 'Dashboard statistics retrieved');
  } catch (error) {
    next(error);
  }
};

const getCharts = async (req, res, next) => {
  try {
    const charts = await reportService.getChartAnalytics();
    return ApiResponse.success(res, charts, 'Analytics chart data retrieved');
  } catch (error) {
    next(error);
  }
};

const getManifest = async (req, res, next) => {
  try {
    const manifest = await reportService.getPassengerManifest(req.params.tripId);
    return ApiResponse.success(res, manifest, 'Passenger manifest generated');
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const logs = await reportService.getAuditLogs(req.query);
    return ApiResponse.success(res, logs, 'Audit logs retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboard,
  getCharts,
  getManifest,
  getAuditLogs
};

