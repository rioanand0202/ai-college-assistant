const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const { verifyAccessToken } = require("../utils/jwt.util");
const OAuthUser = require("../models/OAuthUser.model");

function bearerToken(req) {
  const auth = req.headers.authorization || "";
  return auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
}

/**
 * Resolve Google OAuth user from JWT (WebSocket auth, etc.).
 * @param {string | null | undefined} token
 * @returns {Promise<object | null>}
 */
async function resolveOAuthUserFromToken(token) {
  if (!token || typeof token !== "string") return null;
  const trimmed = token.trim();
  if (!trimmed) return null;
  try {
    const payload = verifyAccessToken(trimmed);
    if (payload.typ !== "access" || payload.authKind !== "oauth") return null;
    const id = String(payload.sub || "");
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const user = await OAuthUser.findById(id).lean();
    if (!user) return null;
    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      provider: user.provider,
    };
  } catch {
    return null;
  }
}

/**
 * If a valid OAuth access JWT is present, sets req.oauthUser. Does not error when missing/invalid.
 */
async function optionalOAuthAuth(req, _res, next) {
  req.oauthUser = null;
  const token = bearerToken(req);
  if (!token) return next();
  try {
    const u = await resolveOAuthUserFromToken(token);
    if (u) req.oauthUser = u;
  } catch {
    /* ignore */
  }
  next();
}

/**
 * Requires Bearer OAuth JWT (Google sign-in). College staff/student tokens are rejected.
 */
async function requireOAuthAuth(req, _res, next) {
  const token = bearerToken(req);
  if (!token) {
    return next(new AppError("Authorization Bearer token required", 401));
  }
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return next(new AppError("Invalid or expired access token", 401));
  }
  if (payload.typ !== "access" || payload.authKind !== "oauth") {
    return next(
      new AppError("This resource requires Google sign-in for the public assistant", 403),
    );
  }
  const id = String(payload.sub || "");
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid token payload", 401));
  }
  try {
    const user = await OAuthUser.findById(id).lean();
    if (!user) {
      return next(new AppError("User not found", 401));
    }
    req.oauthUser = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      provider: user.provider,
    };
    return next();
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  optionalOAuthAuth,
  requireOAuthAuth,
  bearerToken,
  resolveOAuthUserFromToken,
};
