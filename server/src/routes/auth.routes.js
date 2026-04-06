const express = require("express");
const validateBody = require("../middlewares/validate.middleware");
const requireCollegeCodeHeader = require("../middlewares/collegeCodeHeader.middleware");
const {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
} = require("../validators/auth.validator");
const { register, login, verifyOtp } = require("../controllers/auth.controller");

const router = express.Router();

router.post(
  "/register",
  requireCollegeCodeHeader,
  validateBody(registerSchema),
  register,
);
router.post(
  "/login",
  requireCollegeCodeHeader,
  validateBody(loginSchema),
  login,
);
router.post(
  "/verify-otp",
  requireCollegeCodeHeader,
  validateBody(verifyOtpSchema),
  verifyOtp,
);

module.exports = router;
