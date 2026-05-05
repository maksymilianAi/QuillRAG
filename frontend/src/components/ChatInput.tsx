import { useState, type FormEvent, type KeyboardEvent } from "react";

interface Props {
  onSend: (message: string) => void;
  disabled?: boolean;
}

/**
 * Chat input with send button. Supports Enter to send, Shift+Enter for newline.
 */
export function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-3"
    >
      <div className="relative flex-1 flex items-center gap-2 bg-[var(--color-surface-elevated)] rounded-2xl border border-[var(--color-border)] focus-within:border-[var(--color-brand)] focus-within:ring-4 focus-within:ring-[var(--color-brand)]/10 transition-all duration-300 shadow-2xl px-3">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask for copy or paste a Figma link..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent px-4 py-5 text-[16px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none disabled:opacity-50 leading-normal"
          style={{ minHeight: "64px", maxHeight: "160px" }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = "64px";
            target.style.height = `${Math.min(target.scrollHeight, 160)}px`;
          }}
        />
        <div className="pr-2">
          <button
            type="submit"
            disabled={disabled || !value.trim()}
            className="flex items-center justify-center h-11 w-11 rounded-xl bg-[var(--color-brand)] text-white transition-all hover:bg-[var(--color-brand-dark)] hover:shadow-[0_0_25px_rgba(99,102,241,0.6)] disabled:opacity-5 disabled:grayscale active:scale-90"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086L2.28 16.762a.75.75 0 0 0 .826.95l15.19-4.55a.75.75 0 0 0 0-1.424L3.105 2.288Z" />
            </svg>
          </button>
        </div>
      </div>
    </form>
  );
}
