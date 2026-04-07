const fs = require("fs");
const pdfParse = require("pdf-parse");
const { Document } = require("@langchain/core/documents");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { Chroma } = require("@langchain/community/vectorstores/chroma");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");

const { ChromaClient } = require("chromadb");
const elasticsearch = require("./elasticsearch.service");

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

function buildChromaClient() {
  const host = process.env.CHROMA_HOST || "127.0.0.1";
  const port = Number(process.env.CHROMA_PORT || 8000);
  const ssl = String(process.env.CHROMA_SSL || "").toLowerCase() === "true";
  return new ChromaClient({ host, port, ssl });
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
    await chromaStore.ensureCollection();
  }
  return chromaStore;
}

function buildChromaWhere({ subject, department, semester, degree, collegeCode }) {
  const parts = [];
  if (subject) parts.push({ subject: { $eq: String(subject).trim() } });
  if (department) parts.push({ department: { $eq: String(department).trim() } });
  if (semester) parts.push({ semester: { $eq: String(semester).trim() } });
  if (degree) parts.push({ degree: { $eq: String(degree).trim() } });
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

const EXAM_KEYWORDS = /important questions|exam questions|expected questions/i;

function isExamStyleQuestion(q) {
  return EXAM_KEYWORDS.test(String(q || ""));
}

function buildSystemPrompt(examMode) {
  if (examMode) {
    return `You are an expert university examiner. Using ONLY the context passages below, generate exactly 10 exam-oriented practice questions.
Format your response as a clear numbered list (1–10).
Include a mix of:
- Short-answer / 2-mark style questions (about 4 items)
- Long-answer / 10-mark style questions (about 6 items)
Label each question with "[2 marks]" or "[10 marks]" as appropriate.
If the context is insufficient for 10 questions, say so briefly and ask fewer, still labeled. Do not invent facts outside the context.`;
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
  const baseMeta = sanitizeChromaMetadata({
    materialId: String(materialId),
    title: String(title || ""),
    subject: String(subject).trim(),
    department: String(department).trim(),
    semester: String(semester).trim(),
    degree: String(degree).trim(),
    type: String(type || "notes"),
    collegeCode: String(collegeCode).trim().toUpperCase(),
  });

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
  department,
  semester,
  degree,
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
  const where = buildChromaWhere({
    subject,
    department,
    semester,
    degree,
    collegeCode,
  });

  let docs = await store.similaritySearch(q, 5, where);

  if (docs.length === 0 && elasticsearch.isEnabled()) {
    try {
      const { hits } = await elasticsearch.searchChunks({
        query: q,
        subject,
        department,
        semester,
        degree,
        collegeCode,
        size: 5,
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

  const examMode = isExamStyleQuestion(q);
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
      temperature: examMode ? 0.35 : 0.4,
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
    sourcesUsed: docs.length,
    examMode,
    chunksPreview: docs.map((d) => ({
      snippet: (d.pageContent || "").slice(0, 200),
      materialId: d.metadata?.materialId,
      title: d.metadata?.title,
    })),
  };
}

module.exports = {
  getChromaStore,
  ingestMaterialPdf,
  queryRag,
  extractPdfText,
  buildChromaWhere,
};
