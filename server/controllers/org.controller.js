const orgService = require('../services/org.service');

// ─── General ──────────────────────────────────────────────────────

// GET /api/org
// Returns all orgs the logged in user is enrolled in.
// Used to populate the dashboard page.
const getMyOrgs = async (req, res) => {
  try {
    const orgs = await orgService.getMyOrgs(req.authUserId);
    res.status(200).json({ orgs });
  } catch (error) {
    console.error('getMyOrgs error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// GET /api/org/:orgSlug
// Returns the details of one specific org.
// req.org is already attached by requireRole middleware — but this route
// doesn't use requireRole, so we pass the slug and let the service fetch it.
const getOrg = async (req, res) => {
  try {
    const org = await orgService.getOrgBySlug(
      req.params.orgSlug,
      req.authUserId,
    );
    res.status(200).json({ org });
  } catch (error) {
    console.error('getOrg error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// POST /api/org
// Creates a brand new org.
// The logged in user automatically becomes the owner.
const createOrg = async (req, res) => {
  try {
    // Pull only what we need from the request body.
    // Never trust the entire req.body blindly.
    const { name, slug, description } = req.body;

    const org = await orgService.createOrg(
      { name, slug, description },
      req.authUserId,
    );
    res.status(201).json({ org });
  } catch (error) {
    console.error('createOrg error:', error);

    // Handle duplicate slug — someone already has that org name.
    if (error.code === 11000) {
      return res.status(409).json({ message: 'This slug is already taken' });
    }

    res.status(500).json({ message: 'Something went wrong' });
  }
};

// ─── Admin + Owner ────────────────────────────────────────────────

// GET /api/org/:orgSlug/members
// Returns the full member list of an org.
// Only admins and owners can see this.
const listMembers = async (req, res) => {
  try {
    // req.org was attached by requireRole middleware — no need to fetch again.
    const members = await orgService.listMembers(req.org._id);
    res.status(200).json({ members });
  } catch (error) {
    console.error('listMembers error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// POST /api/org/:orgSlug/members
// Adds a new member to the org by their email.
// Only admins and owners can do this.
const addMember = async (req, res) => {
  try {
    const { email, role } = req.body;

    // Pass the requesting user's membership so the service can
    // enforce role limits — an admin cannot add another admin, for example.
    const membership = await orgService.addMember({
      org: req.org,
      email,
      role,
      requestingMembership: req.membership,
    });

    res.status(201).json({ membership });
  } catch (error) {
    console.error('addMember error:', error);
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/org/:orgSlug/members/:memberId
// Removes a member from the org.
// Admins can only remove regular members — not other admins or the owner.
const removeMember = async (req, res) => {
  try {
    await orgService.removeMember({
      org: req.org,
      memberId: req.params.memberId,
      requestingMembership: req.membership,
    });

    res.status(200).json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('removeMember error:', error);
    res.status(400).json({ message: error.message });
  }
};

// ─── Owner Only ───────────────────────────────────────────────────

// PATCH /api/org/:orgSlug/members/:memberId/role
// Promotes a member to admin or demotes an admin back to member.
// Only the owner can change roles.
const updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;

    const updated = await orgService.updateMemberRole({
      org: req.org,
      memberId: req.params.memberId,
      newRole: role,
    });

    res.status(200).json({ membership: updated });
  } catch (error) {
    console.error('updateMemberRole error:', error);
    res.status(400).json({ message: error.message });
  }
};

// POST /api/org/:orgSlug/transfer
// Transfers ownership of the org to another member.
// The current owner becomes a regular admin after this.
const transferOwnership = async (req, res) => {
  try {
    const { newOwnerId } = req.body;

    await orgService.transferOwnership({
      org: req.org,
      currentOwnerId: req.authUserId,
      newOwnerId,
    });

    res.status(200).json({ message: 'Ownership transferred successfully' });
  } catch (error) {
    console.error('transferOwnership error:', error);
    res.status(400).json({ message: error.message });
  }
};

// DELETE /api/org/:orgSlug
// Permanently deletes the org and all its memberships.
// This cannot be undone.
const deleteOrg = async (req, res) => {
  try {
    await orgService.deleteOrg(req.org._id);
    res.status(200).json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('deleteOrg error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

// ─── Mail Config ──────────────────────────────────────────────────

// PUT /api/org/:orgSlug/mail-config
// Saves the SMTP configuration for this org.
// Used later by the mail system to send emails.
const saveMailConfig = async (req, res) => {
  try {
    const config = await orgService.saveMailConfig(req.org._id, req.body);
    res.status(200).json({ config });
  } catch (error) {
    console.error('saveMailConfig error:', error);
    res.status(400).json({ message: error.message });
  }
};

// GET /api/org/:orgSlug/mail-config
// Returns the SMTP config metadata — never the password.
const getMailConfig = async (req, res) => {
  try {
    const config = await orgService.getMailConfig(req.org._id);
    res.status(200).json({ config });
  } catch (error) {
    console.error('getMailConfig error:', error);
    res.status(500).json({ message: 'Something went wrong' });
  }
};

module.exports = {
  getMyOrgs,
  getOrg,
  createOrg,
  listMembers,
  addMember,
  removeMember,
  updateMemberRole,
  transferOwnership,
  deleteOrg,
  saveMailConfig,
  getMailConfig,
};
