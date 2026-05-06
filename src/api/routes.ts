/**
 * API Layer — Route definitions.
 */

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import type { QuillAgent } from "../agent/quill.agent.js";
import { getFigmaText, parseFigmaUrl } from "../mcp/figma.tool.js";
import { createLLM } from "../llm/index.js";
import { ContextAgent } from "../agent/context.agent.js";

/** Patterns that indicate prompt injection or out-of-scope requests. */
const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|your)\s+(instructions?|rules?|prompt)/i,
  /forget\s+(your|the|all)\s+(instructions?|rules?|context|prompt)/i,
  /you\s+are\s+now\s+/i,
  /act\s+as\s+(a\s+)?(different|new|another|unrestricted)/i,
  /reveal\s+(your|the)\s+(system\s+)?prompt/i,
  /show\s+(me\s+)?(your|the)\s+(api\s+key|secret|token|password|credentials?)/i,
  /what\s+is\s+(your|the)\s+(api\s+key|secret|token|password)/i,
  /give\s+(me\s+)?(your|the)\s+(api\s+key|secret|token|password|credentials?)/i,
  /print\s+(your|the)\s+(api\s+key|secret|token|password|system\s+prompt)/i,
  /output\s+(your|the)\s+(api\s+key|secret|token|system\s+prompt)/i,
  /delete\s+(all|every|the)\s+(data|records?|files?|documents?|everything)/i,
  /drop\s+(the\s+)?(database|table|collection)/i,
  /rm\s+-rf/i,
  /execute\s+(this\s+)?(command|code|script)/i,
  /run\s+(this\s+)?(command|code|script)/i,
  /\bDAN\b/,
  /jailbreak/i,
  /bypass\s+(your\s+)?(filter|restriction|rule|limit)/i,
];

/**
 * Returns true if the prompt contains injection/abuse patterns.
 */
function isInjectionAttempt(prompt: string): boolean {
  return INJECTION_PATTERNS.some((re) => re.test(prompt));
}

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

      // Reject prompt injection and out-of-scope requests before touching the LLM
      if (isInjectionAttempt(prompt)) {
        console.warn(`[API] Blocked suspicious prompt: "${prompt.slice(0, 120)}"`);
        res.status(400).json({
          error: "Out-of-scope request",
          message: "Quill only handles UX copywriting tasks. Please describe the copy you need help with.",
        });
        return;
      }

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

  // Copy feedback — implicit signal that a variant was useful
  const feedbackSchema = z.object({
    prompt: z.string(),
    variantIndex: z.number().int().min(0),
    variant: z.object({
      headline: z.string(),
      body: z.string().optional(),
      ctas: z.array(z.string()),
    }),
    action: z.literal("copy"),
    timestamp: z.string(),
  });

  router.post("/feedback", (req: Request, res: Response) => {
    const parsed = feedbackSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid feedback payload" });
      return;
    }
    const { prompt, variantIndex, variant, timestamp } = parsed.data;
    console.log(`[Feedback] copy variant #${variantIndex + 1} at ${timestamp}`);
    console.log(`[Feedback] prompt: "${prompt}"`);
    console.log(`[Feedback] variant: "${variant.headline}" / "${variant.ctas.join(", ")}"`);
    res.json({ ok: true });
  });

  return router;
}
