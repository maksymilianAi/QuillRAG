/**
 * MCP Layer — Type definitions for Figma tool.
 */

/** A single text node extracted from a Figma file */
export interface FigmaTextNode {
  /** Node ID in Figma */
  id: string;
  /** Element name in Figma (e.g. "Primary Button", "Heading") */
  name: string;
  /** Text content of the node */
  text: string;
  /** Absolute coordinates on the Figma canvas */
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/** Result from Figma text extraction */
export interface FigmaExtractionResult {
  fileId: string;
  nodes: FigmaTextNode[];
  extractedAt: string;
  rootBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** URL to a rendered PNG image of the node */
  nodeImageUrl?: string;
}
