const { collegeCodeHeaderSchema } = require("../validators/auth.validator");

const readCollegeCodeHeader = (req) => {
  const h = req.headers;
  return (
    h["x-college-code"] ||
    h["college_code"] ||
    h["college-code"] ||
    h["x-collegecode"]
  );
};

/**
 * Registration: college code from `x-college-code` / `college_code` header OR `collegeCode` in JSON body
 * (body is parsed by express.json before this runs). Sets `req.collegeCode` (uppercase).
 */
const resolveRegisterCollegeCode = (req, res, next) => {
  const fromHeader = readCollegeCodeHeader(req);
  const fromBody =
    req.body && typeof req.body.collegeCode === "string" ? req.body.collegeCode : undefined;

  const headerTrim =
    fromHeader !== undefined && fromHeader !== null ? String(fromHeader).trim() : "";
  const bodyTrim =
    fromBody !== undefined && fromBody !== null ? String(fromBody).trim() : "";

  const raw = headerTrim || bodyTrim;

  if (!raw) {
    return res.status(400).json({
      success: false,
      message:
        "College code is required. Send the x-college-code header and/or collegeCode in the JSON body.",
    });
  }

  const { error, value } = collegeCodeHeaderSchema.validate(raw, { abortEarly: false });
  if (error) {
    const message = error.details.map((d) => d.message).join("; ");
    return res.status(400).json({ success: false, message });
  }

  req.collegeCode = value;
  if (req.body && Object.prototype.hasOwnProperty.call(req.body, "collegeCode")) {
    delete req.body.collegeCode;
  }
  next();
};

module.exports = resolveRegisterCollegeCode;
