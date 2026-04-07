const AppError = require("../utils/appError");

/**
 * @param {string[]} allowedRoles - lower-case role strings (matches Users.role)
 */
const requireRole = (...allowedRoles) => (req, res, next) => {
  if (!req.user || !req.user.role) {
    return next(new AppError("Unauthorized", 401));
  }
  const r = String(req.user.role).toLowerCase();
  const ok = allowedRoles.some((a) => String(a).toLowerCase() === r);
  if (!ok) {
    return next(new AppError("Forbidden", 403));
  }
  next();
};

module.exports = requireRole;
