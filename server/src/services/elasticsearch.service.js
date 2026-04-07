const { Client } = require("@elastic/elasticsearch");

const INDEX_NAME = process.env.ELASTICSEARCH_INDEX || "material_chunks";

let client = null;

function isEnabled() {
  return Boolean(process.env.ELASTICSEARCH_URL?.trim());
}

function getClient() {
  if (!isEnabled()) return null;
  if (!client) {
    client = new Client({ node: process.env.ELASTICSEARCH_URL.trim() });
  }
  return client;
}

async function ensureIndex() {
  const es = getClient();
  if (!es) return false;
  try {
    await es.indices.create({
      index: INDEX_NAME,
      mappings: {
        properties: {
          text: { type: "text", analyzer: "standard" },
          chunkId: { type: "keyword" },
          materialId: { type: "keyword" },
          title: { type: "text", fields: { raw: { type: "keyword" } } },
          subject: { type: "keyword" },
          department: { type: "keyword" },
          semester: { type: "keyword" },
          degree: { type: "keyword" },
          type: { type: "keyword" },
          collegeCode: { type: "keyword" },
        },
      },
    });
    return true;
  } catch (err) {
    const type = err?.meta?.body?.error?.type;
    const msg = String(err?.message || "");
    if (type === "resource_already_exists_exception" || msg.includes("resource_already_exists")) {
      return true;
    }
    console.error("[elasticsearch] ensureIndex:", err.message);
    return false;
  }
}

/**
 * Bulk index text chunks for keyword / hybrid search.
 */
async function indexChunks(docs) {
  const es = getClient();
  if (!es || !docs.length) return { indexed: 0, skipped: true };

  await ensureIndex();
  const operations = docs.flatMap((d) => [
    { index: { _index: INDEX_NAME, _id: d.chunkId } },
    d,
  ]);

  try {
    const res = await es.bulk({ refresh: true, operations });
    if (res.errors) {
      const first = res.items?.find((i) => i.index?.error);
      throw new Error(first?.index?.error?.reason || "bulk had errors");
    }
    return { indexed: docs.length, skipped: false };
  } catch (err) {
    console.error("[elasticsearch] indexChunks:", err.message);
    throw err;
  }
}

/**
 * Full-text search over chunk text with optional metadata filters.
 */
async function searchChunks({ query, subject, department, semester, degree, collegeCode, size = 10 }) {
  const es = getClient();
  if (!es) {
    return { hits: [], disabled: true };
  }

  await ensureIndex();
  const must = [];
  if (query?.trim()) {
    must.push({
      multi_match: {
        query: query.trim(),
        fields: ["text^2", "title"],
        type: "best_fields",
      },
    });
  } else {
    must.push({ match_all: {} });
  }

  const filter = [];
  if (subject) filter.push({ term: { subject: String(subject).trim() } });
  if (department) filter.push({ term: { department: String(department).trim() } });
  if (semester) filter.push({ term: { semester: String(semester).trim() } });
  if (degree) filter.push({ term: { degree: String(degree).trim() } });
  if (collegeCode) filter.push({ term: { collegeCode: String(collegeCode).trim().toUpperCase() } });

  try {
    const res = await es.search({
      index: INDEX_NAME,
      size,
      _source: [
        "text",
        "materialId",
        "chunkId",
        "title",
        "subject",
        "department",
        "semester",
        "degree",
        "type",
      ],
      query: {
        bool: {
          must,
          ...(filter.length ? { filter } : {}),
        },
      },
    });
    const hits = (res.hits?.hits || []).map((h) => ({
      score: h._score,
      ...h._source,
    }));
    return { hits, disabled: false };
  } catch (err) {
    console.error("[elasticsearch] searchChunks:", err.message);
    throw err;
  }
}

module.exports = {
  INDEX_NAME,
  isEnabled,
  getClient,
  ensureIndex,
  indexChunks,
  searchChunks,
};
