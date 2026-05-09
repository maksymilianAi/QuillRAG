import { useState, useEffect } from "react";
import { updateServerConfig } from "../api";

export function OllamaTool() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLocal, setIsLocal] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "success" | "error">("idle");
  
  // Settings state
  const [url, setUrl] = useState(() => localStorage.getItem("copy_local_url") || "http://localhost:11434/v1");
  const [model, setModel] = useState(() => localStorage.getItem("copy_local_model") || "llama3.2");
  const [isActive, setIsActive] = useState(() => localStorage.getItem("copy_provider") === "local");
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Detect localhost
    const hostname = window.location.hostname;
    setIsLocal(hostname === "localhost" || hostname === "127.0.0.1");
    
    // Initial sync with server if active
    if (localStorage.getItem("copy_provider") === "local") {
      syncWithServer();
    }
  }, []);

  const syncWithServer = async (targetProvider = "local") => {
    await updateServerConfig({
      provider: targetProvider,
      localUrl: url,
      localModel: model,
    });
    if (targetProvider === "local") {
      checkConnection();
    }
  };

  const checkConnection = async (targetUrl = url) => {
    setIsConnecting(true);
    setConnectionStatus("idle");
    try {
      // Ollama's /v1/models or just the root
      // We'll try /api/tags which is the most reliable check for Ollama running
      const response = await fetch(targetUrl.replace(/\/v1\/?$/, "") + "/api/tags", {
        method: "GET",
      });
      if (response.ok) {
        setConnectionStatus("success");
        return true;
      } else {
        setConnectionStatus("error");
        return false;
      }
    } catch (err) {
      setConnectionStatus("error");
      return false;
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isLocal) return null;

  const handleSave = async () => {
    const isOk = await checkConnection();
    
    localStorage.setItem("copy_local_url", url);
    localStorage.setItem("copy_local_model", model);
    
    if (isOk) {
      localStorage.setItem("copy_provider", "local");
      setIsActive(true);
      await syncWithServer("local");
    }
    
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      if (isOk) setIsOpen(false);
    }, 1500);
    
    window.dispatchEvent(new Event("storage"));
  };

  const handleDisconnect = async () => {
    localStorage.setItem("copy_provider", "openai"); // fallback to default
    setIsActive(false);
    setConnectionStatus("idle");
    setIsOpen(false);
    
    await updateServerConfig({ provider: "openai" });
    
    window.dispatchEvent(new Event("storage"));
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-[11px] font-bold ${
          isActive && connectionStatus === "success"
            ? "bg-[var(--color-success)]/10 border-[var(--color-success)] text-[var(--color-success)]" 
            : isActive && connectionStatus === "error"
            ? "bg-[var(--color-error)]/10 border-[var(--color-error)] text-[var(--color-error)]"
            : "bg-[var(--color-surface-elevated)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-bright)]"
        }`}
        title="Local LLM Settings (Ollama)"
      >
        <span className="text-sm">🦙</span>
        <span>
          {isActive 
            ? (connectionStatus === "success" ? "Ollama Active" : connectionStatus === "error" ? "Ollama Offline" : "Ollama (Local)") 
            : "Connect Ollama"}
        </span>
        {isActive && (
          <div className={`w-1.5 h-1.5 rounded-full ${
            connectionStatus === "success" ? "bg-[var(--color-success)]" : 
            connectionStatus === "error" ? "bg-[var(--color-error)]" : "bg-[var(--color-text-muted)]"
          }`} />
        )}
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden animate-slide-up">
            <div className="px-6 py-5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface-elevated)]/30">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-all ${
                  connectionStatus === "success" ? "bg-[var(--color-success)] shadow-[var(--color-success)]/20" : 
                  connectionStatus === "error" ? "bg-[var(--color-error)] shadow-[var(--color-error)]/20" : 
                  "bg-gradient-to-br from-[var(--color-brand)] to-[var(--color-brand-dark)] shadow-[var(--color-brand)]/20"
                }`}>
                  <span className="text-xl">🦙</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Local LLM Connection</h3>
                  <p className="text-[10px] text-[var(--color-text-muted)]">
                    {connectionStatus === "success" ? "✓ Connected to Ollama" : 
                     connectionStatus === "error" ? "✕ Cannot reach Ollama" : 
                     "Configure Ollama for local development"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                    Ollama Base URL
                  </label>
                  <button 
                    onClick={() => checkConnection()}
                    disabled={isConnecting}
                    className="text-[9px] font-bold text-[var(--color-brand-light)] hover:underline uppercase"
                  >
                    {isConnecting ? "Checking..." : "Test Connection"}
                  </button>
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="http://localhost:11434/v1"
                  className={`w-full bg-[var(--color-surface-elevated)] border rounded-xl px-4 py-3 text-xs text-[var(--color-text-primary)] outline-none transition-all placeholder-[var(--color-text-muted)] ${
                    connectionStatus === "success" ? "border-[var(--color-success)]/50 focus:border-[var(--color-success)]" : 
                    connectionStatus === "error" ? "border-[var(--color-error)]/50 focus:border-[var(--color-error)]" : 
                    "border-[var(--color-border)] focus:border-[var(--color-brand)]"
                  }`}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-widest">
                  Model Name
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="llama3.2, mistral, etc."
                  className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border)] rounded-xl px-4 py-3 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)] transition-all placeholder-[var(--color-text-muted)]"
                />
              </div>

              <div className="pt-2 space-y-3">
                <button
                  onClick={handleSave}
                  disabled={isSaved || isConnecting}
                  className={`w-full py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
                    isSaved
                      ? "bg-[var(--color-success)] text-white"
                      : "bg-[var(--color-brand)] hover:bg-[var(--color-brand-dark)] text-white shadow-lg shadow-[var(--color-brand)]/20"
                  }`}
                >
                  {isSaved ? "Settings Saved!" : isActive ? "Update & Test" : "Connect & Save"}
                </button>

                {isActive && (
                  <button
                    onClick={handleDisconnect}
                    className="w-full py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/5 transition-all"
                  >
                    Disconnect & Use Cloud LLM
                  </button>
                )}
              </div>
              
              <div className="p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                <p className="text-[10px] text-blue-400 leading-relaxed text-center">
                  Make sure Ollama is running and you have pulled the model: <br/>
                  <code className="bg-blue-500/10 px-1 py-0.5 rounded mt-1 inline-block">ollama pull {model}</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
