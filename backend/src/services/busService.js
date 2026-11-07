const BusOperator = require('../models/BusOperator');
const Bus = require('../models/Bus');
const { logAuditEvent } = require('./auditService');

/**
 * Generate standard seat configuration based on bus layout and total seat count
 */
const generateSeatConfiguration = (layoutType, totalSeats) => {
  const seats = [];

  if (layoutType === '2+1_sleeper') {
    // Sleeper bus: Lower & Upper decks, 2 berths on left, 1 on right
    const seatsPerDeck = Math.ceil(totalSeats / 2);
    const rowsPerDeck = Math.ceil(seatsPerDeck / 3);

    let count = 0;
    // Lower deck
    for (let r = 1; r <= rowsPerDeck && count < seatsPerDeck; r++) {
      // Left window
      count++;
      seats.push({
        seatNumber: `L${count}`,
        deck: 'lower',
        row: r,
        column: 1,
        seatType: 'sleeper',
        isWindow: true,
        basePriceMultiplier: 1.05
      });
      if (count >= seatsPerDeck) break;

      // Left aisle
      count++;
      seats.push({
        seatNumber: `L${count}`,
        deck: 'lower',
        row: r,
        column: 2,
        seatType: 'sleeper',
        isWindow: false,
        basePriceMultiplier: 1.0
      });
      if (count >= seatsPerDeck) break;

      // Right single window
      count++;
      seats.push({
        seatNumber: `L${count}`,
        deck: 'lower',
        row: r,
        column: 4,
        seatType: 'sleeper',
        isWindow: true,
        basePriceMultiplier: 1.15 // Single sleeper premium
      });
    }

    // Upper deck
    let upperCount = 0;
    for (let r = 1; r <= rowsPerDeck && upperCount < (totalSeats - seatsPerDeck); r++) {
      upperCount++;
      seats.push({
        seatNumber: `U${upperCount}`,
        deck: 'upper',
        row: r,
        column: 1,
        seatType: 'sleeper',
        isWindow: true,
        basePriceMultiplier: 1.05
      });
      if (upperCount >= (totalSeats - seatsPerDeck)) break;

      upperCount++;
      seats.push({
        seatNumber: `U${upperCount}`,
        deck: 'upper',
        row: r,
        column: 2,
        seatType: 'sleeper',
        isWindow: false,
        basePriceMultiplier: 1.0
      });
      if (upperCount >= (totalSeats - seatsPerDeck)) break;

      upperCount++;
      seats.push({
        seatNumber: `U${upperCount}`,
        deck: 'upper',
        row: r,
        column: 4,
        seatType: 'sleeper',
        isWindow: true,
        basePriceMultiplier: 1.15
      });
    }
  } else {
    // 2+2 Seater: 4 seats per row (Cols 1,2 aisle Cols 3,4)
    const rows = Math.ceil(totalSeats / 4);
    let count = 0;

    for (let r = 1; r <= rows && count < totalSeats; r++) {
      const colLabels = ['A', 'B', 'C', 'D'];
      const colIndices = [1, 2, 3, 4];

      for (let c = 0; c < 4 && count < totalSeats; c++) {
        count++;
        const isWindow = c === 0 || c === 3;
        seats.push({
          seatNumber: `${r}${colLabels[c]}`,
          deck: 'lower',
          row: r,
          column: colIndices[c],
          seatType: 'seater',
          isWindow,
          basePriceMultiplier: isWindow ? 1.05 : 1.0
        });
      }
    }
  }

  return seats;
};

// Operator Services
const createOperator = async (data, user, ipAddress) => {
  const existing = await BusOperator.findOne({ code: data.code.toUpperCase() });
  if (existing) {
    const error = new Error(`Operator with code '${data.code}' already exists`);
    error.statusCode = 409;
    throw error;
  }

  const operator = await BusOperator.create(data);

  await logAuditEvent({
    userId: user?._id,
    userRole: user?.role,
    action: 'OPERATOR_CREATE',
    entityType: 'BusOperator',
    entityId: operator._id,
    details: { name: operator.name, code: operator.code },
    ipAddress
  });

  return operator;
};

const getAllOperators = async () => {
  return BusOperator.find().sort({ name: 1 });
};

const getOperatorById = async (id) => {
  const operator = await BusOperator.findById(id);
  if (!operator) {
    const error = new Error('Bus operator not found');
    error.statusCode = 404;
    throw error;
  }
  return operator;
};

const updateOperator = async (id, data, user, ipAddress) => {
  const operator = await BusOperator.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  });
  if (!operator) {
    const error = new Error('Bus operator not found');
    error.statusCode = 404;
    throw error;
  }

  await logAuditEvent({
    userId: user?._id,
    userRole: user?.role,
    action: 'OPERATOR_UPDATE',
    entityType: 'BusOperator',
    entityId: operator._id,
    details: data,
    ipAddress
  });

  return operator;
};

// Bus Services
const createBus = async (data, user, ipAddress) => {
  const normalizedBusNumber = data.busNumber.toUpperCase().trim();
  const existing = await Bus.findOne({ busNumber: normalizedBusNumber });
  if (existing) {
    const error = new Error(`Bus with registration '${normalizedBusNumber}' already exists`);
    error.statusCode = 409;
    throw error;
  }

  const operator = await BusOperator.findById(data.operator);
  if (!operator) {
    const error = new Error('Specified bus operator does not exist');
    error.statusCode = 400;
    throw error;
  }

  // Auto-generate seat configuration if not explicitly provided
  let seatConfig = data.seatConfiguration;
  if (!seatConfig || seatConfig.length === 0) {
    seatConfig = generateSeatConfiguration(data.layoutType, data.totalSeats);
  }

  const bus = await Bus.create({
    ...data,
    busNumber: normalizedBusNumber,
    seatConfiguration: seatConfig
  });

  await logAuditEvent({
    userId: user?._id,
    userRole: user?.role,
    action: 'BUS_CREATE',
    entityType: 'Bus',
    entityId: bus._id,
    details: { busNumber: bus.busNumber, busType: bus.busType, totalSeats: bus.totalSeats },
    ipAddress
  });

  return bus.populate('operator');
};

const getAllBuses = async (query = {}) => {
  const filter = {};
  if (query.operator) filter.operator = query.operator;
  if (query.status) filter.status = query.status;
  if (query.busType) filter.busType = query.busType;

  return Bus.find(filter).populate('operator').sort({ createdAt: -1 });
};

const getBusById = async (id) => {
  const bus = await Bus.findById(id).populate('operator');
  if (!bus) {
    const error = new Error('Bus not found');
    error.statusCode = 404;
    throw error;
  }
  return bus;
};

const updateBus = async (id, data, user, ipAddress) => {
  if (data.busNumber) {
    data.busNumber = data.busNumber.toUpperCase().trim();
  }

  // If totalSeats or layoutType changes and seatConfiguration is not supplied, re-generate layout
  if ((data.totalSeats || data.layoutType) && !data.seatConfiguration) {
    const currentBus = await Bus.findById(id);
    if (currentBus) {
      const layout = data.layoutType || currentBus.layoutType;
      const total = data.totalSeats || currentBus.totalSeats;
      data.seatConfiguration = generateSeatConfiguration(layout, total);
    }
  }

  const bus = await Bus.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  }).populate('operator');

  if (!bus) {
    const error = new Error('Bus not found');
    error.statusCode = 404;
    throw error;
  }

  await logAuditEvent({
    userId: user?._id,
    userRole: user?.role,
    action: 'BUS_UPDATE',
    entityType: 'Bus',
    entityId: bus._id,
    details: data,
    ipAddress
  });

  return bus;
};

const deleteBus = async (id, user, ipAddress) => {
  const bus = await Bus.findByIdAndDelete(id);
  if (!bus) {
    const error = new Error('Bus not found');
    error.statusCode = 404;
    throw error;
  }

  await logAuditEvent({
    userId: user?._id,
    userRole: user?.role,
    action: 'BUS_DELETE',
    entityType: 'Bus',
    entityId: id,
    details: { busNumber: bus.busNumber },
    ipAddress
  });

  return bus;
};

module.exports = {
  generateSeatConfiguration,
  createOperator,
  getAllOperators,
  getOperatorById,
  updateOperator,
  createBus,
  getAllBuses,
  getBusById,
  updateBus,
  deleteBus
};

