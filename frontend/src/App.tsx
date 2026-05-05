import { useState } from "react";
import { Sidebar, type AppSettings } from "./components/Sidebar";
import { ClassicChat } from "./components/ClassicChat";
import { VisualIDE } from "./components/VisualIDE";

function App() {
  const [settings, setSettings] = useState<AppSettings>({ provider: "openai", apiKey: "", figmaToken: "" });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<"classic" | "ide">(
    () => (localStorage.getItem("copy_active_view") as "classic" | "ide") || "classic"
  );

  const handleViewChange = (view: "classic" | "ide") => {
    setActiveView(view);
    localStorage.setItem("copy_active_view", view);
  };

  return (
    <div className="flex h-screen bg-[var(--color-surface)] selection:bg-[var(--color-brand)]/30 overflow-hidden font-inter">
      {/* Sidebar */}
      {isSidebarOpen && (
        <Sidebar
          onSettingsChange={setSettings}
          activeView={activeView}
          onViewChange={handleViewChange}
        />
      )}

      {/* Main Content Area */}
      {activeView === "classic" ? (
        <ClassicChat
          settings={settings}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      ) : (
        <VisualIDE
          settings={settings}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      )}
    </div>
  );
}

export default App;
