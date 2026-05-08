import { z } from "zod";

/** Zod schema for structured LLM output — shared between QuillAgent and the Edge Function */
export const agentResponseSchema = z.object({
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

export type AgentResponseSchema = typeof agentResponseSchema;
