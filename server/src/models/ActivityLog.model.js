const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    method: { type: String, required: true },
    path: { type: String, required: true },
    statusCode: { type: Number, required: true },
    ip: { type: String, default: "" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", default: null },
    userEmail: { type: String, default: "" },
    userName: { type: String, default: "" },
    /** Human-readable outcome, e.g. "Login successful", "Login failed: incorrect password" */
    summary: { type: String, default: "" },
    /** Sanitized request snapshot (no passwords / tokens) */
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
