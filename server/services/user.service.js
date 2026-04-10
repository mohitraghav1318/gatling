const bcrypt = require('bcrypt');
const User = require('../models/user.model');

// Updates the user's basic profile fields.
// Only name, bio and avatarUrl can be changed here.
// Email and password have their own separate flows.
const updateProfile = async (userId, { name, bio, avatarUrl }) => {
  // Find the user first to make sure they exist.
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Only update fields that were actually sent in the request.
  // If the frontend only sends name, we don't wipe out bio and avatarUrl.
  if (name !== undefined) user.name = name;
  if (bio !== undefined) user.bio = bio;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

  // Track when the profile was last updated.
  user.profileUpdatedAt = new Date();

  await user.save();

  // Return the updated user without sensitive fields.
  return User.findById(userId).select(
    '-password -loginOtpHash -loginOtpExpiresAt -loginOtpAttempts -loginOtpResendAvailableAt',
  );
};

// Updates the user's username with a 30 day cooldown.
// A user cannot spam username changes — each change locks them out for 30 days.
const updateUsername = async (userId, newUsername) => {
  if (!newUsername) {
    throw new Error('Username is required');
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Check the 30 day cooldown.
  // If usernameUpdatedAt exists and is less than 30 days ago, block the change.
  if (user.usernameUpdatedAt) {
    const daysSinceLastChange =
      (Date.now() - user.usernameUpdatedAt.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceLastChange < 30) {
      const daysLeft = Math.ceil(30 - daysSinceLastChange);
      throw new Error(
        `You can only change your username once every 30 days. Try again in ${daysLeft} day(s)`,
      );
    }
  }

  // Check if the new username is already taken by someone else.
  const existing = await User.findOne({ username: newUsername });

  if (existing && existing._id.toString() !== userId.toString()) {
    throw new Error('This username is already taken');
  }

  user.username = newUsername;
  user.usernameUpdatedAt = new Date();

  await user.save();

  return User.findById(userId).select(
    '-password -loginOtpHash -loginOtpExpiresAt -loginOtpAttempts -loginOtpResendAvailableAt',
  );
};

// Changes the user's password.
// Requires their current password to confirm it's really them making this change.
const updatePassword = async (userId, { currentPassword, newPassword }) => {
  if (!currentPassword || !newPassword) {
    throw new Error('Both current and new password are required');
  }

  // Fetch the user with password included — it's hidden by default in the schema.
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new Error('User not found');
  }

  // Verify the current password is correct before allowing the change.
  const isMatch = await bcrypt.compare(currentPassword, user.password);

  if (!isMatch) {
    throw new Error('Current password is incorrect');
  }

  // Make sure the new password is different from the current one.
  const isSame = await bcrypt.compare(newPassword, user.password);

  if (isSame) {
    throw new Error(
      'New password must be different from your current password',
    );
  }

  // Hash the new password before saving — never store plain text passwords.
  user.password = await bcrypt.hash(newPassword, 12);

  await user.save();
};

module.exports = { updateProfile, updateUsername, updatePassword };
