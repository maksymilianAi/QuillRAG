/**
 * RAG Layer — In-memory knowledge base loader.
 *
 * Reads all JSON files from data/knowledge/ directory.
 * Falls back to data/knowledge.json if directory not found.
 */

import { readFileSync, readdirSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import type { KnowledgeDocument } from "./rag.types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function resolveKnowledgeDir(): string | null {
  const candidates = [
    resolve(__dirname, "../../data/knowledge"),
    resolve(process.cwd(), "data/knowledge"),
  ];
  for (const p of candidates) {
    try {
      readdirSync(p);
      return p;
    } catch { /* try next */ }
  }
  return null;
}

function resolveKnowledgeFile(): string {
  const candidates = [
    resolve(__dirname, "../../data/knowledge.json"),
    resolve(process.cwd(), "data/knowledge.json"),
  ];
  for (const p of candidates) {
    try {
      readFileSync(p, "utf-8");
      return p;
    } catch { /* try next */ }
  }
  return candidates[0];
}

let cachedDocs: KnowledgeDocument[] | null = null;

/**
 * Load knowledge documents from all JSON files in data/knowledge/,
 * or fall back to data/knowledge.json.
 */
export function loadKnowledgeBase(): KnowledgeDocument[] {
  if (cachedDocs) return cachedDocs;

  const dir = resolveKnowledgeDir();

  if (dir) {
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .sort();

    const docs: KnowledgeDocument[] = [];
    for (const file of files) {
      const raw = readFileSync(join(dir, file), "utf-8");
      const entries = JSON.parse(raw) as KnowledgeDocument[];
      docs.push(...entries);
    }

    cachedDocs = docs;
    return cachedDocs;
  }

  // Fallback to single file
  const raw = readFileSync(resolveKnowledgeFile(), "utf-8");
  cachedDocs = JSON.parse(raw) as KnowledgeDocument[];
  return cachedDocs;
}
