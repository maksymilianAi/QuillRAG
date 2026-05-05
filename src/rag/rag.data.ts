/**
 * RAG Layer — In-memory knowledge base loader.
 *
 * Reads knowledge documents from data/knowledge.json
 * and provides them for embedding and retrieval.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type { KnowledgeDocument } from "./rag.types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try multiple paths: __dirname-relative (works in serverless), then cwd-relative (works in dev)
function resolveKnowledgePath(): string {
  const candidates = [
    resolve(__dirname, "../../data/knowledge.json"),   // relative to src/rag/
    resolve(process.cwd(), "data/knowledge.json"),     // relative to project root
  ];
  for (const p of candidates) {
    try {
      readFileSync(p, "utf-8"); // test if file exists
      return p;
    } catch { /* try next */ }
  }
  return candidates[0]; // fallback
}

const KNOWLEDGE_PATH = resolveKnowledgePath();

let cachedDocs: KnowledgeDocument[] | null = null;

/**
 * Load knowledge documents from the JSON file.
 * Results are cached after first load.
 */
export function loadKnowledgeBase(): KnowledgeDocument[] {
  if (cachedDocs) return cachedDocs;

  const raw = readFileSync(KNOWLEDGE_PATH, "utf-8");
  cachedDocs = JSON.parse(raw) as KnowledgeDocument[];
  return cachedDocs;
}
