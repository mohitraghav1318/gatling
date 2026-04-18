import * as mailConfigService from '../services/mailConfig.service.js';
import { sendSuccess, sendError } from '../utils/response.util.js';

// ─────────────────────────────────────────────
//  GET /api/org/:orgId/mail-config
//  Any org member can view the mail config.
//  If none exists yet, we return a 404 so the
//  frontend knows to show a "set it up" screen.
// ─────────────────────────────────────────────
export const getMailConfig = async (req, res) => {
  try {
    const config = await mailConfigService.getMailConfig(req.params.orgId);

    if (!config) {
      return sendError(res, 404, 'No mail config found for this org.');
    }

    return sendSuccess(res, 200, 'Mail config fetched.', config);
  } catch (err) {
    return sendError(res, 500, 'Failed to fetch mail config.', err.message);
  }
};

// ─────────────────────────────────────────────
//  POST /api/org/:orgId/mail-config
//  Owner-only. Creates the initial mail config.
//  If one already exists, we reject the request
//  to avoid duplicate docs — use PUT to update.
// ─────────────────────────────────────────────
export const createMailConfig = async (req, res) => {
  try {
    const { fromName, replyTo } = req.body;

    // Validate required fields before hitting the DB
    if (!fromName || !replyTo) {
      return sendError(res, 400, 'fromName and replyTo are required.');
    }

    // Prevent duplicates — one config per org
    const existing = await mailConfigService.getMailConfig(req.params.orgId);
    if (existing) {
      return sendError(
        res,
        409,
        'Mail config already exists. Use PUT to update.',
      );
    }

    const config = await mailConfigService.createMailConfig(req.params.orgId, {
      fromName,
      replyTo,
    });

    return sendSuccess(res, 201, 'Mail config created.', config);
  } catch (err) {
    return sendError(res, 500, 'Failed to create mail config.', err.message);
  }
};

// ─────────────────────────────────────────────
//  PUT /api/org/:orgId/mail-config
//  Owner-only. Updates fromName and/or replyTo.
//  If no config exists yet, we reject — use POST
//  first to create one before updating.
// ─────────────────────────────────────────────
export const updateMailConfig = async (req, res) => {
  try {
    const { fromName, replyTo } = req.body;

    if (!fromName || !replyTo) {
      return sendError(res, 400, 'fromName and replyTo are required.');
    }

    const updated = await mailConfigService.updateMailConfig(req.params.orgId, {
      fromName,
      replyTo,
    });

    // findOneAndUpdate returns null if no matching document was found
    if (!updated) {
      return sendError(res, 404, 'No mail config to update. Create one first.');
    }

    return sendSuccess(res, 200, 'Mail config updated.', updated);
  } catch (err) {
    return sendError(res, 500, 'Failed to update mail config.', err.message);
  }
};
