const mongoose = require("mongoose");

const OAUTH_PROVIDERS = ["google"];

const oauthUserSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true, index: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    provider: {
      type: String,
      enum: OAUTH_PROVIDERS,
      default: "google",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("OAuthUser", oauthUserSchema);
module.exports.OAUTH_PROVIDERS = OAUTH_PROVIDERS;
