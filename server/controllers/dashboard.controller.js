const dashboardService = require('../services/dashboard.service');

// GET /api/dashboard
// Reads the logged in user's id from the request,
// calls the service, and sends back everything the dashboard needs.
const getOverview = async (req, res) => {
  try {
    const data = await dashboardService.getOverview(req.authUserId);
    res.status(200).json(data);
  } catch (error) {
    console.error('getOverview error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

module.exports = { getOverview };
