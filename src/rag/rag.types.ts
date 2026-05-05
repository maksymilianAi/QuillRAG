/**
 * RAG Layer — Type definitions for the knowledge base.
 */

/** Category of a knowledge document */
export type DocumentCategory = "tone" | "guideline" | "example";

/** A single knowledge document in the RAG store */
export interface KnowledgeDocument {
  id: string;
  text: string;
  category: DocumentCategory;
  embedding?: number[];
}

/** Result of a RAG retrieval query */
export interface RetrievalResult {
  document: KnowledgeDocument;
  score: number;
}
