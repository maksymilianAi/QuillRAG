/**
 * IDEChat — Specialized chat panel for the Visual IDE.
 * Sends targeted text to the backend for rewriting.
 */

import { useState, useRef, useEffect } from "react";
import { generateCopy } from "../api";
import type { AppSettings } from "./Sidebar";
import type { FigmaTextNode, GenerateCopyResponse } from "../types";

interface IDEChatProps {
  settings: AppSettings;
  selectedNode: FigmaTextNode | null;
  contextualDescription: string;
  onCopyGenerated: (nodeId: string, response: GenerateCopyResponse) => void;
}

interface IDEMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  data?: GenerateCopyResponse;
  timestamp: Date;
}

export function IDEChat({
  settings,
  selectedNode,
  contextualDescription,
  onCopyGenerated,
}: IDEChatProps) {
  const [messages, setMessages] = useState<IDEMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // When a node is selected, add a system message
  useEffect(() => {
    if (selectedNode) {
      const systemMsg: IDEMessage = {
        id: crypto.randomUUID(),
        role: "system",
        content: `Selected: "${selectedNode.text}" (${selectedNode.name})`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, systemMsg]);
      inputRef.current?.focus();
    }
  }, [selectedNode?.id]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    if (!selectedNode) {
      const errorMsg: IDEMessage = {
        id: crypto.randomUUID(),
        role: "system",
        content: "⚠️ Select a text element on the canvas first.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      return;
    }

    const userContent = inputValue.trim();
    setInputValue("");

    const userMsg: IDEMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: userContent,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      // Build a targeted prompt that includes context
      const targetedPrompt = [
        `Component Context: ${contextualDescription}`,
        `Target Element: "${selectedNode.name}" — "${selectedNode.text}"`,
        `Task: ${userContent}`,
      ].join("\n");

      const response = await generateCopy({
        prompt: targetedPrompt,
        provider: settings.provider,
        apiKey: settings.apiKey,
        figmaToken: settings.figmaToken,
        localUrl: settings.localUrl,
        localModel: settings.localModel,
        localApiKey: settings.localApiKey,
        options: {
          variantCount: 1,
          fixGrammar: true,
          includeReasoning: true,
        },
      });

      const assistantMsg: IDEMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        data: response,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      onCopyGenerated(selectedNode.id, response);
    } catch (err) {
      const errorMsg: IDEMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `⚠️ ${err instanceof Error ? err.message : "Something went wrong."}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="shrink-0 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface-elevated)]/50">
        <div className="flex items-center gap-3">
          <span className="text-lg">💬</span>
          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
            Quill Chat
          </h3>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-dark)] flex items-center justify-center mb-4 shadow-lg">
              <span className="text-2xl">✏️</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] max-w-[200px]">
              Select a text element on the canvas, then type your rewrite instruction here.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className="animate-slide-up">
            {msg.role === "system" ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-surface-elevated)]/50 border border-[var(--color-border)]/50">
                <span className="text-[10px]">🎯</span>
                <p className="text-[11px] text-[var(--color-text-muted)] truncate">{msg.content}</p>
              </div>
            ) : msg.role === "user" ? (
              <div className="flex justify-end">
                <div className="max-w-[85%] px-3 py-2 rounded-2xl bg-[var(--color-brand)] text-white text-xs">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div className="max-w-[85%]">
                {msg.content ? (
                  <div className="px-3 py-2 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)]">
                    {msg.content}
                  </div>
                ) : msg.data ? (
                  <div className="space-y-2">
                    {/* Fixes */}
                    {msg.data.fixes.length > 0 && (
                      <div className="space-y-1.5">
                        {msg.data.fixes.map((fix, i) => (
                          <div key={i} className="px-3 py-2 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[var(--color-error)] text-[10px]">✕</span>
                              <p className="text-[11px] text-[var(--color-text-muted)] line-through">{fix.original}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[var(--color-success)] text-[10px]">✓</span>
                              <p className="text-[11px] text-[var(--color-text-primary)] font-medium">{fix.corrected}</p>
                            </div>
                            <p className="text-[9px] text-[var(--color-text-muted)] mt-1 italic">{fix.rule}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Variants */}
                    {msg.data.variants.length > 0 && (
                      <div className="space-y-1.5">
                        {msg.data.variants.map((variant, i) => (
                          <div key={i} className="px-3 py-2 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-brand)]/20">
                            <p className="text-[10px] font-bold text-[var(--color-brand-light)] uppercase mb-1">Variant {i + 1}</p>
                            <p className="text-[11px] text-[var(--color-text-primary)] font-semibold">{variant.headline}</p>
                            {variant.cta && <p className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">CTA: {variant.cta}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Reasoning */}
                    {msg.data.reasoning.length > 0 && (
                      <div className="px-3 py-2 rounded-xl bg-[var(--color-surface-elevated)]/50 border border-[var(--color-border)]/50">
                        <p className="text-[9px] font-bold text-[var(--color-text-muted)] uppercase mb-1">💡 Why</p>
                        {msg.data.reasoning.map((r, i) => (
                          <p key={i} className="text-[10px] text-[var(--color-text-muted)]">• {r}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 px-3 py-2">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand)] animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand)] animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-brand)] animate-bounce [animation-delay:300ms]" />
            </div>
            <span className="text-[10px] text-[var(--color-text-muted)]">Quill is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 p-3 border-t border-[var(--color-border)]">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={selectedNode ? "Rewrite this text..." : "Select a node first..."}
            disabled={isLoading}
            className="flex-1 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-3 py-2 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] transition-all placeholder-[var(--color-text-muted)] disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            className="px-3 py-2 rounded-xl bg-[var(--color-brand)] text-white text-xs font-medium hover:bg-[var(--color-brand-dark)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
