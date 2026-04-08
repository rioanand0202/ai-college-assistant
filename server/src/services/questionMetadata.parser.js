const { YEARANDSEMESTER, DEPARTMENT } = require("../utils/constants");

const { YEAR1, YEAR2, YEAR3, SEM1, SEM2 } = YEARANDSEMESTER;

/**
 * Map spoken tokens / abbreviations to candidate `subject` metadata values
 * (Chroma stores lowercase strings from uploads — we OR-match variants).
 */
const SUBJECT_ALIAS_GROUPS = [
  ["os", "operating system", "operating systems"],
  ["dbms", "database", "database management", "database management system"],
  ["cn", "computer networks", "computer network"],
  ["dsa", "data structures", "data structure", "algorithms"],
  ["oop", "object oriented programming", "object-oriented programming"],
  ["ai", "artificial intelligence"],
  ["ml", "machine learning"],
  ["java"],
  ["python"],
  ["c", "programming in c"],
  ["cpp", "c++"],
  ["maths", "mathematics", "math"],
  ["physics"],
  ["chemistry"],
  ["english"],
  ["tamil"],
  ["economics"],
  ["accounting"],
  ["statistics"],
];

function uniq(arr) {
  return [...new Set(arr.filter(Boolean))];
}

function normalizeYearToken(n) {
  const x = Number(n);
  if (x === 1) return YEAR1;
  if (x === 2) return YEAR2;
  if (x === 3) return YEAR3;
  return undefined;
}

function normalizeSemToken(n) {
  const x = Number(n);
  if (x === 1) return SEM1;
  if (x === 2) return SEM2;
  return undefined;
}

/**
 * Extract RAG metadata filters from free-form student questions.
 * @returns {{
 *   subjectVariants: string[],
 *   semester?: string,
 *   year?: string,
 *   department?: string,
 *   degree?: string,
 * }}
 */
function extractFiltersFromQuestion(raw) {
  const q = String(raw || "").toLowerCase();
  const subjectVariants = [];

  for (const group of SUBJECT_ALIAS_GROUPS) {
    for (const term of group) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp(`\\b${escaped}\\b`, "i");
      if (re.test(q)) {
        subjectVariants.push(...group);
        break;
      }
    }
  }

  // "questions in operating systems" style
  const inMatch = q.match(/\bin\s+([a-z0-9][a-z0-9\s+\-]{1,40})/i);
  if (inMatch) {
    const phrase = inMatch[1].trim().toLowerCase();
    if (phrase.length > 1) subjectVariants.push(phrase);
  }

  let year;
  const y1 = q.match(/(\d)(?:st|nd|rd|th)?\s*year\b/i);
  const y2 = q.match(/\byear\s*(\d)\b/i);
  const yn = y1?.[1] || y2?.[1];
  if (yn) year = normalizeYearToken(yn);

  let semester;
  const s1 = q.match(/(\d)(?:st|nd|rd|th)?\s*sem(?:ester)?\b/i);
  const s2 = q.match(/\bsem(?:ester)?\s*(\d)\b/i);
  const sn = s1?.[1] || s2?.[1];
  if (sn) semester = normalizeSemToken(sn);

  let department;
  if (/\bcse\b|\bcomputer science\b|\bcs\b/.test(q)) {
    department = DEPARTMENT.COMPUTER_SCIENCE;
  } else if (/\bmca\b/.test(q)) {
    department = DEPARTMENT.MCA;
  }

  return {
    subjectVariants: uniq(subjectVariants.map((s) => String(s).trim().toLowerCase())),
    semester,
    year,
    department,
  };
}

const EXAM_STYLE =
  /important questions|exam questions|expected questions|model questions|likely questions|10\s*marks?|two marks?/i;

function isExamStyleQuestion(text) {
  return EXAM_STYLE.test(String(text || ""));
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * For Chroma chunk metadata: aliases that may appear in student queries (abbreviations, etc.).
 * @param {string} subjectRaw Staff-entered subject (any casing).
 * @returns {string[]} Lowercase unique terms, always includes canonical subject string.
 */
function inferSubjectAliasesForUpload(subjectRaw) {
  const canonical = String(subjectRaw || "").trim().toLowerCase();
  if (!canonical) return [];
  const out = new Set([canonical]);
  for (const group of SUBJECT_ALIAS_GROUPS) {
    const hit = group.some((term) => {
      const t = String(term).trim().toLowerCase();
      return canonical === t || canonical.includes(t) || t.includes(canonical);
    });
    if (hit) {
      group.forEach((g) => {
        const v = String(g).trim().toLowerCase();
        if (v) out.add(v);
      });
    }
  }
  return [...out];
}

/**
 * Soft signals for ranking — not used as strict Chroma filters.
 * @returns {{
 *   filtersFromQuestion: ReturnType<typeof extractFiltersFromQuestion>,
 *   subjectHints: string[],
 *   intentExam: boolean,
 *   intentImportantQuestions: boolean,
 * }}
 */
function parseQueryForRetrieval(raw) {
  const q = String(raw || "");
  const ql = q.toLowerCase();
  const filtersFromQuestion = extractFiltersFromQuestion(q);

  const subjectHints = new Set(filtersFromQuestion.subjectVariants.map((s) => String(s).trim().toLowerCase()).filter(Boolean));

  for (const group of SUBJECT_ALIAS_GROUPS) {
    const matched = group.some((term) => {
      const re = new RegExp(`\\b${escapeRe(term)}\\b`, "i");
      return re.test(ql);
    });
    if (matched) {
      group.forEach((t) => subjectHints.add(String(t).trim().toLowerCase()));
    }
  }

  const intentImportantQuestions =
    /important\s+questions|model\s+questions|exam\s+questions|expected\s+questions|likely\s+questions/i.test(
      q,
    );
  const intentExam = isExamStyleQuestion(q) || intentImportantQuestions;

  return {
    filtersFromQuestion,
    subjectHints: [...subjectHints],
    intentExam,
    intentImportantQuestions,
  };
}

module.exports = {
  SUBJECT_ALIAS_GROUPS,
  extractFiltersFromQuestion,
  inferSubjectAliasesForUpload,
  isExamStyleQuestion,
  parseQueryForRetrieval,
};
