import {
  BrowserRouter,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import { ContextProvider } from "@os/core/context";

import { GlobalNav } from "@apps/todo/widgets/GlobalNav";
import TodoPage from "./pages/TodoPage";
import SettingsPage from "./pages/SettingsPage";
import FocusShowcasePage from "./pages/FocusShowcasePage";
import BuilderPage from "./pages/BuilderPage";
import DocsPage from "./pages/DocsPage";

import { OS } from "@os/ui";
import { TodoApp } from "@apps/todo/app";
import { CommandInspector } from "@os/debug/Inspector";
import { useEngine } from "@os/core/command/CommandContext";
import { useFocusBridge } from "@os/core/focus/focusBridge";
import type { AppState } from "@apps/todo/model/types";

// --- Internal Layout running inside OS.App ---
function AppContent() {
  useFocusBridge(); // Bidirectional focus sync
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
    <ContextProvider>
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
            <Route path="/docs/*" element={<DocsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ContextProvider>
  );
}
