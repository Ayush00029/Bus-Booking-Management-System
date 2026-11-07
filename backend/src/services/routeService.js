const Route = require('../models/Route');
const { logAuditEvent } = require('./auditService');

const createRoute = async (data, user, ipAddress) => {
  const route = await Route.create({
    ...data,
    sourceCity: data.sourceCity.trim(),
    destinationCity: data.destinationCity.trim()
  });

  await logAuditEvent({
    userId: user?._id,
    userRole: user?.role,
    action: 'ROUTE_CREATE',
    entityType: 'Route',
    entityId: route._id,
    details: {
      sourceCity: route.sourceCity,
      destinationCity: route.destinationCity,
      distanceKm: route.distanceKm
    },
    ipAddress
  });

  return route;
};

const getAllRoutes = async (query = {}) => {
  const filter = {};
  if (query.sourceCity) filter.sourceCity = new RegExp(query.sourceCity, 'i');
  if (query.destinationCity) filter.destinationCity = new RegExp(query.destinationCity, 'i');
  if (query.isActive !== undefined) filter.isActive = query.isActive === 'true' || query.isActive === true;

  return Route.find(filter).sort({ sourceCity: 1, destinationCity: 1 });
};

const getRouteById = async (id) => {
  const route = await Route.findById(id);
  if (!route) {
    const error = new Error('Route not found');
    error.statusCode = 404;
    throw error;
  }
  return route;
};

const updateRoute = async (id, data, user, ipAddress) => {
  const route = await Route.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true
  });

  if (!route) {
    const error = new Error('Route not found');
    error.statusCode = 404;
    throw error;
  }

  await logAuditEvent({
    userId: user?._id,
    userRole: user?.role,
    action: 'ROUTE_UPDATE',
    entityType: 'Route',
    entityId: route._id,
    details: data,
    ipAddress
  });

  return route;
};

const deleteRoute = async (id, user, ipAddress) => {
  const route = await Route.findByIdAndDelete(id);
  if (!route) {
    const error = new Error('Route not found');
    error.statusCode = 404;
    throw error;
  }

  await logAuditEvent({
    userId: user?._id,
    userRole: user?.role,
    action: 'ROUTE_DELETE',
    entityType: 'Route',
    entityId: id,
    details: { sourceCity: route.sourceCity, destinationCity: route.destinationCity },
    ipAddress
  });

  return route;
};

const getDistinctCities = async () => {
  const [origins, destinations] = await Promise.all([
    Route.distinct('sourceCity', { isActive: true }),
    Route.distinct('destinationCity', { isActive: true })
  ]);

  const allCities = Array.from(new Set([...origins, ...destinations])).sort();

  return {
    origins: origins.sort(),
    destinations: destinations.sort(),
    allCities
  };
};

module.exports = {
  createRoute,
  getAllRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  getDistinctCities
};

