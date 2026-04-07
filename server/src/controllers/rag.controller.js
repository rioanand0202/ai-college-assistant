const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const { asyncHookFun, commitActivityLog } = require("../context/requestContext");
const ragService = require("../services/rag.service");
const elasticsearch = require("../services/elasticsearch.service");
const { extractFiltersFromQuestion } = require("../services/questionMetadata.parser");

function mergeRagFilters(question, body) {
  const parsed = extractFiltersFromQuestion(question);
  const b = body || {};

  let subjectVariants = parsed.subjectVariants || [];
  if (b.subject && String(b.subject).trim()) {
    subjectVariants = [String(b.subject).trim().toLowerCase()];
  }

  return {
    subjectVariants,
    semester: b.semester || parsed.semester,
    year: b.year || parsed.year,
    department: b.department || parsed.department,
    degree: b.degree || parsed.degree,
  };
}

/**
 * POST /api/rag/query
 * Body: question (required); subject, department, semester, degree, year optional — parsed from question when omitted.
 */
const queryRag = catchAsync(async (pick, res) => {
  const { req, body } = pick;
  asyncHookFun(req);

  const { question } = body || {};
  if (!question || !String(question).trim()) {
    throw new AppError("question is required", 400);
  }

  const merged = mergeRagFilters(question, body);
  const collegeCode = String(req.user.collegeCode || "").toUpperCase();

  try {
    const result = await ragService.queryRag({
      question,
      subjectVariants: merged.subjectVariants,
      department: merged.department,
      semester: merged.semester,
      degree: merged.degree,
      year: merged.year,
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
      data: {
        ...result,
        filtersApplied: merged,
      },
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

  const { q, query, subject, department, semester, degree, year, size } = body || {};
  const text = (q ?? query ?? "").toString().trim();
  const collegeCode = String(req.user.collegeCode || "").toUpperCase();
  const parsed = extractFiltersFromQuestion(text);
  const subjectIn =
    subject && String(subject).trim()
      ? [String(subject).trim().toLowerCase()]
      : parsed.subjectVariants;

  try {
    const { hits } = await elasticsearch.searchChunks({
      query: text,
      subjectIn,
      department: department || parsed.department,
      semester: semester || parsed.semester,
      degree: degree || parsed.degree,
      year: year || parsed.year,
      collegeCode,
      size: Math.min(Number(size) || 10, 50),
    });

    res.status(200).json({ success: true, data: { hits } });
  } catch (err) {
    throw new AppError(err.message || "Search failed", 502);
  }
});

module.exports = { queryRag, searchChunks };
