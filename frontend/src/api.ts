/**
 * API service — communicates with the CopywrightRAG backend.
 */

import type { GenerateCopyRequest, GenerateCopyResponse, ExtractFigmaRequest, FigmaExtractionResponse } from "./types";

const API_BASE = "/api";

export async function generateCopy(
  request: GenerateCopyRequest
): Promise<GenerateCopyResponse> {
  const res = await fetch(`${API_BASE}/generate-copy`, {
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

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
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
