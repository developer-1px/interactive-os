import { BrowserRouter, Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { ContextProvider } from './lib/context'
import { useTodoEngine } from './lib/todo_engine'
import { CommandInspector } from './components/CommandInspector'
import { GlobalNav } from './components/GlobalNav'
import TodoPage from './pages/TodoPage'
import SettingsPage from './pages/SettingsPage'
import ShowcasePage from './pages/ShowcasePage'
import DocsPage from './pages/DocsPage'

// --- Main Layout ---
function MainLayout() {
  // App is now a perfectly Pure View.
  // We call the engine hook to initialize the system and register the singleton.
  // This must run at the top level to keep the OS alive across route changes.
  useTodoEngine();

  const location = useLocation();

  return (
    <div className="h-screen w-screen bg-slate-950 flex overflow-hidden font-sans text-slate-200 select-none">
      {/* 0. Global Activity Bar */}
      <GlobalNav />

      {/* Route Content (Sidebar + Main Panel, or Settings, etc.) */}
      <Outlet />

      {/* 3. Global System Inspector */}
      {!location.pathname.startsWith('/docs') && <CommandInspector />}
    </div>
  )
}

export default function App() {
  return (
    <ContextProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<TodoPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/search" element={
              <div className="flex-1 flex items-center justify-center text-slate-500">Search Placeholder</div>
            } />
            <Route path="/profile" element={
              <div className="flex-1 flex items-center justify-center text-slate-500">Profile Placeholder</div>
            } />
            <Route path="/showcase" element={<ShowcasePage />} />
            <Route path="/docs/*" element={<DocsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ContextProvider>
  )
}
