import { GoogleGenAI } from "@google/genai";
import type { LLMProvider } from "./llm.interface.js";
import { config } from "../config.js";
import type { z } from "zod";

/**
 * Gemini LLM Provider (Google)
 */
export class GeminiProvider implements LLMProvider {
  readonly name = "gemini";
  private ai: GoogleGenAI;

  constructor(apiKey?: string) {
    const key = apiKey || config.googleApiKey;
    if (!key) throw new Error("Google API key is missing");

    this.ai = new GoogleGenAI({ apiKey: key });
  }

  async generateCopy<T>(systemPrompt: string, userPrompt: string, schema: z.ZodSchema<T>): Promise<T> {
    const strictInstruction = `
${systemPrompt}

CRITICAL INSTRUCTION: You MUST return a single JSON object.
Do not include markdown formatting like \`\`\`json.
Your JSON must strictly follow this exact structure:
{
  "variants": [ // can be empty array if you are only fixing a specific element, not generating full layout variants
    {
      "headline": "string (the main headline)",
      "cta": "string (the primary call to action text)",
      "labels": ["string", "string"]
    }
  ],
  "fixes": [ // use this array to return targeted rewrites and fixes
    {
      "original": "string",
      "corrected": "string",
      "rule": "string (the rule applied)"
    }
  ],
  "reasoning": [
    "string (reasoning sentence 1)",
    "string (reasoning sentence 2)"
  ]
}
`;

    console.log(`[Gemini] Calling model gemini-2.5-flash...`);
    console.log(`[Gemini] User prompt length: ${userPrompt.length} chars`);

    const response = await this.ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: strictInstruction,
        responseMimeType: "application/json",
      }
    });

    console.log(`[Gemini] Response received, text length: ${response.text?.length || 0}`);

    const text = response.text || "{}";
    
    try {
      const parsed = JSON.parse(text);
      return schema.parse(parsed);
    } catch (e) {
      // Fallback cleanup in case it still returned markdown
      const cleaned = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      return schema.parse(parsed);
    }
  }
}
