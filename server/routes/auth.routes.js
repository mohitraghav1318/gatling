const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');

// Signup flow (email OTP first, password second).
router.post('/signup/start', authController.startSignup);
router.post('/signup/verify-otp', authController.verifySignupOtp);
router.post('/signup/complete', authController.completeSignup);

// Login options.
router.post('/login/password', authController.loginWithPassword);
router.post('/login/otp/request', authController.requestLoginOtp);
router.post('/login/otp/verify', authController.verifyLoginOtp);


module.exports = router;
