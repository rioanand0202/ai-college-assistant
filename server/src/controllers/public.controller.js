const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const { runPublicAsk } = require("../services/publicAssistant.service");

/**
 * POST /api/public/ask
 * No JWT required. Optional Bearer OAuth JWT persists chat history for Google users.
 */
const publicAsk = catchAsync(async (pick, res) => {
  const { req, body } = pick;
  const { question } = body || {};

  if (!question || !String(question).trim()) {
    throw new AppError("question is required", 400);
  }

  const data = await runPublicAsk({
    question,
    oauthUser: req.oauthUser || null,
  });

  res.status(200).json({
    success: true,
    data,
  });
});

module.exports = { publicAsk };
