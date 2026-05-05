import { z } from "zod";
import type { LLMProvider } from "../llm/index.js";
import type { FigmaTextNode } from "../mcp/mcp.types.js";

const contextResponseSchema = z.object({
  contextualDescription: z.string().describe("A 1-2 sentence description of what the UI component is and its primary purpose."),
});

export class ContextAgent {
  private llm: LLMProvider;

  constructor(llm: LLMProvider) {
    this.llm = llm;
  }

  /**
   * Generates a contextual description of a UI component based on its text nodes.
   */
  async generateContext(nodes: FigmaTextNode[]): Promise<string> {
    if (!nodes || nodes.length === 0) {
      return "An empty UI component.";
    }

    const systemPrompt = `You are an expert UX designer and product manager.
Your task is to analyze the text labels from a UI component and deduce what the component is and its primary purpose.
Provide a concise 1-2 sentence contextual description.
Do not list the text nodes. Just describe the component holistically.`;

    // Limit to top 50 nodes to avoid massive prompts for huge files
    const textSnapshot = nodes
      .slice(0, 50)
      .map(n => `- "${n.text}" (element: ${n.name})`)
      .join("\n");

    const userPrompt = `Here are the text elements from a UI component:\n\n${textSnapshot}\n\nWhat is this component for?`;

    try {
      const response = await this.llm.generateCopy(
        systemPrompt,
        userPrompt,
        contextResponseSchema
      );
      return response.contextualDescription;
    } catch (error) {
      console.error("[Context Agent] Error generating context:", error);
      return "A UI component with text elements.";
    }
  }
}
