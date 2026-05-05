/**
 * VisualIDE — IDE-style Figma copywriting interface.
 * Center: Figma Canvas with clickable text nodes.
 * Right: Targeted chat panel.
 */

import { useState } from "react";
import { FigmaCanvas } from "./FigmaCanvas";
import { IDEChat } from "./IDEChat";
import { extractFigma } from "../api";
import type { AppSettings } from "./Sidebar";
import type { FigmaTextNode, FigmaExtractionResponse, GenerateCopyResponse } from "../types";

interface VisualIDEProps {
  settings: AppSettings;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function VisualIDE({ settings, isSidebarOpen: _isSidebarOpen, onToggleSidebar }: VisualIDEProps) {
  const [figmaUrl, setFigmaUrl] = useState("");
  const [figmaData, setFigmaData] = useState<FigmaExtractionResponse | null>(null);
  const [selectedNode, setSelectedNode] = useState<FigmaTextNode | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!figmaUrl.trim()) return;
    setIsExtracting(true);
    setError(null);
    setFigmaData(null);
    setSelectedNode(null);

    try {
      const result = await extractFigma({
        figmaUrl: figmaUrl.trim(),
        figmaToken: settings.figmaToken,
        provider: settings.provider,
        apiKey: settings.apiKey,
        localUrl: settings.localUrl,
        localModel: settings.localModel,
        localApiKey: settings.localApiKey,
      });
      setFigmaData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract Figma data.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleNodeSelect = (node: FigmaTextNode) => {
    setSelectedNode(node);
  };

  const handleCopyGenerated = (nodeId: string, response: GenerateCopyResponse) => {
    // Optionally update node text on canvas after LLM response
    if (figmaData && response.fixes.length > 0) {
      const updatedNodes = figmaData.nodes.map((n) => {
        if (n.id === nodeId) {
          return { ...n, text: response.fixes[0].corrected };
        }
        return n;
      });
      setFigmaData({ ...figmaData, nodes: updatedNodes });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0">
      {/* Header */}
      <header className="shrink-0 flex items-center border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-md z-20">
        <div className="flex items-center gap-4 px-6 py-4 w-full">
          <button
            onClick={onToggleSidebar}
            className="p-2 -ml-2 rounded-xl hover:bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm2.25 5.25a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5H5.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-dark)] shadow-lg shadow-indigo-500/20">
            <span className="text-lg">🎨</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-[var(--color-text-primary)] tracking-tight leading-none">
              Visual IDE
            </h1>
            <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">
              {figmaData ? `${figmaData.nodes.length} text nodes` : "Paste a Figma URL to start"}
            </p>
          </div>

          {/* Figma URL Input */}
          <div className="flex-1 flex gap-2 ml-4">
            <input
              type="text"
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleExtract()}
              placeholder="Paste Figma URL (e.g., https://www.figma.com/design/...?node-id=...)"
              className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] transition-all placeholder-[var(--color-text-muted)]"
            />
            <button
              onClick={handleExtract}
              disabled={isExtracting || !figmaUrl.trim()}
              className="px-5 py-2.5 rounded-xl bg-[var(--color-brand)] text-white text-xs font-bold hover:bg-[var(--color-brand-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isExtracting ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  <span>📥</span>
                  Extract
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {!figmaData ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
            {error ? (
              <div className="max-w-md">
                <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4 mx-auto">
                  <span className="text-3xl">⚠️</span>
                </div>
                <p className="text-sm text-[var(--color-error)] mb-4">{error}</p>
                <button
                  onClick={handleExtract}
                  className="text-xs text-[var(--color-brand)] hover:underline"
                >
                  Try again
                </button>
              </div>
            ) : isExtracting ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-[var(--color-brand)]/10 flex items-center justify-center mx-auto">
                  <span className="text-3xl animate-bounce">🎨</span>
                </div>
                <p className="text-sm text-[var(--color-text-secondary)]">Extracting design from Figma...</p>
                <p className="text-xs text-[var(--color-text-muted)]">Generating context with AI...</p>
              </div>
            ) : (
              <div className="space-y-6 max-w-lg">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--color-brand)] to-purple-600 flex items-center justify-center mx-auto shadow-2xl shadow-indigo-500/20 rotate-3">
                  <span className="text-4xl">🎨</span>
                </div>
                <h2 className="text-2xl font-extrabold text-[var(--color-text-primary)] tracking-tight">
                  Visual Copywriting IDE
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Paste a Figma URL above to load your design. Click on any text element to select it,
                  then use the chat panel to rewrite it with AI.
                </p>
                <div className="space-y-2 text-left bg-[var(--color-surface-elevated)]/50 rounded-2xl p-4 border border-[var(--color-border)]">
                  <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest mb-3">How it works</p>
                  {[
                    "1. Paste a Figma URL with a specific node-id",
                    "2. AI extracts text nodes and generates context",
                    "3. Click any text on the canvas to select it",
                    "4. Type your rewrite instruction in the chat",
                  ].map((step) => (
                    <p key={step} className="text-xs text-[var(--color-text-secondary)]">{step}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Loaded state: Canvas + Chat */
          <>
            {/* Center: Canvas */}
            <FigmaCanvas
              nodes={figmaData.nodes}
              rootBoundingBox={figmaData.rootBoundingBox}
              selectedNodeId={selectedNode?.id ?? null}
              onNodeSelect={handleNodeSelect}
              contextualDescription={figmaData.contextualDescription}
              nodeImageUrl={figmaData.nodeImageUrl}
            />

            {/* Right: Chat Panel */}
            <div className="w-[340px] shrink-0 border-l border-[var(--color-border)] bg-[var(--color-surface)]">
              <IDEChat
                settings={settings}
                selectedNode={selectedNode}
                contextualDescription={figmaData.contextualDescription}
                onCopyGenerated={handleCopyGenerated}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
