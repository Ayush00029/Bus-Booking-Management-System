const tripService = require('../services/tripService');
const ApiResponse = require('../utils/apiResponse');

const createTrip = async (req, res, next) => {
  try {
    const trip = await tripService.createTrip(req.body, req.user, req.ip);
    return ApiResponse.created(res, trip, 'Trip scheduled successfully');
  } catch (error) {
    next(error);
  }
};

const getTrips = async (req, res, next) => {
  try {
    const result = await tripService.getAllTrips(req.query);
    return ApiResponse.success(res, result.trips, 'Trips retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getTripById = async (req, res, next) => {
  try {
    const clientToken = req.headers['x-client-token'] || req.query.clientToken || req.user?._id;
    const trip = await tripService.getTripById(req.params.id, clientToken);
    return ApiResponse.success(res, trip, 'Trip details retrieved');
  } catch (error) {
    next(error);
  }
};

const lockSeats = async (req, res, next) => {
  try {
    const clientToken = req.headers['x-client-token'] || req.body.clientToken || req.user?._id;
    const result = await tripService.lockSeats({
      tripId: req.params.id,
      seatNumbers: req.body.seatNumbers,
      lockedBy: clientToken,
      lockDurationMinutes: req.body.lockDurationMinutes || 10
    });
    return ApiResponse.success(res, result, 'Seats locked successfully');
  } catch (error) {
    next(error);
  }
};

const unlockSeats = async (req, res, next) => {
  try {
    const clientToken = req.headers['x-client-token'] || req.body.clientToken || req.user?._id;
    const result = await tripService.unlockSeats({
      tripId: req.params.id,
      seatNumbers: req.body.seatNumbers,
      lockedBy: clientToken
    });
    return ApiResponse.success(res, result, 'Seats released successfully');
  } catch (error) {
    next(error);
  }
};

const updateTrip = async (req, res, next) => {
  try {
    const trip = await tripService.updateTrip(req.params.id, req.body, req.user, req.ip);
    return ApiResponse.success(res, trip, 'Trip updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteTrip = async (req, res, next) => {
  try {
    await tripService.deleteTrip(req.params.id, req.user, req.ip);
    return ApiResponse.success(res, null, 'Trip deleted successfully');
  } catch (error) {
    next(error);
  }
};

const searchTrips = async (req, res, next) => {
  try {
    const result = await tripService.searchTrips(req.query);
    return ApiResponse.success(res, result, 'Search results retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTrip,
  getTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  searchTrips,
  lockSeats,
  unlockSeats
};

