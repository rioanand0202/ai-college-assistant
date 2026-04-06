const ActivityLog = require("../models/ActivityLog.model");
const { catchAsync } = require("../utils/catchAsync");
// const { asyncHookFun, commitActivityLog } = require("../context/requestContext");

const listActivityLogs = catchAsync(async (pick, res) => {
  const { req, query } = pick;

  // asyncHookFun(req);

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.user.role === "admin") {
    if (query.userId) filter.userId = query.userId;
  } else {
    filter.userId = req.user.id;
  }

  const [items, total] = await Promise.all([
    ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    ActivityLog.countDocuments(filter),
  ]);

  // commitActivityLog({
  //   summary: "Activity logs listed",
  //   userId: req.user.id,
  //   userEmail: req.user.email,
  //   userName: req.user.name,
  // });

  res.status(200).json({
    success: true,
    data: {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 0,
    },
  });
});

module.exports = { listActivityLogs };
