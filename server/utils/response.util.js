// Shared API response helpers keep controller responses consistent.
function sendSuccess(res, status, message, data = null) {
  return res.status(status).json({
    success: true,
    message,
    data,
  });
}

function sendError(res, status, message) {
  return res.status(status).json({
    success: false,
    message,
  });
}

module.exports = {
  sendSuccess,
  sendError,
};
