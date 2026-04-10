const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

// Every user route requires the user to be logged in.
router.use(requireAuth);

// PATCH /api/user/profile
// Update basic profile info — name, bio, avatarUrl.
router.patch('/profile', userController.updateProfile);

// PATCH /api/user/username
// Update username separately because it has a cooldown rule.
// A user cannot change their username more than once every 30 days.
router.patch('/username', userController.updateUsername);

// PATCH /api/user/password
// Change password — requires the current password for verification.
router.patch('/password', userController.updatePassword);

module.exports = router;
