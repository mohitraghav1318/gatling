const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema(
  {
    // Which org this membership belongs to.
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Org',
      required: true,
    },

    // Which user this membership belongs to.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // The role this user has inside this specific org.
    // owner  → full access, can do everything
    // admin  → can manage members but cannot delete org or transfer ownership
    // member → can only use the product
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
  },
  {
    timestamps: true,
  },
);

// This ensures one user can only have one membership record per org.
// Without this, the same user could accidentally get added twice.
membershipSchema.index({ org: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Membership', membershipSchema);
