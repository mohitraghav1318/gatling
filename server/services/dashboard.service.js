const User = require('../models/user.model');
const orgService = require('./org.service');

// Fetches everything the dashboard page needs in one call.
// Instead of the frontend making 2-3 separate API calls,
// we bundle it all here and send it in one response.
const getOverview = async (userId) => {
  // Step 1 — Fetch the logged in user's profile.
  // We exclude sensitive fields like password using select('-password').
  // The minus sign means "give me everything except this field".
  const user = await User.findById(userId).select(
    '-password -loginOtpHash -loginOtpExpiresAt -loginOtpAttempts -loginOtpResendAvailableAt',
  );

  if (!user) {
    throw new Error('User not found');
  }

  // Step 2 — Fetch all orgs this user is enrolled in.
  // We already wrote this function in org.service — no need to rewrite it.
  // This is why services are kept separate — they can call each other.
  const orgs = await orgService.getMyOrgs(userId);

  // Step 3 — Return everything bundled together.
  // The frontend gets the user's profile and their orgs in one single response.
  return {
    user,
    orgs,
  };
};

module.exports = { getOverview };
