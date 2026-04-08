const { catchAsync } = require("../utils/catchAsync");
const { getChatSuggestions } = require("../services/chatSuggestions.service");

/**
 * GET /api/public/suggestions?session=<string>&limit=8
 */
const listPublicSuggestions = catchAsync(async (pick, res) => {
  const { query } = pick;
  const sessionKey = query.session || query.s || "";
  const limit = query.limit;

  const suggestions = await getChatSuggestions({ sessionKey, limit });

  res.status(200).json({
    success: true,
    data: { suggestions },
  });
});

module.exports = { listPublicSuggestions };
