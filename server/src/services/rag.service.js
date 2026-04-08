const fs = require("fs");
const pdfParse = require("pdf-parse");
const { Document } = require("@langchain/core/documents");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { Chroma } = require("@langchain/community/vectorstores/chroma");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

const { ChromaClient, ChromaConnectionError } = require("chromadb");
const elasticsearch = require("./elasticsearch.service");
const { isExamStyleQuestion, inferSubjectAliasesForUpload } = require("./questionMetadata.parser");
const { retrieveSemanticFirstChunks } = require("./ragRetrieval.service");

const COLLECTION = process.env.CHROMA_COLLECTION || "college-materials";

let chromaStore = null;
let embeddingsInstance = null;

function getEmbeddings() {
  if (!embeddingsInstance) {
    embeddingsInstance = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
    });
  }
  return embeddingsInstance;
}

/**
 * Chroma HTTP API connection (chromadb npm v3+ uses host/port/ssl; `path` is deprecated).
 * Optional: CHROMA_URL=http://127.0.0.1:8000 overrides CHROMA_HOST / CHROMA_PORT / CHROMA_SSL.
 */
function getChromaConnectionConfig() {
  const rawUrl = process.env.CHROMA_URL?.trim();
  if (rawUrl) {
    try {
      const u = new URL(rawUrl);
      const port = u.port
        ? Number(u.port)
        : u.protocol === "https:"
          ? 443
          : 80;
      return {
        host: u.hostname,
        port,
        ssl: u.protocol === "https:",
      };
    } catch {
      /* fall through */
    }
  }
  let host = (process.env.CHROMA_HOST || "127.0.0.1").replace(/^https?:\/\//, "");
  const colon = host.indexOf(":");
  let port = Number(process.env.CHROMA_PORT || 8000);
  if (colon > -1) {
    const p = host.slice(colon + 1);
    host = host.slice(0, colon);
    if (p) port = Number(p) || port;
  }
  const ssl = String(process.env.CHROMA_SSL || "").toLowerCase() === "true";
  return { host, port, ssl };
}

function getChromaServerUrl() {
  const { host, port, ssl } = getChromaConnectionConfig();
  return `${ssl ? "https" : "http"}://${host}:${port}`;
}

function buildChromaClient() {
  const { host, port, ssl } = getChromaConnectionConfig();
  return new ChromaClient({ host, port, ssl });
}

/** True when Chroma server is not reachable (not running, wrong host/port, firewall). */
function isChromaUnreachableError(err) {
  let e = err;
  for (let i = 0; i < 6 && e; i += 1) {
    if (e instanceof ChromaConnectionError) return true;
    const msg = String(e.message || "");
    if (/failed to connect to chromadb|chroma connection error|econnrefused/i.test(msg)) {
      return true;
    }
    e = e.cause;
  }
  return false;
}

async function getChromaStore() {
  if (!chromaStore) {
    const embeddings = getEmbeddings();
    const args = {
      collectionName: COLLECTION,
      index: buildChromaClient(),
    };
    if (process.env.CHROMA_CLOUD_API_KEY) {
      args.chromaCloudAPIKey = process.env.CHROMA_CLOUD_API_KEY;
    }
    chromaStore = new Chroma(embeddings, args);
    try {
      await chromaStore.ensureCollection();
    } catch (err) {
      const target = getChromaServerUrl();
      const msg = err?.message || String(err);
      const hint =
        `Cannot connect to Chroma at ${target}. ` +
        `Start the database (Docker): from folder "server" run  npm run chroma:up  ` +
        `then verify: curl ${target}/api/v2/version`;
      const wrapped = new Error(`${msg} — ${hint}`);
      wrapped.cause = err;
      chromaStore = null;
      throw wrapped;
    }
  }
  return chromaStore;
}

function buildChromaWhere({
  subject,
  subjectVariants,
  department,
  semester,
  degree,
  year,
  collegeCode,
}) {
  const parts = [];
  const variants = (subjectVariants || [])
    .map((s) => String(s || "").trim().toLowerCase())
    .filter(Boolean);
  if (variants.length > 1) {
    parts.push({ $or: variants.map((s) => ({ subject: { $eq: s } })) });
  } else if (variants.length === 1) {
    parts.push({ subject: { $eq: variants[0] } });
  } else if (subject) {
    parts.push({ subject: { $eq: String(subject).trim().toLowerCase() } });
  }
  if (department) parts.push({ department: { $eq: String(department).trim().toLowerCase() } });
  if (semester) parts.push({ semester: { $eq: String(semester).trim().toLowerCase() } });
  if (degree) parts.push({ degree: { $eq: String(degree).trim().toLowerCase() } });
  if (year) parts.push({ year: { $eq: String(year).trim().toLowerCase() } });
  if (collegeCode) parts.push({ collegeCode: { $eq: String(collegeCode).trim().toUpperCase() } });
  if (parts.length === 0) return undefined;
  if (parts.length === 1) return parts[0];
  return { $and: parts };
}

function sanitizeChromaMetadata(meta) {
  const out = {};
  for (const [k, v] of Object.entries(meta)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "object") {
      out[k] = JSON.stringify(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function buildSystemPrompt(examMode) {
  if (examMode) {
    return `You are an expert university examiner. Using ONLY the context passages below, produce exactly 10 exam-oriented questions as a numbered list (1–10).
Strict counts:
- Exactly 4 questions labeled "[2 marks]" (short answer).
- Exactly 6 questions labeled "[10 marks]" (long answer / essay style).
If the context cannot support 10 grounded questions, state that briefly, then provide as many as you can while keeping the 2-mark vs 10-mark labels honest. Do not invent facts outside the context.`;
  }
  return `You are a helpful AI tutor for college students. Answer using the provided context from course materials when relevant. If the context does not contain enough information, say so and answer from general principles only when safe. Be clear and structured.`;
}

/**
 * Extract plain text from a PDF on disk.
 */
async function extractPdfText(absolutePath) {
  const buf = fs.readFileSync(absolutePath);
  const data = await pdfParse(buf);
  const text = (data.text || "").trim();
  if (!text) {
    throw new Error("No extractable text found in PDF");
  }
  return text;
}

/**
 * Ingest a PDF: chunk, embed into Chroma, index into Elasticsearch.
 */
async function ingestMaterialPdf({
  materialId,
  title,
  subject,
  department,
  semester,
  degree,
  year,
  type,
  collegeCode,
  absoluteFilePath,
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for RAG ingestion");
  }

  const rawText = await extractPdfText(absoluteFilePath);
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1200,
    chunkOverlap: 200,
  });
  const splits = await splitter.splitText(rawText);

  const store = await getChromaStore();
  const baseMetaRaw = {
    materialId: String(materialId),
    title: String(title || ""),
    subject: String(subject).trim().toLowerCase(),
    subjectAliases: inferSubjectAliasesForUpload(subject),
    department: String(department).trim().toLowerCase(),
    semester: String(semester).trim().toLowerCase(),
    degree: String(degree).trim().toLowerCase(),
    type: String(type || "notes"),
    collegeCode: String(collegeCode).trim().toUpperCase(),
  };
  if (year != null && String(year).trim()) {
    baseMetaRaw.year = String(year).trim().toLowerCase();
  }
  const baseMeta = sanitizeChromaMetadata(baseMetaRaw);

  const documents = splits.map((pageContent, i) => {
    const chunkId = `${materialId}_c${i}`;
    return new Document({
      pageContent,
      metadata: sanitizeChromaMetadata({
        ...baseMeta,
        chunkIndex: i,
        chunkId,
      }),
    });
  });

  const ids = documents.map((_, i) => `${materialId}_c${i}`);
  await store.addDocuments(documents, { ids });

  const esDocs = documents.map((doc, i) => ({
    chunkId: ids[i],
    materialId: String(materialId),
    title: String(title || ""),
    text: doc.pageContent,
    subject: baseMeta.subject,
    department: baseMeta.department,
    semester: baseMeta.semester,
    degree: baseMeta.degree,
    ...(baseMeta.year ? { year: baseMeta.year } : {}),
    type: baseMeta.type,
    collegeCode: baseMeta.collegeCode,
  }));

  try {
    if (elasticsearch.isEnabled()) {
      await elasticsearch.indexChunks(esDocs);
    }
  } catch (esErr) {
    console.error("[rag] Elasticsearch indexing failed (Chroma OK):", esErr.message);
  }

  return { chunkCount: documents.length };
}

/**
 * RAG query: Chroma top-k with metadata filter + OpenAI chat.
 */
async function queryRag({
  question,
  subject,
  subjectVariants,
  department,
  semester,
  degree,
  year,
  collegeCode,
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required for RAG queries");
  }

  const q = String(question || "").trim();
  if (!q) {
    throw new Error("question is required");
  }

  const store = await getChromaStore();
  const variants =
    subjectVariants?.length > 0
      ? subjectVariants
      : subject
        ? [String(subject).trim().toLowerCase()]
        : [];

  const examQ = isExamStyleQuestion(q);

  const { docs, trace: retrievalTrace } = await retrieveSemanticFirstChunks(store, q, {
    collegeCode,
    department,
    semester,
    subject,
    subjectVariants: variants,
  });

  if (docs.length === 0 && elasticsearch.isEnabled()) {
    try {
      const { hits } = await elasticsearch.searchChunks({
        query: q,
        subject,
        subjectIn: variants,
        department,
        semester,
        degree,
        year,
        collegeCode,
        size: examQ ? 10 : 8,
      });
      docs = hits.map((h) => ({
        pageContent: h.text || "",
        metadata: {
          materialId: h.materialId,
          title: h.title,
        },
      }));
    } catch {
      /* ignore ES fallback errors */
    }
  }

  const examMode = examQ;
  const context = docs
    .map((d, i) => `[${i + 1}] ${d.pageContent}`)
    .join("\n\n---\n\n");

  const system = buildSystemPrompt(examMode);
  const userContent = examMode
    ? `Context from materials:\n${context || "(no matching chunks)"}\n\nTask: ${q}`
    : `Context from materials:\n${context || "(no matching chunks)"}\n\nQuestion: ${q}`;

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
      // temperature: examMode ? 0.35 : 0.4,
    }),
  });

  const json = await r.json().catch(() => ({}));
  if (!r.ok) {
    const errMsg = json?.error?.message || r.statusText || "OpenAI request failed";
    throw new Error(errMsg);
  }

  const answer = json?.choices?.[0]?.message?.content?.trim() || "";

  const payload = {
    answer,
    sourcesUsed: docs.length,
    examMode,
    chunksPreview: docs.map((d) => ({
      snippet: (d.pageContent || "").slice(0, 200),
      materialId: d.metadata?.materialId,
      title: d.metadata?.title,
    })),
  };
  if (String(process.env.RAG_DEBUG_RETRIEVAL || "").toLowerCase() === "true" && retrievalTrace) {
    payload.retrievalTrace = retrievalTrace;
  }
  return payload;
}

/**
 * OpenAI-only answer when Chroma is down (public assistant fallback).
 */
async function queryOpenAiWithoutCorpus({ question }) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required");
  }
  const q = String(question || "").trim();
  if (!q) {
    throw new Error("question is required");
  }
  const examMode = isExamStyleQuestion(q);
  const system = examMode
    ? `You are an expert university examiner. The college's PDF / vector index is offline — use solid undergraduate curriculum knowledge for the topic in the user's message. Produce exactly 10 exam-style questions as a numbered list (1–10): exactly 4 labeled "[2 marks]" and exactly 6 labeled "[10 marks]". Note briefly that these are not sourced from this institution's uploaded materials.`
    : `You are a helpful AI tutor. The course materials database is not connected. Answer clearly from general principles, and add one short sentence that your answer is not sourced from this college's uploaded PDFs.`;

  const userContent = examMode ? `Task: ${q}` : `Question: ${q}`;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
      ],
      // temperature: examMode ? 0.35 : 0.4,
    }),
  });

  const json = await r.json().catch(() => ({}));
  if (!r.ok) {
    const errMsg = json?.error?.message || r.statusText || "OpenAI request failed";
    throw new Error(errMsg);
  }

  const answer = json?.choices?.[0]?.message?.content?.trim() || "";

  return {
    answer,
    sourcesUsed: 0,
    examMode,
    chunksPreview: [],
    ragSkipped: true,
    ragSkipReason: "chroma_unreachable",
  };
}

async function chromaHeartbeat() {
  const client = buildChromaClient();
  await client.heartbeat();
  return true;
}

module.exports = {
  getChromaStore,
  ingestMaterialPdf,
  queryRag,
  queryOpenAiWithoutCorpus,
  isChromaUnreachableError,
  chromaHeartbeat,
  getChromaServerUrl,
  extractPdfText,
  buildChromaWhere,
};
