const { collegeCodeHeaderSchema } = require("../validators/auth.validator");

/**
 * Requires `x-college-code` or `college_code` header (same rules as former body field).
 * Sets `req.collegeCode` (uppercase).
 */
const readCollegeCodeHeader = (req) => {
  const h = req.headers;
  return (
    h["x-college-code"] ||
    h["college_code"] ||
    h["college-code"] ||
    h["x-collegecode"]
  );
};

const requireCollegeCodeHeader = (req, res, next) => {
  const raw = readCollegeCodeHeader(req);
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return res.status(400).json({
      success: false,
      message:
        "Missing college code header. Send x-college-code or college_code (same value you will use with authenticated requests).",
    });
  }
  const { error, value } = collegeCodeHeaderSchema.validate(raw, { abortEarly: false });
  if (error) {
    const message = error.details.map((d) => d.message).join("; ");
    return res.status(400).json({ success: false, message });
  }
  req.collegeCode = value;
  next();
};

module.exports = requireCollegeCodeHeader;
module.exports.readCollegeCodeHeader = readCollegeCodeHeader;
