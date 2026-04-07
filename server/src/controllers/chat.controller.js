const { catchAsync } = require("../utils/catchAsync");
const ChatMessage = require("../models/ChatMessage.model");

const listHistory = catchAsync(async (pick, res) => {
  const { req } = pick;
  const limit = Math.min(Number(req.query?.limit) || 50, 100);

  const rows = await ChatMessage.find({ userId: req.oauthUser.id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("question answer createdAt")
    .lean();

  res.status(200).json({
    success: true,
    data: { items: rows.reverse() },
  });
});

module.exports = { listHistory };
