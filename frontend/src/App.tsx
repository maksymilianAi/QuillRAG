import { useState } from "react";
import { OllamaTool } from "./components/OllamaTool";
import { ClassicChat } from "./components/ClassicChat";
import { VisualIDE } from "./components/VisualIDE";

function App() {
  const [activeView, setActiveView] = useState<"classic" | "ide">(
    () => (localStorage.getItem("copy_active_view") as "classic" | "ide") || "classic"
  );

  const handleViewChange = (view: "classic" | "ide") => {
    setActiveView(view);
    localStorage.setItem("copy_active_view", view);
  };

  return (
    <div className="relative h-screen bg-[var(--color-surface)] selection:bg-[var(--color-brand)]/30 overflow-hidden">

      {/* Logo — floating top-left */}
      <div className="absolute top-3 left-4 z-30 flex items-center gap-2.5">
        <img src="/quill-logo.png" alt="Quill" className="w-7 h-7 rounded" />
        <span className="text-[17px] font-bold text-[var(--color-text-primary)]">Quill</span>
        <OllamaTool />
      </div>

      {/* View switcher — floating top-right */}
      <div className="absolute top-3 right-4 z-30">
        <div className="flex gap-1 p-1 rounded-xl bg-[var(--color-surface-elevated)]/90 backdrop-blur border border-[var(--color-border)]">
          <button
            onClick={() => handleViewChange("classic")}
            className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition-all ${
              activeView === "classic"
                ? "bg-[var(--color-brand)] text-white shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Classic
          </button>
          <button
            onClick={() => handleViewChange("ide")}
            className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition-all ${
              activeView === "ide"
                ? "bg-[var(--color-brand)] text-white shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            Visual IDE
          </button>
        </div>
      </div>

      <div className={activeView === "classic" ? "flex h-full" : "hidden"}>
        <ClassicChat />
      </div>
      <div className={activeView === "ide" ? "flex h-full" : "hidden"}>
        <VisualIDE />
      </div>
    </div>
  );
}

export default App;
