const userService = require('../services/user.service');

// PATCH /api/user/profile
// Updates the logged in user's basic profile information.
const updateProfile = async (req, res) => {
  try {
    const { name, bio, avatarUrl } = req.body;

    const updated = await userService.updateProfile(req.authUserId, {
      name,
      bio,
      avatarUrl,
    });

    res.status(200).json({ user: updated });
  } catch (error) {
    console.error('updateProfile error:', error);
    res.status(400).json({ message: error.message });
  }
};

// PATCH /api/user/username
// Updates the logged in user's username.
// The service enforces a 30 day cooldown between changes.
const updateUsername = async (req, res) => {
  try {
    const { username } = req.body;

    const updated = await userService.updateUsername(req.authUserId, username);

    res.status(200).json({ user: updated });
  } catch (error) {
    console.error('updateUsername error:', error);
    res.status(400).json({ message: error.message });
  }
};

// PATCH /api/user/password
// Changes the logged in user's password.
// Requires their current password to verify it's really them.
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    await userService.updatePassword(req.authUserId, {
      currentPassword,
      newPassword,
    });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('updatePassword error:', error);
    res.status(400).json({ message: error.message });
  }
};

module.exports = { updateProfile, updateUsername, updatePassword };
