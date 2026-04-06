const mongoose = require("mongoose");

const globalConfigurationSchema = new mongoose.Schema(
  {
    /** Ensures a single logical row for app-wide settings */
    key: {
      type: String,
      default: "default",
      unique: true,
      immutable: true,
    },
    /** When true, login returns MFA challenge instead of tokens */
    mfaOn: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("GlobalConfiguration", globalConfigurationSchema);
