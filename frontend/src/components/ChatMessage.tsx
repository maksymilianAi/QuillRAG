import type { ChatMessage as ChatMessageType } from "../types";
import { ResponseCard } from "./ResponseCard";

interface Props {
  message: ChatMessageType;
}

/**
 * Single chat message bubble — user or assistant.
 */
export function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex animate-slide-up ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[85%] md:max-w-[80%] px-8 py-7 shadow-2xl ${
          isUser
            ? "bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-dark)] text-white rounded-2xl rounded-br-none shadow-indigo-500/10"
            : "bg-[var(--color-surface-elevated)] text-[var(--color-text-primary)] rounded-2xl rounded-bl-none border border-[var(--color-border)] glass-effect"
        }`}
      >
        {/* For user: just show text */}
        {isUser && <p className="text-[16px] leading-relaxed font-medium tracking-tight">{message.content}</p>}



        {/* For assistant: show structured data if available, otherwise text */}
        {!isUser && (
          <div className="space-y-3">
            {message.data ? (
              <ResponseCard data={message.data} prompt={message.prompt} />
            ) : (
              <p className="text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
                {message.content}
              </p>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div className={`flex items-center gap-1.5 mt-3 ${isUser ? "justify-end" : "justify-start"}`}>
          <div className={`w-1 h-1 rounded-full ${isUser ? "bg-white/40" : "bg-[var(--color-text-muted)]"}`} />
          <p
            className={`text-[9px] font-bold uppercase tracking-widest ${
              isUser
                ? "text-indigo-100/60"
                : "text-[var(--color-text-muted)]"
            }`}
          >
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}
