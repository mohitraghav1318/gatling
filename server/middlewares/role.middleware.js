const Membership = require('../models/membership.model');
const Org = require('../models/org.model');

// Role hierarchy — higher number means more power.
// We use this to compare roles without writing a chain of if/else statements.
// Example: owner (3) > admin (2) > member (1)
const ROLE_POWER = {
  member: 1,
  admin: 2,
  owner: 3,
};

// requireRole is a middleware factory.
// You call it with a minimum role like requireRole('admin'),
// and it returns the actual middleware function.
// Think of it like a settings dial — you turn it to the level you need.
const requireRole = (minimumRole) => {
  return async (req, res, next) => {
    try {
      // Get the org slug from the URL.
      // Example: /api/org/acme-corporation → orgSlug = 'acme-corporation'
      const { orgSlug } = req.params;

      // Get the logged in user's id.
      // This was set by requireAuth middleware earlier in the chain.
      const userId = req.authUserId;

      // First find the org by its slug.
      // We need the org's _id to look up the membership record.
      const org = await Org.findOne({ slug: orgSlug });

      // If no org found with this slug, stop here.
      if (!org) {
        return res.status(404).json({ message: 'Organization not found' });
      }

      // Now find this user's membership record for this specific org.
      // Remember — roles are per org, not global.
      // A user can be owner in one org and member in another.
      const membership = await Membership.findOne({
        org: org._id,
        user: userId,
      });

      // If no membership found, this user is not part of this org at all.
      if (!membership) {
        return res
          .status(403)
          .json({ message: 'You are not a member of this organization' });
      }

      // Compare the user's role power against the minimum required power.
      // Example: user is 'admin' (2), route requires 'member' (1) → 2 >= 1 → allowed
      // Example: user is 'member' (1), route requires 'admin' (2) → 1 >= 2 → blocked
      const userPower = ROLE_POWER[membership.role];
      const requiredPower = ROLE_POWER[minimumRole];

      if (userPower < requiredPower) {
        return res
          .status(403)
          .json({ message: 'You do not have permission to do this' });
      }

      // All checks passed. Attach the membership and org to the request object
      // so the controller can use them without fetching from DB again.
      // This is an optimization — we already have the data, no need to fetch twice.
      req.membership = membership;
      req.org = org;

      // Move on to the next middleware or controller.
      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      res.status(500).json({ message: 'Something went wrong' });
    }
  };
};

module.exports = { requireRole };
