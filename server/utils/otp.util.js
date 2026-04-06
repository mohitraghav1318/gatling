const crypto = require('crypto');

function generateOtp() {
  // Generates a 6-digit OTP (100000 to 999999).
  return String(crypto.randomInt(100000, 1000000));
}

function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function compareOtp(storedOtpHash, incomingOtp) {
  const incomingHash = hashOtp(incomingOtp);

  try {
    return crypto.timingSafeEqual(
      Buffer.from(storedOtpHash, 'hex'),
      Buffer.from(incomingHash, 'hex'),
    );
  } catch (_error) {
    return false;
  }
}

module.exports = {
  generateOtp,
  hashOtp,
  compareOtp,
};
