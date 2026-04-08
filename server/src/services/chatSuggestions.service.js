const Material = require("../models/Material.model");

const DEFAULT_SUGGESTIONS = [
  "Important questions in OS 2nd year 1st sem",
  "Explain deadlock in operating systems",
  "Important questions in DBMS",
  "What is normalization in databases?",
];

/** Simple string hash → deterministic 0..2^32-1 */
function hashSeed(str) {
  let h = 2166136261;
  const s = String(str || "default");
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededShuffle(arr, seedStr) {
  let seed = hashSeed(seedStr);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    const j = seed % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function titleCaseSubject(s) {
  const t = String(s || "").trim();
  if (!t) return "this course";
  return t.length <= 3 ? t.toUpperCase() : t.charAt(0).toUpperCase() + t.slice(1);
}

/**
 * Build natural-language prompts from indexed material metadata (staff uploads / RAG).
 */
function buildPromptsFromRow(row) {
  const subject = titleCaseSubject(row.subject);
  const dept = String(row.department || "").trim() || "your department";
  const year = String(row.year || "").trim() || "your year";
  const sem = String(row.semester || "").trim() || "current semester";
  const deg = String(row.degree || "").trim().toUpperCase() || "UG";

  return [
    `Important questions from ${subject} in ${dept}, ${year} ${sem}`,
    `Give me important one-word terms in ${subject} for ${deg} ${year}`,
    `Summarize key concepts I should memorize in ${subject} (${sem})`,
    `What are likely exam topics in ${subject} for ${year}?`,
    `Explain the hardest idea in ${subject} in simple terms`,
  ];
}

/**
 * @param {{ sessionKey?: string, limit?: number }} opts
 * @returns {Promise<string[]>}
 */
async function getChatSuggestions(opts = {}) {
  const limit = Math.min(Math.max(Number(opts.limit) || 8, 4), 12);
  const sessionKey = String(opts.sessionKey || "anon").slice(0, 128);

  const collegeRaw = process.env.PUBLIC_RAG_COLLEGE_CODE;
  const collegeCode =
    collegeRaw && String(collegeRaw).trim()
      ? String(collegeRaw).trim().toUpperCase()
      : null;

  const match = {
    ragStatus: { $in: ["ready", "pending"] },
  };
  if (collegeCode) {
    match.collegeCode = collegeCode;
  }

  let rows = [];
  try {
    rows = await Material.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            subject: "$subject",
            department: "$department",
            year: "$year",
            semester: "$semester",
            degree: "$degree",
          },
        },
      },
      { $limit: 80 },
      {
        $project: {
          _id: 0,
          subject: "$_id.subject",
          department: "$_id.department",
          year: "$_id.year",
          semester: "$_id.semester",
          degree: "$_id.degree",
        },
      },
    ]);
  } catch (e) {
    console.warn("[suggestions] Material aggregate failed:", e.message);
  }

  const pool = [];
  for (const row of rows) {
    if (row.subject) {
      pool.push(...buildPromptsFromRow(row));
    }
  }

  const unique = [...new Set(pool.map((s) => s.trim()).filter(Boolean))];
  const combined =
    unique.length > 0 ? unique : [...DEFAULT_SUGGESTIONS];

  const shuffled = seededShuffle(combined, sessionKey);
  return shuffled.slice(0, limit);
}

module.exports = { getChatSuggestions, DEFAULT_SUGGESTIONS };
