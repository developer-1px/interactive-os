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
import ShowcasePage from "./pages/ShowcasePage";
import DocsPage from "./pages/DocsPage";
import ExperimentPage from "./pages/ExperimentPage";

import { TodoAppShell } from "@apps/todo/TodoAppShell";

// --- Main Layout ---
function MainLayout() {
  return (
    <TodoAppShell>
      {/* 0. Global Activity Bar */}
      <GlobalNav />

      {/* Route Content (Sidebar + Main Panel, or Settings, etc.) */}
      <Outlet />
    </TodoAppShell>
  );
}

export default function App() {
  return (
    <ContextProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
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
            <Route path="/showcase" element={<ShowcasePage />} />
            <Route path="/experiment" element={<ExperimentPage />} />
            <Route path="/docs/*" element={<DocsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ContextProvider>
  );
}
