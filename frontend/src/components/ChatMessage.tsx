import type { ChatMessage as ChatMessageType } from "../types";
import { ResponseCard } from "./ResponseCard";

interface Props {
  message: ChatMessageType;
  onAnswer?: (text: string) => void;
}

/**
 * Single chat message bubble — user or assistant.
 */
export function ChatMessage({ message, onAnswer }: Props) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end animate-slide-up">
        <div className="max-w-[560px] w-[75%]">
          <div className="border border-[var(--color-brand)]/25 bg-[var(--color-brand)]/8 rounded-2xl px-4 py-3">
            <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
              {message.content}
            </p>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] text-right mt-1.5 pr-1">
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    );
  }

  // Approved responses render their own green card — skip the outer wrapper
  if (message.data?.approved) {
    return (
      <div className="flex justify-start animate-slide-up">
        <div className="min-w-[280px] max-w-[600px] w-[85%]">
          <ResponseCard data={message.data} prompt={message.prompt} onAnswer={onAnswer} />
          <p className="text-xs text-[var(--color-text-muted)] mt-1.5 pl-1">
            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start animate-slide-up">
      <div className="min-w-[280px] max-w-[600px] w-[85%]">
        <div className="bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] rounded-2xl border border-[var(--color-border)] px-6 py-5 glass-effect">
          <div className="space-y-3">
            {message.data ? (
              <ResponseCard data={message.data} prompt={message.prompt} onAnswer={onAnswer} />
            ) : (
              <p className="text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
                {message.content}
              </p>
            )}
          </div>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-1.5 pl-1">
          {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
