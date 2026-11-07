const busService = require('../services/busService');
const ApiResponse = require('../utils/apiResponse');

// Operator Handlers
const createOperator = async (req, res, next) => {
  try {
    const operator = await busService.createOperator(req.body, req.user, req.ip);
    return ApiResponse.created(res, operator, 'Operator created successfully');
  } catch (error) {
    next(error);
  }
};

const getOperators = async (req, res, next) => {
  try {
    const operators = await busService.getAllOperators();
    return ApiResponse.success(res, operators, 'Operators retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getOperatorById = async (req, res, next) => {
  try {
    const operator = await busService.getOperatorById(req.params.id);
    return ApiResponse.success(res, operator);
  } catch (error) {
    next(error);
  }
};

const updateOperator = async (req, res, next) => {
  try {
    const operator = await busService.updateOperator(req.params.id, req.body, req.user, req.ip);
    return ApiResponse.success(res, operator, 'Operator updated successfully');
  } catch (error) {
    next(error);
  }
};

// Bus Handlers
const createBus = async (req, res, next) => {
  try {
    const bus = await busService.createBus(req.body, req.user, req.ip);
    return ApiResponse.created(res, bus, 'Bus created successfully');
  } catch (error) {
    next(error);
  }
};

const getBuses = async (req, res, next) => {
  try {
    const buses = await busService.getAllBuses(req.query);
    return ApiResponse.success(res, buses, 'Buses retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getBusById = async (req, res, next) => {
  try {
    const bus = await busService.getBusById(req.params.id);
    return ApiResponse.success(res, bus);
  } catch (error) {
    next(error);
  }
};

const updateBus = async (req, res, next) => {
  try {
    const bus = await busService.updateBus(req.params.id, req.body, req.user, req.ip);
    return ApiResponse.success(res, bus, 'Bus updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteBus = async (req, res, next) => {
  try {
    await busService.deleteBus(req.params.id, req.user, req.ip);
    return ApiResponse.success(res, null, 'Bus deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOperator,
  getOperators,
  getOperatorById,
  updateOperator,
  createBus,
  getBuses,
  getBusById,
  updateBus,
  deleteBus
};

