/**
 * ClassicChat — The original chat-based copywriting interface.
 * Extracted from App.tsx to preserve the original UX.
 */

import { useState, useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { generateCopy } from "../api";
import type { AppSettings } from "./Sidebar";
import type { ChatMessage as ChatMessageType } from "../types";

interface ClassicChatProps {
  settings: AppSettings;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function ClassicChat({ settings, isSidebarOpen, onToggleSidebar }: ClassicChatProps) {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (content: string) => {
    const userMessage: ChatMessageType = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await generateCopy({
        prompt: content,
        provider: settings.provider,
        apiKey: settings.apiKey,
        figmaToken: settings.figmaToken,
        localUrl: settings.localUrl,
        localModel: settings.localModel,
        localApiKey: settings.localApiKey,
        options: {
          variantCount: 2,
          fixGrammar: true,
          includeReasoning: true,
        },
      });

      const assistantMessage: ChatMessageType = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        data: response,
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
    <div className="flex-1 flex flex-col h-full min-w-0">
      {/* Header */}
      <header className="shrink-0 flex items-center justify-center border-b border-[var(--color-border)] bg-[var(--color-surface)]/80 backdrop-blur-md z-20">
        <div className="max-w-5xl w-full flex items-center gap-4 px-6 py-5">
          <button 
            onClick={onToggleSidebar}
            className="p-2 -ml-2 rounded-xl hover:bg-[var(--color-surface-elevated)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm2.25 5.25a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5H5.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-dark)] shadow-lg shadow-indigo-500/20">
            <span className="text-2xl">✍️</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-[var(--color-text-primary)] font-outfit tracking-tight leading-none">
              CopywrightRAG
            </h1>
            <p className="text-[11px] text-[var(--color-text-muted)] font-bold uppercase tracking-[0.15em] mt-1.5">
              AI UX Copywriting
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-success)] animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            <span className="text-[11px] font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">Active</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col items-center">
        <div className="max-w-3xl w-full px-4 md:px-6 py-8 space-y-6 flex-1 flex flex-col">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-slide-up py-12">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[var(--color-brand)] to-purple-600 flex items-center justify-center mb-6 shadow-2xl shadow-indigo-500/30 rotate-3">
                <span className="text-4xl">🧠</span>
              </div>
              <h2 className="text-3xl font-extrabold text-[var(--color-text-primary)] mb-3 font-outfit tracking-tight">
                Design-Driven Copy
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mb-10 leading-relaxed">
                Professional UX writing suggestions based on your Figma context and brand guidelines.
              </p>
              
              <div className="w-full max-w-md space-y-3">
                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.2em] mb-4">
                  Quick Start Suggestions
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "Rewrite checkout page copy to be more engaging",
                    "Improve error messages for a login form",
                    "Write onboarding screen headlines",
                    "Review and fix copy for a pricing page",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleSend(suggestion)}
                      className="group text-left text-xs px-4 py-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50 text-[var(--color-text-secondary)] hover:border-[var(--color-brand)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-primary)] transition-all duration-300 flex items-center justify-between"
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
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
          </div>

          <div ref={messagesEndRef} className="h-4 shrink-0" />
        </div>
      </main>

      {/* Input area */}
      <footer className="shrink-0 flex justify-center bg-gradient-to-t from-[var(--color-surface)] via-[var(--color-surface)] to-transparent pt-10 pb-12 z-20">
        <div className="max-w-3xl w-full px-6">
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
      </footer>
    </div>
  );
}
