const Org = require('../models/org.model');
const Membership = require('../models/membership.model');
const User = require('../models/user.model');

// ─── General ──────────────────────────────────────────────────────

// Finds all orgs the logged in user is enrolled in.
// We look up their membership records first, then populate the org details.
const getMyOrgs = async (userId) => {
  // Find all membership records where this user is the member.
  // populate('org') means — instead of just returning the org's ID,
  // go fetch the actual org document and return that instead.
  // Think of it like looking up a contact name instead of just showing a phone number.
  const memberships = await Membership.find({ user: userId }).populate('org');

  // Extract just the org details from each membership record and
  // attach the user's role in that org.
  return memberships.map((m) => ({
    ...m.org.toObject(),
    role: m.role,
  }));
};

// Finds one org by its slug and checks the requesting user is a member.
// This is for the main org page.
const getOrgBySlug = async (orgSlug, userId) => {
  const org = await Org.findOne({ slug: orgSlug }).populate(
    'owner',
    'name email username',
  );

  if (!org) {
    throw new Error('Organization not found');
  }

  // Check the user is actually a member of this org.
  // We don't want random logged in users viewing orgs they don't belong to.
  const membership = await Membership.findOne({ org: org._id, user: userId });

  if (!membership) {
    throw new Error('You are not a member of this organization');
  }

  // Return the org details along with the requesting user's role.
  return {
    ...org.toObject(),
    yourRole: membership.role,
  };
};

// Creates a new org and automatically makes the creator the owner.
const createOrg = async ({ name, slug, description }, userId) => {
  // Step 1 — Create the org document.
  const org = await Org.create({
    name,
    slug,
    description,
    owner: userId,
  });

  // Step 2 — Create a membership record for the creator with role 'owner'.
  // Even though we store owner on the org document, we still need a membership
  // record so the owner shows up in the members list.
  await Membership.create({
    org: org._id,
    user: userId,
    role: 'owner',
  });

  return org;
};

// ─── Admin + Owner ────────────────────────────────────────────────

// Returns all members of an org with their user details.
const listMembers = async (orgId) => {
  // Find all memberships for this org.
  // populate('user') fetches the actual user document for each membership.
  // We only bring back name, email and username — not password or sensitive fields.
  const memberships = await Membership.find({ org: orgId }).populate(
    'user',
    'name email username avatarUrl',
  );

  return memberships;
};

// Adds a new member to the org by their email address.
// Enforces role limits — an admin cannot add another admin or owner.
const addMember = async ({ org, email, role, requestingMembership }) => {
  // Step 1 — Find the user by email.
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('No user found with this email');
  }

  // Step 2 — Check if this user is already a member.
  const existing = await Membership.findOne({ org: org._id, user: user._id });

  if (existing) {
    throw new Error('This user is already a member of this organization');
  }

  // Step 3 — Enforce role limits.
  // An admin can only add regular members — not other admins or owners.
  // Only an owner can add an admin.
  if (role === 'owner') {
    throw new Error(
      'You cannot directly assign the owner role. Use transfer ownership instead',
    );
  }

  if (role === 'admin' && requestingMembership.role !== 'owner') {
    throw new Error('Only the owner can add an admin');
  }

  // Step 4 — Create the membership.
  const membership = await Membership.create({
    org: org._id,
    user: user._id,
    role: role || 'member',
  });

  return membership;
};

// Removes a member from the org.
// Admins can only remove regular members.
// Nobody can remove the owner.
const removeMember = async ({ org, memberId, requestingMembership }) => {
  // Find the membership record we want to delete.
  const targetMembership = await Membership.findById(memberId);

  if (!targetMembership) {
    throw new Error('Membership not found');
  }

  // Make sure this membership actually belongs to this org.
  // Prevents someone from passing a memberId from a different org.
  if (targetMembership.org.toString() !== org._id.toString()) {
    throw new Error('This member does not belong to this organization');
  }

  // Nobody can remove the owner.
  if (targetMembership.role === 'owner') {
    throw new Error('The owner cannot be removed. Transfer ownership first');
  }

  // An admin cannot remove another admin — only the owner can do that.
  if (
    targetMembership.role === 'admin' &&
    requestingMembership.role === 'admin'
  ) {
    throw new Error('Admins cannot remove other admins');
  }

  await Membership.findByIdAndDelete(memberId);
};

// ─── Owner Only ───────────────────────────────────────────────────

// Promotes a member to admin or demotes an admin back to member.
// The owner role cannot be assigned here — use transferOwnership for that.
const updateMemberRole = async ({ org, memberId, newRole }) => {
  // Only these two roles can be assigned this way.
  if (!['admin', 'member'].includes(newRole)) {
    throw new Error('Invalid role. You can only assign admin or member');
  }

  const targetMembership = await Membership.findById(memberId);

  if (!targetMembership) {
    throw new Error('Membership not found');
  }

  // Make sure this membership belongs to this org.
  if (targetMembership.org.toString() !== org._id.toString()) {
    throw new Error('This member does not belong to this organization');
  }

  // You cannot change the owner's role this way.
  if (targetMembership.role === 'owner') {
    throw new Error(
      'Cannot change the owner role. Use transfer ownership instead',
    );
  }

  targetMembership.role = newRole;
  await targetMembership.save();

  return targetMembership;
};

// Transfers ownership of the org to another member.
// The current owner becomes an admin after this.
const transferOwnership = async ({ org, currentOwnerId, newOwnerId }) => {
  // Find the new owner's membership record.
  const newOwnerMembership = await Membership.findOne({
    org: org._id,
    user: newOwnerId,
  });

  if (!newOwnerMembership) {
    throw new Error(
      'The new owner must already be a member of this organization',
    );
  }

  // Find the current owner's membership record.
  const currentOwnerMembership = await Membership.findOne({
    org: org._id,
    user: currentOwnerId,
  });

  // Step 1 — Demote the current owner to admin.
  currentOwnerMembership.role = 'admin';
  await currentOwnerMembership.save();

  // Step 2 — Promote the new owner.
  newOwnerMembership.role = 'owner';
  await newOwnerMembership.save();

  // Step 3 — Update the owner field on the org document itself.
  org.owner = newOwnerId;
  await org.save();
};

// Permanently deletes the org and all its membership records.
const deleteOrg = async (orgId) => {
  // Delete all memberships first, then the org itself.
  // If you delete the org first and the membership deletion fails,
  // you'd have orphaned membership records with no org to point to.
  await Membership.deleteMany({ org: orgId });
  await Org.findByIdAndDelete(orgId);
};

// ─── Mail Config ──────────────────────────────────────────────────

// Saves the SMTP config for the org.
// We will build this properly when we get to the mail system.
// For now it just stores whatever config object is passed in.
const saveMailConfig = async (orgId, config) => {
  // We will implement this properly in the mail system phase.
  throw new Error('Mail config not implemented yet');
};

// Returns the SMTP config metadata — never the password.
const getMailConfig = async (orgId) => {
  // We will implement this properly in the mail system phase.
  throw new Error('Mail config not implemented yet');
};

module.exports = {
  getMyOrgs,
  getOrgBySlug,
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
