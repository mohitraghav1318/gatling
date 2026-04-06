const mongoose = require('mongoose');

// Membership documents connect users to organizations with role-based access.
const organizationMembershipSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
      required: true,
    },

    status: {
      type: String,
      enum: ['active', 'invited', 'requested'],
      default: 'active',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// A user can only have one membership record per organization.
organizationMembershipSchema.index(
  { user: 1, organization: 1 },
  { unique: true },
);

module.exports = mongoose.model(
  'OrganizationMembership',
  organizationMembershipSchema,
);
