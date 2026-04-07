const AppError = require("../utils/appError");
const { catchAsync } = require("../utils/catchAsync");
const ragService = require("../services/rag.service");
const ChatMessage = require("../models/ChatMessage.model");
const { extractFiltersFromQuestion } = require("../services/questionMetadata.parser");

/**
 * POST /api/public/ask
 * No JWT required. Optional Bearer OAuth JWT persists history for Google users.
 */
const publicAsk = catchAsync(async (pick, res) => {
  const { req, body } = pick;
  const { question } = body || {};

  if (!question || !String(question).trim()) {
    throw new AppError("question is required", 400);
  }

  const parsed = extractFiltersFromQuestion(question);
  const collegeRaw = process.env.PUBLIC_RAG_COLLEGE_CODE;
  const collegeCode =
    collegeRaw && String(collegeRaw).trim()
      ? String(collegeRaw).trim().toUpperCase()
      : undefined;

  /** Default: allow OpenAI-only answers when Chroma is down. Set to "false" to return 502 until Chroma runs. */
  const allowOpenAiFallbackWhenChromaDown =
    String(process.env.PUBLIC_FALLBACK_OPENAI_ON_CHROMA_DOWN ?? "true").toLowerCase() !==
    "false";

  let result;
  try {
    result = await ragService.queryRag({
      question,
      subjectVariants: parsed.subjectVariants,
      semester: parsed.semester,
      year: parsed.year,
      department: parsed.department,
      degree: parsed.degree,
      collegeCode,
    });
  } catch (err) {
    if (allowOpenAiFallbackWhenChromaDown && ragService.isChromaUnreachableError(err)) {
      console.warn(
        "[public/ask] Chroma unreachable at",
        ragService.getChromaServerUrl(),
        "— using OpenAI-only fallback (set PUBLIC_FALLBACK_OPENAI_ON_CHROMA_DOWN=false to return 502 instead).",
      );
      result = await ragService.queryOpenAiWithoutCorpus({ question });
    } else {
      throw new AppError(err?.message || "Assistant request failed", err.statusCode || 502);
    }
  }

  if (req.oauthUser) {
    await ChatMessage.create({
      userId: req.oauthUser.id,
      question: String(question).trim(),
      answer: result.answer,
    });
  }

  res.status(200).json({
    success: true,
    data: {
      ...result,
      filtersApplied: parsed,
      historySaved: Boolean(req.oauthUser),
    },
  });
});

module.exports = { publicAsk };
