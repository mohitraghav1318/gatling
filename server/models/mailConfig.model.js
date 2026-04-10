const mongoose = require('mongoose');

// Stores the sending configuration for one org.
// Every campaign inside this org will use these settings when sending.
const mailConfigSchema = new mongoose.Schema(
  {
    // Which org this config belongs to.
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Org',
      required: true,
      unique: true, // One config per org, no duplicates.
    },

    // The name that appears in the recipient's inbox.
    // Example: "Acme Team" or "Mohit from Gatling"
    fromName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // Optional reply-to email address.
    // When recipient hits reply, it goes here instead of the sending address.
    // Example: "support@acme.com"
    replyTo: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('MailConfig', mailConfigSchema);
