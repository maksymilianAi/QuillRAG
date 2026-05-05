/**
 * CopywrightRAG — Application entry point.
 *
 * Initializes all layers (LLM, RAG, Agent) and starts the API server.
 */

import { config } from "./config.js";
import { createLLM } from "./llm/index.js";
import { RAGService } from "./rag/rag.service.js";
import { QuillAgent } from "./agent/quill.agent.js";
import { startServer } from "./api/server.js";

async function main() {
  console.log("🧠 CopywrightRAG — AI-Powered UX Copywriting Tool");
  console.log("━".repeat(50));

  // Validate config
  if (!config.openaiApiKey) {
    console.warn("⚠️  OPENAI_API_KEY is not set in .env — RAG and LLM calls will fail");
    console.warn("   Copy .env.example to .env and add your key");
  }

  // 1. Initialize LLM provider
  console.log(`[Init] LLM provider: ${config.llmProvider}`);
  let llm = null;
  try {
    llm = createLLM(config.llmProvider);
  } catch (err) {
    console.warn(`[Init] Default LLM provider failed to start: ${err instanceof Error ? err.message : "Missing API Key"}`);
    console.warn("       Users must provide an API Key in the frontend sidebar.");
  }

  // 2. Initialize RAG service (lazy — will embed on first request)
  console.log("[Init] RAG service created");
  const rag = new RAGService();

  // 3. Create Quill agent (handle null LLM)
  const agent = new QuillAgent(llm as any, rag);
  console.log("[Init] Quill agent ready");

  // 4. Start API server
  startServer(agent);
}

main().catch((err) => {
  console.error("❌ Failed to start:", err);
  process.exit(1);
});
