const bcrypt = require("bcryptjs");
const Users = require("../models/Users.model");
const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const { asyncHookFun, commitActivityLog } = require("../context/requestContext");
const { getGlobalConfiguration } = require("../services/globalConfiguration.service");
const { signAccessToken, signRefreshToken } = require("../utils/jwt.util");
const { generateOtp, hashOtp, verifyOtp: verifyOtpHash } = require("../utils/otp.util");

const MFA_OTP_TTL_MS = 10 * 60 * 1000;

const issueTokens = (user) => {
  const collegeCode = String(user.collegeCode || "").toUpperCase();
  const payload = {
    sub: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    collegeCode,
  };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken({
      sub: user._id.toString(),
      collegeCode,
    }),
  };
};

const register = catchAsync(async (pick, res) => {//need to remove college code from this header
  const { req, body } = pick;
  const collegeCode = req.collegeCode;
  const { name, email, password, role, degree, department, year, semester } = body;

  asyncHookFun(req);

  const existing = await Users.findOne({ email });
  if (existing) {
    commitActivityLog({
      summary: "Registration failed: email already registered",
      userEmail: email,
    });
    throw new AppError("Email already registered", 409);
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await Users.create({
    name,
    email,
    password: hashed,
    collegeCode,
    role,
    degree,
    department,
    year,
    semester,
  });

  commitActivityLog({
    summary: "Registration successful",
    userId: user._id,
    userEmail: user.email,
    userName: user.name,
  });

  const tokens = issueTokens(user);
  res.status(201).json({
    success: true,
    message: "Account created",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    },
  });
});

const login = catchAsync(async (pick, res) => {
  const { req, body } = pick;
  const collegeCode = req.collegeCode;
  const { email, password } = body;

  asyncHookFun(req);

  const user = await Users.findOne({ email }).select("+password");

  if (!user) {
    commitActivityLog({
      summary: "Login failed: user not found",
      userEmail: email,
    });
    throw new AppError("Invalid email or password", 401);
  }

  if (String(user.collegeCode || "").toUpperCase() !== String(collegeCode).toUpperCase()) {
    commitActivityLog({
      summary: "Login failed: college code mismatch",
      userEmail: email,
    });
    throw new AppError("Invalid email or password", 401);
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    commitActivityLog({
      summary: "Login failed: incorrect password",
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
    });
    throw new AppError("Invalid email or password", 401);
  }

  const config = await getGlobalConfiguration();

  if (config.mfaOn) {
    const otp = generateOtp();
    user.otp = hashOtp(otp);
    user.expiry_time = new Date(Date.now() + MFA_OTP_TTL_MS);
    await user.save();

    if (process.env.NODE_ENV !== "production" || process.env.LOG_MFA_OTP === "true") {
      console.info(`[MFA] OTP for ${email}: ${otp} (dev / LOG_MFA_OTP only)`);
    }

    commitActivityLog({
      summary: "Login: MFA OTP issued (tokens withheld until verification)",
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
    });

    return res.status(200).json({
      success: true,
      mfaRequired: true,
      message: "OTP sent. Verify with POST /api/auth/verify-otp to receive tokens.",
      data: { email: user.email },
    });
  }

  commitActivityLog({
    summary: "Login successful",
    userId: user._id,
    userEmail: user.email,
    userName: user.name,
  });

  const tokens = issueTokens(user);
  res.status(200).json({
    success: true,
    mfaRequired: false,
    message: "Login successful",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    },
  });
});

const verifyOtp = catchAsync(async (pick, res) => {
  const { req, body } = pick;
  const collegeCode = req.collegeCode;
  const { email, otp } = body;

  asyncHookFun(req);

  const config = await getGlobalConfiguration();
  if (!config.mfaOn) {
    commitActivityLog({
      summary: "OTP verify rejected: MFA disabled globally",
      userEmail: email,
    });
    throw new AppError("MFA is not enabled; use normal login.", 400);
  }

  const user = await Users.findOne({ email }).select("+otp +expiry_time");
  if (!user || !user.otp || !user.expiry_time) {
    commitActivityLog({
      summary: "OTP verify failed: no pending OTP",
      userEmail: email,
    });
    throw new AppError("No pending OTP for this email. Log in again.", 400);
  }

  if (String(user.collegeCode || "").toUpperCase() !== String(collegeCode).toUpperCase()) {
    commitActivityLog({
      summary: "OTP verify failed: college code mismatch",
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
    });
    throw new AppError("Invalid college code for this account", 403);
  }

  if (user.expiry_time.getTime() < Date.now()) {
    await Users.updateOne({ _id: user._id }, { $unset: { otp: 1, expiry_time: 1 } });
    commitActivityLog({
      summary: "OTP verify failed: OTP expired",
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
    });
    throw new AppError("OTP expired. Log in again.", 401);
  }

  if (!verifyOtpHash(otp, user.otp)) {
    commitActivityLog({
      summary: "OTP verify failed: incorrect OTP",
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
    });
    throw new AppError("Invalid OTP", 401);
  }

  await Users.updateOne({ _id: user._id }, { $unset: { otp: 1, expiry_time: 1 } });

  commitActivityLog({
    summary: "MFA OTP verified; tokens issued",
    userId: user._id,
    userEmail: user.email,
    userName: user.name,
  });

  const tokens = issueTokens(user);
  res.status(200).json({
    success: true,
    message: "OTP verified",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    },
  });
});

module.exports = { register, login, verifyOtp };
