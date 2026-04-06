const ActivityLog = require('../models/activityLog.model');
const Organization = require('../models/organization.model');
const OrganizationMembership = require('../models/organizationMembership.model');
const User = require('../models/user.model');
const {
  ensureUsernameForUser,
  isReservedUsername,
  isUsernameTaken,
  isValidUsernameFormat,
  slugifyUsername,
} = require('../utils/username.util');
const {
  isReservedOrganizationSlug,
  isValidOrganizationSlugFormat,
  slugifyOrganizationName,
} = require('../utils/organization.util');

const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
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

function toSafeUser(userDocument) {
  return {
    id: userDocument._id,
    name: userDocument.name,
    email: userDocument.email,
    username: userDocument.username,
    bio: userDocument.bio,
    avatarUrl: userDocument.avatarUrl,
    isEmailVerified: userDocument.isEmailVerified,
    createdAt: userDocument.createdAt,
    updatedAt: userDocument.updatedAt,
  };
}

function formatActivities(activityDocuments) {
  return activityDocuments.map((activity) => ({
    id: activity._id,
    actionType: activity.actionType,
    message: activity.message,
    metadata: activity.metadata,
    organization: activity.organization
      ? {
          id: activity.organization._id,
          name: activity.organization.name,
          slug: activity.organization.slug,
        }
      : null,
    createdAt: activity.createdAt,
  }));
}

exports.getOverview = async (req, res) => {
  try {
    const user = await User.findById(req.authUserId);
    if (!user) {
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'Account not found. Please login again.',
      );
    }

    await ensureUsernameForUser(user);

    const memberships = await OrganizationMembership.find({
      user: user._id,
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

    const activityLogs = await ActivityLog.find({ actor: user._id })
      .populate('organization', 'name slug')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return sendSuccess(res, HTTP_STATUS.OK, 'Dashboard overview loaded', {
      user: toSafeUser(user),
      organizations,
      recentActivity: formatActivities(activityLogs),
    });
  } catch (_error) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to load dashboard overview',
    );
  }
};

exports.getMyActivity = async (req, res) => {
  try {
    const activityLogs = await ActivityLog.find({ actor: req.authUserId })
      .populate('organization', 'name slug')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return sendSuccess(res, HTTP_STATUS.OK, 'Activity loaded', {
      activity: formatActivities(activityLogs),
    });
  } catch (_error) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to load activity',
    );
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, avatarUrl } = req.body;

    if (name === undefined && bio === undefined && avatarUrl === undefined) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Provide at least one field to update: name, bio or avatarUrl',
      );
    }

    const user = await User.findById(req.authUserId);
    if (!user) {
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'Account not found. Please login again.',
      );
    }

    if (name !== undefined) {
      const trimmedName = String(name).trim();
      if (trimmedName.length < 2 || trimmedName.length > 50) {
        return sendError(
          res,
          HTTP_STATUS.BAD_REQUEST,
          'Name must be between 2 and 50 characters',
        );
      }
      user.name = trimmedName;
    }

    if (bio !== undefined) {
      const normalizedBio = String(bio || '').trim();
      if (normalizedBio.length > 280) {
        return sendError(
          res,
          HTTP_STATUS.BAD_REQUEST,
          'Bio must be 280 characters or less',
        );
      }
      user.bio = normalizedBio;
    }

    if (avatarUrl !== undefined) {
      const normalizedAvatarUrl = String(avatarUrl || '').trim();
      if (normalizedAvatarUrl.length > 500) {
        return sendError(
          res,
          HTTP_STATUS.BAD_REQUEST,
          'Avatar URL must be 500 characters or less',
        );
      }
      user.avatarUrl = normalizedAvatarUrl;
    }

    await ensureUsernameForUser(user);
    await user.save();

    await createActivity({
      actor: user._id,
      actionType: 'PROFILE_UPDATED',
      message: 'Updated profile information',
    });

    return sendSuccess(res, HTTP_STATUS.OK, 'Profile updated', {
      user: toSafeUser(user),
    });
  } catch (_error) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to update profile',
    );
  }
};

exports.updateUsername = async (req, res) => {
  try {
    const requestedUsername = slugifyUsername(req.body.username);

    if (!isValidUsernameFormat(requestedUsername)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Username must be 3 to 30 characters and use only lowercase letters, numbers or underscores',
      );
    }

    if (isReservedUsername(requestedUsername)) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'That username is reserved. Please choose another one.',
      );
    }

    const user = await User.findById(req.authUserId);
    if (!user) {
      return sendError(
        res,
        HTTP_STATUS.UNAUTHORIZED,
        'Account not found. Please login again.',
      );
    }

    if (user.username === requestedUsername) {
      return sendSuccess(res, HTTP_STATUS.OK, 'Username unchanged', {
        username: user.username,
      });
    }

    const taken = await isUsernameTaken(requestedUsername, user._id);
    if (taken) {
      return sendError(
        res,
        HTTP_STATUS.CONFLICT,
        'Username is already in use. Please choose another one.',
      );
    }

    user.username = requestedUsername;
    user.usernameUpdatedAt = new Date();
    await user.save();

    await createActivity({
      actor: user._id,
      actionType: 'USERNAME_UPDATED',
      message: `Changed username to ${requestedUsername}`,
      metadata: {
        username: requestedUsername,
      },
    });

    return sendSuccess(res, HTTP_STATUS.OK, 'Username updated', {
      username: user.username,
      route: `/dashboard/u/${user.username}`,
    });
  } catch (_error) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to update username',
    );
  }
};

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

    await OrganizationMembership.create({
      user: req.authUserId,
      organization: organization._id,
      role: 'owner',
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
        role: 'member',
        status: 'active',
      });
    } else {
      existingMembership.status = 'active';
      if (!existingMembership.role) {
        existingMembership.role = 'member';
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

exports.getOrganizationBySlug = async (req, res) => {
  try {
    const organizationSlug = slugifyOrganizationName(
      req.params.organizationName,
    );

    if (!organizationSlug) {
      return sendError(
        res,
        HTTP_STATUS.BAD_REQUEST,
        'Invalid organization name in URL',
      );
    }

    const organization = await Organization.findOne({ slug: organizationSlug });
    if (!organization) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'Organization not found');
    }

    const membership = await OrganizationMembership.findOne({
      user: req.authUserId,
      organization: organization._id,
      status: 'active',
    }).lean();

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

exports.getUserByUsername = async (req, res) => {
  try {
    const requestedUsername = slugifyUsername(req.params.username);

    if (!requestedUsername) {
      return sendError(res, HTTP_STATUS.BAD_REQUEST, 'Invalid username in URL');
    }

    const targetUser = await User.findOne({ username: requestedUsername })
      .select('name email username bio avatarUrl createdAt updatedAt')
      .lean();

    if (!targetUser) {
      return sendError(res, HTTP_STATUS.NOT_FOUND, 'User not found');
    }

    const memberships = await OrganizationMembership.find({
      user: targetUser._id,
      status: 'active',
    })
      .populate('organization', 'name slug')
      .lean();

    const activities = await ActivityLog.find({ actor: targetUser._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('organization', 'name slug')
      .lean();

    const requesterId = String(req.authUserId);
    const isOwnProfile = String(targetUser._id) === requesterId;

    return sendSuccess(res, HTTP_STATUS.OK, 'User profile loaded', {
      user: {
        id: targetUser._id,
        name: targetUser.name,
        username: targetUser.username,
        bio: targetUser.bio,
        avatarUrl: targetUser.avatarUrl,
        // Email is private unless the requester is the owner.
        email: isOwnProfile ? targetUser.email : undefined,
        createdAt: targetUser.createdAt,
        updatedAt: targetUser.updatedAt,
      },
      organizations: memberships
        .filter((membership) => membership.organization)
        .map((membership) => ({
          id: membership.organization._id,
          name: membership.organization.name,
          slug: membership.organization.slug,
          role: membership.role,
        })),
      recentActivity: formatActivities(activities),
    });
  } catch (_error) {
    return sendError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to load user profile',
    );
  }
};
