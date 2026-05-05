/**
 * LLM Layer — Factory & barrel exports.
 */

import type { LLMProvider, LLMProviderName } from "./llm.interface.js";
import { OpenAIProvider } from "./openai.provider.js";
import { ClaudeProvider } from "./claude.provider.js";
import { GeminiProvider } from "./gemini.provider.js";
import { LocalLLMProvider } from "./local.provider.js";

export { type LLMProvider, type LLMProviderName } from "./llm.interface.js";

/**
 * Factory function to create an LLM provider by name.
 */
export function createLLM(provider: string, apiKey?: string, localUrl?: string, localModel?: string): LLMProvider {
  switch (provider.toLowerCase()) {
    case "openai":
      return new OpenAIProvider(apiKey);
    case "claude":
    case "anthropic":
      return new ClaudeProvider(apiKey);
    case "gemini":
    case "google":
      return new GeminiProvider(apiKey);
    case "local":
      if (!localUrl || !localModel) {
        throw new Error("Base URL and Model Name are required for the local provider.");
      }
      return new LocalLLMProvider(localUrl, localModel, apiKey);
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}
