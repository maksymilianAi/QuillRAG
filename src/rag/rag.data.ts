/**
 * RAG Layer — In-memory knowledge base loader.
 *
 * Reads knowledge documents from data/knowledge.json
 * and provides them for embedding and retrieval.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import type { KnowledgeDocument } from "./rag.types.js";

const KNOWLEDGE_PATH = resolve(process.cwd(), "data/knowledge.json");

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
