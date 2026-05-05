/**
 * MCP Layer — Figma text extraction tool.
 *
 * Calls the Figma REST API to extract TEXT nodes from a design file.
 * Only text content and element names are extracted — layout and styling are ignored.
 */

import { config } from "../config.js";
import type { FigmaTextNode, FigmaExtractionResult } from "./mcp.types.js";

const FIGMA_API_BASE = "https://api.figma.com/v1";

/**
 * Recursively extract all TEXT nodes from a Figma document tree.
 */
function extractTextNodes(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  node: any,
  results: FigmaTextNode[] = []
): FigmaTextNode[] {
  if (node.type === "TEXT" && node.characters) {
    results.push({
      id: node.id,
      name: node.name || "Unnamed",
      text: node.characters,
      absoluteBoundingBox: node.absoluteBoundingBox,
    });
  }

  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      extractTextNodes(child, results);
    }
  }

  return results;
}

export async function getFigmaText(
  fileId: string,
  nodeId?: string,
  figmaToken?: string
): Promise<FigmaExtractionResult> {
  const token = figmaToken || config.figmaAccessToken;
  if (!token) {
    throw new Error("Figma Access Token is missing. Provide it in the UI or backend environment.");
  }

  const endpoint = nodeId 
    ? `${FIGMA_API_BASE}/files/${fileId}/nodes?ids=${nodeId}`
    : `${FIGMA_API_BASE}/files/${fileId}`;

  const response = await fetch(endpoint, {
    headers: {
      "X-Figma-Token": token,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Figma API error (${response.status}): ${errorText}`
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await response.json()) as any;
  
  let nodes: FigmaTextNode[] = [];
  let rootBoundingBox;
  if (nodeId && data.nodes && data.nodes[nodeId]) {
    // When fetching specific nodes, the response is data.nodes[nodeId].document
    const document = data.nodes[nodeId].document;
    nodes = extractTextNodes(document);
    rootBoundingBox = document.absoluteBoundingBox;
  } else if (data.document) {
    nodes = extractTextNodes(data.document);
    // If fetching the whole file without node-id, we don't have a specific root bounding box
  }

  console.log(
    `[Figma MCP] Extracted ${nodes.length} text nodes from file ${fileId}${nodeId ? ` (node ${nodeId})` : ''}`
  );

  // Fetch a rendered PNG of the node via Figma Image Export API
  let nodeImageUrl: string | undefined;
  if (nodeId) {
    try {
      nodeImageUrl = await getFigmaNodeImage(fileId, nodeId, token);
    } catch (err) {
      console.error("[Figma MCP] Failed to fetch node image, continuing without it:", err);
    }
  }

  return {
    fileId,
    nodes,
    extractedAt: new Date().toISOString(),
    rootBoundingBox,
    nodeImageUrl,
  };
}

/**
 * Fetch a rendered PNG image of a specific Figma node.
 * Uses the Figma Image Export API: GET /v1/images/:file_key?ids=:node_id
 */
async function getFigmaNodeImage(
  fileId: string,
  nodeId: string,
  token: string
): Promise<string | undefined> {
  const imageEndpoint = `${FIGMA_API_BASE}/images/${fileId}?ids=${nodeId}&format=png&scale=2`;

  const response = await fetch(imageEndpoint, {
    headers: { "X-Figma-Token": token },
  });

  if (!response.ok) {
    console.warn(`[Figma MCP] Image export returned ${response.status}`);
    return undefined;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (await response.json()) as any;

  if (data.images && data.images[nodeId]) {
    console.log(`[Figma MCP] Got rendered image for node ${nodeId}`);
    return data.images[nodeId];
  }

  return undefined;
}

/**
 * Parse a Figma URL to extract the file ID.
 * Supports formats:
 * - https://www.figma.com/file/{fileId}/...
 * - https://www.figma.com/design/{fileId}/...
 */
export function parseFigmaUrl(url: string): { fileId: string; nodeId?: string } | null {
  const filePattern = /figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/;
  const nodePattern = /node-id=([a-zA-Z0-9%:-]+)/;

  const fileMatch = url.match(filePattern);
  if (!fileMatch) return null;

  const fileId = fileMatch[1];
  let nodeId: string | undefined;

  const nodeMatch = url.match(nodePattern);
  if (nodeMatch) {
    nodeId = decodeURIComponent(nodeMatch[1]).replace(/-/g, ":");
  }

  return { fileId, nodeId };
}
