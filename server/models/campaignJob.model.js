const mongoose = require('mongoose');

// A campaign job is one individual email send within a campaign.
// One record per recipient — so if a campaign has 1000 recipients,
// there will be 1000 campaign job records.
// This is what allows us to resume automatically after a crash —
// we just look for all jobs that are still 'pending' and retry them.
const campaignJobSchema = new mongoose.Schema(
  {
    // Which campaign this job belongs to.
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
    },

    // Which org this job belongs to.
    // Stored here for faster querying without always joining campaign.
    org: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Org',
      required: true,
    },

    // The recipient's email address.
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    // The recipient's full row data from the CSV.
    // We store the entire row so we can replace placeholders like {{name}}
    // with their actual data when sending.
    // Example: { name: "John", team: "Engineering", phone: "9999999999" }
    csvRow: {
      type: Map,
      of: String,
      default: {},
    },

    // Current state of this individual email.
    // pending   → waiting to be sent
    // sent      → successfully delivered to Resend
    // failed    → Resend returned an error
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
    },

    // If sending failed, store the error reason here.
    // Useful for debugging and showing the user what went wrong.
    failReason: {
      type: String,
      default: null,
    },

    // How many times we have tried to send this email.
    // We will retry failed emails up to 3 times before giving up.
    attempts: {
      type: Number,
      default: 0,
    },

    // When this email was successfully sent.
    sentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// This index makes it fast to find all pending jobs for a campaign.
// When resuming after a crash, this is the query we run.
campaignJobSchema.index({ campaign: 1, status: 1 });

module.exports = mongoose.model('CampaignJob', campaignJobSchema);
