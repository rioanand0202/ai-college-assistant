const College = require("../models/College.model");

/**
 * Ensures college rows exist so login/register can validate `collegeCode`.
 *
 * Configure ONE of these (restart server after changing .env):
 * - COLLEGE_CODE=CSIJAC and optional COLLEGE_NAME=St Joseph College  ← simplest for one college
 * - SEED_COLLEGES=CSIJAC:St Joseph,DEMO:Demo (comma-separated; name optional: CSIJAC alone works)
 *
 * If nothing is set: non-production seeds DEMO only. Production seeds nothing until you set env.
 */
const seedCollegesFromEnv = async () => {
  /** @type {Map<string, string>} code -> name */
  const byCode = new Map();

  const add = (code, name) => {
    const c = String(code || "").trim().toUpperCase();
    if (c.length < 2) return;
    const n = String(name || c).trim() || c;
    if (!byCode.has(c)) byCode.set(c, n);
  };

  const primary = process.env.COLLEGE_CODE?.trim();
  if (primary) {
    add(primary, process.env.COLLEGE_NAME?.trim() || primary);
  }

  const listRaw =
    process.env.SEED_COLLEGES ||
    process.env.DEFAULT_COLLEGE ||
    (process.env.NODE_ENV !== "production" && !byCode.size ? "DEMO:Demo College" : "");

  if (String(listRaw).trim()) {
    for (const pair of String(listRaw)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)) {
      if (pair.includes(":")) {
        const [codePart, ...nameParts] = pair.split(":");
        add(codePart, nameParts.join(":") || codePart);
      } else {
        add(pair, pair);
      }
    }
  }

  for (const [code, name] of byCode) {
    await College.findOneAndUpdate(
      { code },
      { $setOnInsert: { name } },
      { upsert: true, new: true },
    );
  }

  if (byCode.size) {
    console.info(`[colleges] Seeded/upheld: ${[...byCode.keys()].join(", ")}`);
  } else if (process.env.NODE_ENV === "production") {
    console.warn(
      "[colleges] No colleges configured. Set COLLEGE_CODE or SEED_COLLEGES in .env — login will fail until a College exists.",
    );
  }
};

module.exports = { seedCollegesFromEnv };
