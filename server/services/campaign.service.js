// services/campaign.service.js

import Campaign from '../models/campaign.model.js';

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
