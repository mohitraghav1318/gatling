const mongoose = require('mongoose');

// Organization documents store tenant-level metadata.
// Memberships are stored in a separate collection for many-to-many scalability.
const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    slug: {
      type: String,
      required: [true, 'Organization slug is required'],
      unique: true,
      index: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]{2,50}$/, 'Invalid organization slug format'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: 400,
      default: '',
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Organization', organizationSchema);
