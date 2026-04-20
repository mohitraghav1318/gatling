// services/campaign.service.js

import Campaign from '../models/campaign.model.js';

import mongoose from 'mongoose';
import CampaignJob from '../models/campaignJob.model.js';

// ─────────────────────────────────────────────
//  LIST — fetch all campaigns belonging to an org
//  Sorted by newest first so the dashboard always
//  shows the most recent campaign at the top.
// ─────────────────────────────────────────────
export const getCampaignsByOrg = async (orgId) => {
  return await Campaign.find({ org: orgId }).sort({ createdAt: -1 });
};

// ─────────────────────────────────────────────
//  SINGLE — fetch one campaign by its ID
//  We also filter by org so a user from Org A
//  cannot access a campaign that belongs to Org B
//  just by guessing a MongoDB ObjectId.
// ─────────────────────────────────────────────
export const getCampaignById = async (campaignId, orgId) => {
  return await Campaign.findOne({ _id: campaignId, org: orgId });
};

// ─────────────────────────────────────────────
//  CREATE — save a new campaign as a draft
//  Status is always "draft" at creation time.
//  The campaign does not send anything yet —
//  that happens in Step 7 when the user hits send.
// ─────────────────────────────────────────────
export const createCampaign = async (orgId, { name, subject, body }) => {
  const campaign = new Campaign({
    org: orgId,
    name,
    subject,
    body,
    status: 'draft', // always starts as a draft — never jumps straight to sending
    sentCount: 0, // no emails sent yet
    failedCount: 0, // no failures yet
    totalRecipients: 0, // recipients are added later when a CSV is uploaded (Step 3)
  });

  return await campaign.save();
};

// ─────────────────────────────────────────────
//  UPDATE — edit a campaign's name/subject/body
//  We use $set so only the provided fields change.
//  We also enforce that only draft campaigns can
//  be edited — you should not be able to change
//  the subject of an email that is already sending.
// ─────────────────────────────────────────────
export const updateCampaign = async (
  campaignId,
  orgId,
  { name, subject, body },
) => {
  return await Campaign.findOneAndUpdate(
    {
      _id: campaignId,
      org: orgId,
      status: 'draft', // safety lock — only drafts are editable
    },
    { $set: { name, subject, body } },
    { new: true }, // return the updated document, not the old one
  );
};

// ─────────────────────────────────────────────
//  DELETE — permanently remove a campaign
//  We also enforce the draft-only rule here.
//  A campaign that is queued or sending should
//  never be deleted mid-flight — that would leave
//  orphaned campaignJob records in the DB.
// ─────────────────────────────────────────────
export const deleteCampaign = async (campaignId, orgId) => {
  return await Campaign.findOneAndDelete({
    _id: campaignId,
    org: orgId,
    status: 'draft', // cannot delete a campaign that is already in progress
  });
};

//   1. Opens a MongoDB transaction (session)
//   2. Saves all recipient rows as campaignJobs
//   3. Updates the campaign's totalRecipients
//   4. If anything fails, rolls back everything
//      so we never end up with a half-saved state
// ─────────────────────────────────────────────
export const saveRecipientsForCampaign = async (
  campaignId,
  orgId,
  recipients,
) => {
  // A session is like a container for a transaction.
  // MongoDB watches everything that happens inside this
  // session — if something breaks, it undoes all of it.
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Build the list of campaignJob documents to insert.
    // One object per recipient row from the CSV.
    const jobs = recipients.map((recipient) => ({
      campaign: campaignId, // which campaign these jobs belong to
      org: orgId, // which org owns this campaign
      email: recipient.email, // the recipient's email address
      csvRow: recipient, // the full CSV row — used later for {{name}} replacements
      status: 'pending', // starts as pending — worker will pick this up in Step 5
      attempts: 0, // how many send attempts have been made (starts at zero)
    }));

    // Save all jobs in one single DB call instead of one call per recipient.
    // { session } tells MongoDB to include this operation in the transaction.
    await CampaignJob.insertMany(jobs, { session });

    // Update the campaign's totalRecipients count to match how many rows came in.
    // $set replaces just this field — everything else on the campaign stays the same.
    await Campaign.findOneAndUpdate(
      { _id: campaignId, org: orgId },
      { $set: { totalRecipients: recipients.length } },
      { session },
    );

    // Everything worked — tell MongoDB to make these changes permanent
    await session.commitTransaction();
  } catch (err) {
    // Something went wrong — undo everything that happened in this transaction.
    // This means zero campaignJobs are saved and totalRecipients stays unchanged.
    // Better to have nothing saved than to have a broken half-state.
    await session.abortTransaction();

    // Re-throw so the controller knows it failed and can send an error response
    throw err;
  } finally {
    // Always end the session whether things worked or not.
    // Not ending the session leaks DB connections over time.
    session.endSession();
  }
};
