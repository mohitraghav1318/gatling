// controllers/campaign.controller.js

import * as campaignService from '../services/campaign.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

import { parseCsv, extractRecipients } from "../utils/csv.util.js";
import { saveRecipientsForCampaign, getCampaignById } from "../services/campaign.service.js";
 

// ─────────────────────────────────────────────
//  GET /api/org/:orgId/campaigns
//  Returns all campaigns for this org.
//  Any org member can call this — it's read-only.
//  Returns an empty array if none exist yet
//  (not a 404 — having zero campaigns is valid).
// ─────────────────────────────────────────────
export const listCampaigns = async (req, res) => {
  try {
    const campaigns = await campaignService.getCampaignsByOrg(req.params.orgId);

    return sendSuccess(res, 200, 'Campaigns fetched.', campaigns);
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch campaigns.', err.message);
  }
};

// ─────────────────────────────────────────────
//  GET /api/org/:orgId/campaigns/:campaignId
//  Returns a single campaign by ID.
//  The service also checks that this campaign
//  belongs to the given org, so a user cannot
//  peek at another org's campaign by guessing IDs.
// ─────────────────────────────────────────────
export const getCampaign = async (req, res) => {
  try {
    const campaign = await campaignService.getCampaignById(
      req.params.campaignId,
      req.params.orgId,
    );

    if (!campaign) {
      return sendError(res, 404, 'Campaign not found.');
    }

    return sendSuccess(res, 200, 'Campaign fetched.', campaign);
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch campaign.', err.message);
  }
};

// ─────────────────────────────────────────────
//  POST /api/org/:orgId/campaigns
//  Creates a new draft campaign for this org.
//  Requires: name, subject, body in req.body.
//  Admin and above only — members cannot create
//  campaigns on behalf of an org.
// ─────────────────────────────────────────────
export const createCampaign = async (req, res) => {
  try {
    const { name, subject, body } = req.body;

    // All three fields are required before saving anything to the DB
    if (!name || !subject || !body) {
      return sendError(res, 400, 'name, subject, and body are all required.');
    }

    const campaign = await campaignService.createCampaign(req.params.orgId, {
      name,
      subject,
      body,
    });

    return sendSuccess(res, 201, 'Campaign created.', campaign);
  } catch (err) {
    return sendError(res, 500, 'Failed to create campaign.', err.message);
  }
};

// ─────────────────────────────────────────────
//  PUT /api/org/:orgId/campaigns/:campaignId
//  Updates name, subject, and/or body of a draft.
//  If the campaign is not in "draft" status, the
//  service returns null and we send back a 409 —
//  editing a live or completed campaign is not allowed.
// ─────────────────────────────────────────────
export const updateCampaign = async (req, res) => {
  try {
    const { name, subject, body } = req.body;

    if (!name || !subject || !body) {
      return sendError(res, 400, 'name, subject, and body are all required.');
    }

    const updated = await campaignService.updateCampaign(
      req.params.campaignId,
      req.params.orgId,
      { name, subject, body },
    );

    // null means either the campaign doesn't exist OR it is not a draft
    if (!updated) {
      return sendError(
        res,
        409,
        'Campaign not found, or it cannot be edited because it is no longer a draft.',
      );
    }

    return sendSuccess(res, 200, 'Campaign updated.', updated);
  } catch (err) {
    return sendError(res, 500, 'Failed to update campaign.', err.message);
  }
};

// ─────────────────────────────────────────────
//  DELETE /api/org/:orgId/campaigns/:campaignId
//  Permanently deletes a draft campaign.
//  Owner only — this is a destructive action.
//  Returns 409 if the campaign is not a draft,
//  because deleting a campaign mid-send would
//  leave orphaned campaignJob records in the DB.
// ─────────────────────────────────────────────
export const deleteCampaign = async (req, res) => {
  try {
    const deleted = await campaignService.deleteCampaign(
      req.params.campaignId,
      req.params.orgId,
    );

    // null means either not found OR not a draft — same protection as update
    if (!deleted) {
      return sendError(
        res,
        409,
        'Campaign not found, or it cannot be deleted because it is no longer a draft.',
      );
    }

    return sendSuccess(res, 200, 'Campaign deleted.');
  } catch (err) {
    return sendError(res, 500, 'Failed to delete campaign.', err.message);
  }
};

// Route: POST /api/org/:orgId/campaigns/:campaignId/upload-csv
//
// What happens here step by step:
//   1. Multer already ran before this — req.file
//      is the CSV sitting in memory as raw bytes
//   2. We check the campaign exists and is a draft
//   3. We parse the CSV bytes into JS objects
//   4. We check every row has an email column
//   5. We save everything to the DB in one transaction
//   6. We respond — CSV is never stored anywhere
// ─────────────────────────────────────────────
export const uploadCsv = async (req, res) => {
  try {

    // req.file is attached by multer middleware.
    // If the user forgot to include a file, multer
    // won't attach anything and req.file will be undefined.
    if (!req.file) {
      return sendError(res, 400, "No CSV file was uploaded.");
    }

    const { orgId, campaignId } = req.params;

    // Make sure this campaign actually exists and belongs to this org.
    // We also need to confirm it is still a draft — you should not be
    // able to re-upload a CSV to a campaign that is already sending.
    const campaign = await getCampaignById(campaignId, orgId);

    if (!campaign) {
      return sendError(res, 404, "Campaign not found.");
    }

    if (campaign.status !== "draft") {
      return sendError(
        res,
        409,
        "CSV cannot be uploaded to a campaign that is already queued or sending."
      );
    }

    // req.file.buffer is the raw bytes of the CSV file.
    // parseCsv reads those bytes and turns each row into
    // a plain JavaScript object like:
    //   { email: "john@example.com", name: "John", company: "Acme" }
    const rows = await parseCsv(req.file.buffer);

    // extractRecipients pulls the email and all other columns
    // from each row and gives us a clean array to work with.
    const recipients = extractRecipients(rows);

    // If the CSV had no rows at all, there is nothing to save.
    if (!recipients || recipients.length === 0) {
      return sendError(res, 400, "The CSV file is empty or has no valid rows.");
    }

    // Every row must have an email — that is the minimum we need to send.
    // We check all rows upfront rather than failing halfway through saving.
    const missingEmail = recipients.some((r) => !r.email);
    if (missingEmail) {
      return sendError(
        res,
        400,
        "Every row in the CSV must have an email column."
      );
    }

    // Save all campaignJobs and update totalRecipients in one transaction.
    // If this throws, the catch block below will handle it.
    await saveRecipientsForCampaign(campaignId, orgId, recipients);

    return sendSuccess(res, 201, "CSV uploaded successfully.", {
      totalRecipients: recipients.length,
    });

  } catch (err) {
    return sendError(res, 500, "Failed to process CSV upload.", err.message);
  }
};
