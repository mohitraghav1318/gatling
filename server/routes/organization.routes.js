const express = require('express');
const organizationController = require('../controllers/organization.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

// Every organization endpoint needs a logged-in user.
// This middleware reads the Bearer token and sets req.authUserId.
router.use(requireAuth);

// 1) Create organization
// POST /api/org
router.post('/', organizationController.createOrganization);

// 2) Join organization by slug/name
// POST /api/org/join
router.post('/join', organizationController.joinOrganization);

// 3) List all organizations where current user is enrolled
// GET /api/org/mine
router.get('/mine', organizationController.getMyOrganizations);

// 4) List members of an org (owner/admin only)
// GET /api/org/:organizationName/members
router.get('/:organizationName/members', organizationController.listMembers);

// 5) Add member to org (owner/admin, with role limits)
// POST /api/org/:organizationName/members
router.post('/:organizationName/members', organizationController.addMember);

// 6) Promote / demote member role (owner only)
// PATCH /api/org/:organizationName/members/:membershipId/role
router.patch(
  '/:organizationName/members/:membershipId/role',
  organizationController.updateMemberRole,
);

// 7) Remove member from org (owner/admin with restrictions)
// DELETE /api/org/:organizationName/members/:membershipId
router.delete(
  '/:organizationName/members/:membershipId',
  organizationController.removeMember,
);

// 8) Transfer organization ownership (owner only)
// POST /api/org/:organizationName/transfer-ownership
router.post(
  '/:organizationName/transfer-ownership',
  organizationController.transferOwnership,
);

// 9) Save SMTP config for organization (owner only)
// PUT /api/org/:organizationName/mail-config
router.put(
  '/:organizationName/mail-config',
  organizationController.upsertMailConfig,
);

// 10) Read SMTP config metadata (owner only, no password)
// GET /api/org/:organizationName/mail-config
router.get(
  '/:organizationName/mail-config',
  organizationController.getMailConfigMeta,
);

// 11) Delete organization (owner only)
// DELETE /api/org/:organizationName
router.delete('/:organizationName', organizationController.deleteOrganization);

// 12) Visit one organization details page
// GET /api/org/:organizationName
router.get('/:organizationName', organizationController.getOrganizationBySlug);

module.exports = router;
