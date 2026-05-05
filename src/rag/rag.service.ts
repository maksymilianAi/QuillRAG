import { embed, embedMany, type EmbeddingModel } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { GoogleGenAI } from "@google/genai";
import { config } from "../config.js";
import { loadKnowledgeBase } from "./rag.data.js";
import type { KnowledgeDocument, RetrievalResult } from "./rag.types.js";

const TOP_K = 5;

/** Cosine similarity between two vectors */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class RAGService {
  private docs: KnowledgeDocument[] = [];
  // Cache embeddings by provider name
  private providerEmbeddings: Map<string, number[][]> = new Map();

  private async generateEmbeddings(provider: string, apiKey: string, texts: string[]): Promise<number[][]> {
    switch (provider.toLowerCase()) {
      case "openai": {
        const model = createOpenAI({ apiKey }).embedding("text-embedding-3-small");
        const { embeddings } = await embedMany({ model, values: texts });
        return embeddings;
      }
      case "claude":
      case "anthropic": {
        // Anthropic has no embedding API — fall back to OpenAI if key is available
        const fallbackKey = config.openaiApiKey;
        if (!fallbackKey) {
          throw new Error("Claude doesn't support embeddings. Set OPENAI_API_KEY in .env as fallback for RAG.");
        }
        const model = createOpenAI({ apiKey: fallbackKey }).embedding("text-embedding-3-small");
        const { embeddings } = await embedMany({ model, values: texts });
        return embeddings;
      }
      case "gemini":
      case "google": {
        const ai = new GoogleGenAI({ apiKey });
        // Generate embeddings concurrently
        const embeddings = await Promise.all(texts.map(async (text) => {
          const res = await ai.models.embedContent({
            model: "text-embedding-004",
            contents: text
          });
          return res.embeddings?.[0]?.values || [];
        }));
        return embeddings;
      }
      default:
        throw new Error(`Embeddings not supported for provider: ${provider}`);
    }
  }

  private async generateEmbedding(provider: string, apiKey: string, text: string): Promise<number[]> {
    const embeddings = await this.generateEmbeddings(provider, apiKey, [text]);
    return embeddings[0] || [];
  }

  /**
   * Initialize embeddings for a specific provider if not already cached.
   */
  private async ensureEmbeddings(provider: string, apiKey: string): Promise<void> {
    const cacheKey = provider.toLowerCase();
    if (this.providerEmbeddings.has(cacheKey)) return;

    if (this.docs.length === 0) {
      this.docs = loadKnowledgeBase();
    }

    try {
      console.log(`[RAG] Computing embeddings for provider: ${provider}...`);
      
      const embeddings = await this.generateEmbeddings(provider, apiKey, this.docs.map((d) => d.text));

      this.providerEmbeddings.set(cacheKey, embeddings);
      console.log(`[RAG] Cached ${embeddings.length} embeddings for ${provider}`);
    } catch (err) {
      console.error(`[RAG] Failed to compute embeddings for ${provider}:`, err);
      throw err;
    }
  }

  /**
   * Retrieve top-K most relevant documents for a given query.
   */
  async retrieve(query: string, provider?: string, apiKey?: string): Promise<RetrievalResult[]> {
    const activeProvider = provider || config.llmProvider;
    const activeKey = apiKey || (
      activeProvider === "openai" ? config.openaiApiKey :
      activeProvider === "claude" ? config.anthropicApiKey :
      activeProvider === "gemini" ? config.googleApiKey : ""
    );

    if (!activeKey) {
      console.warn(`[RAG] No API key for ${activeProvider}. Skipping RAG.`);
      return [];
    }

    try {
      // Ensure we have embeddings for this provider's vector space
      await this.ensureEmbeddings(activeProvider, activeKey);
      
      const embeddings = this.providerEmbeddings.get(activeProvider.toLowerCase())!;

      // Embed the query
      const queryEmbedding = await this.generateEmbedding(activeProvider, activeKey, query);

      if (queryEmbedding.length === 0) {
        console.warn(`[RAG] Failed to embed query for ${activeProvider}.`);
        return [];
      }

      // Score all documents
      const scored: RetrievalResult[] = this.docs
        .map((doc, i) => ({
          document: doc,
          score: cosineSimilarity(queryEmbedding, embeddings[i]),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, TOP_K);

      return scored;
    } catch (err) {
      console.warn(`[RAG] Retrieval failed for ${activeProvider}:`, err);
      return [];
    }
  }
}

