const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const { asyncHookFun, commitActivityLog } = require("../context/requestContext");
const ragService = require("../services/rag.service");
const elasticsearch = require("../services/elasticsearch.service");

/**
 * POST /api/rag/query
 * Body: question, subject, department, semester, degree (optional)
 */
const queryRag = catchAsync(async (pick, res) => {
  const { req, body } = pick;
  asyncHookFun(req);

  const { question, subject, department, semester, degree } = body || {};

  if (!question || !String(question).trim()) {
    throw new AppError("question is required", 400);
  }
  if (!subject || !department || !semester) {
    throw new AppError("subject, department, and semester are required", 400);
  }

  const collegeCode = String(req.user.collegeCode || "").toUpperCase();

  try {
    const result = await ragService.queryRag({
      question,
      subject,
      department,
      semester,
      degree,
      collegeCode,
    });

    commitActivityLog({
      summary: "RAG query",
      userId: req.user.id,
      userEmail: req.user.email,
      userName: req.user.name,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    const msg = err?.message || "RAG query failed";
    throw new AppError(msg, err.statusCode || 502);
  }
});

/**
 * POST /api/rag/search  (Elasticsearch keyword search over chunks)
 */
const searchChunks = catchAsync(async (pick, res) => {
  const { req, body } = pick;
  asyncHookFun(req);

  if (!elasticsearch.isEnabled()) {
    return res.status(503).json({
      success: false,
      message:
        "Elasticsearch is not configured (set ELASTICSEARCH_URL). Chroma RAG at POST /api/rag/query still works.",
    });
  }

  const { q, query, subject, department, semester, degree, size } = body || {};
  const text = (q ?? query ?? "").toString().trim();
  const collegeCode = String(req.user.collegeCode || "").toUpperCase();

  try {
    const { hits } = await elasticsearch.searchChunks({
      query: text,
      subject,
      department,
      semester,
      degree,
      collegeCode,
      size: Math.min(Number(size) || 10, 50),
    });

    res.status(200).json({ success: true, data: { hits } });
  } catch (err) {
    throw new AppError(err.message || "Search failed", 502);
  }
});

module.exports = { queryRag, searchChunks };
