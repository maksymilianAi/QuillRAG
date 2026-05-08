import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject, streamObject, type LanguageModel } from "ai";
import type { LLMProvider } from "./llm.interface.js";
import { config } from "../config.js";
import type { z } from "zod";

/**
 * Claude (Anthropic) provider — uses claude-sonnet-4-20250514 for MVP.
 */
export class ClaudeProvider implements LLMProvider {
  readonly name = "claude";
  private readonly model: LanguageModel;

  constructor(apiKey?: string) {
    const key = apiKey || config.anthropicApiKey;
    if (!key) throw new Error("Anthropic API key is missing");

    const client = createAnthropic({ apiKey: key });
    this.model = client("claude-sonnet-4-5");
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

  streamCopy<T>(systemPrompt: string, userPrompt: string, schema: z.ZodSchema<T>) {
    const { partialObjectStream, object } = streamObject({
      model: this.model,
      schema,
      system: systemPrompt,
      prompt: userPrompt,
    });
    return { partialObjectStream, object } as { partialObjectStream: AsyncIterable<unknown>; object: Promise<T> };
  }
}
