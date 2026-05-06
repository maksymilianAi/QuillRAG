import { useState } from "react";
import { Header } from "./components/Header";
import { ClassicChat } from "./components/ClassicChat";
import { VisualIDE } from "./components/VisualIDE";

export interface AppSettings {
  provider: string;
  apiKey: string;
  figmaToken: string;
  localUrl?: string;
  localModel?: string;
  localApiKey?: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  provider: "claude",
  apiKey: "",
  figmaToken: "",
};

function App() {
  const [activeView, setActiveView] = useState<"classic" | "ide">(
    () => (localStorage.getItem("copy_active_view") as "classic" | "ide") || "classic"
  );

  const handleViewChange = (view: "classic" | "ide") => {
    setActiveView(view);
    localStorage.setItem("copy_active_view", view);
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--color-surface)] selection:bg-[var(--color-brand)]/30 overflow-hidden">
      <Header activeView={activeView} onViewChange={handleViewChange} />

      {activeView === "classic" ? (
        <ClassicChat settings={DEFAULT_SETTINGS} />
      ) : (
        <VisualIDE settings={DEFAULT_SETTINGS} />
      )}
    </div>
  );
}

export default App;
