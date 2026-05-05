import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, type LanguageModel } from "ai";
import type { LLMProvider } from "./llm.interface.js";
import { config } from "../config.js";
import type { z } from "zod";

/**
 * OpenAI LLM Provider
 */
export class OpenAIProvider implements LLMProvider {
  readonly name = "openai";
  private readonly model: LanguageModel;

  constructor(apiKey?: string) {
    const key = apiKey || config.openaiApiKey;
    if (!key) throw new Error("OpenAI API key is missing");

    const client = createOpenAI({ apiKey: key });
    this.model = client("gpt-4o-mini");
  }

  async generateCopy<T>(systemPrompt: string, userPrompt: string, schema: z.ZodSchema<T>): Promise<T> {
    const { object } = await generateObject({
      model: this.model,
      schema,
      system: systemPrompt,
      prompt: userPrompt,
    });
    return object;
  }
}
