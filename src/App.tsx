import { ContextProvider } from './lib/context'
import { useTodoEngine } from './lib/todo_engine'
import { CommandInspector } from './components/CommandInspector'
import { Sidebar } from './components/Sidebar'
import { TodoPanel } from './components/TodoPanel'

// --- 1. Main Component ---
function TodoApp() {
  // App is now a perfectly Pure View.
  // We call the engine hook to initialize the system and register the singleton.
  useTodoEngine();

  return (
    <div className="h-screen w-screen bg-slate-950 flex overflow-hidden font-sans text-slate-200 select-none">


      {/* 1. Category Navigation (Isolated Component) */}
      <Sidebar />

      {/* 2. Main Work Area (Isolated Component) */}
      <TodoPanel />

      {/* 3. Global System Inspector */}
      <CommandInspector />
    </div>
  )
}

export default function App() {
  return (
    <ContextProvider>
      <TodoApp />
    </ContextProvider>
  )
}
