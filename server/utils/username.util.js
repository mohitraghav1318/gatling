const User = require('../models/user.model');

const RESERVED_USERNAMES = new Set([
  'admin',
  'api',
  'auth',
  'dashboard',
  'help',
  'home',
  'join',
  'login',
  'logout',
  'new',
  'org',
  'profile',
  'register',
  'root',
  'settings',
  'support',
  'u',
  'user',
]);

function slugifyUsername(rawValue) {
  return String(rawValue || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, '_');
}

function buildBaseUsername(name, email) {
  const nameCandidate = slugifyUsername(name);
  if (nameCandidate.length >= 3) {
    return nameCandidate.slice(0, 30);
  }

  const emailPrefix = String(email || '').split('@')[0];
  const emailCandidate = slugifyUsername(emailPrefix);
  if (emailCandidate.length >= 3) {
    return emailCandidate.slice(0, 30);
  }

  return `user_${Date.now().toString().slice(-6)}`;
}

function isReservedUsername(username) {
  return RESERVED_USERNAMES.has(String(username || '').toLowerCase());
}

function isValidUsernameFormat(username) {
  return /^[a-z0-9_]{3,30}$/.test(String(username || ''));
}

async function isUsernameTaken(username, excludedUserId = null) {
  const query = { username };

  if (excludedUserId) {
    query._id = { $ne: excludedUserId };
  }

  const existingUser = await User.findOne(query).select('_id').lean();
  return Boolean(existingUser);
}

async function generateUniqueUsername({ name, email, excludedUserId = null }) {
  const baseUsername = buildBaseUsername(name, email);
  let candidate = baseUsername;

  for (let attempt = 0; attempt < 150; attempt += 1) {
    if (!isReservedUsername(candidate)) {
      // eslint-disable-next-line no-await-in-loop
      const taken = await isUsernameTaken(candidate, excludedUserId);
      if (!taken) {
        return candidate;
      }
    }

    const numericSuffix = String(100 + attempt);
    const maxBaseLength = Math.max(3, 30 - (numericSuffix.length + 1));
    candidate = `${baseUsername.slice(0, maxBaseLength)}_${numericSuffix}`;
  }

  throw new Error(
    'Could not generate a unique username after multiple attempts',
  );
}

async function ensureUsernameForUser(userDocument) {
  if (userDocument.username) {
    return userDocument.username;
  }

  const uniqueUsername = await generateUniqueUsername({
    name: userDocument.name,
    email: userDocument.email,
    excludedUserId: userDocument._id,
  });

  userDocument.username = uniqueUsername;
  if (!userDocument.usernameUpdatedAt) {
    userDocument.usernameUpdatedAt = new Date();
  }
  await userDocument.save();

  return uniqueUsername;
}

module.exports = {
  buildBaseUsername,
  ensureUsernameForUser,
  generateUniqueUsername,
  isReservedUsername,
  isUsernameTaken,
  isValidUsernameFormat,
  slugifyUsername,
};
