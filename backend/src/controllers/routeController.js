const routeService = require('../services/routeService');
const ApiResponse = require('../utils/apiResponse');

const createRoute = async (req, res, next) => {
  try {
    const route = await routeService.createRoute(req.body, req.user, req.ip);
    return ApiResponse.created(res, route, 'Route created successfully');
  } catch (error) {
    next(error);
  }
};

const getRoutes = async (req, res, next) => {
  try {
    const routes = await routeService.getAllRoutes(req.query);
    return ApiResponse.success(res, routes, 'Routes retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getRouteById = async (req, res, next) => {
  try {
    const route = await routeService.getRouteById(req.params.id);
    return ApiResponse.success(res, route);
  } catch (error) {
    next(error);
  }
};

const updateRoute = async (req, res, next) => {
  try {
    const route = await routeService.updateRoute(req.params.id, req.body, req.user, req.ip);
    return ApiResponse.success(res, route, 'Route updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteRoute = async (req, res, next) => {
  try {
    await routeService.deleteRoute(req.params.id, req.user, req.ip);
    return ApiResponse.success(res, null, 'Route deleted successfully');
  } catch (error) {
    next(error);
  }
};

const getCities = async (req, res, next) => {
  try {
    const cities = await routeService.getDistinctCities();
    return ApiResponse.success(res, cities, 'Cities retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRoute,
  getRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  getCities
};

