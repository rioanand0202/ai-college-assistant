const express = require("express");
const passport = require("passport");
const validateBody = require("../middlewares/validate.middleware");
const resolveRegisterCollegeCode = require("../middlewares/registerCollegeCode.middleware");
const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  refreshTokenSchema,
} = require("../validators/auth.validator");
const { requireAuth } = require("../middlewares/auth.middleware");
const { requireOAuthAuth } = require("../middlewares/oauthAuth.middleware");
const { signOAuthAccessToken } = require("../utils/jwt.util");
const {
  register,
  login,
  verifyOtp,
  refreshAccess,
  getCurrentUser,
} = require("../controllers/auth.controller");
const { getOAuthMe } = require("../controllers/oauthUser.controller");

const router = express.Router();

function googleOAuthConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}

const clientBase = () =>
  (process.env.CLIENT_URL || "http://localhost:3000").replace(/\/$/, "");

router.post(
  "/register",
  resolveRegisterCollegeCode,
  validateBody(registerSchema),
  register,
);
router.post("/login", validateBody(loginSchema), login);
router.post("/refresh", validateBody(refreshTokenSchema), refreshAccess);
router.post("/verify-otp", validateBody(verifyOtpSchema), verifyOtp);

router.get("/me", requireAuth, getCurrentUser);

router.get("/oauth/me", requireOAuthAuth, getOAuthMe);

router.get("/google", (req, res, next) => {
  if (!googleOAuthConfigured()) {
    return res.status(503).json({
      success: false,
      message: "Google OAuth is not configured on the server",
    });
  }
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: true,
  })(req, res, next);
});

router.get(
  "/google/callback",
  (req, res, next) => {
    if (!googleOAuthConfigured()) {
      return res.status(503).send("Google OAuth is not configured");
    }
    passport.authenticate("google", {
      session: false,
      failureRedirect: `${clientBase()}/?oauth=error`,
    })(req, res, next);
  },
  (req, res) => {
    const user = req.user;
    if (!user) {
      return res.redirect(`${clientBase()}/?oauth=error`);
    }
    const token = signOAuthAccessToken({
      sub: user._id.toString(),
      email: user.email,
      name: user.name,
    });
    res.redirect(
      `${clientBase()}/auth/google/callback#token=${encodeURIComponent(token)}`,
    );
  },
);

module.exports = router;
