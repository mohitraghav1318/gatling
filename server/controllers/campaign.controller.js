// controllers/campaign.controller.js

import * as campaignService from '../services/campaign.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

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
