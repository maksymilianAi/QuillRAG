/**
 * API Layer — Route definitions.
 */

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import type { QuillAgent } from "../agent/quill.agent.js";
import { getFigmaText, parseFigmaUrl } from "../mcp/figma.tool.js";
import { createLLM } from "../llm/index.js";
import { ContextAgent } from "../agent/context.agent.js";

/** Request body validation schema */
const generateCopySchema = z.object({
  prompt: z.string().min(1),
  provider: z.string().optional(),
  apiKey: z.string().optional(),
  figmaToken: z.string().optional(),
  localUrl: z.string().optional(),
  localModel: z.string().optional(),
  localApiKey: z.string().optional(),
  options: z
    .object({
      variantCount: z.number().int().min(1).max(5).default(3),
      fixGrammar: z.boolean().default(true),
      includeReasoning: z.boolean().default(true),
    })
    .optional(),
});

/**
 * Create API routes with the injected Quill agent.
 */
export function createRoutes(agent: QuillAgent): Router {
  const router = Router();

  // Health check
  router.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  // Main endpoint: generate copy
  router.post("/generate-copy", async (req: Request, res: Response) => {
    try {
      // Validate input
      const parsed = generateCopySchema.safeParse(req.body);

      if (!parsed.success) {
        res.status(400).json({
          error: "Validation error",
          details: parsed.error.flatten().fieldErrors,
        });
        return;
      }

      const { prompt, options, provider, apiKey, figmaToken, localUrl, localModel, localApiKey } = parsed.data;

      // Process through agent
      const result = await agent.process({
        prompt,
        options,
        provider,
        apiKey,
        figmaToken,
        localUrl,
        localModel,
        localApiKey,
      });

      res.json(result);
    } catch (err) {
      console.error("[API] Error generating copy:", err);
      res.status(500).json({
        error: "Internal server error",
        message:
          err instanceof Error ? err.message : "Unknown error",
      });
    }
  });

  // Schema for Figma extraction request
  const extractFigmaSchema = z.object({
    figmaUrl: z.string(),
    figmaToken: z.string().optional(),
    provider: z.string().optional(),
    apiKey: z.string().optional(),
    localUrl: z.string().optional(),
    localModel: z.string().optional(),
    localApiKey: z.string().optional(),
  });

  // Route to extract Figma data and generate context
  router.post("/extract-figma", async (req: Request, res: Response) => {
    try {
      const parsed = extractFigmaSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors });
        return;
      }

      const { figmaUrl, figmaToken, provider, apiKey, localUrl, localModel, localApiKey } = parsed.data;

      const figmaData = parseFigmaUrl(figmaUrl);
      if (!figmaData) {
        res.status(400).json({ error: "Invalid Figma URL format" });
        return;
      }

      // Fetch Figma nodes
      const extractionResult = await getFigmaText(figmaData.fileId, figmaData.nodeId, figmaToken);

      // Generate contextual description via LLM
      let contextualDescription = "Context not generated.";
      try {
        const keyToUse = provider === "local" ? localApiKey : apiKey;
        const llm = createLLM(provider || "gemini", keyToUse, localUrl, localModel);
        const contextAgent = new ContextAgent(llm);
        contextualDescription = await contextAgent.generateContext(extractionResult.nodes);
      } catch (err) {
        console.error("[API] Failed to generate context, skipping.", err);
      }

      res.json({
        ...extractionResult,
        contextualDescription,
      });
    } catch (error) {
      console.error("[API] Error extracting Figma data:", error);
      res.status(500).json({ error: String(error) });
    }
  });

  return router;
}
