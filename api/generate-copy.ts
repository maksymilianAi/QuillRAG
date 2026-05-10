/**
 * Edge Function — /api/generate-copy
 *
 * Runs on Vercel Edge Runtime (no Node.js 10s limit).
 * Uses a direct fetch() to the Anthropic Messages API — bypasses the AI SDK
 * to avoid Edge runtime compatibility issues with Zod v4 / generateObject.
 */

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

const GENERATE_COPY_TOOL = {
  name: "generate_copy",
  description: "Output structured UX copywriting result",
  input_schema: {
    type: "object",
    properties: {
      format: {
        type: "string",
        enum: ["full", "tooltip", "error", "warning", "info", "label", "button", "status"],
        description: "Detected copy format",
      },
      formatNote: { type: "string" },
      needsClarification: { type: "boolean" },
      clarifyingQuestions: { type: "array", items: { type: "string" } },
      quickOptions: { type: "array", items: { type: "string" } },
      approved: { type: "boolean" },
      approvalNote: { type: "string" },
      original: { type: "string" },
      recommended: { type: "integer", minimum: 0 },
      variants: {
        type: "array",
        items: {
          type: "object",
          properties: {
            headline: { type: "string" },
            body: { type: "string" },
            ctas: { type: "array", items: { type: "string" } },
          },
          required: ["ctas"],
        },
      },
      fixes: {
        type: "array",
        items: {
          type: "object",
          properties: {
            original: { type: "string" },
            corrected: { type: "string" },
            rule: { type: "string" },
          },
          required: ["original", "corrected", "rule"],
        },
      },
      reasoning: {
        type: "object",
        properties: {
          headline: { type: "string" },
          body: { type: "string" },
          ctas: { type: "string" },
        },
      },
    },
    required: ["format", "recommended", "variants", "fixes", "reasoning"],
  },
};

function parseFigmaUrl(url: string): { fileId: string; nodeId?: string } | null {
  const fileMatch = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
  if (!fileMatch) return null;
  const nodeMatch = url.match(/node-id=([a-zA-Z0-9%:-]+)/);
  return {
    fileId: fileMatch[1],
    nodeId: nodeMatch ? decodeURIComponent(nodeMatch[1]).replace(/-/g, ":") : undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractTextNodes(node: any, results: Array<{ id: string; name: string; text: string }> = []) {
  if (node.type === "TEXT" && node.characters) {
    results.push({ id: node.id, name: node.name || "Unnamed", text: node.characters });
  }
  if (node.children) for (const child of node.children) extractTextNodes(child, results);
  return results;
}

async function fetchFigmaNodes(
  fileId: string,
  nodeId: string | undefined,
  token: string
): Promise<Array<{ id: string; name: string; text: string }>> {
  const endpoint = nodeId
    ? `https://api.figma.com/v1/files/${fileId}/nodes?ids=${nodeId}`
    : `https://api.figma.com/v1/files/${fileId}`;
  const res = await fetch(endpoint, { headers: { "X-Figma-Token": token } });
  if (!res.ok) throw new Error(`Figma API ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await res.json() as any;
  if (nodeId && data.nodes?.[nodeId]) return extractTextNodes(data.nodes[nodeId].document);
  if (data.document) return extractTextNodes(data.document);
  return [];
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

  const apiKey = (process.env.ANTHROPIC_API_KEY ?? process.env.Claude_API) as string | undefined;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Anthropic API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Extract Figma nodes if a Figma URL is present in the prompt
  const figmaMatch = prompt.match(/https:\/\/(?:www\.)?figma\.com\/[^\s]+/);
  let figmaNodes: Array<{ id: string; name: string; text: string }> = [];
  if (figmaMatch) {
    const figmaToken = (process.env.FIGMA_ACCESS_TOKEN ?? process.env.Figma_Token) as string | undefined;
    if (figmaToken) {
      const parsed = parseFigmaUrl(figmaMatch[0]);
      if (parsed) {
        try {
          figmaNodes = await fetchFigmaNodes(parsed.fileId, parsed.nodeId, figmaToken);
          console.log(`[Edge] Fetched ${figmaNodes.length} Figma nodes`);
        } catch (err) {
          console.error("[Edge] Figma fetch failed, proceeding without nodes:", err);
        }
      }
    } else {
      console.warn("[Edge] Figma URL detected but no Figma token configured");
    }
  }

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt({
    userPrompt: prompt,
    ragContext: [],
    figmaNodes,
    variantCount,
    fixGrammar,
    includeReasoning,
  });

  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(enc.encode(":ok\n\n"));

      const fetchAbort = new AbortController();
      const fetchTimeout = setTimeout(() => fetchAbort.abort(), 28_000);

      try {
        console.log("[Edge] calling Anthropic API...");
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 4096,
            system: systemPrompt,
            messages: [{ role: "user", content: userPrompt }],
            tools: [GENERATE_COPY_TOOL],
            tool_choice: { type: "tool", name: "generate_copy" },
          }),
          signal: fetchAbort.signal,
        });
        console.log("[Edge] Anthropic responded:", res.status);

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Anthropic API error ${res.status}: ${errText}`);
        }

        const result = (await res.json()) as {
          content: Array<{ type: string; input?: unknown }>;
        };

        const toolUse = result.content.find((c) => c.type === "tool_use");
        if (!toolUse?.input) {
          throw new Error("No tool_use block in Anthropic response");
        }

        controller.enqueue(
          enc.encode(`event: done\ndata: ${JSON.stringify(toolUse.input)}\n\n`)
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("[Edge] Anthropic fetch error:", message);
        controller.enqueue(
          enc.encode(`event: error\ndata: ${JSON.stringify({ message })}\n\n`)
        );
      } finally {
        clearTimeout(fetchTimeout);
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
