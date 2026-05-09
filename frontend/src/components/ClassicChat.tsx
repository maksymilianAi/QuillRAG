/**
 * ClassicChat — The original chat-based copywriting interface.
 * Extracted from App.tsx to preserve the original UX.
 */

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { generateCopy } from "../api";
import type { ChatMessage as ChatMessageType } from "../types";

function ResponseSkeleton() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="min-w-[280px] max-w-[600px] w-[85%]">
        <div className="bg-[var(--color-surface-elevated)] rounded-2xl border border-[var(--color-border)] px-6 py-5 space-y-4">
          <div className="skeleton h-3 w-16 rounded" />
          <div className="space-y-2">
            <div className="skeleton h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-4 w-1/2 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

const STORAGE_KEY = "quill_chat_history";
const today = () => new Date().toDateString();

function loadHistory(): ChatMessageType[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const { date, messages } = JSON.parse(raw);
    if (date !== today()) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    return messages.map((m: ChatMessageType) => ({ ...m, timestamp: new Date(m.timestamp as unknown as string) }));
  } catch {
    return [];
  }
}

const MAX_STORED_MESSAGES = 30;

function saveHistory(messages: ChatMessageType[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today(), messages: messages.slice(-MAX_STORED_MESSAGES) }));
  } catch {}
}

export function ClassicChat() {
  const [messages, setMessages] = useState<ChatMessageType[]>(() => loadHistory());
  const [isLoading, setIsLoading] = useState(false);
  const [pendingClarification, setPendingClarification] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    saveHistory(messages);
  }, [messages]);

  const handleSend = async (content: string) => {
    const userMessage: ChatMessageType = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    const isFollowUp = pendingClarification !== null;
    // Accumulate full context — original prompt is never lost across follow-up rounds
    const accumulatedPrompt = isFollowUp
      ? `${pendingClarification}\n\nAdditional context: ${content}`
      : content;
    // On a follow-up, instruct the model to generate immediately and not ask again
    const prompt = isFollowUp
      ? `${accumulatedPrompt}\n\n[The user has answered your clarifying questions. Generate copy now — do not ask for more clarification.]`
      : content;
    setPendingClarification(null);

    try {
      const response = await generateCopy({
        prompt,
        options: {
          variantCount: 2,
          fixGrammar: true,
          includeReasoning: true,
        },
      });

      if (response.needsClarification) {
        // Store the accumulated prompt (not just content) so context carries forward
        setPendingClarification(accumulatedPrompt);
      }

      const assistantMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        data: response,
        prompt: content,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `⚠️ ${err instanceof Error ? err.message : "Something went wrong. Please try again."}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 relative">
      {/* Messages */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col items-center">
        <div className="max-w-[968px] w-full px-4 md:px-6 py-8 space-y-6 flex-1 flex flex-col">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-slide-up" style={{ paddingBottom: "8%" }}>
              <img
                src="/quill-logo.png"
                alt="Quill"
                className="w-16 h-16 mb-5"
                style={{ borderRadius: "18px" }}
              />
              <h2 className="text-3xl font-extrabold text-[var(--color-text-primary)] mb-2 tracking-tight">
                Quill
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] mb-7">
                Your Copywriting Assistant
              </p>

              <div className="w-full max-w-lg space-y-3">
                <p className="text-xs font-medium text-[var(--color-text-muted)] mb-3">
                  Try asking
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    "Rewrite a page or modal copy",
                    "Improve specific text",
                    "Write copy from scratch",
                    "Review and audit copy",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSend(suggestion)}
                      className="group text-left text-xs px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 text-[var(--color-text-secondary)] hover:border-[var(--color-brand)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)] transition-all duration-200 flex items-center justify-between"
                    >
                      <span>{suggestion}</span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--color-brand-light)]">→</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-6">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} onAnswer={handleSend} />
            ))}
            {isLoading && <ResponseSkeleton />}
          </div>

          <div ref={messagesEndRef} className="h-4 shrink-0" />
        </div>
      </main>

      {/* Input area */}
      <footer className="shrink-0 flex justify-center bg-gradient-to-t from-[var(--color-surface)] via-[var(--color-surface)] to-transparent pt-6 pb-8 z-20">
        <div className="max-w-[968px] w-full px-6">
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
      </footer>
    </div>
  );
}
