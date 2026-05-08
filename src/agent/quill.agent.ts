/**
 * Quill Agent — Central copywriting orchestrator.
 *
 * Coordinates RAG retrieval, Figma text extraction, prompt assembly,
 * and LLM generation to produce structured UX copy.
 */

import { z } from "zod";
import { createLLM, type LLMProvider } from "../llm/index.js";
import { RAGService } from "../rag/rag.service.js";
import { getFigmaText, parseFigmaUrl } from "../mcp/figma.tool.js";
import { buildSystemPrompt, buildUserPrompt } from "../prompt/prompt.builder.js";
import type { GenerateCopyInput, AgentResponse } from "./agent.types.js";

/** Zod schema for structured LLM output */
const agentResponseSchema = z.object({
  format: z.enum(["full", "tooltip", "error", "warning", "info", "label", "button", "status"])
    .describe("Detected copy format based on BOTH the user's request AND the tone/content of the text. Analyze the actual text — if it describes a failure, missing configuration, or required action with consequences, classify as 'error' or 'warning' even if the user called it something else."),
  formatNote: z.string().optional()
    .describe("If the actual tone or severity of the text differs from what the user labeled it — explain the mismatch in one sentence. Omit if there is no mismatch."),
  needsClarification: z.boolean().optional()
    .describe("Set to true when the request lacks enough context to generate accurate copy — e.g. the component type, purpose, or content is unspecified. When true, populate clarifyingQuestions and return empty variants and fixes."),
  clarifyingQuestions: z.array(z.string()).optional()
    .describe("2–4 specific questions to ask the user when needsClarification=true. Ask only what is genuinely missing. Each question should be concrete and answerable in one sentence."),
  quickOptions: z.array(z.string()).optional()
    .describe("3–5 short context chips when needsClarification=true — common component types or use cases relevant to the request (e.g. 'Empty state', 'Error message', 'Success confirmation'). Omit otherwise."),
  approved: z.boolean().optional()
    .describe("Set to true if the submitted copy already meets all style rules and guidelines and needs no changes. When true, set approvalNote and return empty variants and fixes arrays."),
  approvalNote: z.string().optional()
    .describe("Short confirmation when approved=true, e.g. 'Looks good — verb-first, sentence style, period at end.' Omit when approved is not true."),
  original: z.string().optional().describe("Original copy text from the design context, as plain text. Omit if no original context is available."),
  recommended: z.number().int().min(0).describe("Zero-based index of the recommended variant"),
  variants: z.array(
    z.object({
      headline: z.string().optional().describe("Title or heading text (Book Style) — populate for 'full', 'label', 'status' formats only"),
      body: z.string().optional().describe("Supporting/descriptive body text — populate for 'full', 'tooltip', 'error' formats only"),
      ctas: z.array(z.string()).describe("Button labels — populate for 'full' and 'button' formats; empty array otherwise"),
    })
  ),
  fixes: z.array(
    z.object({
      original: z.string().describe("Original text with issue"),
      corrected: z.string().describe("Corrected version"),
      rule: z.string().describe("Grammar/style rule applied"),
    })
  ),
  reasoning: z.object({
    headline: z.string().optional().describe("Why this headline approach was chosen"),
    body: z.string().optional().describe("Why this body text approach was chosen"),
    ctas: z.string().optional().describe("Why these CTA labels were chosen"),
  }).describe("Per-section reasoning for copywriting decisions"),
});

export class QuillAgent {
  private llm: LLMProvider;
  private rag: RAGService;

  constructor(llm: LLMProvider, rag: RAGService) {
    this.llm = llm;
    this.rag = rag;
  }

  /**
   * Process a copywriting request end-to-end.
   */
  async process(input: GenerateCopyInput): Promise<AgentResponse> {
    // 1. Resolve LLM provider (use request-specific if provided)
    let activeLlm = this.llm;
    const userKey = input.provider === "local" ? input.localApiKey : input.apiKey;
    if (input.provider && userKey) {
      activeLlm = createLLM(input.provider, userKey, input.localUrl, input.localModel);
    }

    if (!activeLlm) {
      throw new Error(
        "No LLM provider available. Please provide an API key in the settings sidebar or set it in the server .env file."
      );
    }

    console.log(`[Quill] Processing request: "${input.prompt}"`);

    // 2. Retrieve RAG context (using the provider's own embedding model if available)
    const ragResults = await this.rag.retrieve(input.prompt, input.provider, input.apiKey);
    const ragContext = ragResults.map((r) => r.document.text);
    console.log(`[Quill] Retrieved ${ragContext.length} RAG documents`);

    // 2. Get Figma text nodes (if figmaNodes provided or detect URL in prompt)
    let figmaNodes = input.figmaNodes || [];

    if (figmaNodes.length === 0) {
      // Try to detect Figma URL in the prompt
      const figmaParsed = parseFigmaUrl(input.prompt);
      if (figmaParsed) {
        try {
          const extraction = await getFigmaText(figmaParsed.fileId, figmaParsed.nodeId, input.figmaToken);
          figmaNodes = extraction.nodes;
          console.log(
            `[Quill] Extracted ${figmaNodes.length} nodes from Figma`
          );
        } catch (err) {
          console.warn(`[Quill] Figma extraction failed:`, err);
        }
      }
    }

    // 3. Build prompts
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt({
      userPrompt: input.prompt,
      ragContext,
      figmaNodes,
      variantCount: input.options?.variantCount ?? 2,
      fixGrammar: input.options?.fixGrammar ?? true,
      includeReasoning: input.options?.includeReasoning ?? true,
    });

    console.log("================ SYSTEM PROMPT ================");
    console.log(systemPrompt);
    console.log("================= USER PROMPT =================");
    console.log(userPrompt);
    console.log("===============================================");

    // 4. Generate structured response via LLM
    console.log(`[Quill] Generating with ${activeLlm.name}...`);

    const object = await activeLlm.generateCopy(
      systemPrompt,
      userPrompt,
      agentResponseSchema
    );

    console.log(
      `[Quill] Generated ${object.variants.length} variants, ${object.fixes.length} fixes`
    );

    return object;
  }

  /**
   * Stream a copywriting request, calling onPartial for each incremental update.
   * Falls back to blocking generateCopy for providers without streaming support.
   */
  async processStream(
    input: GenerateCopyInput,
    onPartial: (partial: unknown) => void
  ): Promise<AgentResponse> {
    let activeLlm = this.llm;
    const userKey = input.provider === "local" ? input.localApiKey : input.apiKey;
    if (input.provider && userKey) {
      activeLlm = createLLM(input.provider, userKey, input.localUrl, input.localModel);
    }

    if (!activeLlm) {
      throw new Error(
        "No LLM provider available. Please provide an API key in the settings sidebar or set it in the server .env file."
      );
    }

    console.log(`[Quill] Streaming request: "${input.prompt}"`);

    const ragResults = await this.rag.retrieve(input.prompt, input.provider, input.apiKey);
    const ragContext = ragResults.map((r) => r.document.text);

    let figmaNodes = input.figmaNodes || [];
    if (figmaNodes.length === 0) {
      const figmaParsed = parseFigmaUrl(input.prompt);
      if (figmaParsed) {
        try {
          const extraction = await getFigmaText(figmaParsed.fileId, figmaParsed.nodeId, input.figmaToken);
          figmaNodes = extraction.nodes;
        } catch (err) {
          console.warn(`[Quill] Figma extraction failed:`, err);
        }
      }
    }

    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt({
      userPrompt: input.prompt,
      ragContext,
      figmaNodes,
      variantCount: input.options?.variantCount ?? 2,
      fixGrammar: input.options?.fixGrammar ?? true,
      includeReasoning: input.options?.includeReasoning ?? true,
    });

    if (activeLlm.streamCopy) {
      const { partialObjectStream, object } = activeLlm.streamCopy(
        systemPrompt,
        userPrompt,
        agentResponseSchema
      );

      for await (const partial of partialObjectStream) {
        onPartial(partial);
      }

      return await object;
    }

    return await activeLlm.generateCopy(systemPrompt, userPrompt, agentResponseSchema);
  }
}
