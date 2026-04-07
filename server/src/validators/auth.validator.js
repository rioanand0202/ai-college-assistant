const Joi = require("joi");
const { ROLE, DEGREE, YEARANDSEMESTER } = require("../utils/constants");

const roleValues = Object.values(ROLE);
const degreeValues = Object.values(DEGREE);
const { YEAR1, YEAR2, YEAR3, SEM1, SEM2 } = YEARANDSEMESTER;
const yearValues = [YEAR1, YEAR2, YEAR3];
const semesterValues = [SEM1, SEM2];

/** College code: register resolves from header or JSON (registerCollege middleware). Login sends `collegeCode` in JSON. Protected routes use `collegeCode` from the JWT only. */
const collegeCodeHeaderSchema = Joi.string()
  .trim()
  .min(2)
  .max(64)
  .pattern(/^[a-zA-Z0-9_-]+$/)
  .uppercase()
  .required()
  .messages({
    "any.required": "College code is required (send x-college-code or college_code header)",
    "string.empty": "College code cannot be empty",
    "string.min": "College code must be at least {#limit} characters",
    "string.pattern.base": "College code may only contain letters, numbers, underscore, and hyphen",
  });

const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(128).required(),
  role: Joi.string().valid(...roleValues).default(ROLE.STUDENT),
  degree: Joi.when("role", {
    is: ROLE.STAFF,
    then: Joi.string().valid(...degreeValues).optional(),
    otherwise: Joi.string().valid(...degreeValues).required(),
  }),
  department: Joi.when("role", {
    is: ROLE.STAFF,
    then: Joi.string().trim().min(2).max(120).optional(),
    otherwise: Joi.string().trim().min(2).max(120).required(),
  }),
  year: Joi.when("role", {
    is: ROLE.STAFF,
    then: Joi.string().valid(...yearValues).optional(),
    otherwise: Joi.string().valid(...yearValues).required(),
  }),
  semester: Joi.when("role", {
    is: ROLE.STAFF,
    then: Joi.string().valid(...semesterValues).optional(),
    otherwise: Joi.string().valid(...semesterValues).required(),
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  collegeCode: collegeCodeHeaderSchema,
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().trim().min(10).required(),
});

module.exports = {
  collegeCodeHeaderSchema,
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  refreshTokenSchema,
};
