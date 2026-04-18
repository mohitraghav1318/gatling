const authService = require('../services/auth.service');
const { sendSuccess, sendError } = require('../utils/response.util');

const handleServiceResponse = (res, result, defaultStatus = 200) => {
  const status = result.status || defaultStatus;
  return sendSuccess(res, status, result.message, result.data);
};

const handleServiceError = (res, error) => {
  if (error instanceof authService.AuthServiceError) {
    return sendError(res, error.status, error.message);
  }
  console.error('[AUTH_CONTROLLER_ERROR]', error);
  return sendError(res, 500, 'Internal server error');
};

exports.startSignup = async (req, res) => {
  try {
    const result = await authService.startSignup(req.body);
    return handleServiceResponse(res, result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

exports.verifySignupOtp = async (req, res) => {
  try {
    const result = await authService.verifySignupOtp(req.body);
    return handleServiceResponse(res, result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

exports.completeSignup = async (req, res) => {
  try {
    const result = await authService.completeSignup(req.body);
    return handleServiceResponse(res, result, 201);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

exports.loginWithPassword = async (req, res) => {
  try {
    const result = await authService.loginWithPassword(req.body);
    return handleServiceResponse(res, result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

exports.requestLoginOtp = async (req, res) => {
  try {
    const result = await authService.requestLoginOtp(req.body);
    return handleServiceResponse(res, result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

exports.verifyLoginOtp = async (req, res) => {
  try {
    const result = await authService.verifyLoginOtp(req.body);
    return handleServiceResponse(res, result);
  } catch (error) {
    return handleServiceError(res, error);
  }
};

// Backward-compatible aliases
exports.register = exports.startSignup;
exports.login = exports.loginWithPassword;
