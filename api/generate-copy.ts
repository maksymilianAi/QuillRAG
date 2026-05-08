/**
 * Edge Function — /api/generate-copy
 *
 * Runs on Vercel Edge Runtime (no Node.js 10s limit).
 * Streams the Claude response as SSE so the client sees the typing indicator
 * throughout generation and gets the full ResponseCard when done.
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { agentResponseSchema } from "../src/agent/agent.schema.js";
import { buildSystemPrompt, buildUserPrompt } from "../src/prompt/prompt.builder.js";

export const config = { runtime: "edge" };

const INJECTION_PATTERNS = [
  /ignore\s+(previous|all|your)\s+(instructions?|rules?|prompt)/i,
  /forget\s+(your|the|all)\s+(instructions?|rules?|context|prompt)/i,
  /you\s+are\s+now\s+/i,
  /act\s+as\s+(a\s+)?(different|new|another|unrestricted)/i,
  /reveal\s+(your|the)\s+(system\s+)?prompt/i,
  /show\s+(me\s+)?(your|the)\s+(api\s+key|secret|token|password|credentials?)/i,
  /give\s+(me\s+)?(your|the)\s+(api\s+key|secret|token|password|credentials?)/i,
  /print\s+(your|the)\s+(api\s+key|secret|token|password|system\s+prompt)/i,
  /\bDAN\b/,
  /jailbreak/i,
  /bypass\s+(your\s+)?(filter|restriction|rule|limit)/i,
];

function isInjectionAttempt(prompt: string): boolean {
  return INJECTION_PATTERNS.some((re) => re.test(prompt));
}

export default async function handler(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return new Response(JSON.stringify({ error: "prompt is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (isInjectionAttempt(prompt)) {
    return new Response(
      JSON.stringify({
        error: "Out-of-scope request",
        message: "Quill only handles UX copywriting tasks.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const options = (body.options as Record<string, unknown>) ?? {};
  const variantCount = typeof options.variantCount === "number" ? options.variantCount : 2;
  const fixGrammar = options.fixGrammar !== false;
  const includeReasoning = options.includeReasoning !== false;

  const apiKey = process.env.ANTHROPIC_API_KEY ?? (process.env.Claude_API as string | undefined);
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Anthropic API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const anthropic = createAnthropic({ apiKey });
  const model = anthropic("claude-sonnet-4-6");

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt({
    userPrompt: prompt,
    ragContext: [],
    figmaNodes: [],
    variantCount,
    fixGrammar,
    includeReasoning,
  });

  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Flush headers immediately — this keeps the Edge connection alive
      // while Claude generates (which can take 20-30s)
      controller.enqueue(enc.encode(":ok\n\n"));

      try {
        const { object } = await generateObject({
          model,
          schema: agentResponseSchema,
          system: systemPrompt,
          prompt: userPrompt,
        });
        controller.enqueue(enc.encode(`event: done\ndata: ${JSON.stringify(object)}\n\n`));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[Edge] generateObject error:", message);
        controller.enqueue(enc.encode(`event: error\ndata: ${JSON.stringify({ message })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
