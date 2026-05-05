import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, type LanguageModel } from "ai";
import type { LLMProvider } from "./llm.interface.js";
import type { z } from "zod";

/**
 * Local / Custom LLM Provider
 * Connects to OpenAI-compatible endpoints like Ollama, LM Studio, vLLM, Groq, Together AI, etc.
 */
export class LocalLLMProvider implements LLMProvider {
  readonly name = "local";
  private readonly model: LanguageModel;

  constructor(baseURL: string, modelName: string, apiKey?: string) {
    if (!baseURL) throw new Error("Base URL is required for the local provider");
    if (!modelName) throw new Error("Model name is required for the local provider");

    // The Vercel AI SDK allows overriding baseURL to hit any OpenAI-compatible endpoint
    const client = createOpenAI({
      baseURL,
      apiKey: apiKey || "local", // Fallback to "local" if not provided, since Ollama/LM Studio don't require real keys
    });

    this.model = client(modelName);
  }

  async generateCopy<T>(
    systemPrompt: string,
    userPrompt: string,
    schema: z.ZodSchema<T>
  ): Promise<T> {
    const { object } = await generateObject({
      model: this.model,
      schema,
      system: systemPrompt,
      prompt: userPrompt,
    });
    return object;
  }
}
