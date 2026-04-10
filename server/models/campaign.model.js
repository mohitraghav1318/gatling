const mongoose = require('mongoose');

// A campaign is one bulk email job.
// It stores everything about what to send and the current state of sending.
const campaignSchema = new mongoose.Schema(
  {
    // Which org this campaign belongs to.
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Org',
      required: true,
    },

    // Who created this campaign.
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // The campaign name — just for internal reference.
    // Example: "April Newsletter" or "Product Launch"
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // The subject line the recipient sees in their inbox.
    subject: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },

    // The sender name for this specific campaign.
    // Overrides the org mailConfig fromName if provided.
    fromName: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },

    // The full HTML email body.
    // This is what the user writes in the editor.
    // Placeholders like {{name}} will be replaced with CSV data before sending.
    body: {
      type: String,
      required: true,
    },

    // Current state of this campaign.
    // draft     → user is still editing, not sent yet
    // queued    → user hit send, waiting for the queue to pick it up
    // sending   → currently sending batches
    // completed → all emails sent successfully
    // failed    → something went wrong, check campaignJobs for details
    // paused    → manually paused by user (future feature)
    status: {
      type: String,
      enum: ['draft', 'queued', 'sending', 'completed', 'failed', 'paused'],
      default: 'draft',
    },

    // Total number of recipients from the CSV.
    // Set when the user uploads the CSV and hits send.
    totalRecipients: {
      type: Number,
      default: 0,
    },

    // How many emails have been successfully sent so far.
    // Incremented after each successful batch.
    sentCount: {
      type: Number,
      default: 0,
    },

    // How many emails failed to send.
    failedCount: {
      type: Number,
      default: 0,
    },

    // When the user actually hit the send button.
    sentAt: {
      type: Date,
      default: null,
    },

    // When all emails finished sending.
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('Campaign', campaignSchema);
