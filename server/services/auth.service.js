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

class AuthServiceError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// -----------------------------------------------------------------------------
// Signup Flow - Step 1
// -----------------------------------------------------------------------------
exports.startSignup = async ({ name, email }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!name || !normalizedEmail) {
    throw new AuthServiceError(
      HTTP_STATUS.BAD_REQUEST,
      'Name and email are required',
    );
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AuthServiceError(
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

  const waitSeconds = getWaitSeconds(pendingSignup.signupOtpResendAvailableAt);
  if (waitSeconds > 0) {
    throw new AuthServiceError(
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

      pendingSignup.signupOtpHash = null;
      pendingSignup.signupOtpExpiresAt = null;
      pendingSignup.signupOtpAttempts = 0;
      pendingSignup.signupOtpResendAvailableAt = null;
      await pendingSignup.save();

      throw new AuthServiceError(
        HTTP_STATUS.SERVICE_UNAVAILABLE,
        'Unable to send OTP email right now. Please verify SMTP settings and try again.',
      );
    }
    throw error;
  }

  return { message: 'OTP sent to your email' };
};

// -----------------------------------------------------------------------------
// Signup Flow - Step 2
// -----------------------------------------------------------------------------
exports.verifySignupOtp = async ({ email, otp }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !otp) {
    throw new AuthServiceError(
      HTTP_STATUS.BAD_REQUEST,
      'Email and OTP are required',
    );
  }

  const pendingSignup = await PendingSignup.findOne({
    email: normalizedEmail,
  }).select('+signupOtpHash +signupOtpExpiresAt +signupOtpAttempts');

  if (!pendingSignup) {
    throw new AuthServiceError(
      HTTP_STATUS.NOT_FOUND,
      'Signup session not found. Start signup first.',
    );
  }

  if (pendingSignup.signupOtpAttempts >= OTP_POLICY.maxAttempts) {
    throw new AuthServiceError(
      HTTP_STATUS.TOO_MANY_REQUESTS,
      'Too many invalid OTP attempts. Please request a new OTP.',
    );
  }

  if (!pendingSignup.signupOtpHash || !pendingSignup.signupOtpExpiresAt) {
    throw new AuthServiceError(
      HTTP_STATUS.BAD_REQUEST,
      'OTP not found. Request a new OTP.',
    );
  }

  if (Date.now() > pendingSignup.signupOtpExpiresAt.getTime()) {
    throw new AuthServiceError(
      HTTP_STATUS.BAD_REQUEST,
      'OTP expired. Request a new OTP.',
    );
  }

  const isValidOtp = compareOtp(pendingSignup.signupOtpHash, otp);
  if (!isValidOtp) {
    pendingSignup.signupOtpAttempts += 1;
    await pendingSignup.save();
    throw new AuthServiceError(HTTP_STATUS.BAD_REQUEST, 'Invalid OTP');
  }

  pendingSignup.isOtpVerified = true;
  pendingSignup.signupOtpHash = null;
  pendingSignup.signupOtpExpiresAt = null;
  pendingSignup.signupOtpAttempts = 0;
  await pendingSignup.save();

  return { message: 'Email verified successfully' };
};

// -----------------------------------------------------------------------------
// Signup Flow - Step 3
// -----------------------------------------------------------------------------
exports.completeSignup = async ({ email, password, confirmPassword }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password || !confirmPassword) {
    throw new AuthServiceError(
      HTTP_STATUS.BAD_REQUEST,
      'Email, password and confirmPassword are required',
    );
  }

  if (password !== confirmPassword) {
    throw new AuthServiceError(
      HTTP_STATUS.BAD_REQUEST,
      'Password and confirm password do not match',
    );
  }

  if (String(password).length < 8) {
    throw new AuthServiceError(
      HTTP_STATUS.BAD_REQUEST,
      'Password must be at least 8 characters long',
    );
  }

  const pendingSignup = await PendingSignup.findOne({ email: normalizedEmail });
  if (!pendingSignup) {
    throw new AuthServiceError(
      HTTP_STATUS.NOT_FOUND,
      'Signup session not found. Start signup first.',
    );
  }

  if (!pendingSignup.isOtpVerified) {
    throw new AuthServiceError(
      HTTP_STATUS.BAD_REQUEST,
      'Please verify your email OTP first',
    );
  }

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new AuthServiceError(
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

  await ensureUsernameForUser(user);
  await PendingSignup.deleteOne({ _id: pendingSignup._id });

  const token = buildAuthToken(user);

  return {
    message: 'Account created successfully',
    data: { token, user: createSafeUser(user) },
    status: HTTP_STATUS.CREATED,
  };
};

// -----------------------------------------------------------------------------
// Login with Password
// -----------------------------------------------------------------------------
exports.loginWithPassword = async ({ email, password }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !password) {
    throw new AuthServiceError(
      HTTP_STATUS.BAD_REQUEST,
      'Email and password are required',
    );
  }

  const user = await User.findOne({ email: normalizedEmail }).select(
    '+password',
  );
  if (!user) {
    throw new AuthServiceError(
      HTTP_STATUS.UNAUTHORIZED,
      'Invalid email or password',
    );
  }

  const isPasswordCorrect = await comparePassword(password, user.password);
  if (!isPasswordCorrect) {
    throw new AuthServiceError(
      HTTP_STATUS.UNAUTHORIZED,
      'Invalid email or password',
    );
  }

  await ensureUsernameForUser(user);

  const token = buildAuthToken(user);
  return {
    message: 'Login successful',
    data: { token, user: createSafeUser(user) },
  };
};

// -----------------------------------------------------------------------------
// Login with OTP - Step 1
// -----------------------------------------------------------------------------
exports.requestLoginOtp = async ({ email }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    throw new AuthServiceError(HTTP_STATUS.BAD_REQUEST, 'Email is required');
  }

  const user = await User.findOne({ email: normalizedEmail }).select(
    '+loginOtpHash +loginOtpExpiresAt +loginOtpAttempts +loginOtpResendAvailableAt',
  );

  if (!user) {
    throw new AuthServiceError(
      HTTP_STATUS.NOT_FOUND,
      'No account found with this email',
    );
  }

  const waitSeconds = getWaitSeconds(user.loginOtpResendAvailableAt);
  if (waitSeconds > 0) {
    throw new AuthServiceError(
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

      user.loginOtpHash = null;
      user.loginOtpExpiresAt = null;
      user.loginOtpAttempts = 0;
      user.loginOtpResendAvailableAt = null;
      await user.save();

      throw new AuthServiceError(
        HTTP_STATUS.SERVICE_UNAVAILABLE,
        'Unable to send OTP email right now. Please verify SMTP settings and try again.',
      );
    }
    throw error;
  }

  return { message: 'Login OTP sent to your email' };
};

// -----------------------------------------------------------------------------
// Login with OTP - Step 2
// -----------------------------------------------------------------------------
exports.verifyLoginOtp = async ({ email, otp }) => {
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail || !otp) {
    throw new AuthServiceError(
      HTTP_STATUS.BAD_REQUEST,
      'Email and OTP are required',
    );
  }

  const user = await User.findOne({ email: normalizedEmail }).select(
    '+loginOtpHash +loginOtpExpiresAt +loginOtpAttempts +loginOtpResendAvailableAt',
  );

  if (!user) {
    throw new AuthServiceError(
      HTTP_STATUS.NOT_FOUND,
      'No account found with this email',
    );
  }

  if (user.loginOtpAttempts >= OTP_POLICY.maxAttempts) {
    throw new AuthServiceError(
      HTTP_STATUS.TOO_MANY_REQUESTS,
      'Too many invalid OTP attempts. Please request a new OTP.',
    );
  }

  if (!user.loginOtpHash || !user.loginOtpExpiresAt) {
    throw new AuthServiceError(
      HTTP_STATUS.BAD_REQUEST,
      'OTP not found. Request a new OTP.',
    );
  }

  if (Date.now() > user.loginOtpExpiresAt.getTime()) {
    throw new AuthServiceError(
      HTTP_STATUS.BAD_REQUEST,
      'OTP expired. Request a new OTP.',
    );
  }

  const isValidOtp = compareOtp(user.loginOtpHash, otp);
  if (!isValidOtp) {
    user.loginOtpAttempts += 1;
    await user.save();
    throw new AuthServiceError(HTTP_STATUS.BAD_REQUEST, 'Invalid OTP');
  }

  user.loginOtpHash = null;
  user.loginOtpExpiresAt = null;
  user.loginOtpAttempts = 0;
  user.loginOtpResendAvailableAt = null;
  await ensureUsernameForUser(user);
  await user.save();

  const token = buildAuthToken(user);
  return {
    message: 'Login successful',
    data: { token, user: createSafeUser(user) },
  };
};

module.exports.AuthServiceError = AuthServiceError;
