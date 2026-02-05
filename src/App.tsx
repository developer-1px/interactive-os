import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";

import { GlobalNav } from "@apps/todo/widgets/GlobalNav";
import TodoPage from "./pages/TodoPage";
import SettingsPage from "./pages/SettingsPage";
import FocusShowcasePage from "./pages/focus-showcase";
import AriaShowcasePage from "./pages/aria-showcase";
import BuilderPage from "./pages/BuilderPage";
import DocsPage from "./pages/DocsPage";

import { OS } from "@os/features/AntigravityOS";
import { TodoApp } from "@apps/todo/app";
import { CommandInspector } from "@os/app/debug/CommandInspector";
import { useEngine } from "@os/features/command/ui/CommandContext";
import type { AppState } from "@apps/todo/model/types";

// --- Internal Layout running inside OS.App ---

function AppContent({ isAppShell }: { isAppShell: boolean }) {
  const { state } = useEngine<AppState>();
  const isInspectorOpen = state?.ui?.isInspectorOpen;

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
        <div className={isAppShell ? "flex-1 overflow-y-auto overflow-x-hidden" : "flex-1"}>
          <Outlet />
        </div>
      </div>

      {/* Inspector (Separated from OS Core) */}
      {isInspectorOpen && (
        <aside className="h-full w-[600px] flex-shrink-0 overflow-hidden border-l border-white/10 shadow-2xl sticky top-0">
          <CommandInspector />
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
