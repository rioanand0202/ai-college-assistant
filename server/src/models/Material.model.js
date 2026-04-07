const mongoose = require("mongoose");

const materialSchema = new mongoose.Schema({
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
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
  /** Relative URL path served under /uploads when file upload */
  filePath: { type: String, default: null },
  /** External link when upload is URL */
  sourceUrl: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Material", materialSchema);
