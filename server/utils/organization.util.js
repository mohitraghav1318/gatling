const RESERVED_ORGANIZATION_SLUGS = new Set([
  'admin',
  'api',
  'auth',
  'dashboard',
  'help',
  'home',
  'join',
  'login',
  'org',
  'profile',
  'register',
  'settings',
  'u',
]);

function slugifyOrganizationName(rawValue) {
  return String(rawValue || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function isReservedOrganizationSlug(slug) {
  return RESERVED_ORGANIZATION_SLUGS.has(String(slug || '').toLowerCase());
}

function isValidOrganizationSlugFormat(slug) {
  return /^[a-z0-9-]{2,50}$/.test(String(slug || ''));
}

module.exports = {
  isReservedOrganizationSlug,
  isValidOrganizationSlugFormat,
  slugifyOrganizationName,
};
