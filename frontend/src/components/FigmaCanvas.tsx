/**
 * FigmaCanvas — Visual representation of a Figma design.
 * Shows the rendered PNG from Figma as background, with clickable text
 * overlay nodes positioned at their exact coordinates.
 */

import { useState } from "react";
import type { FigmaTextNode } from "../types";

interface FigmaCanvasProps {
  nodes: FigmaTextNode[];
  rootBoundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  selectedNodeId: string | null;
  onNodeSelect: (node: FigmaTextNode) => void;
  contextualDescription: string;
  nodeImageUrl?: string;
}

export function FigmaCanvas({
  nodes,
  rootBoundingBox,
  selectedNodeId,
  onNodeSelect,
  contextualDescription,
  nodeImageUrl,
}: FigmaCanvasProps) {
  const [scale, setScale] = useState(0.6);
  const [showOverlay, setShowOverlay] = useState(true);

  // Calculate the canvas dimensions from root bounding box or from all nodes
  const canvasBounds = rootBoundingBox || calculateBoundsFromNodes(nodes);

  if (!canvasBounds) {
    return (
      <div className="flex-1 flex items-center justify-center text-[var(--color-text-muted)] text-sm">
        No position data available for these nodes.
      </div>
    );
  }

  const originX = canvasBounds.x;
  const originY = canvasBounds.y;

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Context bar */}
      <div className="shrink-0 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-2 h-2 rounded-full bg-[var(--color-brand)] animate-pulse shrink-0" />
            <p className="text-xs text-[var(--color-text-secondary)] truncate">
              <span className="font-semibold text-[var(--color-text-primary)]">Context:</span>{" "}
              {contextualDescription}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0 ml-4">
            {/* Toggle overlay */}
            <button
              onClick={() => setShowOverlay(!showOverlay)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                showOverlay
                  ? "bg-[var(--color-brand)]/10 border-[var(--color-brand)]/30 text-[var(--color-brand-light)]"
                  : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)]"
              }`}
              title="Toggle text overlay visibility"
            >
              {showOverlay ? "🎯 Overlay On" : "👁 Overlay Off"}
            </button>
            {/* Zoom controls */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setScale((s) => Math.max(0.2, s - 0.1))}
                className="w-7 h-7 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors text-xs font-bold"
              >
                −
              </button>
              <span className="text-[10px] text-[var(--color-text-muted)] font-mono w-10 text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                onClick={() => setScale((s) => Math.min(2, s + 0.1))}
                className="w-7 h-7 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors text-xs font-bold"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-auto bg-[#0d0d12] p-8">
        <div
          className="relative mx-auto rounded-xl overflow-hidden shadow-2xl"
          style={{
            width: canvasBounds.width * scale,
            height: canvasBounds.height * scale,
          }}
        >
          {/* Background: Figma-rendered image */}
          {nodeImageUrl ? (
            <img
              src={nodeImageUrl}
              alt="Figma design"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              style={{
                imageRendering: "auto",
              }}
              draggable={false}
            />
          ) : (
            /* Fallback: dark background with grid */
            <div
              className="absolute inset-0 bg-[var(--color-surface)]/5 border border-[var(--color-border)]/30"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                `,
                backgroundSize: `${20 * scale}px ${20 * scale}px`,
              }}
            />
          )}

          {/* Text node overlays */}
          {showOverlay && nodes.map((node) => {
            if (!node.absoluteBoundingBox) return null;
            const bb = node.absoluteBoundingBox;
            const isSelected = selectedNodeId === node.id;

            return (
              <button
                key={node.id}
                onClick={() => onNodeSelect(node)}
                className={`absolute text-left transition-all duration-150 cursor-pointer group
                  ${isSelected
                    ? "ring-2 ring-[var(--color-brand)] bg-[var(--color-brand)]/15 z-10 shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                    : "hover:bg-[var(--color-brand)]/10 hover:ring-1 hover:ring-[var(--color-brand)]/50"
                  }`}
                style={{
                  left: (bb.x - originX) * scale,
                  top: (bb.y - originY) * scale,
                  width: bb.width * scale,
                  height: bb.height * scale,
                }}
                title={`${node.name}: "${node.text}"`}
              >
                {/* Show a subtle label on hover when image is the background */}
                {nodeImageUrl && (
                  <span
                    className={`absolute -top-5 left-0 text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none transition-opacity
                      ${isSelected
                        ? "opacity-100 bg-[var(--color-brand)] text-white"
                        : "opacity-0 group-hover:opacity-100 bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                      }`}
                  >
                    {node.name}
                  </span>
                )}

                {/* When no image, show the text directly */}
                {!nodeImageUrl && (
                  <span
                    className={`block leading-tight overflow-hidden text-ellipsis whitespace-nowrap
                      ${isSelected
                        ? "text-[var(--color-brand-light)] font-medium"
                        : "text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]"
                      }`}
                    style={{
                      fontSize: Math.max(8, Math.min(14, bb.height * scale * 0.6)),
                    }}
                  >
                    {node.text}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected node info bar */}
      {selectedNodeId && (
        <div className="shrink-0 px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
              Selected
            </span>
            <span className="text-[10px] text-[var(--color-brand)] font-mono bg-[var(--color-brand)]/10 px-2 py-0.5 rounded">
              {nodes.find((n) => n.id === selectedNodeId)?.name}
            </span>
            <span className="text-xs text-[var(--color-text-primary)] font-medium truncate">
              "{nodes.find((n) => n.id === selectedNodeId)?.text}"
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/** Fallback: calculate bounding box from all nodes if root isn't available */
function calculateBoundsFromNodes(nodes: FigmaTextNode[]) {
  const withBounds = nodes.filter((n) => n.absoluteBoundingBox);
  if (withBounds.length === 0) return null;

  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  for (const node of withBounds) {
    const bb = node.absoluteBoundingBox!;
    minX = Math.min(minX, bb.x);
    minY = Math.min(minY, bb.y);
    maxX = Math.max(maxX, bb.x + bb.width);
    maxY = Math.max(maxY, bb.y + bb.height);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 40,
    height: maxY - minY + 40,
  };
}
