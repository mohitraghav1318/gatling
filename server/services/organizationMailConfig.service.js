const OrganizationMailConfig = require('../models/organizationMailConfig.model');
const { decryptText } = require('../utils/crypto.util');

// This service is intentionally backend-only.
// Frontend should never receive decrypted SMTP password.
async function getDecryptedMailConfigByOrganizationId(organizationId) {
  const config = await OrganizationMailConfig.findOne({
    organization: organizationId,
  })
    .select('+smtpPassEncrypted smtpHost smtpPort smtpSecure smtpUser smtpFrom')
    .lean();

  if (!config) {
    return null;
  }

  return {
    smtpHost: config.smtpHost,
    smtpPort: config.smtpPort,
    smtpSecure: config.smtpSecure,
    smtpUser: config.smtpUser,
    smtpPass: decryptText(config.smtpPassEncrypted),
    smtpFrom: config.smtpFrom,
  };
}

module.exports = {
  getDecryptedMailConfigByOrganizationId,
};
