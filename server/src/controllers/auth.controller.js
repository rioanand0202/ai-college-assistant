const bcrypt = require("bcryptjs");
const Users = require("../models/Users.model");
const College = require("../models/College.model");
const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const {
  asyncHookFun,
  commitActivityLog,
} = require("../context/requestContext");
const {
  getGlobalConfiguration,
} = require("../services/globalConfiguration.service");
const { signAccessToken, signRefreshToken } = require("../utils/jwt.util");
const {
  generateOtp,
  hashOtp,
  verifyOtp: verifyOtpHash,
} = require("../utils/otp.util");
const {
  ROLE,
  YEARANDSEMESTER,
  USER_STATUS,
  DEGREE,
  DEPARTMENT,
} = require("../utils/constants");
const { YEAR1, SEM1 } = YEARANDSEMESTER;

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

const staffDefaults = () => ({
  degree: DEGREE.BSC,
  department: DEPARTMENT.GENERAL,
  year: YEAR1,
  semester: SEM1,
});

const register = catchAsync(async (pick, res) => {
  const { req, body } = pick;
  const { name, email, password, role, degree, department, year, semester } =
    body;
  const collegeCode = req.collegeCode;

  asyncHookFun(req);

  const college = await College.findOne({ code: collegeCode });
  if (!college) {
    throw new AppError("Invalid college code", 400);
  }

  const existing = await Users.findOne({ email });
  if (existing) {
    commitActivityLog({
      summary: "Registration failed: email already registered",
      userEmail: email,
    });
    throw new AppError("Email already registered", 409);
  }

  const isStaff = role === ROLE.STAFF;
  const defaults = staffDefaults();
  const yearFinal = isStaff ? year || defaults.year : year;
  const semesterFinal = isStaff ? semester || defaults.semester : semester;
  const degreeFinal = isStaff ? degree || defaults.degree : degree;
  const departmentFinal = isStaff
    ? department || defaults.department
    : department;
  const status = isStaff ? USER_STATUS.PENDING : USER_STATUS.APPROVED;

  const hashed = await bcrypt.hash(password, 12);
  const user = await Users.create({
    name,
    email,
    password: hashed,
    collegeCode,
    role,
    degree: degreeFinal,
    department: departmentFinal,
    year: yearFinal,
    semester: semesterFinal,
    status,
  });

  commitActivityLog({
    summary: isStaff
      ? "Staff registration pending admin approval"
      : "Registration successful",
    userId: user._id,
    userEmail: user.email,
    userName: user.name,
  });

  if (isStaff) {
    return res.status(201).json({
      success: true,
      pendingApproval: true,
      message: "Registration successful. Waiting for admin approval.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          collegeCode: String(user.collegeCode || "").toUpperCase(),
        },
      },
    });
  }
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
        status: user.status,
        collegeCode: String(user.collegeCode || "").toUpperCase(),
      },
      ...tokens,
    },
  });
});

const assertStaffCanLogin = (user) => {
  if (user.role !== ROLE.STAFF) return;
  const st = user.status || USER_STATUS.APPROVED;
  if (st === USER_STATUS.PENDING) {
    throw new AppError("Waiting for admin approval", 403);
  }
  if (st === USER_STATUS.REJECTED) {
    throw new AppError("Your registration was rejected", 403);
  }
};

const login = catchAsync(async (pick, res) => {
  const { req, body } = pick;
  const { email, password, collegeCode } = body;
  const cc = String(collegeCode || "").toUpperCase();

  asyncHookFun(req);

  const college = await College.findOne({ code: cc });
  if (!college) {
    throw new AppError("Invalid college code", 400);
  }

  const user = await Users.findOne({ email, collegeCode: cc }).select(
    "+password status collegeCode",
  );
  if (!user) {
    commitActivityLog({
      summary: "Login failed: user not found",
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

  try {
    assertStaffCanLogin(user);
  } catch (e) {
    commitActivityLog({
      summary: `Login blocked: ${e.message}`,
      userId: user._id,
      userEmail: user.email,
      userName: user.name,
    });
    throw e;
  }

  const config = await getGlobalConfiguration();

  if (config.mfaOn) {
    const otp = generateOtp();
    user.otp = hashOtp(otp);
    user.expiry_time = new Date(Date.now() + MFA_OTP_TTL_MS);
    await user.save();

    if (
      process.env.NODE_ENV !== "production" ||
      process.env.LOG_MFA_OTP === "true"
    ) {
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
      message:
        "OTP sent. Verify with POST /api/auth/verify-otp to receive tokens.",
      data: {
        email: user.email,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          collegeCode: String(user.collegeCode || "").toUpperCase(),
        },
      },
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
        status: user.status,
        collegeCode: String(user.collegeCode || "").toUpperCase(),
      },
      ...tokens,
    },
  });
});

const verifyOtp = catchAsync(async (pick, res) => {
  const { req, body } = pick;
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

  const user = await Users.findOne({ email }).select(
    "+otp +expiry_time status role",
  );
  if (!user || !user.otp || !user.expiry_time) {
    commitActivityLog({
      summary: "OTP verify failed: no pending OTP",
      userEmail: email,
    });
    throw new AppError("No pending OTP for this email. Log in again.", 400);
  }

  if (user.expiry_time.getTime() < Date.now()) {
    await Users.updateOne(
      { _id: user._id },
      { $unset: { otp: 1, expiry_time: 1 } },
    );
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

  await Users.updateOne(
    { _id: user._id },
    { $unset: { otp: 1, expiry_time: 1 } },
  );

  try {
    assertStaffCanLogin(user);
  } catch (e) {
    throw e;
  }

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
        status: user.status,
        collegeCode: String(user.collegeCode || "").toUpperCase(),
      },
      ...tokens,
    },
  });
});

const getCurrentUser = catchAsync(async (pick, res) => {
  const { req } = pick;
  const user = await Users.findById(req.user.id).select(
    "name email role collegeCode degree department year semester status",
  );
  if (!user) {
    throw new AppError("User not found", 404);
  }
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        degree: user.degree,
        department: user.department,
        year: user.year,
        semester: user.semester,
        status: user.status,
        collegeCode: String(user.collegeCode || "").toUpperCase(),
      },
    },
  });
});

module.exports = { register, login, verifyOtp, getCurrentUser };
