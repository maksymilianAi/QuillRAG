/**
 * Frontend types matching the backend API contract.
 */

export interface CopyVariant {
  headline: string;
  body?: string;
  ctas: string[];
}

export interface GrammarFix {
  original: string;
  corrected: string;
  rule: string;
}

export interface GenerateCopyRequest {
  prompt: string;
  provider?: string;
  apiKey?: string;
  figmaToken?: string;
  localUrl?: string;
  localModel?: string;
  localApiKey?: string;
  options?: {
    variantCount?: number;
    fixGrammar?: boolean;
    includeReasoning?: boolean;
  };
}

export interface SectionReasoning {
  headline?: string;
  body?: string;
  ctas?: string;
}

export interface GenerateCopyResponse {
  original?: string;
  recommended: number;
  variants: CopyVariant[];
  fixes: GrammarFix[];
  reasoning: SectionReasoning;
}

export interface CopyFeedback {
  prompt: string;
  variantIndex: number;
  variant: Pick<CopyVariant, "headline" | "body" | "ctas">;
  action: "copy";
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Structured response (only for assistant messages) */
  data?: GenerateCopyResponse;
  /** The user prompt that triggered this response */
  prompt?: string;
  timestamp: Date;
}

/** A text node extracted from Figma with position data */
export interface FigmaTextNode {
  id: string;
  name: string;
  text: string;
  absoluteBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/** Response from /api/extract-figma */
export interface FigmaExtractionResponse {
  fileId: string;
  nodes: FigmaTextNode[];
  extractedAt: string;
  rootBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  contextualDescription: string;
  /** Rendered PNG image of the Figma node */
  nodeImageUrl?: string;
}

/** Request payload for /api/extract-figma */
export interface ExtractFigmaRequest {
  figmaUrl: string;
  figmaToken?: string;
  provider?: string;
  apiKey?: string;
  localUrl?: string;
  localModel?: string;
  localApiKey?: string;
}
