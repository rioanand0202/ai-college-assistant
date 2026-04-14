const EventAnnouncement = require("../models/EventAnnouncement.model");
const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");

/** UTC midnight for calendar day YYYY-MM-DD */
function utcMidnightFromYmd(ymd) {
  const [y, m, d] = String(ymd).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function startOfTodayUtc() {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate(), 0, 0, 0, 0));
}

/** Deactivate expired rows for a college, then return active list. */
const listPublicEventAnnouncements = catchAsync(async (pick, res) => {
  const { req } = pick;
  const collegeCode = String(req.query.collegeCode || "")
    .trim()
    .toUpperCase();
  if (!collegeCode) {
    throw new AppError("Query parameter collegeCode is required", 400);
  }

  const today = startOfTodayUtc();

  await EventAnnouncement.updateMany(
    {
      isActive: true,
      collegeCode,
      eventEndDate: { $lt: today },
    },
    { $set: { isActive: false } },
  );

  const items = await EventAnnouncement.find({ isActive: true, collegeCode })
    .sort({ eventDate: 1, createdAt: -1 })
    .select("-__v")
    .lean();

  res.status(200).json({ success: true, data: { items } });
});

const createEventAnnouncement = catchAsync(async (pick, res) => {
  const { req, body } = pick;
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }
  const collegeCode = String(req.user.collegeCode || "").toUpperCase();
  const {
    title,
    description,
    kind,
    linkUrl: rawLink,
    isSingleDay,
    eventDate: eventDateStr,
    eventEndDate: eventEndStr,
  } = body;

  let linkUrl = String(rawLink || "").trim();
  if (linkUrl && !/^https?:\/\//i.test(linkUrl)) {
    linkUrl = `https://${linkUrl}`;
  }

  const start = utcMidnightFromYmd(eventDateStr);
  const end = isSingleDay
    ? utcMidnightFromYmd(eventDateStr)
    : utcMidnightFromYmd(eventEndStr);

  const today = startOfTodayUtc();
  if (start < today) {
    throw new AppError("eventDate cannot be in the past", 400);
  }
  if (end < today) {
    throw new AppError("eventEndDate cannot be in the past", 400);
  }
  if (end < start) {
    throw new AppError("eventEndDate must be on or after eventDate", 400);
  }

  if (kind === "announcement" && linkUrl) {
    try {
      // eslint-disable-next-line no-new
      new URL(linkUrl);
    } catch {
      throw new AppError("linkUrl must be a valid URL", 400);
    }
  }

  const doc = await EventAnnouncement.create({
    title,
    description: description || "",
    kind,
    linkUrl: kind === "announcement" && linkUrl ? String(linkUrl).trim() : "",
    isSingleDay: Boolean(isSingleDay),
    eventDate: start,
    eventEndDate: end,
    isActive: true,
    collegeCode,
    createdBy: req.user.id,
  });

  res.status(201).json({
    success: true,
    message: "Created",
    data: { item: doc },
  });
});

const listAdminEventAnnouncements = catchAsync(async (pick, res) => {
  const { req } = pick;
  if (!req.user) {
    throw new AppError("Unauthorized", 401);
  }
  const collegeCode = String(req.user.collegeCode || "").toUpperCase();
  const items = await EventAnnouncement.find({ collegeCode })
    .sort({ eventDate: -1, createdAt: -1 })
    .lean();
  res.status(200).json({ success: true, data: { items } });
});

module.exports = {
  listPublicEventAnnouncements,
  createEventAnnouncement,
  listAdminEventAnnouncements,
};
