const mongoose = require("mongoose");
const { ROLE, DEGREE, YEARANDSEMESTER } = require("../utils/constants");

const { STUDENT, ADMIN, STAFF, SUPER_ADMIN, INCHARGE, HOD } = ROLE;
const { BSC, MSC, BA, MA, SCHOLAR, BCOM, BBA, BCA, MCA } = DEGREE;
const { YEAR1, YEAR2, YEAR3, SEM1, SEM2 } = YEARANDSEMESTER;

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    select: false,
  },
  /** Tenant / institution code; also embedded in JWT (not returned in API user JSON). */
  collegeCode: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  /** HMAC hash of MFA OTP (plaintext never stored) */
  otp: {
    type: String,
    select: false,
  },
  expiry_time: {
    type: Date,
    select: false,
  },
  role: {
    type: String,
    enum: [STUDENT, ADMIN, STAFF, SUPER_ADMIN, INCHARGE, HOD],
    default: STUDENT,
  },
  degree: {
    type: String,
    required: true,
    enum: [BSC, MSC, BA, MA, SCHOLAR, BCOM, BBA, BCA, MCA],
  },
  department: {
    type: String,
    required: true,
  },
  year: {
    type: String,
    required: true,
    enum: [YEAR1, YEAR2, YEAR3],
  },
  semester: {
    type: String,
    required: true,
    enum: [SEM1, SEM2],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre("save", function () {
  this.updatedAt = new Date();
});

module.exports = mongoose.model("Users", userSchema);
