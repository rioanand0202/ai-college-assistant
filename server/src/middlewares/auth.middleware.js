const crypto = require("crypto");
const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const { verifyAccessToken } = require("../utils/jwt.util");
const Users = require("../models/Users.model");

const headerUserId = (req) => req.headers["x-user-id"] || req.headers["user_id"];

const headerCollegeCode = (req) =>
  req.headers["x-college-code"] || req.headers["college_code"];

const isAppLocal = () =>
  String(process.env.APP_LOCAL || "").toLowerCase() === "true";

/** Used when APP_LOCAL skips auth: no real user id so ActivityLog omits userId. */
const localBypassUser = () => ({
  name: "Local bypass",
  email: "local@bypass",
  role: "admin",
  collegeCode: "LOCAL",
});

const timingSafeStringEqual = (a, b) => {
  const x = Buffer.from(String(a), "utf8");
  const y = Buffer.from(String(b), "utf8");
  if (x.length !== y.length) return false;
  return crypto.timingSafeEqual(x, y);
};

const requireAuth = async (req, res, next) => {
  try {
    if (isAppLocal()) {
      const tryAttachUser = async (rawId) => {
        if (!rawId || !mongoose.Types.ObjectId.isValid(String(rawId))) return null;
        const u = await Users.findById(rawId).select("name email role collegeCode");
        if (!u) return null;
        return {
          id: u._id.toString(),
          name: u.name,
          email: u.email,
          role: u.role,
          collegeCode: String(u.collegeCode || "").toUpperCase(),
        };
      };

      const fromHeader = await tryAttachUser(headerUserId(req));
      if (fromHeader) {
        req.user = fromHeader;
        return next();
      }

      const fromEnv = await tryAttachUser(process.env.LOCAL_DEV_USER_ID);
      if (fromEnv) {
        req.user = fromEnv;
        return next();
      }

      req.user = localBypassUser();
      return next();
    }

    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
    if (!token) {
      throw new AppError("Authorization Bearer token required", 401);
    }

    const rawHeaderId = headerUserId(req);
    if (!rawHeaderId) {
      throw new AppError("user id header required (x-user-id or user_id)", 401);
    }

    const rawCollegeCode = headerCollegeCode(req);
    if (!rawCollegeCode) {
      throw new AppError("college code header required (x-college-code or college_code)", 401);
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new AppError("Invalid or expired access token", 401);
    }

    if (payload.typ !== "access") {
      throw new AppError("Invalid token type", 401);
    }

    const tokenUserId = String(payload.sub);
    if (tokenUserId !== String(rawHeaderId)) {
      throw new AppError("Token does not match user id header", 403);
    }

    const tokenCollege = payload.collegeCode != null ? String(payload.collegeCode).toUpperCase() : "";
    const headerCollege = String(rawCollegeCode).trim().toUpperCase();
    if (!tokenCollege || !timingSafeStringEqual(tokenCollege, headerCollege)) {
      throw new AppError("college code header does not match signed token", 403);
    }

    const user = await Users.findById(tokenUserId).select("name email role collegeCode");
    if (!user) {
      throw new AppError("User not found", 401);
    }

    if (String(user.collegeCode).toUpperCase() !== tokenCollege) {
      throw new AppError("Token college code is out of date; sign in again", 403);
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      collegeCode: tokenCollege,
    };
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireAuth, headerUserId, headerCollegeCode, isAppLocal };
