const ActivityLog = require("../models/ActivityLog.model");
const { getStore } = require("../context/requestContext");

const activityLogMiddleware = (req, res, next) => {
  res.on("finish", () => {
    const store = res.locals.__requestContextStore || getStore();
    if (!store?.activity?._persist) return;

    const cap = store.capture || {};
    const act = store.activity;

    const method = cap.method || req.method;
    const path = cap.path || req.originalUrl.split("?")[0];
    const ip = cap.ip || req.ip || req.socket?.remoteAddress || "";

    const userId = act.userId ?? (req.user && req.user.id) ?? null;

    const meta = {
      query: cap.query,
      body: cap.body,
    };
    if (req.user && req.user.collegeCode) {
      meta.collegeCode = req.user.collegeCode;
    }

    const summary =
      act.summary || `${method} ${path} — HTTP ${res.statusCode}`;

    setImmediate(() => {
      ActivityLog.create({
        method,
        path,
        statusCode: res.statusCode,
        ip,
        userId: userId || undefined,
        userEmail: act.userEmail ?? (req.user && req.user.email) ?? "",
        userName: act.userName ?? (req.user && req.user.name) ?? "",
        summary,
        meta,
      }).catch((err) => console.error("ActivityLog persist error:", err.message));
    });
  });

  next();
};

module.exports = activityLogMiddleware;
