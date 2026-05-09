import { OllamaTool } from "./OllamaTool";

interface HeaderProps {
  activeView: "classic" | "ide";
  onViewChange: (view: "classic" | "ide") => void;
}

export function Header({ activeView, onViewChange }: HeaderProps) {
  return (
    <header className="shrink-0 flex items-center justify-between px-6 h-14 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
      {/* Logo + name */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <img
            src="/quill-logo.png"
            alt="Quill"
            className="w-7 h-7 rounded"
          />
          <span className="text-[18px] font-bold text-[var(--color-text-primary)]">Quill</span>
        </div>

        {/* Local development tool */}
        <OllamaTool />
      </div>

      {/* Mode switcher */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border)]">
        <button
          onClick={() => onViewChange("classic")}
          className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition-all ${
            activeView === "classic"
              ? "bg-[var(--color-brand)] text-white shadow-sm"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          Classic
        </button>
        <button
          onClick={() => onViewChange("ide")}
          className={`py-1.5 px-4 rounded-lg text-xs font-semibold transition-all ${
            activeView === "ide"
              ? "bg-[var(--color-brand)] text-white shadow-sm"
              : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          Visual IDE
        </button>
      </div>
    </header>
  );
}
