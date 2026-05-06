import { useState } from "react";
import type { GenerateCopyResponse, SectionReasoning } from "../types";
import copyIconUrl from "../assets/copy-icon.svg";
import checkIconUrl from "../assets/check-icon.svg";
import crossIconUrl from "../assets/cross-icon.svg";

interface Props {
  data: GenerateCopyResponse;
  prompt?: string;
}


function InlineCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleClick = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleClick}
      className={`shrink-0 flex items-center gap-1 px-2.5 py-1 text-[10px] font-semibold transition-all duration-200 border rounded-lg ${
        copied
          ? "bg-[var(--color-success)]/10 border-[var(--color-success)]/30 text-[var(--color-success)]"
          : "bg-transparent border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[rgba(63,104,255,0.65)] hover:text-white"
      }`}
    >
      {copied ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
          <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
        </svg>
      ) : (
        <img src={copyIconUrl} alt="" className="w-3 h-3" style={{ filter: "brightness(0) invert(0.6)" }} />
      )}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

interface VariantRowProps {
  index: number;
  isRecommended: boolean;
  children: React.ReactNode;
  copyText: string;
}

function VariantRow({ index, isRecommended, children, copyText }: VariantRowProps) {
  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${
      isRecommended
        ? "border-[rgba(63,104,255,0.5)] bg-[var(--color-brand)]/5"
        : "border-[var(--color-border)] bg-transparent"
    }`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`shrink-0 flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-bold ${
          isRecommended ? "bg-[var(--color-brand)] text-white" : "bg-[var(--color-surface-card)] text-[var(--color-text-muted)]"
        }`}>
          {index + 1}
        </span>
        <div className="min-w-0">{children}</div>
        {isRecommended && (
          <span className="shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[var(--color-brand)]/15 text-[var(--color-brand-light)] uppercase tracking-wider">
            Best
          </span>
        )}
      </div>
      <InlineCopyButton text={copyText} />
    </div>
  );
}

function SectionNote({ text }: { text: string }) {
  return (
    <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed px-1 mt-1">{text}</p>
  );
}

export function ResponseCard({ data }: Props) {
  const hasBody = data.variants.some((v) => v.body);
  const hasCtas = data.variants.some((v) => v.ctas.length > 0);
  const reasoning: SectionReasoning = data.reasoning ?? {};

  return (
    <div className="space-y-5 animate-slide-up">

      {/* Original copy block */}
      {data.original && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-2">Original</p>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed whitespace-pre-line">{data.original}</p>
        </div>
      )}

      {/* Headline variants */}
      {data.variants.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Headline</p>
          {data.variants.map((v, i) => (
            <VariantRow
              key={i}
              index={i}
              isRecommended={i === data.recommended}
              copyText={v.headline}
            >
              <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug truncate">{v.headline}</p>
            </VariantRow>
          ))}
          {reasoning.headline && <SectionNote text={reasoning.headline} />}
        </div>
      )}

      {/* Body text variants */}
      {hasBody && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">Body text</p>
          {data.variants.map((v, i) =>
            v.body ? (
              <VariantRow
                key={i}
                index={i}
                isRecommended={i === data.recommended}
                copyText={v.body}
              >
                <p className="text-sm text-[var(--color-text-secondary)] leading-snug">{v.body}</p>
              </VariantRow>
            ) : null
          )}
          {reasoning.body && <SectionNote text={reasoning.body} />}
        </div>
      )}

      {/* CTA variants */}
      {hasCtas && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">CTAs</p>
          {data.variants.flatMap((v, i) =>
            v.ctas.map((cta, ci) => (
              <VariantRow
                key={`${i}-${ci}`}
                index={i}
                isRecommended={i === data.recommended}
                copyText={cta}
              >
                <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                  ci === 0
                    ? "bg-[var(--color-brand)]/15 border-[var(--color-brand)]/30 text-[var(--color-brand-light)]"
                    : "border-[var(--color-border)] text-[var(--color-text-muted)]"
                }`}>
                  {cta}
                </span>
              </VariantRow>
            ))
          )}
          {reasoning.ctas && <SectionNote text={reasoning.ctas} />}
        </div>
      )}

      {/* Grammar Fixes */}
      {data.fixes.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-2">Grammar & Style Fixes</p>
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
