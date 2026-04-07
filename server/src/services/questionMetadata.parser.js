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

module.exports = {
  extractFiltersFromQuestion,
  isExamStyleQuestion,
};
