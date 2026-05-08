/**
 * Quill Agent — Central copywriting orchestrator.
 *
 * Coordinates RAG retrieval, Figma text extraction, prompt assembly,
 * and LLM generation to produce structured UX copy.
 */

import { createLLM, type LLMProvider } from "../llm/index.js";
import { RAGService } from "../rag/rag.service.js";
import { getFigmaText, parseFigmaUrl } from "../mcp/figma.tool.js";
import { buildSystemPrompt, buildUserPrompt } from "../prompt/prompt.builder.js";
import type { GenerateCopyInput, AgentResponse } from "./agent.types.js";
import { agentResponseSchema } from "./agent.schema.js";

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
