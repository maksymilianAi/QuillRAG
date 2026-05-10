import { useState } from "react";
import type { CopyFormat, GenerateCopyResponse, SectionReasoning } from "../types";
import { generateCopy } from "../api";
import copyIconUrl from "../assets/copy-icon.svg";
import checkIconUrl from "../assets/check-icon.svg";
import crossIconUrl from "../assets/cross-icon.svg";
import arrowRightUrl from "../assets/arrow-right.svg";
import editIconUrl from "../assets/edit-icon.svg";

const REWRITE_QUICK_ACTIONS = [
  "Make it shorter",
  "Make it more formal",
  "Simplify the language",
  "Make it more direct",
];

type SectionKey = "headline" | "body" | "ctas";

const SECTION_CONFIG: Record<CopyFormat, Partial<Record<SectionKey, string>>> = {
  full:    { headline: "Headline", body: "Body Text", ctas: "CTAs" },
  tooltip: { body: "Tooltip" },
  info:    { body: "Info Message" },
  warning: { body: "Warning Message" },
  error:   { body: "Error Message" },
  label:   { headline: "Label" },
  button:  { ctas: "Button" },
  status:  { headline: "Status" },
};

interface Props {
  data: GenerateCopyResponse;
  prompt?: string;
  onAnswer?: (text: string) => void;
}

function InlineCopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleClick = () =>
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});

  return (
    <button
      onClick={handleClick}
      title={copied ? "Copied!" : "Copy"}
      className={`shrink-0 flex items-center justify-center w-8 h-8 transition-all duration-200 border rounded-lg ${
        copied
          ? "bg-[var(--color-success)]/10 border-[var(--color-success)]/30 text-[var(--color-success)]"
          : "bg-transparent border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[rgba(63,104,255,0.65)] hover:text-white"
      }`}
    >
      {copied ? (
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
        </svg>
      ) : (
        <img src={copyIconUrl} alt="" className="w-4 h-4" style={{ filter: "brightness(0) invert(0.6)" }} />
      )}
    </button>
  );
}

interface VariantRowProps {
  variantIndex: number;
  isRecommended: boolean;
  isUnchanged?: boolean;
  isLoading?: boolean;
  totalVariants: number;
  children: React.ReactNode;
  copyText: string;
  onRewriteClick?: () => void;
  isRewriting?: boolean;
}

function VariantRow({
  variantIndex, isRecommended, isUnchanged, isLoading, totalVariants,
  children, copyText, onRewriteClick, isRewriting,
}: VariantRowProps) {
  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all duration-200 ${
      isLoading     ? "border-[var(--color-border)] opacity-60"
      : isUnchanged ? "border-[var(--color-success)]/30 bg-[var(--color-success)]/5"
      : isRecommended ? "border-[rgba(63,104,255,0.5)] bg-[var(--color-brand)]/5"
      : "border-[var(--color-border)] bg-transparent"
    }`}>
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {totalVariants > 1 && (
          <span className={`shrink-0 flex items-center justify-center w-4 h-4 rounded text-xs font-bold ${
            isUnchanged   ? "bg-[var(--color-success)]/20 text-[var(--color-success)]"
            : isRecommended ? "bg-[var(--color-brand)] text-white"
            : "bg-[var(--color-surface-card)] text-[var(--color-text-muted)]"
          }`}>
            {variantIndex + 1}
          </span>
        )}
        <div className="min-w-0 flex-1">
          {isLoading
            ? <div className="skeleton h-4 w-48 rounded" />
            : children
          }
        </div>
        {!isLoading && isUnchanged && (
          <span className="shrink-0 px-1.5 py-0.5 rounded text-xs font-semibold bg-[var(--color-success)]/15 text-[var(--color-success)] uppercase tracking-wider">
            Already correct
          </span>
        )}
        {!isLoading && !isUnchanged && isRecommended && totalVariants > 1 && (
          <span className="shrink-0 px-1.5 py-0.5 rounded text-xs font-semibold bg-[var(--color-brand)]/15 text-[var(--color-brand-light)] uppercase tracking-wider">
            Best
          </span>
        )}
      </div>
      {!isLoading && (
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onRewriteClick}
            title="Rewrite"
            className={`flex items-center justify-center w-8 h-8 transition-all duration-200 border rounded-lg ${
              isRewriting
                ? "bg-[var(--color-brand)]/10 border-[var(--color-brand)]/40 text-[var(--color-brand-light)]"
                : "bg-transparent border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[rgba(63,104,255,0.65)] hover:text-white"
            }`}
          >
            <img src={editIconUrl} alt="" className="w-4 h-4" style={{ filter: "brightness(0) invert(0.6)" }} />
          </button>
          <InlineCopyButton text={copyText} />
        </div>
      )}
    </div>
  );
}

function SectionNote({ text }: { text: string }) {
  const sentences = text.split(/(?<=\.)\s+/).filter(Boolean);
  return (
    <details className="mt-2 group">
      <summary className="flex items-center gap-1.5 cursor-pointer list-none select-none text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors w-fit py-2 -my-2">
        <svg className="w-3 h-3 transition-transform group-open:rotate-90 shrink-0" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Why this copy?
      </summary>
      <div className="mt-1.5 pl-3 border-l border-[var(--color-border)]">
        {sentences.length > 1 ? (
          <ol className="space-y-1 list-none">
            {sentences.map((s, i) => (
              <li key={i} className="flex gap-2 text-xs text-[var(--color-text-muted)] leading-relaxed">
                <span className="shrink-0 font-medium">{i + 1}.</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{text}</p>
        )}
      </div>
    </details>
  );
}

interface RewritePanelProps {
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (instruction: string) => void;
}

function RewritePanel({ isLoading, onClose, onSubmit }: RewritePanelProps) {
  const [input, setInput] = useState("");

  const submit = (instruction: string) => {
    if (!instruction.trim() || isLoading) return;
    onSubmit(instruction);
  };

  return (
    <div className="mt-2 animate-slide-up space-y-2.5">
      {/* Quick actions first */}
      {!isLoading && (
        <div className="flex flex-wrap gap-1.5">
          {REWRITE_QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              onClick={() => submit(action)}
              className="px-2.5 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/60 text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-brand)] hover:text-[var(--color-text-primary)] transition-all duration-200"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* Input row with × inside */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit(input)}
          placeholder="Or describe what to change..."
          autoFocus
          disabled={isLoading}
          className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] transition-all placeholder-[var(--color-text-muted)] disabled:opacity-50"
        />
        <button
          onClick={() => submit(input)}
          disabled={!input.trim() || isLoading}
          className="w-8 h-8 rounded-lg bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-dark)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0"
        >
          {isLoading ? (
            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <img src={arrowRightUrl} alt="" className="w-3.5 h-3.5" style={{ filter: "brightness(0) invert(1)" }} />
          )}
        </button>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)] transition-all text-base leading-none shrink-0"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function ResponseCard({ data, prompt, onAnswer }: Props) {
  const [rewritingKey, setRewritingKey] = useState<string | null>(null);
  const [rewriteLoading, setRewriteLoading] = useState<Set<string>>(new Set());
  const [rewriteHistory, setRewriteHistory] = useState<Map<string, string[]>>(new Map());

  const handleRewriteSubmit = async (key: string, originalText: string, instruction: string) => {
    if (!instruction.trim()) return;
    setRewritingKey(null);
    setRewriteLoading((prev) => new Set(prev).add(key));
    try {
      const response = await generateCopy({
        prompt: `Rewrite this UI copy: "${originalText}"\n\nInstruction: ${instruction.trim()}\n\nYou MUST return a different version — do not repeat the exact same text. If the current copy is already good, still provide a clearly distinct alternative phrasing that satisfies the instruction.`,
        options: { variantCount: 1, fixGrammar: false, includeReasoning: false },
      });
      const v = response.variants[0];
      const newText = v?.headline || v?.body || v?.ctas?.[0] || originalText;
      setRewriteHistory((prev) => {
        const m = new Map(prev);
        m.set(key, [...(m.get(key) ?? []), newText]);
        return m;
      });
    } catch {
      // keep original on error
    } finally {
      setRewriteLoading((prev) => { const s = new Set(prev); s.delete(key); return s; });
    }
  };

  const useVersion = (key: string, versionIndex: number) => {
    setRewriteHistory((prev) => {
      const m = new Map(prev);
      if (versionIndex === 0) { m.delete(key); }
      else { m.set(key, (m.get(key) ?? []).slice(0, versionIndex)); }
      return m;
    });
  };

  // ── Clarification ──────────────────────────────────────────────────────────
  if (data.needsClarification && data.clarifyingQuestions?.length) {
    return (
      <div className="animate-slide-up space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wide text-[var(--color-text-muted)]">
            A few questions before I start
          </p>
          <ol className="space-y-1.5 pl-1">
            {data.clarifyingQuestions.map((q, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-[var(--color-surface-card)] text-xs font-bold text-[var(--color-text-muted)] mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{q}</p>
              </li>
            ))}
          </ol>
        </div>
        {data.quickOptions && data.quickOptions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wide text-[var(--color-text-muted)]">Quick options</p>
            <div className="flex flex-wrap gap-2">
              {data.quickOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => onAnswer?.(opt)}
                  className="px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-brand)] hover:text-[var(--color-text-primary)] transition-all duration-200"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Approved ───────────────────────────────────────────────────────────────
  if (data.approved) {
    const sentences = (data.approvalNote ?? "Looks good — no changes needed.")
      .split(/(?<=\.)\s+/)
      .filter(Boolean);
    return (
      <div className="animate-slide-up flex items-start gap-3 px-4 py-3.5 rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/8">
        <img src={checkIconUrl} alt="" className="w-4 h-4 shrink-0 mt-0.5" />
        {sentences.length > 1 ? (
          <ul className="space-y-1">
            {sentences.map((s, i) => (
              <li key={i} className="flex gap-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                <span className="shrink-0">·</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{sentences[0]}</p>
        )}
      </div>
    );
  }

  // ── Main response ──────────────────────────────────────────────────────────
  const format: CopyFormat = data.format ?? "full";
  const sections = SECTION_CONFIG[format];
  const reasoning: SectionReasoning = data.reasoning ?? {};

  const hasHeadline = !!sections.headline && data.variants.some((v) => v.headline);
  const hasBody     = !!sections.body     && data.variants.some((v) => v.body);
  const hasCtas     = !!sections.ctas     && data.variants.some((v) => v.ctas.length > 0);

  const promptQuoted = prompt
    ? (prompt.match(/["""«»](.+?)["""«»]/) ?? prompt.match(/'(.+?)'/))?.[ 1]
    : undefined;
  const originalText = data.original || promptQuoted;
  const isVariantUnchanged = (text: string | undefined) =>
    !!text && !!originalText && text.trim() === originalText.trim();

  const renderVariantBlock = (
    key: string,
    variantIndex: number,
    originalVariantText: string,
    isRecommended: boolean,
    totalVariants: number,
    renderContent: (displayText: string) => React.ReactNode
  ) => {
    const loading = rewriteLoading.has(key);
    const history = rewriteHistory.get(key) ?? [];
    const displayText = history.at(-1) ?? originalVariantText;
    const isOpen = rewritingKey === key;
    // allVersions = [original, ...history]; carry originalIndex through deduplication
    // so useVersion() always slices the real history position, not the filtered index
    const allVersions = [originalVariantText, ...history];
    const previousVersions: { text: string; originalIndex: number }[] = history.length > 0
      ? allVersions
          .slice(0, -1)
          .map((text, originalIndex) => ({ text, originalIndex }))
          .filter(({ text }, i, arr) => text !== displayText && text !== arr[i + 1]?.text)
      : [];

    return (
      <div key={key} className={isOpen ? "mb-5" : ""}>
        <VariantRow
          variantIndex={variantIndex}
          isRecommended={isRecommended}
          isUnchanged={isVariantUnchanged(displayText)}
          isLoading={loading}
          totalVariants={totalVariants}
          copyText={displayText}
          onRewriteClick={() => setRewritingKey(isOpen ? null : key)}
          isRewriting={isOpen}
        >
          {renderContent(displayText)}
        </VariantRow>

        {/* Previous versions history */}
        {previousVersions.length > 0 && !loading && (
          <div className="ml-4 mt-2 space-y-1">
            <p className="text-[10px] font-semibold tracking-wider uppercase text-[var(--color-text-muted)] opacity-50">
              Previous versions
            </p>
            {previousVersions.map(({ text, originalIndex }) => (
              <div key={originalIndex} className="flex items-start gap-2 py-1 border-l border-[var(--color-border)] pl-2">
                <p className="text-xs text-[var(--color-text-muted)] flex-1 leading-relaxed">{text}</p>
                <button
                  onClick={() => useVersion(key, originalIndex)}
                  className="shrink-0 text-xs text-[var(--color-brand-light)] hover:underline px-1.5 py-0.5 rounded border border-transparent hover:border-[var(--color-brand)]/30 transition-all"
                >
                  Back to this
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Rewrite panel */}
        {isOpen && (
          <RewritePanel
            isLoading={loading}
            onClose={() => setRewritingKey(null)}
            onSubmit={(instruction) => handleRewriteSubmit(key, displayText, instruction)}
          />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-slide-up">

      {/* Original */}
      {data.original && (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-card)]/30 px-4 py-3">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-[var(--color-text-muted)] mb-1.5 opacity-60">Original</p>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line">{data.original}</p>
        </div>
      )}

      {/* Headline variants */}
      {hasHeadline && (
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wide text-[var(--color-text-muted)]">{sections.headline}</p>
          {data.variants.map((v, i) => {
            if (!v.headline) return null;
            const total = data.variants.filter((x) => x.headline).length;
            return renderVariantBlock(`headline-${i}`, i, v.headline, i === data.recommended, total, (text) => (
              <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug">{text}</p>
            ));
          })}
          {reasoning.headline && <SectionNote text={reasoning.headline} />}
        </div>
      )}

      {/* Body variants */}
      {hasBody && (
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wide text-[var(--color-text-muted)]">{sections.body}</p>
          {data.variants.map((v, i) => {
            if (!v.body) return null;
            const total = data.variants.filter((x) => x.body).length;
            return renderVariantBlock(`body-${i}`, i, v.body, i === data.recommended, total, (text) => (
              <p className="text-sm text-[var(--color-text-secondary)] leading-snug">{text}</p>
            ));
          })}
          {reasoning.body && <SectionNote text={reasoning.body} />}
        </div>
      )}

      {/* CTA variants */}
      {hasCtas && (
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wide text-[var(--color-text-muted)]">{sections.ctas}</p>
          {data.variants.flatMap((v, i) =>
            v.ctas.map((cta, ci) => {
              const total = data.variants.filter((x) => x.ctas.length > 0).length;
              return renderVariantBlock(`cta-${i}-${ci}`, i, cta, i === data.recommended, total, (text) => (
                <span className="text-sm text-[var(--color-text-primary)] font-medium">{text}</span>
              ));
            })
          )}
          {reasoning.ctas && <SectionNote text={reasoning.ctas} />}
        </div>
      )}

      {/* Grammar Check — only shown when there is original copy to audit */}
      {data.original && <div>
        <p className="text-xs font-semibold tracking-wide text-[var(--color-text-muted)] mb-2">Grammar Check</p>
        {data.fixes.length === 0 ? (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--color-success)]/20 bg-[var(--color-success)]/5">
            <img src={checkIconUrl} alt="" className="w-3.5 h-3.5 shrink-0" />
            <p className="text-xs text-[var(--color-text-muted)]">Grammar check passed — no issues found.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4 space-y-4">
            {data.fixes.map((fix, i) => (
              <div key={i} className="flex gap-3">
                {data.fixes.length > 1 && (
                  <span className="shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-[var(--color-surface-elevated)] text-xs font-bold text-[var(--color-text-muted)] mt-0.5">
                    {i + 1}
                  </span>
                )}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <img src={crossIconUrl} alt="" className="w-3.5 h-3.5 shrink-0" />
                    <p className="text-sm text-[var(--color-text-secondary)] line-through decoration-[var(--color-error)]/40">{fix.original}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <img src={checkIconUrl} alt="" className="w-3.5 h-3.5 shrink-0" />
                    {fix.corrected ? (
                      <p className="text-sm text-[var(--color-text-primary)] font-medium">{fix.corrected}</p>
                    ) : (
                      <p className="text-xs italic text-[var(--color-text-muted)]">(delete)</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>}

    </div>
  );
}
