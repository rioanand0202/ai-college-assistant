const express = require("express");
const validateBody = require("../middlewares/validate.middleware");
const resolveRegisterCollegeCode = require("../middlewares/registerCollegeCode.middleware");
const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
} = require("../validators/auth.validator");
const { requireAuth } = require("../middlewares/auth.middleware");
const { register, login, verifyOtp, getCurrentUser } = require("../controllers/auth.controller");

const router = express.Router();

router.post(
  "/register",
  resolveRegisterCollegeCode,
  validateBody(registerSchema),
  register,
);
router.post("/login", validateBody(loginSchema), login);
router.post("/verify-otp", validateBody(verifyOtpSchema), verifyOtp);

router.get("/me", requireAuth, getCurrentUser);

module.exports = router;
