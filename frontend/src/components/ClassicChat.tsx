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


export function ClassicChat({ settings, isSidebarOpen: _isSidebarOpen, onToggleSidebar }: ClassicChatProps) {
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
      {/* Floating open-sidebar button — visible only when sidebar is collapsed */}
      {!_isSidebarOpen && (
        <button
          onClick={onToggleSidebar}
          className="absolute top-4 left-4 z-20 p-2 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-brand)] transition-all shadow-sm"
          title="Open sidebar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm2.25 5.25a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5H5.5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      {/* Messages */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col items-center">
        <div className="max-w-3xl w-full px-4 md:px-6 py-8 space-y-6 flex-1 flex flex-col">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center animate-slide-up py-12">
              <img
                src="/quill-logo.png"
                alt="Quill"
                className="w-20 h-20 mb-7"
                style={{ borderRadius: "20px" }}
              />
              <h2 className="text-4xl font-extrabold text-[var(--color-text-primary)] mb-3 tracking-tight">
                Quill
              </h2>
              <p className="text-base text-[var(--color-text-muted)] mb-10">
                Your Copywriting Assistant
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
