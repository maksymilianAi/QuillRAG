/**
 * LLM Layer — Abstract interface for language model providers.
 *
 * Uses Vercel AI SDK under the hood for some providers, but exposes a simplified interface
 * so the rest of the system doesn't depend on SDK internals.
 */

import type { z } from "zod";

/** Supported LLM provider names */
export type LLMProviderName = "openai" | "claude" | "gemini" | "local";

/**
 * Unified LLM interface used by the Quill agent.
 */
export interface LLMProvider {
  /** Human-readable name of the provider */
  readonly name: string;

  /** Generates structured copy variants based on prompts */
  generateCopy<T>(systemPrompt: string, userPrompt: string, schema: z.ZodSchema<T>): Promise<T>;
}
