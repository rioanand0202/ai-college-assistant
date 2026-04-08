/**
 * Semantic-first hybrid retrieval for Chroma (LangChain).
 * Primary: embedding similarity with light optional filters; broaden to college-only, then optionally global.
 */

const {
  parseQueryForRetrieval,
  inferSubjectAliasesForUpload,
} = require("./questionMetadata.parser");

const DEFAULT_MIN = 3;
const DEFAULT_BROAD_K = 14;
const DEFAULT_MAX_MERGED = 10;

function envInt(name, fallback) {
  const n = Number(process.env[name]);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function chunkDedupeKey(doc) {
  const m = doc.metadata || {};
  if (m.chunkId) return String(m.chunkId);
  return `${m.materialId || "?"}_${m.chunkIndex ?? "?"}`;
}

/** Light filter: tenant + optional department/semester only (no subject / year / degree). */
function buildLightChromaWhere({ collegeCode, department, semester }) {
  const parts = [];
  if (collegeCode && String(collegeCode).trim()) {
    parts.push({ collegeCode: { $eq: String(collegeCode).trim().toUpperCase() } });
  }
  if (department && String(department).trim()) {
    parts.push({ department: { $eq: String(department).trim().toLowerCase() } });
  }
  if (semester && String(semester).trim()) {
    parts.push({ semester: { $eq: String(semester).trim().toLowerCase() } });
  }
  if (parts.length === 0) return undefined;
  if (parts.length === 1) return parts[0];
  return { $and: parts };
}

function buildCollegeOnlyWhere({ collegeCode }) {
  if (!collegeCode || !String(collegeCode).trim()) return undefined;
  return { collegeCode: { $eq: String(collegeCode).trim().toUpperCase() } };
}

function whereJsonKey(where) {
  if (where === undefined) return "__none__";
  try {
    return JSON.stringify(where);
  } catch {
    return String(where);
  }
}

/**
 * Higher = better match for internal ranking.
 * Chroma / LangChain typically return distance (lower = closer); normalize monotonically.
 */
function baseRankFromRawScore(raw) {
  if (!Number.isFinite(raw)) return 0;
  if (raw >= 0 && raw <= 1) {
    return 1 - raw;
  }
  return 1 / (1 + Math.abs(raw));
}

async function semanticSearchWithScores(store, query, k, filter) {
  if (k <= 0) return [];
  if (typeof store.similaritySearchWithScore === "function") {
    const pairs = await store.similaritySearchWithScore(query, k, filter);
    return pairs.map(([doc, rawScore]) => ({
      doc,
      rawScore,
      baseRank: baseRankFromRawScore(rawScore),
    }));
  }
  const docs = await store.similaritySearch(query, k, filter);
  return docs.map((doc, i) => ({
    doc,
    rawScore: null,
    baseRank: 1 - i * 0.001,
  }));
}

function parseAliasesJson(meta) {
  const raw = meta?.subjectAliases;
  if (Array.isArray(raw)) return raw.map((x) => String(x).toLowerCase()).filter(Boolean);
  if (!raw || typeof raw !== "string") return [];
  try {
    const a = JSON.parse(raw);
    return Array.isArray(a) ? a.map((x) => String(x).toLowerCase()).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function hintMatchesChunk(hint, meta) {
  const h = String(hint || "").trim().toLowerCase();
  if (!h) return false;
  const subject = String(meta?.subject || "").toLowerCase();
  const title = String(meta?.title || "").toLowerCase();
  const aliases = parseAliasesJson(meta);
  if (subject && (subject.includes(h) || h.includes(subject))) return true;
  if (aliases.some((a) => a && (a.includes(h) || h.includes(a)))) return true;
  if (title && title.includes(h)) return true;
  return false;
}

function titleIntentBoost(meta, retrievalParse) {
  if (!retrievalParse.intentExam && !retrievalParse.intentImportantQuestions) return 0;
  const title = String(meta?.title || "").toLowerCase();
  if (!title) return 0;
  const kw = [
    "important",
    "question",
    "questions",
    "exam",
    "model",
    "mark",
    "marks",
    "2 mark",
    "10 mark",
  ];
  const hits = kw.filter((k) => title.includes(k)).length;
  if (hits === 0) return 0;
  return Math.min(0.12, Number(process.env.RAG_RANK_TITLE_BOOST || 0.08) * (1 + hits * 0.15));
}

function applyRankingBoosts(rows, retrievalParse) {
  const subjectBoost = Number(process.env.RAG_RANK_SUBJECT_BOOST || 0.12);
  return rows.map((row) => {
    let boost = 0;
    const meta = row.doc.metadata || {};
    for (const hint of retrievalParse.subjectHints || []) {
      if (hintMatchesChunk(hint, meta)) {
        boost += subjectBoost;
        break;
      }
    }
    boost += titleIntentBoost(meta, retrievalParse);
    return { ...row, finalRank: row.baseRank + boost };
  });
}

/**
 * Merge candidate lists by chunk id; keep best finalRank per key.
 */
function mergeByChunk(rowsA, rowsB) {
  const map = new Map();
  const add = (row) => {
    const k = chunkDedupeKey(row.doc);
    const prev = map.get(k);
    if (!prev || row.finalRank > prev.finalRank) {
      map.set(k, row);
    }
  };
  rowsA.forEach(add);
  rowsB.forEach(add);
  return [...map.values()];
}

function stageLabel(where) {
  if (where === undefined) return "unfiltered";
  const j = whereJsonKey(where);
  if (j.includes("collegeCode") && !j.includes("department") && !j.includes("semester")) {
    return "college_only";
  }
  if (j.includes("department") || j.includes("semester")) return "light";
  return "custom";
}

/**
 * @param {import('@langchain/community/vectorstores/chroma').Chroma} store
 * @param {{
 *   question: string,
 *   collegeCode?: string,
 *   department?: string,
 *   semester?: string,
 *   degree?: string,
 *   year?: string,
 *   subject?: string,
 *   subjectVariants?: string[],
 * }} request - explicit staff/public filters (subject NOT used as Chroma hard filter)
 * @returns {Promise<{ docs: import('@langchain/core/documents').Document[], trace: object }>}
 */
async function retrieveSemanticFirstChunks(store, question, request = {}) {
  const q = String(question || "").trim();
  const retrievalParse = parseQueryForRetrieval(q);

  const subjectFromRequest = request.subject && String(request.subject).trim();
  const variantsFromRequest = (request.subjectVariants || [])
    .map((s) => String(s || "").trim().toLowerCase())
    .filter(Boolean);
  const expandedRequestSubject = subjectFromRequest
    ? inferSubjectAliasesForUpload(subjectFromRequest)
    : [];
  const subjectHints = [
    ...new Set([
      ...retrievalParse.subjectHints,
      ...(subjectFromRequest ? [subjectFromRequest.toLowerCase()] : []),
      ...variantsFromRequest,
      ...expandedRequestSubject,
    ]),
  ];
  const rankingParse = { ...retrievalParse, subjectHints };

  const minChunks = envInt("RAG_SEMANTIC_MIN_CHUNKS", DEFAULT_MIN);
  const broadK = envInt("RAG_SEMANTIC_BROAD_K", DEFAULT_BROAD_K);
  const maxMerged = envInt("RAG_MAX_MERGED_CHUNKS", DEFAULT_MAX_MERGED);

  const fromQ = retrievalParse.filtersFromQuestion;

  const department =
    (request.department && String(request.department).trim()) || fromQ.department || undefined;
  const semester =
    (request.semester && String(request.semester).trim()) || fromQ.semester || undefined;
  const collegeCode = request.collegeCode && String(request.collegeCode).trim();

  const lightWhere = buildLightChromaWhere({ collegeCode, department, semester });
  const collegeWhere = buildCollegeOnlyWhere({ collegeCode });

  const allowGlobal =
    String(process.env.RAG_ALLOW_GLOBAL_SEMANTIC_FALLBACK || "").toLowerCase() === "true" ||
    !collegeCode;

  const trace = { stages: [], minChunks, broadK, maxMerged };

  let rows = applyRankingBoosts(
    await semanticSearchWithScores(store, q, broadK, lightWhere),
    rankingParse,
  );
  trace.stages.push({ name: stageLabel(lightWhere), count: rows.length });

  const needMore = () => rows.length < minChunks;

  if (needMore() && whereJsonKey(lightWhere) !== whereJsonKey(collegeWhere)) {
    const extra = applyRankingBoosts(
      await semanticSearchWithScores(store, q, broadK, collegeWhere),
      rankingParse,
    );
    rows = mergeByChunk(rows, extra);
    trace.stages.push({ name: "fallback_college", added: extra.length, merged: rows.length });
  }

  if (needMore() && allowGlobal && whereJsonKey(collegeWhere) !== "__none__") {
    const extra = applyRankingBoosts(
      await semanticSearchWithScores(store, q, broadK, undefined),
      rankingParse,
    );
    rows = mergeByChunk(rows, extra);
    trace.stages.push({ name: "fallback_global", added: extra.length, merged: rows.length });
  }

  rows.sort((a, b) => b.finalRank - a.finalRank);
  const top = rows.slice(0, maxMerged);

  trace.returned = top.length;
  trace.subjectHints = subjectHints;

  const outTrace = { ...trace };
  if (String(process.env.RAG_DEBUG_RETRIEVAL || "").toLowerCase() === "true") {
    outTrace.retrievalParse = retrievalParse;
  }

  return {
    docs: top.map((r) => r.doc),
    trace: outTrace,
  };
}

module.exports = {
  retrieveSemanticFirstChunks,
  buildLightChromaWhere,
  buildCollegeOnlyWhere,
  chunkDedupeKey,
};
