const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

function getJwtSecret() {
  return process.env.JWT_SECRET || 'dev-only-secret-change-in-production';
}

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token is required',
      });
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token is required',
      });
    }

    let payload;
    try {
      payload = jwt.verify(token, getJwtSecret());
    } catch (_error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authorization token',
      });
    }

    const authUser = await User.findById(payload.sub).select(
      '_id name email username isEmailVerified',
    );

    if (!authUser) {
      return res.status(401).json({
        success: false,
        message: 'Account no longer exists. Please login again.',
      });
    }

    req.authUser = authUser;
    req.authUserId = authUser._id;
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication middleware failed',
    });
  }
}

module.exports = {
  requireAuth,
};
