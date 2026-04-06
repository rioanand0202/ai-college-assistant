const crypto = require("crypto");

const pepper = () => process.env.OTP_PEPPER || "dev-otp-pepper-change-me";

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const hashOtp = (otp) =>
  crypto.createHmac("sha256", pepper()).update(String(otp)).digest("hex");

const verifyOtp = (plain, hashed) => {
  if (!plain || !hashed) return false;
  const a = Buffer.from(hashOtp(plain), "hex");
  const b = Buffer.from(hashed, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
};

module.exports = { generateOtp, hashOtp, verifyOtp };
