const AppError = require("../utils/appError");
const ragService = require("./rag.service");
const ChatMessage = require("../models/ChatMessage.model");
const { extractFiltersFromQuestion } = require("./questionMetadata.parser");

/**
 * Shared RAG + optional history persistence for public assistant (HTTP + WebSocket).
 * @param {{ question: string, oauthUser: object | null }} args
 * @returns {Promise<object>} data payload matching POST /api/public/ask
 */
async function runPublicAsk({ question, oauthUser }) {
  const q = String(question || "").trim();
  if (!q) {
    throw new AppError("question is required", 400);
  }

  const parsed = extractFiltersFromQuestion(q);
  const collegeRaw = process.env.PUBLIC_RAG_COLLEGE_CODE;
  const collegeCode =
    collegeRaw && String(collegeRaw).trim()
      ? String(collegeRaw).trim().toUpperCase()
      : undefined;

  const allowOpenAiFallbackWhenChromaDown =
    String(process.env.PUBLIC_FALLBACK_OPENAI_ON_CHROMA_DOWN ?? "true").toLowerCase() !==
    "false";

  let result;
  try {
    result = await ragService.queryRag({
      question: q,
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
        "— using OpenAI-only fallback.",
      );
      result = await ragService.queryOpenAiWithoutCorpus({ question: q });
    } else {
      throw new AppError(err?.message || "Assistant request failed", err.statusCode || 502);
    }
  }

  if (oauthUser) {
    await ChatMessage.create({
      userId: oauthUser.id,
      question: q,
      answer: result.answer,
    });
  }

  return {
    ...result,
    filtersApplied: parsed,
    historySaved: Boolean(oauthUser),
  };
}

module.exports = { runPublicAsk };
