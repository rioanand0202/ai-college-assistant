const path = require("path");
const Material = require("../models/Material.model");
const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const { asyncHookFun, commitActivityLog } = require("../context/requestContext");

const uploadMaterial = catchAsync(async (pick, res) => {
  const { req } = pick;
  asyncHookFun(req);

  const { degree, department, year, semester, subject, url } = req.body || {};
  const file = req.file;

  if (!degree || !department || !year || !semester || !subject) {
    throw new AppError("degree, department, year, semester, and subject are required", 400);
  }

  const hasFile = Boolean(file);
  const trimmedUrl = typeof url === "string" ? url.trim() : "";
  const hasUrl = trimmedUrl.length > 0;

  if (!hasFile && !hasUrl) {
    throw new AppError("Provide either a PDF file or a URL", 400);
  }
  if (hasFile && hasUrl) {
    throw new AppError("Send either file or url, not both", 400);
  }

  if (hasUrl) {
    try {
      // eslint-disable-next-line no-new
      new URL(trimmedUrl);
    } catch {
      throw new AppError("Invalid URL", 400);
    }
  }

  const collegeCode = String(req.user.collegeCode || "").toUpperCase();
  const relPath = hasFile ? `/uploads/materials/${file.filename}` : null;

  const doc = await Material.create({
    uploadedBy: req.user.id,
    collegeCode,
    degree,
    department,
    year,
    semester,
    subject: String(subject).trim(),
    filePath: relPath,
    sourceUrl: hasUrl ? trimmedUrl : null,
  });

  commitActivityLog({
    summary: "Material uploaded",
    userId: req.user.id,
    userEmail: req.user.email,
    userName: req.user.name,
  });

  res.status(201).json({
    success: true,
    message: "Material uploaded",
    data: { material: doc },
  });
});

const getMyMaterials = catchAsync(async (pick, res) => {
  const { req } = pick;
  const list = await Material.find({ uploadedBy: req.user.id })
    .sort({ createdAt: -1 })
    .lean();
  res.status(200).json({ success: true, data: { materials: list } });
});

module.exports = { uploadMaterial, getMyMaterials };
