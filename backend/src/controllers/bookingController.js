const bookingService = require('../services/bookingService');
const ApiResponse = require('../utils/apiResponse');

const createBooking = async (req, res, next) => {
  try {
    const {
      tripId,
      passengers,
      boardingPoint,
      droppingPoint,
      contactEmail,
      contactPhone
    } = req.body;

    const booking = await bookingService.createBooking({
      userId: req.user._id,
      tripId,
      passengers,
      boardingPoint,
      droppingPoint,
      contactEmail,
      contactPhone,
      ipAddress: req.ip
    });

    return ApiResponse.created(res, booking, 'Booking confirmed successfully');
  } catch (error) {
    next(error);
  }
};

const lookupTicket = async (req, res, next) => {
  try {
    const { pnr, contact } = req.query;
    if (!pnr) {
      return ApiResponse.badRequest(res, 'PNR is required for ticket lookup');
    }
    const booking = await bookingService.lookupTicket(pnr, contact);
    return ApiResponse.success(res, booking, 'Ticket retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getMyBookings = async (req, res, next) => {
  try {
    const bookings = await bookingService.getUserBookings(req.user._id, req.query);
    return ApiResponse.success(res, bookings, 'Bookings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getBookingByPnr = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingByPnr(req.params.pnr, req.user);
    return ApiResponse.success(res, booking, 'Booking retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getBookingById = async (req, res, next) => {
  try {
    const booking = await bookingService.getBookingById(req.params.id, req.user);
    return ApiResponse.success(res, booking, 'Booking retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const cancelBooking = async (req, res, next) => {
  try {
    const { cancellationReason } = req.body;
    const cancelledBooking = await bookingService.cancelBooking(
      req.params.id,
      req.user,
      { cancellationReason },
      req.ip
    );

    return ApiResponse.success(res, cancelledBooking, 'Booking cancelled and refund processed');
  } catch (error) {
    next(error);
  }
};

const getAllBookings = async (req, res, next) => {
  try {
    const result = await bookingService.getAllBookings(req.query);
    return ApiResponse.success(res, result, 'All bookings retrieved successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  lookupTicket,
  getMyBookings,
  getBookingByPnr,
  getBookingById,
  cancelBooking,
  getAllBookings
};

