const path = require("path");
const Material = require("../models/Material.model");
const { MATERIAL_TYPES } = Material;
const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const { asyncHookFun, commitActivityLog } = require("../context/requestContext");
const ragService = require("../services/rag.service");

const uploadMaterial = catchAsync(async (pick, res) => {
  const { req } = pick;
  asyncHookFun(req);

  const {
    degree,
    department,
    year,
    semester,
    subject,
    title,
    type: typeRaw,
    url,
  } = req.body || {};
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

  if (hasFile) {
    const t = typeof title === "string" ? title.trim() : "";
    if (!t) {
      throw new AppError("title is required for PDF uploads", 400);
    }
  }

  const matType =
    typeof typeRaw === "string" && MATERIAL_TYPES.includes(typeRaw) ? typeRaw : "notes";

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
    title: hasFile ? String(title).trim() : String(title || "").trim() || "Linked material",
    degree,
    department,
    year,
    semester,
    subject: String(subject).trim(),
    type: matType,
    filePath: relPath,
    sourceUrl: hasUrl ? trimmedUrl : null,
    ragStatus: hasFile ? "pending" : "skipped",
  });

  if (hasFile) {
    const absPath = path.join(__dirname, "../../uploads/materials", file.filename);
    try {
      const { chunkCount } = await ragService.ingestMaterialPdf({
        materialId: doc._id.toString(),
        title: doc.title,
        subject: doc.subject,
        department: doc.department,
        semester: doc.semester,
        degree: doc.degree,
        type: doc.type,
        collegeCode: doc.collegeCode,
        absoluteFilePath: absPath,
      });
      doc.ragStatus = "ready";
      doc.chunkCount = chunkCount;
      doc.ragError = null;
      await doc.save();
    } catch (ingestErr) {
      doc.ragStatus = "failed";
      let msg = ingestErr.message || "RAG ingestion failed";
      if (/ChromaConnectionError|Failed to connect|ECONNREFUSED/i.test(String(msg))) {
        msg = `${msg} — Start the Chroma server: from the server folder run: docker compose -f docker-compose.chroma.yml up -d (then ensure CHROMA_HOST/CHROMA_PORT match, default 127.0.0.1:8000).`;
      }
      doc.ragError = msg;
      await doc.save();
    }
  }

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
