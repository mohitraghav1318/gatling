const ActivityLog = require('../models/activityLog.model');
const Organization = require('../models/organization.model');
const OrganizationMembership = require('../models/organizationMembership.model');
const OrganizationMailConfig = require('../models/organizationMailConfig.model');
const User = require('../models/user.model');
const {
  isReservedOrganizationSlug,
  isValidOrganizationSlugFormat,
  slugifyOrganizationName,
} = require('../utils/organization.util');
const { slugifyUsername } = require('../utils/username.util');
const { encryptText } = require('../utils/crypto.util');

const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
};

const ORG_ROLE = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
};

function sendSuccess(res, status, message, data = null) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

function sendError(res, status, message) {
  return res.status(status).json({
    success: false,
    message,
  });
}

async function createActivity({
  actor,
  actionType,
  message,
  organization = null,
  metadata = {},
}) {
  await ActivityLog.create({
    actor,
    organization,
    actionType,
    message,
    metadata,
  });
}

async function getOrganizationFromSlugOrFail(res, organizationName) {
  const organizationSlug = slugifyOrganizationName(organizationName);
  if (!organizationSlug) {
    return {
      error: sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Invalid organization name in URL',
      ),
    };
  }

  const organization = await Organization.findOne({ slug: organizationSlug });
  if (!organization) {
    return {
      error: sendError(res, HTTP_STATUS.NOT_FOUND, 'Organization not found'),
    };
  }

  return { organization };
}

async function getActiveMembership(organizationId, userId) {
  return OrganizationMembership.findOne({
    organization: organizationId,
    user: userId,
    status: 'active',
  });
}

async function requireOrganizationRole({
  req,
  res,
  organization,
  allowedRoles,
}) {
  const requesterMembership = await getActiveMembership(
    organization._id,
    req.authUserId,
  );

  if (!requesterMembership) {
    return {
      error: sendError(
        res,
        HTTP_STATUS.FORBIDDEN,
        'You are not a member of this organization',
      ),
    };
  }

  if (!allowedRoles.includes(requesterMembership.role)) {
    return {
      error: sendError(
        res,
        HTTP_STATUS.FORBIDDEN,
        'You do not have permission for this action',
      ),
    };
  }

  return { requesterMembership };
}

function toMemberDTO(membershipDoc) {
  return {
    membershipId: membershipDoc._id,
    role: membershipDoc.role,
    status: membershipDoc.status,
    joinedAt: membershipDoc.createdAt,
    user: membershipDoc.user
      ? {
          id: membershipDoc.user._id,
          name: membershipDoc.user.name,
          email: membershipDoc.user.email,
          username: membershipDoc.user.username,
        }
      : null,
  };
}

// ---------------------------------------------------------------
// Base org endpoints (create, join, mine, get by slug)
// ---------------------------------------------------------------

exports.createOrganization = async (req, res) => {
  try {
    const { name, description = '' } = req.body;

    if (!name || String(name).trim().length < 2) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Organization name must be at least 2 characters',
      );
    }

    const normalizedName = String(name).trim();
    const organizationSlug = slugifyOrganizationName(normalizedName);

    if (!isValidOrganizationSlugFormat(organizationSlug)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Organization name creates an invalid URL slug. Use letters and numbers.',
      );
    }

    if (isReservedOrganizationSlug(organizationSlug)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'That organization URL is reserved. Choose a different name.',
      );
    }

    const existingOrganization = await Organization.findOne({
      slug: organizationSlug,
    })
      .select('_id')
      .lean();

    if (existingOrganization) {
      return sendError(
        res,
        HTTP_STATUS.CONFLICT,
        'Organization name is already in use. Please pick another.',
      );
    }

    const organization = await Organization.create({
      name: normalizedName,
      slug: organizationSlug,
      description: String(description || '').trim(),
      createdBy: req.authUserId,
    });

    // Creator is always owner of the organization.
    await OrganizationMembership.create({
      user: req.authUserId,
      organization: organization._id,
      role: ORG_ROLE.OWNER,
      status: 'active',
    });

    await createActivity({
      actor: req.authUserId,
      organization: organization._id,
      actionType: 'ORGANIZATION_CREATED',
      message: `Created organization ${organization.name}`,
      metadata: {
        organizationSlug: organization.slug,
      },
    });

    return sendSuccess(res, HTTP_STATUS.OK, 'Organization created', {
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
      },
      route: `/dashboard/org/${organization.slug}`,
    });
  } catch (_error) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to create organization',
    );
  }
};

exports.joinOrganization = async (req, res) => {
  try {
    const organizationName = slugifyOrganizationName(req.body.organizationName);

    if (!organizationName) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'organizationName is required',
      );
    }

    const organization = await Organization.findOne({ slug: organizationName });
    if (!organization) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Organization not found');
    }

    const existingMembership = await OrganizationMembership.findOne({
      user: req.authUserId,
      organization: organization._id,
    });

    if (existingMembership && existingMembership.status === 'active') {
      return sendSuccess(res, HTTP_STATUS.OK, 'Already a member', {
        organization: {
          id: organization._id,
          name: organization.name,
          slug: organization.slug,
        },
      });
    }

    if (!existingMembership) {
      await OrganizationMembership.create({
        user: req.authUserId,
        organization: organization._id,
        role: ORG_ROLE.MEMBER,
        status: 'active',
      });
    } else {
      existingMembership.status = 'active';
      if (!existingMembership.role) {
        existingMembership.role = ORG_ROLE.MEMBER;
      }
      await existingMembership.save();
    }

    await createActivity({
      actor: req.authUserId,
      organization: organization._id,
      actionType: 'ORGANIZATION_JOINED',
      message: `Joined organization ${organization.name}`,
      metadata: {
        organizationSlug: organization.slug,
      },
    });

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      'Joined organization successfully',
      {
        organization: {
          id: organization._id,
          name: organization.name,
          slug: organization.slug,
        },
        route: `/dashboard/org/${organization.slug}`,
      },
    );
  } catch (_error) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to join organization',
    );
  }
};

exports.getMyOrganizations = async (req, res) => {
  try {
    const memberships = await OrganizationMembership.find({
      user: req.authUserId,
      status: 'active',
    })
      .populate('organization', 'name slug description createdAt')
      .sort({ createdAt: -1 })
      .lean();

    const organizations = memberships
      .filter((membership) => membership.organization)
      .map((membership) => ({
        id: membership.organization._id,
        name: membership.organization.name,
        slug: membership.organization.slug,
        description: membership.organization.description,
        role: membership.role,
        joinedAt: membership.createdAt,
      }));

    return sendSuccess(res, HTTP_STATUS.OK, 'Organizations loaded', {
      organizations,
    });
  } catch (_error) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to load organizations',
    );
  }
};

exports.getOrganizationBySlug = async (req, res) => {
  try {
    const orgResult = await getOrganizationFromSlugOrFail(
      res,
      req.params.organizationName,
    );
    if (orgResult.error) {
      return orgResult.error;
    }

    const { organization } = orgResult;

    const membership = await getActiveMembership(
      organization._id,
      req.authUserId,
    );

    if (!membership) {
      return sendError(
        res,
        HTTP_STATUS.FORBIDDEN,
        'You are not a member of this organization',
      );
    }

    const memberCount = await OrganizationMembership.countDocuments({
      organization: organization._id,
      status: 'active',
    });

    const organizationActivity = await ActivityLog.find({
      organization: organization._id,
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('actor', 'name username')
      .lean();

    return sendSuccess(res, HTTP_STATUS.OK, 'Organization loaded', {
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
        description: organization.description,
        role: membership.role,
        memberCount,
        createdAt: organization.createdAt,
      },
      recentActivity: organizationActivity.map((item) => ({
        id: item._id,
        actionType: item.actionType,
        message: item.message,
        actor: item.actor
          ? {
              id: item.actor._id,
              name: item.actor.name,
              username: item.actor.username,
            }
          : null,
        createdAt: item.createdAt,
      })),
    });
  } catch (_error) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to load organization',
    );
  }
};

// ---------------------------------------------------------------
// Controlled role-based management endpoints
// ---------------------------------------------------------------

exports.listMembers = async (req, res) => {
  try {
    const orgResult = await getOrganizationFromSlugOrFail(
      res,
      req.params.organizationName,
    );
    if (orgResult.error) {
      return orgResult.error;
    }

    const { organization } = orgResult;

    const roleResult = await requireOrganizationRole({
      req,
      res,
      organization,
      allowedRoles: [ORG_ROLE.OWNER, ORG_ROLE.ADMIN],
    });
    if (roleResult.error) {
      return roleResult.error;
    }

    const members = await OrganizationMembership.find({
      organization: organization._id,
      status: 'active',
    })
      .populate('user', 'name email username')
      .sort({ role: 1, createdAt: 1 })
      .lean();

    return sendSuccess(res, HTTP_STATUS.OK, 'Organization members loaded', {
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
      },
      members: members.map(toMemberDTO),
    });
  } catch (_error) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to load organization members',
    );
  }
};

exports.addMember = async (req, res) => {
  try {
    const orgResult = await getOrganizationFromSlugOrFail(
      res,
      req.params.organizationName,
    );
    if (orgResult.error) {
      return orgResult.error;
    }

    const { organization } = orgResult;

    const roleResult = await requireOrganizationRole({
      req,
      res,
      organization,
      allowedRoles: [ORG_ROLE.OWNER, ORG_ROLE.ADMIN],
    });
    if (roleResult.error) {
      return roleResult.error;
    }

    const requesterMembership = roleResult.requesterMembership;

    const { email, username, role = ORG_ROLE.MEMBER } = req.body;

    if (!email && !username) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Provide email or username to add a member',
      );
    }

    if (![ORG_ROLE.MEMBER, ORG_ROLE.ADMIN].includes(role)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Role must be member or admin',
      );
    }

    // Admin has less access than owner: admin can add only "member" role.
    if (
      requesterMembership.role === ORG_ROLE.ADMIN &&
      role !== ORG_ROLE.MEMBER
    ) {
      return sendError(
        res,
        HTTP_STATUS.FORBIDDEN,
        'Admin can add only member role. Only owner can assign admin.',
      );
    }

    const normalizedEmail = email ? String(email).trim().toLowerCase() : null;
    const normalizedUsername = username ? slugifyUsername(username) : null;

    const user = await User.findOne(
      normalizedEmail
        ? { email: normalizedEmail }
        : { username: normalizedUsername },
    );

    if (!user) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Target user not found');
    }

    const existingMembership = await OrganizationMembership.findOne({
      organization: organization._id,
      user: user._id,
    });

    if (existingMembership && existingMembership.status === 'active') {
      return sendError(
        res,
        HTTP_STATUS.CONFLICT,
        'User is already an active member of this organization',
      );
    }

    if (!existingMembership) {
      await OrganizationMembership.create({
        organization: organization._id,
        user: user._id,
        role,
        status: 'active',
      });
    } else {
      existingMembership.role = role;
      existingMembership.status = 'active';
      await existingMembership.save();
    }

    await createActivity({
      actor: req.authUserId,
      organization: organization._id,
      actionType: 'ORGANIZATION_MEMBER_ADDED',
      message: `Added ${user.name} to organization ${organization.name}`,
      metadata: {
        addedUserId: user._id,
        addedUserEmail: user.email,
        assignedRole: role,
      },
    });

    return sendSuccess(res, HTTP_STATUS.OK, 'Member added successfully', {
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
      },
      addedUser: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username,
      },
      role,
    });
  } catch (_error) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to add organization member',
    );
  }
};

exports.updateMemberRole = async (req, res) => {
  try {
    const orgResult = await getOrganizationFromSlugOrFail(
      res,
      req.params.organizationName,
    );
    if (orgResult.error) {
      return orgResult.error;
    }

    const { organization } = orgResult;

    const roleResult = await requireOrganizationRole({
      req,
      res,
      organization,
      allowedRoles: [ORG_ROLE.OWNER],
    });
    if (roleResult.error) {
      return roleResult.error;
    }

    const { role } = req.body;
    if (![ORG_ROLE.MEMBER, ORG_ROLE.ADMIN].includes(role)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Role must be member or admin',
      );
    }

    const membership = await OrganizationMembership.findOne({
      _id: req.params.membershipId,
      organization: organization._id,
      status: 'active',
    }).populate('user', 'name email username');

    if (!membership) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Membership not found');
    }

    if (membership.role === ORG_ROLE.OWNER) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Owner role cannot be changed from this endpoint. Use transfer ownership.',
      );
    }

    membership.role = role;
    await membership.save();

    await createActivity({
      actor: req.authUserId,
      organization: organization._id,
      actionType: 'ORGANIZATION_MEMBER_ROLE_UPDATED',
      message: `Updated ${membership.user?.name || 'member'} role to ${role}`,
      metadata: {
        membershipId: membership._id,
        targetUserId: membership.user?._id,
        newRole: role,
      },
    });

    return sendSuccess(res, HTTP_STATUS.OK, 'Member role updated', {
      membership: toMemberDTO(membership),
    });
  } catch (_error) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to update member role',
    );
  }
};

exports.removeMember = async (req, res) => {
  try {
    const orgResult = await getOrganizationFromSlugOrFail(
      res,
      req.params.organizationName,
    );
    if (orgResult.error) {
      return orgResult.error;
    }

    const { organization } = orgResult;

    const roleResult = await requireOrganizationRole({
      req,
      res,
      organization,
      allowedRoles: [ORG_ROLE.OWNER, ORG_ROLE.ADMIN],
    });
    if (roleResult.error) {
      return roleResult.error;
    }

    const requesterMembership = roleResult.requesterMembership;

    const membership = await OrganizationMembership.findOne({
      _id: req.params.membershipId,
      organization: organization._id,
      status: 'active',
    }).populate('user', 'name email username');

    if (!membership) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Membership not found');
    }

    if (membership.role === ORG_ROLE.OWNER) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Owner cannot be removed. Transfer ownership first.',
      );
    }

    // Admin has less access than owner: admin cannot remove admins.
    if (
      requesterMembership.role === ORG_ROLE.ADMIN &&
      membership.role === ORG_ROLE.ADMIN
    ) {
      return sendError(
        res,
        HTTP_STATUS.FORBIDDEN,
        'Admin cannot remove another admin. Only owner can do that.',
      );
    }

    await membership.deleteOne();

    await createActivity({
      actor: req.authUserId,
      organization: organization._id,
      actionType: 'ORGANIZATION_MEMBER_REMOVED',
      message: `Removed ${membership.user?.name || 'member'} from organization`,
      metadata: {
        removedMembershipId: membership._id,
        removedUserId: membership.user?._id,
      },
    });

    return sendSuccess(res, HTTP_STATUS.OK, 'Member removed successfully');
  } catch (_error) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to remove member',
    );
  }
};

exports.transferOwnership = async (req, res) => {
  try {
    const orgResult = await getOrganizationFromSlugOrFail(
      res,
      req.params.organizationName,
    );
    if (orgResult.error) {
      return orgResult.error;
    }

    const { organization } = orgResult;

    const roleResult = await requireOrganizationRole({
      req,
      res,
      organization,
      allowedRoles: [ORG_ROLE.OWNER],
    });
    if (roleResult.error) {
      return roleResult.error;
    }

    const { targetMembershipId } = req.body;

    if (!targetMembershipId) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'targetMembershipId is required',
      );
    }

    const currentOwnerMembership = await getActiveMembership(
      organization._id,
      req.authUserId,
    );

    const targetMembership = await OrganizationMembership.findOne({
      _id: targetMembershipId,
      organization: organization._id,
      status: 'active',
    }).populate('user', 'name email username');

    if (!targetMembership) {
      return sendError(
        res,
        HTTP_STATUS.NOT_FOUND,
        'Target membership not found',
      );
    }

    if (String(targetMembership.user._id) === String(req.authUserId)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'You are already the owner of this organization',
      );
    }

    // Ownership transfer flow:
    // 1) target becomes owner
    // 2) current owner becomes admin (still powerful, but less than owner)
    targetMembership.role = ORG_ROLE.OWNER;
    await targetMembership.save();

    currentOwnerMembership.role = ORG_ROLE.ADMIN;
    await currentOwnerMembership.save();

    organization.createdBy = targetMembership.user._id;
    await organization.save();

    await createActivity({
      actor: req.authUserId,
      organization: organization._id,
      actionType: 'ORGANIZATION_OWNERSHIP_TRANSFERRED',
      message: `Transferred ownership to ${targetMembership.user.name}`,
      metadata: {
        newOwnerUserId: targetMembership.user._id,
      },
    });

    return sendSuccess(res, HTTP_STATUS.OK, 'Ownership transferred', {
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
      },
      newOwner: {
        id: targetMembership.user._id,
        name: targetMembership.user.name,
        email: targetMembership.user.email,
      },
    });
  } catch (_error) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to transfer ownership',
    );
  }
};

exports.deleteOrganization = async (req, res) => {
  try {
    const orgResult = await getOrganizationFromSlugOrFail(
      res,
      req.params.organizationName,
    );
    if (orgResult.error) {
      return orgResult.error;
    }

    const { organization } = orgResult;

    const roleResult = await requireOrganizationRole({
      req,
      res,
      organization,
      allowedRoles: [ORG_ROLE.OWNER],
    });
    if (roleResult.error) {
      return roleResult.error;
    }

    const { confirmSlug } = req.body;
    if (confirmSlug !== organization.slug) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'For safety, confirmSlug must exactly match the organization slug',
      );
    }

    await OrganizationMailConfig.deleteOne({ organization: organization._id });
    await OrganizationMembership.deleteMany({ organization: organization._id });
    await ActivityLog.deleteMany({ organization: organization._id });
    await organization.deleteOne();

    await createActivity({
      actor: req.authUserId,
      actionType: 'ORGANIZATION_DELETED',
      message: `Deleted organization ${organization.name}`,
      metadata: {
        deletedOrganizationSlug: organization.slug,
      },
    });

    return sendSuccess(
      res,
      HTTP_STATUS.OK,
      'Organization deleted successfully',
    );
  } catch (_error) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to delete organization',
    );
  }
};

exports.upsertMailConfig = async (req, res) => {
  try {
    const orgResult = await getOrganizationFromSlugOrFail(
      res,
      req.params.organizationName,
    );
    if (orgResult.error) {
      return orgResult.error;
    }

    const { organization } = orgResult;

    const roleResult = await requireOrganizationRole({
      req,
      res,
      organization,
      allowedRoles: [ORG_ROLE.OWNER],
    });
    if (roleResult.error) {
      return roleResult.error;
    }

    const { smtpHost, smtpPort, smtpSecure, smtpUser, smtpPass, smtpFrom } =
      req.body;

    if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'smtpHost, smtpUser, smtpPass and smtpFrom are required',
      );
    }

    const normalizedPort = Number(smtpPort);
    if (
      !Number.isInteger(normalizedPort) ||
      normalizedPort < 1 ||
      normalizedPort > 65535
    ) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'smtpPort must be a valid port number',
      );
    }

    const normalizedSecure =
      smtpSecure === undefined
        ? true
        : String(smtpSecure).toLowerCase() === 'true';

    const encryptedPass = encryptText(String(smtpPass));

    const config = await OrganizationMailConfig.findOneAndUpdate(
      { organization: organization._id },
      {
        organization: organization._id,
        smtpHost: String(smtpHost).trim(),
        smtpPort: normalizedPort,
        smtpSecure: normalizedSecure,
        smtpUser: String(smtpUser).trim(),
        smtpPassEncrypted: encryptedPass,
        smtpFrom: String(smtpFrom).trim(),
        updatedBy: req.authUserId,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();

    await createActivity({
      actor: req.authUserId,
      organization: organization._id,
      actionType: 'ORGANIZATION_MAIL_CONFIG_UPDATED',
      message: `Updated SMTP config for ${organization.name}`,
      metadata: {
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        smtpSecure: config.smtpSecure,
      },
    });

    return sendSuccess(res, HTTP_STATUS.OK, 'Mail config saved', {
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
      },
      mailConfig: {
        smtpHost: config.smtpHost,
        smtpPort: config.smtpPort,
        smtpSecure: config.smtpSecure,
        smtpUser: config.smtpUser,
        smtpFrom: config.smtpFrom,
        hasPassword: true,
        updatedAt: config.updatedAt,
      },
    });
  } catch (_error) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to save organization mail config',
    );
  }
};

exports.getMailConfigMeta = async (req, res) => {
  try {
    const orgResult = await getOrganizationFromSlugOrFail(
      res,
      req.params.organizationName,
    );
    if (orgResult.error) {
      return orgResult.error;
    }

    const { organization } = orgResult;

    const roleResult = await requireOrganizationRole({
      req,
      res,
      organization,
      allowedRoles: [ORG_ROLE.OWNER],
    });
    if (roleResult.error) {
      return roleResult.error;
    }

    const config = await OrganizationMailConfig.findOne({
      organization: organization._id,
    })
      .select(
        'smtpHost smtpPort smtpSecure smtpUser smtpFrom updatedAt updatedBy',
      )
      .populate('updatedBy', 'name email username')
      .lean();

    return sendSuccess(res, HTTP_STATUS.OK, 'Mail config status loaded', {
      organization: {
        id: organization._id,
        name: organization.name,
        slug: organization.slug,
      },
      mailConfig: config
        ? {
            smtpHost: config.smtpHost,
            smtpPort: config.smtpPort,
            smtpSecure: config.smtpSecure,
            smtpUser: config.smtpUser,
            smtpFrom: config.smtpFrom,
            hasPassword: true,
            updatedAt: config.updatedAt,
            updatedBy: config.updatedBy
              ? {
                  id: config.updatedBy._id,
                  name: config.updatedBy.name,
                  email: config.updatedBy.email,
                  username: config.updatedBy.username,
                }
              : null,
          }
        : null,
    });
  } catch (_error) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to load organization mail config status',
    );
  }
};

module.exports.ORG_ROLE = ORG_ROLE;
