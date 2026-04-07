const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

function getEncryptionSecret() {
  // We prefer a dedicated key for org SMTP config.
  // Fallback to JWT_SECRET keeps development unblocked, but production should
  // always use MAIL_CONFIG_ENCRYPTION_KEY.
  return (
    process.env.MAIL_CONFIG_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    'dev-only-mail-config-key-change-me'
  );
}

function getKeyBuffer() {
  // Convert any secret string into a 32-byte key required by AES-256.
  return crypto.createHash('sha256').update(getEncryptionSecret()).digest();
}

function encryptText(plainText) {
  const normalized = String(plainText || '');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKeyBuffer(), iv);

  const encrypted = Buffer.concat([
    cipher.update(normalized, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Stored as iv:tag:ciphertext in base64 for easy DB storage.
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

function decryptText(payload) {
  const parts = String(payload || '').split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted payload format');
  }

  const [ivB64, tagB64, encryptedB64] = parts;
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(tagB64, 'base64');
  const encrypted = Buffer.from(encryptedB64, 'base64');

  const decipher = crypto.createDecipheriv(ALGORITHM, getKeyBuffer(), iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

module.exports = {
  encryptText,
  decryptText,
};
