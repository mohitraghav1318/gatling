const express = require('express');
const dashboardController = require('../controllers/dashboard.controller');
const organizationController = require('../controllers/organization.controller');
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
router.get('/org/mine', organizationController.getMyOrganizations);
router.post('/org', organizationController.createOrganization);
router.post('/org/join', organizationController.joinOrganization);
router.get(
  '/org/:organizationName',
  organizationController.getOrganizationBySlug,
);

// Public-style user path in dashboard space.
router.get('/u/:username', dashboardController.getUserByUsername);

module.exports = router;
