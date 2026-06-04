/**
 * API service — communicates with the CopywrightRAG backend.
 */

import type { GenerateCopyRequest, GenerateCopyResponse, ExtractFigmaRequest, FigmaExtractionResponse, CopyFeedback } from "./types";

const API_BASE = "/api";

// ─── Mock mode ────────────────────────────────────────────────────────────────
// Set to true to use local mock responses (no API calls).
const USE_MOCK = false;

const MOCK_RESPONSES: Record<string, GenerateCopyResponse> = {
  confirmation_success: {
    format: "confirmation_success",
    recommended: 0,
    variants: [
      {
        headline: "Your request has been submitted",
        body: "You can check the status under expense details.",
        ctas: [],
      },
      {
        headline: "Request received",
        body: "We'll send an update when the review is complete.",
        ctas: [],
      },
    ],
    reasoning: {
      headline: "Sentence case, present perfect passive with personal framing.",
      body: "Capability framing — 'you can check' instead of imperative.",
    },
  },

  confirmation_prompt: {
    format: "confirmation_prompt",
    recommended: 0,
    variants: [
      { headline: "Submit reimbursement request?", body: "Submitting will route this to your administrator for review.", ctas: [] },
    ],
    reasoning: { headline: "Active voice question, sentence case, 3 words." },
  },

  destructive: {
    format: "destructive",
    recommended: 0,
    variants: [
      { headline: "Delete account?", body: "This will remove the account and all linked data. This cannot be undone.", ctas: [] },
    ],
    reasoning: {
      headline: "Active voice question, sentence case, names the destruction.",
      body: "Explicit irreversibility statement per destructive rule.",
    },
  },

  notification: {
    format: "notification",
    recommended: 0,
    variants: [
      {
        headline: "Healthcare FSA is scheduled for termination",
        body: "Please note that you can edit or cancel the termination configuration until [date].",
        ctas: [],
      },
    ],
    reasoning: {
      headline: "Declarative present passive, sentence case, no end punctuation.",
      body: "Polite softener 'please note' + capability framing.",
    },
  },
};

function getMockResponse(prompt: string): GenerateCopyResponse {
  const p = prompt.toLowerCase();
  const quotedMatch = prompt.match(/["'""](.+?)["'""]/);
  const originalText = quotedMatch ? quotedMatch[1] : undefined;

  let base: GenerateCopyResponse;
  if (p.includes("delete") || p.includes("remove") || p.includes("destroy")) {
    base = MOCK_RESPONSES.destructive;
  } else if (p.includes("scheduled") || p.includes("notification") || p.includes("upcoming")) {
    base = MOCK_RESPONSES.notification;
  } else if (p.includes("confirm") || p.includes("submit?") || p.includes("are you sure")) {
    base = MOCK_RESPONSES.confirmation_prompt;
  } else {
    base = MOCK_RESPONSES.confirmation_success;
  }

  return originalText ? { ...base, original: originalText } : base;
}
// ─────────────────────────────────────────────────────────────────────────────

export interface SessionConfig {
  provider?: string;
  apiKey?: string;
  localUrl?: string;
  localModel?: string;
  localApiKey?: string;
  figmaToken?: string;
}

/**
 * Update session-specific configuration on the server.
 */
export async function updateServerConfig(config: SessionConfig): Promise<void> {
  await fetch(`${API_BASE}/config`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
}

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
      throw new Error("Request timed out. Please try again.", { cause: err });
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
  // Include provider settings from localStorage so the server doesn't need a
  // prior /api/config call — each request is self-contained on cold starts.
  const storedProvider = localStorage.getItem("copy_provider") ?? undefined;
  const enriched: ExtractFigmaRequest = {
    provider: storedProvider,
    localUrl: storedProvider === "local" ? (localStorage.getItem("copy_local_url") ?? undefined) : undefined,
    localModel: storedProvider === "local" ? (localStorage.getItem("copy_local_model") ?? undefined) : undefined,
    ...request,
  };

  const res = await fetch(`${API_BASE}/extract-figma`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(enriched),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}
