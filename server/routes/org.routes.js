import {
  getMailConfig,
  createMailConfig,
  updateMailConfig,
} from '../controllers/mailConfig.controller.js';

import {
  listCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
} from '../controllers/campaign.controller.js';

const express = require('express');
const router = express.Router();
const orgController = require('../controllers/org.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

// Every single org route requires the user to be logged in.
// Instead of adding requireAuth to every line, we apply it once here.
// It runs automatically before any route below this line.
router.use(requireAuth);

// ─── General Routes ───────────────────────────────────────────────
// These are available to any logged in user, regardless of their role.

// Get all orgs the current user is enrolled in.
// This is what populates the dashboard page.
router.get('/', orgController.getMyOrgs);

// Create a brand new org.
// The person who hits this route automatically becomes the owner.
router.post('/', orgController.createOrg);

// Get the details of one specific org by its slug.
// Example: GET /api/org/acme-corporation
// This is the main org page the user lands on after clicking an org.
router.get('/:orgSlug', orgController.getOrg);

// ─── Admin + Owner Routes ─────────────────────────────────────────
// These require the user to be at least an admin inside that org.
// requireRole('admin') will also allow owners through — owners outrank admins.

// Get the full list of members in an org.
router.get(
  '/:orgSlug/members',
  requireRole('admin'),
  orgController.listMembers,
);

// The ONLY way to join an org is if an admin or owner adds you.
// No self-join allowed.
router.post('/:orgSlug/members', requireRole('admin'), orgController.addMember);

// Remove a member from the org.
// Admins can remove regular members. They cannot remove other admins or the owner.
router.delete(
  '/:orgSlug/members/:memberId',
  requireRole('admin'),
  orgController.removeMember,
);

// ─── Owner Only Routes ────────────────────────────────────────────
// These are the most powerful actions. Only the org owner can do these.

// Promote a member to admin, or demote an admin back to member.
router.patch(
  '/:orgSlug/members/:memberId/role',
  requireRole('owner'),
  orgController.updateMemberRole,
);

// Hand over ownership of the org to another member.
router.post(
  '/:orgSlug/transfer',
  requireRole('owner'),
  orgController.transferOwnership,
);

// Permanently delete the org and all its memberships.
router.delete('/:orgSlug', requireRole('owner'), orgController.deleteOrg);

// Save the SMTP email config for this org (used by the mail system later).
router.put(
  '/:orgSlug/mail-config',
  requireRole('owner'),
  orgController.saveMailConfig,
);

// Read the SMTP config — but never expose the password, just metadata.
router.get(
  '/:orgSlug/mail-config',
  requireRole('owner'),
  orgController.getMailConfig,
);

// Any member can view the org's mail config
router.get('/:orgId/mail-config', requireAuth, getMailConfig);

// Only the org owner can create or update it
router.post(
  '/:orgId/mail-config',
  requireAuth,
  requireRole('owner'),
  createMailConfig,
);
router.put(
  '/:orgId/mail-config',
  requireAuth,
  requireRole('owner'),
  updateMailConfig,
);

// List all campaigns for this org
router.get('/:orgId/campaigns', requireAuth, listCampaigns);

// Get a single campaign by ID
router.get('/:orgId/campaigns/:campaignId', requireAuth, getCampaign);

// Create a new draft campaign (admin + owner)
router.post(
  '/:orgId/campaigns',
  requireAuth,
  requireRole('admin'),
  createCampaign,
);

// Edit a draft campaign (admin + owner)
router.put(
  '/:orgId/campaigns/:campaignId',
  requireAuth,
  requireRole('admin'),
  updateCampaign,
);

// Delete a draft campaign (owner only — destructive action)
router.delete(
  '/:orgId/campaigns/:campaignId',
  requireAuth,
  requireRole('owner'),
  deleteCampaign,
);

module.exports = router;
