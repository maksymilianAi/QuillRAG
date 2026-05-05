import { useState, useEffect } from "react";

interface SidebarProps {
  onSettingsChange: (settings: AppSettings) => void;
  activeView: "classic" | "ide";
  onViewChange: (view: "classic" | "ide") => void;
}

export interface AppSettings {
  provider: string;
  apiKey: string;
  figmaToken: string;
  localUrl?: string;
  localModel?: string;
  localApiKey?: string;
}

export function Sidebar({ onSettingsChange, activeView, onViewChange }: SidebarProps) {
  const [provider, setProvider] = useState(() => localStorage.getItem("copy_provider") || "openai");
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("copy_api_key") || "");
  const [figmaToken, setFigmaToken] = useState(() => localStorage.getItem("copy_figma_token") || "");
  const [localUrl, setLocalUrl] = useState(() => localStorage.getItem("copy_local_url") || "http://localhost:11434/v1");
  const [localModel, setLocalModel] = useState(() => localStorage.getItem("copy_local_model") || "llama3.2");
  const [localApiKey, setLocalApiKey] = useState(() => localStorage.getItem("copy_local_api_key") || "");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    onSettingsChange({ provider, apiKey, figmaToken, localUrl, localModel, localApiKey });
  }, []);

  const handleSave = () => {
    localStorage.setItem("copy_provider", provider);
    localStorage.setItem("copy_api_key", apiKey);
    localStorage.setItem("copy_figma_token", figmaToken);
    localStorage.setItem("copy_local_url", localUrl);
    localStorage.setItem("copy_local_model", localModel);
    localStorage.setItem("copy_local_api_key", localApiKey);
    onSettingsChange({ provider, apiKey, figmaToken, localUrl, localModel, localApiKey });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <aside className="w-72 shrink-0 bg-[var(--color-surface-elevated)] border-r border-[var(--color-border)] flex flex-col p-6 space-y-6 h-screen z-30">
      {/* View Switcher */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
          Mode
        </label>
        <div className="flex gap-1 p-1 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <button
            onClick={() => onViewChange("classic")}
            className={`flex-1 py-2 px-3 rounded-lg text-[11px] font-bold transition-all ${
              activeView === "classic"
                ? "bg-[var(--color-brand)] text-white shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            💬 Classic
          </button>
          <button
            onClick={() => onViewChange("ide")}
            className={`flex-1 py-2 px-3 rounded-lg text-[11px] font-bold transition-all ${
              activeView === "ide"
                ? "bg-[var(--color-brand)] text-white shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            🎨 Visual IDE
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-bold text-[var(--color-text-primary)] font-outfit uppercase tracking-wider">
          LLM Settings
        </h2>
        <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed">
          Select your preferred model provider and add your API key.
        </p>
      </div>

      <div className="space-y-5 flex-1">
        {/* Provider Selection */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
            Provider
          </label>
          <div className="grid grid-cols-1 gap-2">
            {["openai", "claude", "gemini", "local"].map((p) => (
              <button
                key={p}
                onClick={() => setProvider(p)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-xs font-medium ${
                  provider === p
                    ? "bg-[var(--color-brand)]/10 border-[var(--color-brand)] text-[var(--color-text-primary)]"
                    : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-bright)]"
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${provider === p ? "bg-[var(--color-brand)]" : "bg-[var(--color-text-muted)]"}`} />
                <span className="capitalize">
                  {p === "gemini" ? "Google Gemini" : p === "local" ? "Local / Custom" : p}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic LLM Inputs */}
        {provider !== "local" ? (
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
              API Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={`Enter ${provider} key...`}
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] transition-all placeholder-[var(--color-text-muted)]"
              />
            </div>
            <p className="text-[9px] text-[var(--color-text-muted)] italic">
              * Keys are stored locally in your browser.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                Base URL
              </label>
              <input
                type="text"
                value={localUrl}
                onChange={(e) => setLocalUrl(e.target.value)}
                placeholder="http://localhost:11434/v1"
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] transition-all placeholder-[var(--color-text-muted)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                Model Name
              </label>
              <input
                type="text"
                value={localModel}
                onChange={(e) => setLocalModel(e.target.value)}
                placeholder="llama3.2"
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] transition-all placeholder-[var(--color-text-muted)]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                Custom API Key <span className="text-[9px] font-normal lowercase">(optional)</span>
              </label>
              <input
                type="password"
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="Bearer token..."
                className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] transition-all placeholder-[var(--color-text-muted)]"
              />
            </div>
          </div>
        )}

        {/* Figma Token Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
            Figma Token
          </label>
          <div className="relative">
            <input
              type="password"
              value={figmaToken}
              onChange={(e) => setFigmaToken(e.target.value)}
              placeholder="Enter Personal Access Token..."
              className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] transition-all placeholder-[var(--color-text-muted)]"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        className={`w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${
          isSaved
            ? "bg-[var(--color-success)] text-white"
            : "bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white shadow-lg shadow-indigo-500/20"
        }`}
      >
        {isSaved ? "Saved!" : "Apply Changes"}
      </button>

      <div className="pt-6 border-t border-[var(--color-border)]">
        <p className="text-[10px] text-[var(--color-text-muted)] text-center">
          CopywrightRAG v1.0.0
        </p>
      </div>
    </aside>
  );
}
