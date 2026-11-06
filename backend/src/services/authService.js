const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logAuditEvent } = require('./auditService');

/**
 * Generate signed JWT for authenticated user
 */
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'algions_bus_booking_jwt_secret_key_prod_safe_2026';
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    secret,
    { expiresIn }
  );
};

/**
 * Register a new user (passenger or admin with secret)
 */
const registerUser = async ({
  name,
  email,
  password,
  phone,
  role = 'passenger',
  adminSecret = '',
  ipAddress = ''
}) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if user already exists
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error('An account with this email address already exists');
    error.statusCode = 409;
    throw error;
  }

  // Security constraint: Prevent unauthenticated privilege escalation.
  // Admin role can only be assigned with matching admin secret key.
  const expectedAdminSecret = process.env.ADMIN_REGISTRATION_SECRET || 'algions_admin_secret_key_2026';
  let validRole = 'passenger';
  if (role === 'admin') {
    if (adminSecret && adminSecret === expectedAdminSecret) {
      validRole = 'admin';
    } else {
      // Default to passenger if secret does not match or is omitted
      validRole = 'passenger';
    }
  }

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password,
    phone: phone ? phone.trim() : '',
    role: validRole
  });

  const token = generateToken(user);

  await logAuditEvent({
    userId: user._id,
    userRole: user.role,
    action: 'AUTH_REGISTER',
    entityType: 'User',
    entityId: user._id,
    details: { name: user.name, email: user.email, role: user.role },
    ipAddress
  });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt
    },
    token
  };
};

/**
 * Authenticate existing user with email and password
 */
const loginUser = async ({ email, password, ipAddress = '' }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Find user and explicitly include password field
  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Compare hashed password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);

  await logAuditEvent({
    userId: user._id,
    userRole: user.role,
    action: 'AUTH_LOGIN',
    entityType: 'User',
    entityId: user._id,
    details: { email: user.email, role: user.role },
    ipAddress
  });

  return {
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      createdAt: user.createdAt
    },
    token
  };
};

/**
 * Fetch profile of current user by id
 */
const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User profile not found');
    error.statusCode = 404;
    throw error;
  }
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    createdAt: user.createdAt
  };
};

module.exports = {
  generateToken,
  registerUser,
  loginUser,
  getCurrentUser
};

