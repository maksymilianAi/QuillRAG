import { z } from "zod";

/** Zod schema for structured LLM output — shared between QuillAgent and the Edge Function */
export const agentResponseSchema = z.object({
  format: z
    .enum([
      "confirmation_success",
      "confirmation_prompt",
      "destructive",
      "notification",
    ])
    .describe(
      "Modal subtype detected from the request and content. confirmation_success = action just completed; confirmation_prompt = user is being asked to confirm an action; destructive = user is being asked to confirm an irreversible action; notification = system informs about an ongoing/future event the user did not just trigger."
    ),
  formatNote: z
    .string()
    .optional()
    .describe(
      "Set when the detected subtype differs from what the user labelled it — explain the mismatch in one sentence."
    ),
  needsClarification: z
    .boolean()
    .optional()
    .describe(
      "Set to true only when the prompt truly contains nothing to work from (no quoted copy, no Figma context, no Previous copy/variants block, no refinement instruction)."
    ),
  clarifyingQuestions: z
    .array(z.string())
    .optional()
    .describe("Up to 3 questions when needsClarification=true. Each 8 words max, no parenthetical examples."),
  approved: z
    .boolean()
    .optional()
    .describe("Set true when the original copy already satisfies the subtype + universal rules."),
  approvalNote: z
    .string()
    .optional()
    .describe("Short confirmation when approved=true — must name at least 2 specific rules satisfied."),
  original: z
    .string()
    .optional()
    .describe("Verbatim copy of the source text — never corrected. Omit if no source copy."),
  recommended: z.number().int().min(0).describe("Zero-based index of the recommended variant."),
  variants: z.array(
    z.object({
      headline: z.string().describe("The modal title."),
      body: z.string().optional().describe("Optional body text. Omit when no meaningful follow-up to add (only for confirmation_success)."),
      ctas: z
        .array(z.string())
        .describe("Out of MVP scope — always return an empty array."),
    })
  ),
  reasoning: z
    .object({
      headline: z.string().optional().describe("Why the title approach was chosen — name a specific rule."),
      body: z.string().optional().describe("Why the body approach was chosen — name a specific rule."),
    })
    .describe("Per-section reasoning. No generic phrases like 'more concise'."),
});

export type AgentResponseSchema = typeof agentResponseSchema;
