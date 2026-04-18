import MailConfig from '../models/mailConfig.model.js';

// ─────────────────────────────────────────────
//  GET — fetch the mail config for an org
//  Returns null if the org has not set one yet
// ─────────────────────────────────────────────
export const getMailConfig = async (orgId) => {
  return await MailConfig.findOne({ org: orgId });
};

// ─────────────────────────────────────────────
//  CREATE — save a new mail config for an org
//  Called only the first time (no existing doc)
// ─────────────────────────────────────────────
export const createMailConfig = async (orgId, { fromName, replyTo }) => {
  const config = new MailConfig({
    org: orgId,
    fromName,
    replyTo,
  });

  return await config.save();
};

// ─────────────────────────────────────────────
//  UPDATE — overwrite fields on an existing doc
//  $set means only the provided fields change,
//  everything else on the document stays intact
// ─────────────────────────────────────────────
export const updateMailConfig = async (orgId, { fromName, replyTo }) => {
  return await MailConfig.findOneAndUpdate(
    { org: orgId }, // find the doc belonging to this org
    { $set: { fromName, replyTo } }, // update only these two fields
    { new: true }, // return the updated doc, not the old one
  );
};
