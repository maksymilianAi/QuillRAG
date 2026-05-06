import { useState, type FormEvent, type KeyboardEvent } from "react";
import arrowRightUrl from "../assets/arrow-right.svg";

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
      <div className="relative flex-1 flex items-center gap-2 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] focus-within:border-[var(--color-brand)] focus-within:ring-4 focus-within:ring-[var(--color-brand)]/10 transition-all duration-300 shadow-2xl px-3">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write your request or paste a Figma link..."
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent px-4 py-5 text-[16px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none disabled:opacity-300 leading-normal"
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
            className="flex items-center justify-center h-11 w-11 rounded-xl bg-[var(--color-brand)] text-white transition-all hover:bg-[var(--color-brand-dark)] disabled:opacity-30 disabled:grayscale active:scale-90"
          >
            <img src={arrowRightUrl} alt="" className="w-6 h-6" style={{ filter: "brightness(0) invert(1)" }} />
          </button>
        </div>
      </div>
    </form>
  );
}
