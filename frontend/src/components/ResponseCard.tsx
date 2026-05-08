import { useState } from "react";
import type { CopyFormat, GenerateCopyResponse, SectionReasoning } from "../types";
import copyIconUrl from "../assets/copy-icon.svg";
import checkIconUrl from "../assets/check-icon.svg";
import crossIconUrl from "../assets/cross-icon.svg";
import arrowRightUrl from "../assets/arrow-right.svg";
import editIconUrl from "../assets/edit-icon.svg";

const REWRITE_QUICK_ACTIONS = [
  "Make it shorter",
  "Make it longer",
  "Make it more formal",
  "Simplify the language",
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

  const handleClick = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={handleClick}
      className={`shrink-0 flex items-center gap-1 px-2.5 py-1 text-xs font-semibold transition-all duration-200 border rounded-lg ${
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
  isUnchanged?: boolean;
  totalVariants?: number;
  children: React.ReactNode;
  copyText: string;
  onRewriteClick?: () => void;
  isRewriting?: boolean;
}

function VariantRow({ index, isRecommended, isUnchanged, totalVariants, children, copyText, onRewriteClick, isRewriting }: VariantRowProps) {
  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-all duration-500 ${
      isUnchanged
        ? "border-[var(--color-success)]/30 bg-[var(--color-success)]/5"
        : isRecommended
        ? "border-[rgba(63,104,255,0.5)] bg-[var(--color-brand)]/5"
        : "border-[var(--color-border)] bg-transparent"
    }`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`shrink-0 flex items-center justify-center w-4 h-4 rounded-full text-xs font-bold ${
          isUnchanged ? "bg-[var(--color-success)]/20 text-[var(--color-success)]"
          : isRecommended ? "bg-[var(--color-brand)] text-white"
          : "bg-[var(--color-surface-card)] text-[var(--color-text-muted)]"
        }`}>
          {index + 1}
        </span>
        <div className="min-w-0">{children}</div>
        {isUnchanged && (
          <span className="shrink-0 px-1.5 py-0.5 rounded text-xs font-semibold bg-[var(--color-success)]/15 text-[var(--color-success)] uppercase tracking-wider">
            Already correct
          </span>
        )}
        {!isUnchanged && isRecommended && (totalVariants ?? 2) > 1 && (
          <span className="shrink-0 px-1.5 py-0.5 rounded text-xs font-semibold bg-[var(--color-brand)]/15 text-[var(--color-brand-light)] uppercase tracking-wider">
            Best
          </span>
        )}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={onRewriteClick}
          className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold transition-all duration-200 border rounded-lg ${
            isRewriting
              ? "bg-[var(--color-brand)]/10 border-[var(--color-brand)]/40 text-[var(--color-brand-light)]"
              : "bg-transparent border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[rgba(63,104,255,0.65)] hover:text-white"
          }`}
        >
          <img src={editIconUrl} alt="" className="w-3 h-3" style={{ filter: "brightness(0) invert(0.6)" }} />
          Rewrite
        </button>
        <InlineCopyButton text={copyText} />
      </div>
    </div>
  );
}

function SectionNote({ text }: { text: string }) {
  const sentences = text.split(/(?<=\.)\s+/).filter(Boolean);
  return (
    <details className="mt-2 group">
      <summary className="flex items-center gap-1.5 cursor-pointer list-none select-none text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors w-fit">
        <svg className="w-3 h-3 transition-transform group-open:rotate-90 shrink-0" viewBox="0 0 16 16" fill="currentColor">
          <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Why this copy
      </summary>
      <div className="mt-1.5 pl-3 border-l border-[var(--color-border)] space-y-1">
        {sentences.map((s, i) => (
          <p key={i} className="text-xs text-[var(--color-text-muted)] leading-relaxed">{s}</p>
        ))}
      </div>
    </details>
  );
}

interface RewritePanelProps {
  variantText: string;
  input: string;
  onInputChange: (val: string) => void;
  onSubmit: (variantText: string, instruction: string) => void;
}

function RewritePanel({ variantText, input, onInputChange, onSubmit }: RewritePanelProps) {
  return (
    <div className="mt-1.5 ml-6 rounded-xl border border-[var(--color-brand)]/20 bg-[var(--color-brand)]/5 p-3 space-y-2.5 animate-slide-up">
      <div className="flex flex-wrap gap-1.5">
        {REWRITE_QUICK_ACTIONS.map((action) => (
          <button
            key={action}
            onClick={() => onSubmit(variantText, action)}
            className="px-2.5 py-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/60 text-xs text-[var(--color-text-secondary)] hover:border-[var(--color-brand)] hover:text-[var(--color-text-primary)] transition-all duration-200"
          >
            {action}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit(variantText, input)}
          placeholder="Or describe what to change..."
          autoFocus
          className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] transition-all placeholder-[var(--color-text-muted)]"
        />
        <button
          onClick={() => onSubmit(variantText, input)}
          disabled={!input.trim()}
          className="px-3 py-2 rounded-lg bg-[var(--color-brand)] text-white text-xs font-medium hover:bg-[var(--color-brand-dark)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <img src={arrowRightUrl} alt="Submit" className="w-3.5 h-3.5" style={{ filter: "brightness(0) invert(1)" }} />
        </button>
      </div>
    </div>
  );
}

export function ResponseCard({ data, prompt, onAnswer }: Props) {
  const [clarifyInput, setClarifyInput] = useState("");
  const [rewritingKey, setRewritingKey] = useState<string | null>(null);
  const [rewriteInput, setRewriteInput] = useState("");

  const handleRewriteSubmit = (variantText: string, instruction: string) => {
    const text = instruction.trim();
    if (!text || !onAnswer) return;
    setRewritingKey(null);
    setRewriteInput("");
    onAnswer(`Refine this copy variant: "${variantText}"\nInstruction: ${text}`);
  };

  const submitClarification = (text: string) => {
    const val = text.trim();
    if (!val) return;
    setClarifyInput("");
    onAnswer?.(val);
  };

  if (data.needsClarification && data.clarifyingQuestions?.length) {
    return (
      <div className="animate-slide-up space-y-4">
        {/* Questions */}
        <div className="space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
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

        {/* Primary: text input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={clarifyInput}
            onChange={(e) => setClarifyInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitClarification(clarifyInput)}
            placeholder="Describe the component or paste a Figma link..."
            className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] transition-all placeholder-[var(--color-text-muted)]"
          />
          <button
            onClick={() => submitClarification(clarifyInput)}
            disabled={!clarifyInput.trim()}
            className="px-4 py-2.5 rounded-xl bg-[var(--color-brand)] text-white text-sm font-medium hover:bg-[var(--color-brand-dark)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            →
          </button>
        </div>

        {/* Secondary: quick option chips */}
        {data.quickOptions && data.quickOptions.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-[0.1em] font-bold">Quick options</p>
            <div className="flex flex-wrap gap-2">
              {data.quickOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => submitClarification(opt)}
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

  if (data.approved) {
    return (
      <div className="animate-slide-up flex items-start gap-3 px-4 py-3.5 rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-success)]/8">
        <img src={checkIconUrl} alt="" className="w-4 h-4 shrink-0 mt-0.5" />
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          {data.approvalNote ?? "Looks good — no changes needed."}
        </p>
      </div>
    );
  }

  const format: CopyFormat = data.format ?? "full";
  const sections = SECTION_CONFIG[format];
  const reasoning: SectionReasoning = data.reasoning ?? {};

  const hasHeadline = !!sections.headline && data.variants.some((v) => v.headline);
  const hasBody     = !!sections.body     && data.variants.some((v) => v.body);
  const hasCtas     = !!sections.ctas     && data.variants.some((v) => v.ctas.length > 0);

  // Use data.original if available, otherwise extract quoted text from the user's prompt
  const promptQuoted = prompt
    ? (prompt.match(/["""«»](.+?)["""«»]/) ?? prompt.match(/'(.+?)'/))?.[ 1]
    : undefined;
  const originalText = data.original || promptQuoted;

  // Detect when a variant is identical to the original (LLM returned unchanged copy)
  const isVariantUnchanged = (text: string | undefined) =>
    !!text && !!originalText && text.trim() === originalText.trim();

  return (
    <div className="space-y-5 animate-slide-up">

      {/* Original copy block */}
      {data.original && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
          <p className="text-xs font-semibold tracking-wide text-[var(--color-text-muted)] mb-2">Original</p>
          <p className="text-sm text-[var(--color-text-muted)] leading-relaxed whitespace-pre-line">{data.original}</p>
        </div>
      )}

      {/* Headline variants */}
      {hasHeadline && (
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wide text-[var(--color-text-muted)]">{sections.headline}</p>
          {data.variants.map((v, i) =>
            v.headline ? (
              <div key={i}>
                <VariantRow
                  index={i}
                  isRecommended={i === data.recommended}
                  isUnchanged={isVariantUnchanged(v.headline)}
                  totalVariants={data.variants.filter(v => v.headline).length}
                  copyText={v.headline}
                  onRewriteClick={() => setRewritingKey(rewritingKey === `headline-${i}` ? null : `headline-${i}`)}
                  isRewriting={rewritingKey === `headline-${i}`}
                >
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug truncate">{v.headline}</p>
                </VariantRow>
                {rewritingKey === `headline-${i}` && (
                  <RewritePanel
                    variantText={v.headline}
                    input={rewriteInput}
                    onInputChange={setRewriteInput}
                    onSubmit={handleRewriteSubmit}
                  />
                )}
              </div>
            ) : null
          )}
          {reasoning.headline && <SectionNote text={reasoning.headline} />}
        </div>
      )}

      {/* Body text variants */}
      {hasBody && (
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wide text-[var(--color-text-muted)]">{sections.body}</p>
          {data.variants.map((v, i) =>
            v.body ? (
              <div key={i}>
                <VariantRow
                  index={i}
                  isRecommended={i === data.recommended}
                  isUnchanged={isVariantUnchanged(v.body)}
                  totalVariants={data.variants.filter(v => v.body).length}
                  copyText={v.body}
                  onRewriteClick={() => setRewritingKey(rewritingKey === `body-${i}` ? null : `body-${i}`)}
                  isRewriting={rewritingKey === `body-${i}`}
                >
                  <p className="text-sm text-[var(--color-text-secondary)] leading-snug">{v.body}</p>
                </VariantRow>
                {rewritingKey === `body-${i}` && (
                  <RewritePanel
                    variantText={v.body}
                    input={rewriteInput}
                    onInputChange={setRewriteInput}
                    onSubmit={handleRewriteSubmit}
                  />
                )}
              </div>
            ) : null
          )}
          {reasoning.body && <SectionNote text={reasoning.body} />}
        </div>
      )}

      {/* CTA variants */}
      {hasCtas && (
        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-wide text-[var(--color-text-muted)]">{sections.ctas}</p>
          {data.variants.flatMap((v, i) =>
            v.ctas.map((cta, ci) => (
              <div key={`${i}-${ci}`}>
                <VariantRow
                  index={i}
                  isRecommended={i === data.recommended}
                  isUnchanged={isVariantUnchanged(cta)}
                  totalVariants={data.variants.filter(v => v.ctas.length > 0).length}
                  copyText={cta}
                  onRewriteClick={() => setRewritingKey(rewritingKey === `cta-${i}-${ci}` ? null : `cta-${i}-${ci}`)}
                  isRewriting={rewritingKey === `cta-${i}-${ci}`}
                >
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium border ${
                    ci === 0
                      ? "bg-[var(--color-brand)]/15 border-[var(--color-brand)]/30 text-[var(--color-brand-light)]"
                      : "border-[var(--color-border)] text-[var(--color-text-muted)]"
                  }`}>
                    {cta}
                  </span>
                </VariantRow>
                {rewritingKey === `cta-${i}-${ci}` && (
                  <RewritePanel
                    variantText={cta}
                    input={rewriteInput}
                    onInputChange={setRewriteInput}
                    onSubmit={handleRewriteSubmit}
                  />
                )}
              </div>
            ))
          )}
          {reasoning.ctas && <SectionNote text={reasoning.ctas} />}
        </div>
      )}

      {/* Grammar & Style Fixes */}
      <div>
        <p className="text-xs font-semibold tracking-wide text-[var(--color-text-muted)] mb-2">Grammar & Style</p>
        {data.fixes.length === 0 ? (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--color-success)]/20 bg-[var(--color-success)]/5">
            <img src={checkIconUrl} alt="" className="w-3.5 h-3.5 shrink-0" />
            <p className="text-xs text-[var(--color-text-muted)]">No issues found.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-card)] p-4 space-y-4">
            {data.fixes.map((fix, i) => (
              <div key={i} className="flex gap-3">
                <span className="shrink-0 flex items-center justify-center w-4 h-4 rounded-full bg-[var(--color-surface-elevated)] text-xs font-bold text-[var(--color-text-muted)] mt-0.5">
                  {i + 1}
                </span>
                <div className="space-y-1.5 min-w-0">
                  <p className="text-xs text-[var(--color-text-muted)]">{fix.rule}</p>
                  <div className="flex items-center gap-2">
                    <img src={crossIconUrl} alt="" className="w-3.5 h-3.5 shrink-0" />
                    <p className="text-sm text-[var(--color-text-secondary)] line-through decoration-[var(--color-error)]/40">{fix.original}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <img src={checkIconUrl} alt="" className="w-3.5 h-3.5 shrink-0" />
                    <p className="text-sm text-[var(--color-text-primary)] font-medium">{fix.corrected}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
