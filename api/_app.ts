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
    console.log("[Vercel] Cold start — initializing app...");

    const provider = process.env.LLM_PROVIDER || "openai";
    const apiKey =
      provider === "claude" || provider === "anthropic"
        ? process.env.ANTHROPIC_API_KEY
        : provider === "openai"
        ? process.env.OPENAI_API_KEY
        : provider === "gemini" || provider === "google"
        ? process.env.GOOGLE_API_KEY
        : undefined;

    console.log(`[Vercel] Provider: ${provider}, key present: ${!!apiKey}`);

    let llm = null;
    try {
      llm = createLLM(provider, apiKey);
      console.log("[Vercel] Default LLM created:", provider);
    } catch (e) {
      console.log("[Vercel] Default LLM failed:", e instanceof Error ? e.message : e);
    }

    const rag = new RAGService();
    const agent = new QuillAgent(llm as any, rag);
    app = createServer(agent);
    console.log("[Vercel] App initialized successfully");
  }
  return app;
}
