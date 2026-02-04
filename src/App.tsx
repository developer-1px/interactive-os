import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";

import { GlobalNav } from "@apps/todo/widgets/GlobalNav";
import TodoPage from "./pages/TodoPage";
import SettingsPage from "./pages/SettingsPage";
import FocusShowcasePage from "./pages/FocusShowcasePage";
import FocusShowcasePage2 from "./pages/FocusShowcasePage2";
import BuilderPage from "./pages/BuilderPage";
import DocsPage from "./pages/DocsPage";

import { OS } from "@os/features/AntigravityOS";
import { TodoApp } from "@apps/todo/app";
import { CommandInspector } from "@os/app/debug/CommandInspector";
import { useEngine } from "@os/features/command/ui/CommandContext";
import type { AppState } from "@apps/todo/model/types";

// --- Internal Layout running inside OS.App ---
function AppContent() {
  const { state } = useEngine<AppState>();
  const isInspectorOpen = state?.ui?.isInspectorOpen;

  return (
    <div className="h-screen w-screen bg-[#0a0a0a] flex overflow-hidden font-sans text-slate-900 select-none">
      {/* 0. Global Activity Bar */}
      <GlobalNav />

      {/* Main App Container */}
      <div className="flex-1 flex min-w-0 h-full relative bg-white overflow-hidden">
        {/* Route Content (Sidebar + Main Panel, or Settings, etc.) */}
        <Outlet />
      </div>

      {/* Inspector (Separated from OS Core) */}
      {isInspectorOpen && (
        <aside className="h-full w-[600px] flex-shrink-0 overflow-hidden border-l border-white/10 shadow-2xl">
          <CommandInspector />
        </aside>
      )}
    </div>
  );
}

// --- App Shell (Bootstrapper) ---
function AppShell() {
  return (
    <OS.App definition={TodoApp}>
      <AppContent />
    </OS.App>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
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
          <Route path="/builder" element={<BuilderPage />} />
          <Route path="/focus-showcase" element={<FocusShowcasePage />} />
          <Route path="/focus-showcase-2" element={<FocusShowcasePage2 />} />
          <Route path="/docs/*" element={<DocsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
