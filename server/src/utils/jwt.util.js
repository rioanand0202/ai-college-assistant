const jwt = require("jsonwebtoken");

const accessSecret = () => process.env.JWT_ACCESS_SECRET || "ba7c16d3999a06420cda13adc4a58e50d808728520f90595c32ca4e2820844f2";
const refreshSecret = () => process.env.JWT_REFRESH_SECRET || "fa9c72fa103565e7b962d2ae856abdaf50d43d962c67b9dc034c628692d5022e";

const accessExpires = () => process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const refreshExpires = () => process.env.JWT_REFRESH_EXPIRES_IN || "3d";

const signAccessToken = (payload) =>
  jwt.sign({ ...payload, typ: "access" }, accessSecret(), { expiresIn: accessExpires() });

const signRefreshToken = (payload) =>
  jwt.sign({ ...payload, typ: "refresh" }, refreshSecret(), { expiresIn: refreshExpires() });

const verifyAccessToken = (token) => jwt.verify(token, accessSecret());

const verifyRefreshToken = (token) => jwt.verify(token, refreshSecret());

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
