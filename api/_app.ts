/**
 * Shared Express app instance for Vercel serverless functions.
 * Reuses the existing server setup so we don't duplicate logic.
 */

import { createServer } from "../src/api/server.js";
import { createLLM } from "../src/llm/index.js";
import { RAGService } from "../src/rag/rag.service.js";
import { QuillAgent } from "../src/agent/quill.agent.js";
import type { Express } from "express";

let app: Express | null = null;

export function getApp(): Express {
  if (!app) {
    let llm = null;
    try {
      llm = createLLM(process.env.LLM_PROVIDER || "openai");
    } catch {
      // Users provide keys via frontend — this is expected
    }

    const rag = new RAGService();
    const agent = new QuillAgent(llm as any, rag);
    app = createServer(agent);
  }
  return app;
}
