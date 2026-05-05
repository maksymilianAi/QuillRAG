import type { GenerateCopyResponse } from "../types";

interface Props {
  data: GenerateCopyResponse;
}

/**
 * Renders the structured AI response: variants, grammar fixes, reasoning.
 */
export function ResponseCard({ data }: Props) {
  return (
    <div className="space-y-4 animate-slide-up">
      {/* Copy Variants */}
      {data.variants.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-3 font-outfit">
            ✨ Copy Variants
          </h4>
          <div className="space-y-3">
            {data.variants.map((v, i) => (
              <div
                key={i}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-5 transition-all hover:border-[var(--color-brand)] hover:shadow-[0_0_30px_-10px_rgba(99,102,241,0.3)] glass-effect group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[var(--color-brand)] text-[10px] font-bold text-white shadow-sm">
                      {i + 1}
                    </span>
                    <span className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wider">
                      Option {i + 1}
                    </span>
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText(v.headline)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-[var(--color-surface-card)] text-[var(--color-text-muted)] hover:text-[var(--color-brand-light)]"
                    title="Copy headline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path d="M7 3.5A1.5 1.5 0 0 1 8.5 2h3.879a1.5 1.5 0 0 1 1.06.44l3.122 3.12a1.5 1.5 0 0 1 .439 1.061V14.5a1.5 1.5 0 0 1-1.5 1.5H8.5A1.5 1.5 0 0 1 7 14.5v-11Z" />
                      <path d="M3.5 7A1.5 1.5 0 0 0 2 8.5v7A1.5 1.5 0 0 0 3.5 17h7a1.5 1.5 0 0 0 1.5-1.5v-1.125a.75.75 0 0 0-1.5 0v1.125h-7v-7h1.125a.75.75 0 0 0 0-1.5H3.5Z" />
                    </svg>
                  </button>
                </div>
                <p className="text-base font-semibold text-[var(--color-text-primary)] mb-3 leading-snug">
                  {v.headline}
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-4 py-1.5 rounded-xl bg-gradient-to-r from-[var(--color-brand)] to-[var(--color-brand-dark)] text-white text-xs font-bold shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all cursor-default">
                    {v.cta}
                  </span>
                  {v.labels.map((label, j) => (
                    <span
                      key={j}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg bg-[var(--color-surface-card)]/50 text-[var(--color-text-secondary)] text-[11px] border border-[var(--color-border)] backdrop-blur-sm"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grammar Fixes */}
      {data.fixes.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-3 font-outfit">
            🔧 Grammar Fixes
          </h4>
          <div className="space-y-2">
            {data.fixes.map((fix, i) => (
              <div
                key={i}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-4 text-sm glass-effect"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-surface-card)] text-[var(--color-text-muted)] border border-[var(--color-border)] uppercase tracking-wider">
                    {fix.rule}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--color-error)] opacity-60">✕</span>
                      <p className="text-[var(--color-text-secondary)] line-through decoration-[var(--color-error)]/40">
                        {fix.original}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[var(--color-success)]">✓</span>
                      <p className="text-[var(--color-text-primary)] font-medium">
                        {fix.corrected}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reasoning */}
      {data.reasoning.length > 0 && (
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--color-text-muted)] mb-3 font-outfit">
            💡 Reasoning
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
    </div>
  );
}
