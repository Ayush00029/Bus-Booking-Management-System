const authService = require('../services/authService');
const ApiResponse = require('../utils/apiResponse');

const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, adminSecret } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    const result = await authService.registerUser({
      name,
      email,
      password,
      phone,
      role,
      adminSecret,
      ipAddress
    });

    return ApiResponse.created(res, result, 'Registration successful');
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    const result = await authService.loginUser({
      email,
      password,
      ipAddress
    });

    return ApiResponse.success(res, result, 'Login successful');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const profile = await authService.getCurrentUser(req.user._id);
    return ApiResponse.success(res, profile, 'User profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  // In JWT stateless architecture, client discards token
  return ApiResponse.success(res, null, 'Logged out successfully');
};

module.exports = {
  register,
  login,
  getMe,
  logout
};

