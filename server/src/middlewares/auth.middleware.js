const mongoose = require("mongoose");
const AppError = require("../utils/appError");
const { verifyAccessToken } = require("../utils/jwt.util");
const Users = require("../models/Users.model");

const isAppLocal = () =>
  String(process.env.APP_LOCAL || "").toLowerCase() === "true";

const localBypassUser = () => ({
  id: "local",
  userId: "local",
  name: "Local bypass",
  email: "local@bypass",
  role: "admin",
  collegeCode: "LOCAL",
  status: "approved",
});

/**
 * Protected routes: Bearer JWT when present (same in production and APP_LOCAL).
 * College and user id come from the token payload + DB user row.
 *
 * If APP_LOCAL and no Bearer token: x-user-id, LOCAL_DEV_USER_ID, or synthetic bypass.
 */
const requireAuth = async (req, res, next) => {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;

    if (token) {
      let payload;
      try {
        payload = verifyAccessToken(token);
      } catch {
        return next(new AppError("Invalid or expired access token", 401));
      }

      if (payload.typ !== "access") {
        return next(new AppError("Invalid token type", 401));
      }

      const userId = String(payload.sub);
      const tokenCollege = String(payload.collegeCode || "").toUpperCase();
      console.log({ userId, tokenCollege });
      if (
        !userId ||
        !tokenCollege ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        return next(new AppError("Invalid token payload", 401));
      }

      const user = await Users.findById(userId).select(
        "name email role collegeCode status",
      );
      if (!user) {
        return next(new AppError("User not found", 401));
      }

      const dbCollege = String(user.collegeCode || "").toUpperCase();
      if (dbCollege !== tokenCollege) {
        return next(new AppError("Token is out of date; sign in again", 403));
      }

      req.user = {
        id: userId,
        userId,
        name: user.name,
        email: user.email,
        role: user.role,
        collegeCode: tokenCollege,
        status: user.status,
      };
      return next();
    }

    if (!isAppLocal()) {
      return next(new AppError("Authorization Bearer token required", 401));
    }

    const rawId = req.headers["x-user-id"] || req.headers["user_id"];
    if (rawId && mongoose.Types.ObjectId.isValid(String(rawId))) {
      const u = await Users.findById(rawId).select(
        "name email role collegeCode status",
      );
      if (u) {
        const id = u._id.toString();
        req.user = {
          id,
          userId: id,
          name: u.name,
          email: u.email,
          role: u.role,
          collegeCode: String(u.collegeCode || "").toUpperCase(),
          status: u.status,
        };
        return next();
      }
    }

    if (
      process.env.LOCAL_DEV_USER_ID &&
      mongoose.Types.ObjectId.isValid(process.env.LOCAL_DEV_USER_ID)
    ) {
      const u = await Users.findById(process.env.LOCAL_DEV_USER_ID).select(
        "name email role collegeCode status",
      );
      if (u) {
        const id = u._id.toString();
        req.user = {
          id,
          userId: id,
          name: u.name,
          email: u.email,
          role: u.role,
          collegeCode: String(u.collegeCode || "").toUpperCase(),
          status: u.status,
        };
        return next();
      }
    }

    req.user = localBypassUser();
    return next();
  } catch (err) {
    next(err);
  }
};

module.exports = { requireAuth, isAppLocal };
