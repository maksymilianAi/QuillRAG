try {
  const dotenv = await import("dotenv");
  dotenv.config();
} catch {
  // dotenv not available (e.g., serverless) — env vars come from platform
}

export const config = {
  /** LLM provider: "openai" | "claude" | "gemini" */
  llmProvider: (process.env.LLM_PROVIDER || "openai") as
    | "openai"
    | "claude"
    | "gemini",

  /** OpenAI API key */
  openaiApiKey: process.env.OPENAI_API_KEY || "",

  /** Anthropic (Claude) API key */
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || "",

  /** Google (Gemini) API key */
  googleApiKey: process.env.GOOGLE_API_KEY || "",

  /** Figma personal access token */
  figmaAccessToken: process.env.FIGMA_ACCESS_TOKEN || "",

  /** Server port */
  port: parseInt(process.env.PORT || "3001", 10),

  /** Node environment */
  nodeEnv: process.env.NODE_ENV || "development",
} as const;
