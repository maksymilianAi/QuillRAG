import { useState } from "react";
import type { GenerateCopyResponse, CopyVariant } from "../types";
import { sendCopyFeedback } from "../api";
import copyIconUrl from "../assets/copy-icon.svg";
import checkIconUrl from "../assets/check-icon.svg";
import crossIconUrl from "../assets/cross-icon.svg";

interface Props {
  data: GenerateCopyResponse;
  prompt?: string;
}

function formatVariantText(v: CopyVariant): string {
  const lines = [v.headline, v.cta];
  if (v.labels.length > 0) lines.push(v.labels.join(" · "));
  return lines.join("\n");
}

function CopyButton({ text, onCopied }: { text: string; onCopied: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      onCopied();
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 border ${
        copied
          ? "bg-[var(--color-success)]/10 border-[var(--color-success)]/30 text-[var(--color-success)]"
          : "bg-[var(--color-surface-card)] border-[var(--color-border)] text-white hover:border-[var(--color-brand)] hover:text-white"
      }`}
      title="Copy this variant"
    >
      {copied ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
          </svg>
          Copied
        </>
      ) : (
        <>
          <img src={copyIconUrl} alt="" className="w-3.5 h-3.5" style={{ filter: "brightness(0) invert(1)" }} />
          Copy
        </>
      )}
    </button>
  );
}

export function ResponseCard({ data, prompt }: Props) {
  const handleVariantCopied = (variantIndex: number, variant: CopyVariant) => {
    sendCopyFeedback({
      prompt: prompt ?? "",
      variantIndex,
      variant,
      action: "copy",
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-4 animate-slide-up">
      {/* Copy Variants */}
      {data.variants.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-3">
            Copy Variants
          </h4>
          <div className="space-y-3">
            {data.variants.map((v, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5 transition-all duration-500 hover:border-[rgba(63,104,255,0.65)] hover:shadow-[0_0_16px_-6px_rgba(63,104,255,0.08)] glass-effect"
              >
                {/* Header row */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-brand)] text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                      Option {i + 1}
                    </span>
                  </div>
                  <CopyButton
                    text={formatVariantText(v)}
                    onCopied={() => handleVariantCopied(i, v)}
                  />
                </div>

                {/* Structured fields */}
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Headline</p>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug">{v.headline}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1">CTA</p>
                    <p className="text-sm text-[var(--color-text-primary)]">{v.cta}</p>
                  </div>
                  {v.labels.length > 0 && (
                    <div>
                      <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Labels</p>
                      <p className="text-sm text-[var(--color-text-secondary)]">{v.labels.join(", ")}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reasoning */}
      {data.reasoning.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-3">
            Reasoning
          </h4>
          <ul className="space-y-1 text-sm text-[var(--color-text-secondary)]">
            {data.reasoning.map((reason, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-[var(--color-brand-light)] mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Grammar Fixes */}
      {data.fixes.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-3">
            Grammar & Style Fixes
          </h4>
          <div className="space-y-2">
            {data.fixes.map((fix, i) => (
              <div
                key={i}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4 text-sm"
              >
                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">{fix.rule}</p>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <img src={crossIconUrl} alt="" className="w-4 h-4 shrink-0" />
                    <p className="text-[var(--color-text-secondary)] line-through decoration-[var(--color-error)]/40">{fix.original}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <img src={checkIconUrl} alt="" className="w-4 h-4 shrink-0" />
                    <p className="text-[var(--color-text-primary)] font-medium">{fix.corrected}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
