const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

// All dashboard endpoints require a valid Bearer token.
router.use(requireAuth);

// Main overview and activity timeline.
router.get('/', dashboardController.getOverview);
router.get('/activity', dashboardController.getMyActivity);

// Profile management.
router.patch('/profile', dashboardController.updateProfile);
router.patch('/profile/username', dashboardController.updateUsername);

// Organization workflows.
router.post('/org', dashboardController.createOrganization);
router.post('/org/join', dashboardController.joinOrganization);
router.get('/org/:organizationName', dashboardController.getOrganizationBySlug);

// Public-style user path in dashboard space.
router.get('/u/:username', dashboardController.getUserByUsername);

module.exports = router;
