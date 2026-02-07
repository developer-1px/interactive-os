import { KanbanApp } from "@apps/kanban/app";
import { TodoApp } from "@apps/todo/app";
import { GlobalNav } from "@apps/todo/widgets/GlobalNav";
import { InspectorShell } from "@os/app/debug/InspectorShell";
import { OS } from "@os/features/AntigravityOS";
import { useInspectorStore } from "@os/features/inspector/InspectorStore";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import AriaShowcasePage from "./pages/aria-showcase";
import BuilderPage from "./pages/BuilderPage";
import DocsPage from "./pages/DocsPage";
import FocusShowcasePage from "./pages/focus-showcase";
import KanbanPage from "./pages/KanbanPage";
import SettingsPage from "./pages/SettingsPage";
import TodoPage from "./pages/TodoPage";

// --- Internal Layout running inside OS.App ---

function AppContent({ isAppShell }: { isAppShell: boolean }) {
  // v7.50: Use independent InspectorStore (Zustand) instead of app state
  const isInspectorOpen = useInspectorStore((s) => s.isOpen);

  // AppShell = Fixed viewport (no scroll), Body = Scrollable
  const rootClass = isAppShell
    ? "h-screen w-screen bg-[#0a0a0a] flex overflow-hidden font-sans text-slate-900"
    : "min-h-screen w-screen bg-[#0a0a0a] flex font-sans text-slate-900 overflow-auto";

  const mainClass = isAppShell
    ? "flex-1 flex min-w-0 h-full relative bg-white overflow-hidden"
    : "flex-1 flex min-w-0 relative bg-white overflow-visible";

  return (
    <div className={rootClass}>
      {/* 0. Global Activity Bar */}
      <GlobalNav />

      {/* Main App Container */}
      <div className={mainClass}>
        {/* Route Content - Scrollable when AppShell */}
        <div
          className={
            isAppShell ? "flex-1 overflow-y-auto overflow-x-hidden" : "flex-1"
          }
        >
          <Outlet />
        </div>
      </div>

      {/* Inspector (Separated from OS Core) */}
      {isInspectorOpen && (
        <aside className="h-full flex-shrink-0 sticky top-0 z-50">
          <InspectorShell />
        </aside>
      )}
    </div>
  );
}

// --- Todo App Shell (with full keybindings) ---
function TodoAppShell() {
  return (
    <OS.App definition={TodoApp} isAppShell>
      <AppContent isAppShell={true} />
    </OS.App>
  );
}

// --- Kanban App Shell (with kanban keybindings) ---
function KanbanAppShell() {
  return (
    <OS.App definition={KanbanApp} isAppShell>
      <AppContent isAppShell={true} />
    </OS.App>
  );
}

// --- Minimal Shell (no app-specific keybindings) ---
function MinimalShell() {
  return (
    <OS.App isAppShell>
      <AppContent isAppShell={true} />
    </OS.App>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* OS.Root: Global infrastructure (InputEngine, FocusSensor, etc.) */}
      <OS.Root>
        <Routes>
          {/* Todo App routes - with full TodoApp keybindings */}
          <Route element={<TodoAppShell />}>
            <Route path="/" element={<TodoPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route
              path="/search"
              element={
                <div className="flex-1 flex items-center justify-center text-slate-500">
                  Search Placeholder
                </div>
              }
            />
            <Route
              path="/profile"
              element={
                <div className="flex-1 flex items-center justify-center text-slate-500">
                  Profile Placeholder
                </div>
              }
            />
          </Route>

          {/* Kanban App routes - with KanbanApp keybindings */}
          <Route element={<KanbanAppShell />}>
            <Route path="/kanban" element={<KanbanPage />} />
          </Route>

          {/* Standalone pages - no TodoApp keybindings */}
          <Route element={<MinimalShell />}>
            <Route path="/builder" element={<BuilderPage />} />
            <Route path="/focus-showcase" element={<FocusShowcasePage />} />
            <Route path="/aria-showcase" element={<AriaShowcasePage />} />
            <Route path="/docs/*" element={<DocsPage />} />
          </Route>
        </Routes>
      </OS.Root>
    </BrowserRouter>
  );
}
