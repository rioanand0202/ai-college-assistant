const Joi = require("joi");
const { ROLE, DEGREE, YEARANDSEMESTER } = require("../utils/constants");

const roleValues = Object.values(ROLE);
const degreeValues = Object.values(DEGREE);
const { YEAR1, YEAR2, YEAR3, SEM1, SEM2 } = YEARANDSEMESTER;
const yearValues = [YEAR1, YEAR2, YEAR3];
const semesterValues = [SEM1, SEM2];

/** Use on `x-college-code` / `college_code` / `college-code` header (not body). */
const collegeCodeHeaderSchema = Joi.string()
  .trim()
  .min(2)
  .max(64)
  .pattern(/^[a-zA-Z0-9_-]+$/)
  .uppercase()
  .required()
  .messages({
    "any.required": "College code header is required (use x-college-code or college_code)",
    "string.empty": "College code header cannot be empty",
    "string.min": "College code must be at least {#limit} characters",
    "string.pattern.base": "College code may only contain letters, numbers, underscore, and hyphen",
  });

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string().valid(...roleValues).default(ROLE.STUDENT),
  degree: Joi.string().valid(...degreeValues).required(),
  department: Joi.string().trim().min(2).max(120).required(),
  year: Joi.string().valid(...yearValues).required(),
  semester: Joi.string().valid(...semesterValues).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
});

module.exports = {
  collegeCodeHeaderSchema,
  registerSchema,
  loginSchema,
  verifyOtpSchema,
};
