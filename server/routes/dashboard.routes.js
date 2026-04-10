const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

// Every dashboard route requires the user to be logged in.
router.use(requireAuth);

// GET /api/dashboard
// The main dashboard page.
// Returns the logged in user's profile and all their orgs in one single call.
// The frontend uses this one response to render the entire dashboard page.
router.get('/', dashboardController.getOverview);

module.exports = router;
