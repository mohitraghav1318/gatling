const User = require('../models/user.model');
const PendingSignup = require('../models/pendingSignup.model');
const {
  normalizeEmail,
  hashPassword,
  comparePassword,
  buildAuthToken,
  createSafeUser,
} = require('../utils/auth.util');
const { generateOtp, hashOtp, compareOtp } = require('../utils/otp.util');
const { sendOtpEmail, MailDeliveryError } = require('../services/mail.service');
const { ensureUsernameForUser } = require('../utils/username.util');
const { sendSuccess, sendError } = require('../utils/response.util');

// Keep common HTTP codes centralized.
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  SERVICE_UNAVAILABLE: 503,
  INTERNAL_SERVER_ERROR: 500,
};

// Central OTP settings so changing policy is easy later.
const OTP_POLICY = {
  ttlMinutes: 10,
  maxAttempts: 5,
  resendCooldownSeconds: 60,
};

function getWaitSeconds(futureDate) {
  if (!futureDate) return 0;
  return Math.max(0, Math.ceil((futureDate.getTime() - Date.now()) / 1000));
}

// -----------------------------------------------------------------------------
// Signup Flow - Step 1
// User submits name + email, server sends signup OTP.
// -----------------------------------------------------------------------------
exports.startSignup = async (req, res) => {
  try {
    const { name, email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Name and email are required',
      );
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendError(
        res,
        HTTP_STATUS.CONFLICT,
        'Account already exists. Please login.',
      );
    }

    let pendingSignup = await PendingSignup.findOne({
      email: normalizedEmail,
    }).select('+signupOtpHash +signupOtpExpiresAt +signupOtpResendAvailableAt');

    if (!pendingSignup) {
      pendingSignup = new PendingSignup({
        name,
        email: normalizedEmail,
      });
    }

    const waitSeconds = getWaitSeconds(
      pendingSignup.signupOtpResendAvailableAt,
    );
    if (waitSeconds > 0) {
      return sendError(
        res,
        HTTP_STATUS.TOO_MANY_REQUESTS,
        `Please wait ${waitSeconds}s before requesting a new OTP`,
      );
    }

    const otp = generateOtp();
    pendingSignup.name = name;
    pendingSignup.signupOtpHash = hashOtp(otp);
    pendingSignup.signupOtpExpiresAt = new Date(
      Date.now() + OTP_POLICY.ttlMinutes * 60 * 1000,
    );
    pendingSignup.signupOtpAttempts = 0;
    pendingSignup.signupOtpResendAvailableAt = new Date(
      Date.now() + OTP_POLICY.resendCooldownSeconds * 1000,
    );
    pendingSignup.isOtpVerified = false;

    await pendingSignup.save();

    try {
      await sendOtpEmail({
        email: normalizedEmail,
        otp,
        purpose: 'signup_verification',
        ttlMinutes: OTP_POLICY.ttlMinutes,
      });
    } catch (error) {
      if (error instanceof MailDeliveryError) {
        console.error('[MAIL][SIGNUP][ERROR]', {
          message: error.message,
          cause: error.cause?.message,
          code: error.cause?.code,
          responseCode: error.cause?.responseCode,
        });

        // Clear OTP fields when mail fails so users do not get stuck with an unreachable OTP.
        pendingSignup.signupOtpHash = null;
        pendingSignup.signupOtpExpiresAt = null;
        pendingSignup.signupOtpAttempts = 0;
        pendingSignup.signupOtpResendAvailableAt = null;
        await pendingSignup.save();

        return sendError(
          res,
          HTTP_STATUS.SERVICE_UNAVAILABLE,
          'Unable to send OTP email right now. Please verify SMTP settings and try again.',
        );
      }

      throw error;
    }

    return sendSuccess(res, HTTP_STATUS.OK, 'OTP sent to your email');
  } catch (error) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to start signup flow',
    );
  }
};

// -----------------------------------------------------------------------------
// Signup Flow - Step 2
// User submits email + OTP to verify ownership.
// -----------------------------------------------------------------------------
exports.verifySignupOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !otp) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Email and OTP are required',
      );
    }

    const pendingSignup = await PendingSignup.findOne({
      email: normalizedEmail,
    }).select('+signupOtpHash +signupOtpExpiresAt +signupOtpAttempts');

    if (!pendingSignup) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Signup session not found. Start signup first.',
      );
    }

    if (pendingSignup.signupOtpAttempts >= OTP_POLICY.maxAttempts) {
      return sendError(
        res,
        HTTP_STATUS.TOO_MANY_REQUESTS,
        'Too many invalid OTP attempts. Please request a new OTP.',
      );
    }

    if (!pendingSignup.signupOtpHash || !pendingSignup.signupOtpExpiresAt) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'OTP not found. Request a new OTP.',
      );
    }

    if (Date.now() > pendingSignup.signupOtpExpiresAt.getTime()) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'OTP expired. Request a new OTP.',
      );
    }

    const isValidOtp = compareOtp(pendingSignup.signupOtpHash, otp);
    if (!isValidOtp) {
      pendingSignup.signupOtpAttempts += 1;
      await pendingSignup.save();
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid OTP');
    }

    pendingSignup.isOtpVerified = true;
    pendingSignup.signupOtpHash = null;
    pendingSignup.signupOtpExpiresAt = null;
    pendingSignup.signupOtpAttempts = 0;
    await pendingSignup.save();

    return sendSuccess(res, HTTP_STATUS.OK, 'Email verified successfully');
  } catch (error) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to verify OTP',
    );
  }
};

// -----------------------------------------------------------------------------
// Signup Flow - Step 3
// After OTP verification, user sets password and account is created.
// -----------------------------------------------------------------------------
exports.completeSignup = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password || !confirmPassword) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Email, password and confirmPassword are required',
      );
    }

    if (password !== confirmPassword) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Password and confirm password do not match',
      );
    }

    if (String(password).length < 8) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Password must be at least 8 characters long',
      );
    }

    const pendingSignup = await PendingSignup.findOne({
      email: normalizedEmail,
    });
    if (!pendingSignup) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Signup session not found. Start signup first.',
      );
    }

    if (!pendingSignup.isOtpVerified) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Please verify your email OTP first',
      );
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return sendError(
        res,
        HTTP_STATUS.CONFLICT,
        'Account already exists. Please login.',
      );
    }

    const passwordHash = await hashPassword(password);

    const user = await User.create({
      name: pendingSignup.name,
      email: normalizedEmail,
      password: passwordHash,
      isEmailVerified: true,
    });

    // Ensure each user gets a unique dashboard username route key.
    await ensureUsernameForUser(user);

    await PendingSignup.deleteOne({ _id: pendingSignup._id });

    const token = buildAuthToken(user);

    return sendSuccess(
      res,
      HTTP_STATUS.CREATED,
      'Account created successfully',
      {
        token,
        user: createSafeUser(user),
      },
    );
  } catch (error) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to complete signup',
    );
  }
};

// -----------------------------------------------------------------------------
// Login with Password
// -----------------------------------------------------------------------------
exports.loginWithPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Email and password are required',
      );
    }

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+password',
    );
    if (!user) {
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'Invalid email or password',
      );
    }

    const isPasswordCorrect = await comparePassword(password, user.password);
    if (!isPasswordCorrect) {
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'Invalid email or password',
      );
    }

    // Backfill username for older accounts created before username support.
    await ensureUsernameForUser(user);

    const token = buildAuthToken(user);
    return sendSuccess(res, HTTP_STATUS.OK, 'Login successful', {
      token,
      user: createSafeUser(user),
    });
  } catch (error) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to login with password',
    );
  }
};

// -----------------------------------------------------------------------------
// Login with OTP - Step 1
// User requests OTP using email.
// -----------------------------------------------------------------------------
exports.requestLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Email is required');
    }

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+loginOtpHash +loginOtpExpiresAt +loginOtpAttempts +loginOtpResendAvailableAt',
    );

    if (!user) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        'No account found with this email',
      );
    }

    const waitSeconds = getWaitSeconds(user.loginOtpResendAvailableAt);
    if (waitSeconds > 0) {
      return sendError(
        res,
        HTTP_STATUS.TOO_MANY_REQUESTS,
        `Please wait ${waitSeconds}s before requesting a new OTP`,
      );
    }

    const otp = generateOtp();
    user.loginOtpHash = hashOtp(otp);
    user.loginOtpExpiresAt = new Date(
      Date.now() + OTP_POLICY.ttlMinutes * 60 * 1000,
    );
    user.loginOtpAttempts = 0;
    user.loginOtpResendAvailableAt = new Date(
      Date.now() + OTP_POLICY.resendCooldownSeconds * 1000,
    );
    await user.save();

    try {
      await sendOtpEmail({
        email: normalizedEmail,
        otp,
        purpose: 'login',
        ttlMinutes: OTP_POLICY.ttlMinutes,
      });
    } catch (error) {
      if (error instanceof MailDeliveryError) {
        console.error('[MAIL][LOGIN_OTP][ERROR]', {
          message: error.message,
          cause: error.cause?.message,
          code: error.cause?.code,
          responseCode: error.cause?.responseCode,
        });

        // Remove generated OTP state if email delivery fails.
        user.loginOtpHash = null;
        user.loginOtpExpiresAt = null;
        user.loginOtpAttempts = 0;
        user.loginOtpResendAvailableAt = null;
        await user.save();

        return sendError(
          res,
          HTTP_STATUS.SERVICE_UNAVAILABLE,
          'Unable to send OTP email right now. Please verify SMTP settings and try again.',
        );
      }

      throw error;
    }

    return sendSuccess(res, HTTP_STATUS.OK, 'Login OTP sent to your email');
  } catch (error) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to request login OTP',
    );
  }
};

// -----------------------------------------------------------------------------
// Login with OTP - Step 2
// User submits email + OTP, server validates and returns JWT.
// -----------------------------------------------------------------------------
exports.verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !otp) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Email and OTP are required',
      );
    }

    const user = await User.findOne({ email: normalizedEmail }).select(
      '+loginOtpHash +loginOtpExpiresAt +loginOtpAttempts +loginOtpResendAvailableAt',
    );

    if (!user) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        'No account found with this email',
      );
    }

    if (user.loginOtpAttempts >= OTP_POLICY.maxAttempts) {
      return sendError(
        res,
        HTTP_STATUS.TOO_MANY_REQUESTS,
        'Too many invalid OTP attempts. Please request a new OTP.',
      );
    }

    if (!user.loginOtpHash || !user.loginOtpExpiresAt) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'OTP not found. Request a new OTP.',
      );
    }

    if (Date.now() > user.loginOtpExpiresAt.getTime()) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'OTP expired. Request a new OTP.',
      );
    }

    const isValidOtp = compareOtp(user.loginOtpHash, otp);
    if (!isValidOtp) {
      user.loginOtpAttempts += 1;
      await user.save();
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid OTP');
    }

    user.loginOtpHash = null;
    user.loginOtpExpiresAt = null;
    user.loginOtpAttempts = 0;
    user.loginOtpResendAvailableAt = null;
    await ensureUsernameForUser(user);
    await user.save();

    const token = buildAuthToken(user);
    return sendSuccess(res, HTTP_STATUS.OK, 'Login successful', {
      token,
      user: createSafeUser(user),
    });
  } catch (error) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to verify login OTP',
    );
  }
};

// Backward-compatible aliases if old frontend still uses /register and /login.
exports.register = exports.startSignup;
exports.login = exports.loginWithPassword;
