const nodemailer = require('nodemailer');

let transporter = null;
let transporterReadyPromise = null;

class MailDeliveryError extends Error {
  constructor(message, cause = null) {
    super(message);
    this.name = 'MailDeliveryError';
    this.cause = cause;
  }
}

function hasSmtpConfig() {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS,
  );
}

function getTransporter() {
  if (transporter) return transporter;

  const smtpPort = Number(process.env.SMTP_PORT);
  if (!Number.isInteger(smtpPort) || smtpPort <= 0) {
    throw new MailDeliveryError('SMTP_PORT must be a valid number');
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: String(process.env.SMTP_SECURE || 'false') === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

async function ensureTransporterReady() {
  if (!transporterReadyPromise) {
    const mailer = getTransporter();
    transporterReadyPromise = mailer.verify().catch((error) => {
      transporterReadyPromise = null;
      throw new MailDeliveryError(
        'SMTP connection failed. Check SMTP host, port, security, username and password.',
        error,
      );
    });
  }

  await transporterReadyPromise;
  return getTransporter();
}

// Mail service abstraction.
// OTP is only sent through SMTP.
// If SMTP is missing or invalid, this function throws an error and never exposes OTP.
async function sendOtpEmail({ email, otp, purpose, ttlMinutes }) {
  const subject =
    purpose === 'login'
      ? `Your login OTP (${ttlMinutes} min)`
      : `Verify your email OTP (${ttlMinutes} min)`;

  const text = `Your OTP is ${otp}. It will expire in ${ttlMinutes} minute(s).`;

  if (!hasSmtpConfig()) {
    throw new MailDeliveryError(
      'SMTP configuration is incomplete. Set SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS and SMTP_FROM.',
    );
  }

  if (!process.env.SMTP_FROM) {
    throw new MailDeliveryError('SMTP_FROM is required to send OTP emails');
  }

  try {
    const mailer = await ensureTransporterReady();
    await mailer.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject,
      text,
    });
  } catch (error) {
    if (error instanceof MailDeliveryError) {
      throw error;
    }

    throw new MailDeliveryError(
      'Failed to deliver OTP email. Verify SMTP credentials and sender address.',
      error,
    );
  }
}

module.exports = {
  MailDeliveryError,
  sendOtpEmail,
};
