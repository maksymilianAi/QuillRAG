/**
 * API service — communicates with the CopywrightRAG backend.
 */

import type { GenerateCopyRequest, GenerateCopyResponse, ExtractFigmaRequest, FigmaExtractionResponse, CopyFeedback } from "./types";

const API_BASE = "/api";

// ─── Mock mode ────────────────────────────────────────────────────────────────
// Set to true to use local mock responses (no API calls).
const USE_MOCK = false;

const MOCK_RESPONSES: Record<string, GenerateCopyResponse> = {
  full: {
    format: "full",
    original: "Mental Health service created!\nDon't forget to update payout definitions if you want it to be paid from any account.\nGo to Services · Go to Payout Definition",
    recommended: 0,
    variants: [
      {
        headline: "Mental Health Service Created",
        body: "Update payout definitions to enable reimbursement from any account.",
        ctas: ["Go to Services", "Update Payout Definitions"],
      },
      {
        headline: "Service Created Successfully",
        body: "To allow payments from any account, update the payout definitions for this service.",
        ctas: ["Go to Services", "Go to Payout Definition"],
      },
    ],
    fixes: [
      { original: "Mental Health service created!", rule: "No exclamation marks in functional copy", corrected: "Mental Health Service Created" },
      { original: "Don't forget to update payout definitions", rule: "No reminder phrasing — use direct imperative", corrected: "Update payout definitions" },
    ],
    reasoning: {
      headline: "Variant 1 uses the specific service name ('Mental Health Service') to provide context-appropriate confirmation, matching the noun-phrase modal title pattern in Book Style. Variant 2 offers a generic alternative that works across service types.",
      body: "Sentence style, verb-first, describes the required action without blame or filler. One sentence per the 2-sentence max rule for support text.",
      ctas: "Primary CTA routes to the relevant next step; secondary CTA is the direct remediation action. Book Style, action verb + noun.",
    },
  },

  tooltip: {
    format: "tooltip",
    original: "HSA contribution limit info",
    recommended: 0,
    variants: [
      { headline: undefined, body: "Limits the total amount contributed to an HSA in a calendar year, including employer and employee contributions.", ctas: [] },
      { headline: undefined, body: "Sets the maximum combined contribution from employer and employee for the current plan year.", ctas: [] },
    ],
    fixes: [],
    reasoning: {
      body: "Sentence style, factual and neutral, ends with period. Pattern: 'Limits the [what] that can be [action] [scope].' Variant 1 follows the pattern more precisely.",
    },
  },

  error: {
    format: "error",
    original: "You entered an invalid date. Please try again.",
    recommended: 0,
    variants: [
      { headline: undefined, body: "Enter a date in MM/DD/YYYY format.", ctas: [] },
      { headline: undefined, body: "Enter a valid date to continue.", ctas: [] },
    ],
    fixes: [
      { original: "You entered an invalid date.", rule: "Avoid blame — remove 'You' subject", corrected: "Enter a date in MM/DD/YYYY format." },
    ],
    reasoning: {
      body: "Verb-first, action-oriented per error message rules. Tells the user what to do, not what went wrong. Ends with period.",
    },
  },

  label: {
    format: "label",
    original: "Upload your documents here",
    recommended: 0,
    variants: [
      { headline: "Supporting Documents", body: undefined, ctas: [] },
      { headline: "Attachments", body: undefined, ctas: [] },
    ],
    fixes: [
      { original: "Upload your documents here", rule: "Field labels: 1–3 words, no instructions in the label", corrected: "Supporting Documents" },
    ],
    reasoning: {
      headline: "Sentence style, noun phrase, 1–3 words. Variant 1 is more descriptive; Variant 2 is more universal.",
    },
  },

  button: {
    format: "button",
    original: "Click here to submit",
    recommended: 0,
    variants: [
      { headline: undefined, body: undefined, ctas: ["Submit Reimbursement"] },
      { headline: undefined, body: undefined, ctas: ["Submit Request"] },
    ],
    fixes: [
      { original: "Click here to submit", rule: "Buttons: action verb + noun, no 'Click here'", corrected: "Submit Reimbursement" },
    ],
    reasoning: {
      ctas: "Book Style, action verb + specific noun. Variant 1 is preferred when the context is a reimbursement flow; Variant 2 works across request types.",
    },
  },

  warning: {
    format: "warning",
    formatNote: "This reads as a warning, not an info message — it describes a required action that affects payments.",
    original: undefined,
    recommended: 0,
    variants: [
      { headline: undefined, body: "Update payout definitions to allow reimbursement from any account.", ctas: [] },
      { headline: undefined, body: "Payout definitions are not configured for this service.", ctas: [] },
    ],
    fixes: [
      { original: "Update payout definitions to enable payments from specific accounts.", rule: "Avoid 'enable payments' — use the product term 'reimbursement'", corrected: "Update payout definitions to allow reimbursement from any account." },
    ],
    reasoning: {
      body: "Sentence style, informative and action-oriented. Variant 1 tells the user what to do; Variant 2 states the current state. Both end with a period.",
    },
  },

  clarification: {
    format: "full",
    needsClarification: true,
    clarifyingQuestions: [
      "What type of component or screen is this for?",
      "What is the user's goal or action on this screen?",
      "What content or key message should be communicated?",
    ],
    quickOptions: [
      "Empty state screen",
      "Error message",
      "Success confirmation",
      "Onboarding step",
      "Modal dialog",
    ],
    recommended: 0,
    variants: [],
    fixes: [],
    reasoning: {},
  },

  status: {
    format: "status",
    original: "Your payment was processed!",
    recommended: 0,
    variants: [
      { headline: "Payment Processed", body: undefined, ctas: [] },
      { headline: "Reimbursement Submitted", body: undefined, ctas: [] },
    ],
    fixes: [
      { original: "Your payment was processed!", rule: "No exclamation marks; no passive voice", corrected: "Payment Processed" },
    ],
    reasoning: {
      headline: "Book Style, short noun phrase, no exclamation. Variant 1 is neutral; Variant 2 is more specific to the reimbursement context.",
    },
  },
};

function getMockResponse(prompt: string): GenerateCopyResponse {
  const p = prompt.toLowerCase();

  // Extract quoted text from the prompt to use as the original
  const quotedMatch = prompt.match(/["'""](.+?)["'""]/) ;
  const originalText = quotedMatch ? quotedMatch[1] : undefined;

  let base: GenerateCopyResponse;

  if (p.includes("tooltip") || p.includes("hover") || p.includes("info icon") || p.includes("helper text")) {
    base = MOCK_RESPONSES.tooltip;
  } else if (p.includes("error") || p.includes("validation") || p.includes("invalid")) {
    base = MOCK_RESPONSES.error;
  } else if (p.includes("warning")) {
    base = MOCK_RESPONSES.warning;
  } else if (p.includes("label") || p.includes("field name") || p.includes("column header") || p.includes("tab name") || p.includes("nav item")) {
    base = MOCK_RESPONSES.label;
  } else if (p.includes("button") || p.includes("cta") || p.includes("link text")) {
    base = MOCK_RESPONSES.button;
  } else if (p.includes("status") || p.includes("confirmation") || p.includes("success") || p.includes("notification") || p.includes("toast") || p.includes("badge")) {
    base = MOCK_RESPONSES.status;
  } else if (
    (p.includes("write") || p.includes("create") || p.includes("generate") || p.includes("make")) &&
    !p.includes("additional context:")
  ) {
    base = MOCK_RESPONSES.clarification;
  } else if (p.includes("page") || p.includes("modal") || p.includes("screen") || p.includes("popup") || p.includes("section")) {
    base = MOCK_RESPONSES.full;
  } else if (originalText) {
    // Infer format from the quoted text itself
    const words = originalText.trim().split(/\s+/);
    if (words.length <= 4) base = MOCK_RESPONSES.status;
    else if (originalText.endsWith(".") || originalText.endsWith("?")) base = MOCK_RESPONSES.tooltip;
    else base = MOCK_RESPONSES.status;
  } else {
    base = MOCK_RESPONSES.status;
  }

  // Inject the actual quoted text as original so the mock feels realistic
  return originalText ? { ...base, original: originalText } : base;
}
// ─────────────────────────────────────────────────────────────────────────────

export async function generateCopy(
  request: GenerateCopyRequest
): Promise<GenerateCopyResponse> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    return getMockResponse(request.prompt);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);

  try {
    const res = await fetch(`${API_BASE}/generate-copy`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Unknown error" }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("text/event-stream")) {
      return await readSSEStream(res);
    }
    return res.json();
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out. Please try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function readSSEStream(res: Response): Promise<GenerateCopyResponse> {
  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) throw new Error("Stream ended without a response. Please try again.");

      buffer += decoder.decode(value, { stream: true });

      let boundary: number;
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        const event = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        const lines = event.split("\n");
        const type = lines.find((l) => l.startsWith("event:"))?.slice(6).trim();
        const dataLine = lines.find((l) => l.startsWith("data:"));
        if (!dataLine) continue;

        const data = JSON.parse(dataLine.slice(5).trim());
        if (type === "done") return data as GenerateCopyResponse;
        if (type === "error") throw new Error(data.message ?? "Generation failed");
        // "partial" events are ignored — TypingIndicator is already visible
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

export function sendCopyFeedback(feedback: CopyFeedback): void {
  fetch(`${API_BASE}/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(feedback),
  }).catch(() => {});
}

export async function extractFigma(
  request: ExtractFigmaRequest
): Promise<FigmaExtractionResponse> {
  const res = await fetch(`${API_BASE}/extract-figma`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}
