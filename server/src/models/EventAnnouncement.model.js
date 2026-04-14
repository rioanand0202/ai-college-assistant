const mongoose = require("mongoose");

const KINDS = ["event", "announcement"];

const eventAnnouncementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: "", trim: true, maxlength: 8000 },
    kind: { type: String, enum: KINDS, required: true },
    /** Optional link (e.g. hall ticket PDF) when kind is announcement */
    linkUrl: { type: String, default: "", trim: true, maxlength: 2000 },
    isSingleDay: { type: Boolean, default: true },
    /** Inclusive start (UTC midnight of calendar day) */
    eventDate: { type: Date, required: true },
    /** Inclusive end (UTC midnight); equals eventDate for single-day */
    eventEndDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    collegeCode: { type: String, required: true, uppercase: true, trim: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
  },
  { timestamps: true },
);

eventAnnouncementSchema.index({ collegeCode: 1, isActive: 1, eventDate: 1 });

module.exports = mongoose.model("EventAnnouncement", eventAnnouncementSchema);
