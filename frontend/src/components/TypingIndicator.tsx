/**
 * Typing indicator — three animated dots.
 */
export function TypingIndicator() {
  return (
    <div className="flex justify-start animate-slide-up">
      <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="typing-dot w-2 h-2 rounded-full bg-[var(--color-brand-light)]" />
          <span className="typing-dot w-2 h-2 rounded-full bg-[var(--color-brand-light)]" />
          <span className="typing-dot w-2 h-2 rounded-full bg-[var(--color-brand-light)]" />
        </div>
      </div>
    </div>
  );
}
