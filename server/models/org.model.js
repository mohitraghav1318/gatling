const mongoose = require('mongoose');

const orgSchema = new mongoose.Schema(
  {
    // The display name of the organization.
    // Example: "Acme Corporation"
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      minlength: 2,
      maxlength: 50,
    },

    // The URL-friendly version of the name.
    // Example: "acme-corporation"
    // This is what appears in the URL → /org/acme-corporation
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9-]{2,50}$/,
        'Slug can only contain lowercase letters, numbers and hyphens',
      ],
    },

    // Optional short description of the org.
    description: {
      type: String,
      trim: true,
      maxlength: 280,
      default: '',
    },

    // The user who created and currently owns this org.
    // We store their userId as a reference to the User model.
    // Think of it like storing a library card number instead of copying
    // the entire person's details — MongoDB will look them up when needed.
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    // Mongoose will automatically add createdAt and updatedAt fields.
    timestamps: true,
  },
);

module.exports = mongoose.model('Org', orgSchema);
