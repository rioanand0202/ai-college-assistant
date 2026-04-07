const mongoose = require("mongoose");

const MATERIAL_TYPES = ["notes", "question_paper"];

const materialSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    default: "",
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    default: null,
  },
  collegeCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  degree: { type: String, required: true },
  department: { type: String, required: true },
  year: { type: String, required: true },
  semester: { type: String, required: true },
  subject: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: MATERIAL_TYPES,
    default: "notes",
  },
  /** Relative URL path served under /uploads when file upload */
  filePath: { type: String, default: null },
  /** External link when upload is URL */
  sourceUrl: { type: String, default: null },
  /** RAG ingestion status (PDF file uploads only) */
  ragStatus: {
    type: String,
    enum: ["skipped", "pending", "ready", "failed"],
    default: "skipped",
  },
  ragError: { type: String, default: null },
  chunkCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const Material = mongoose.model("Material", materialSchema);

module.exports = Material;
module.exports.MATERIAL_TYPES = MATERIAL_TYPES;
