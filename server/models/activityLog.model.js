const mongoose = require('mongoose');

// Activity logs drive timeline/history views in dashboard screens.
const activityLogSchema = new mongoose.Schema(
  {
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },

    actionType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 240,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

activityLogSchema.index({ actor: 1, createdAt: -1 });
activityLogSchema.index({ organization: 1, createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
