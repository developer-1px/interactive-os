import { createFileRoute } from "@tanstack/react-router";
import { Keyboard, MousePointer2, Play, RotateCcw, Type } from "lucide-react";
import { useRef, useState } from "react";

// -----------------------------------------------------------------------------
// Route Definition
// -----------------------------------------------------------------------------

export const Route = createFileRoute("/playground/design-testbot-cursor")({
  component: TestBotCursorDesignInfo,
  staticData: {
    title: "TestBot Design",
    icon: MousePointer2,
  },
});

// -----------------------------------------------------------------------------
// Types & Interfaces
// -----------------------------------------------------------------------------

type CursorPosition = { x: number; y: number };

type KeyPress = {
  id: string;
  key: string; // e.g., 'Enter', 'Ctrl+C'
  timestamp: number;
};

type BotAction =
  | { type: "move"; x: number; y: number; duration?: number }
  | { type: "click" }
  | { type: "type"; text: string }
  | { type: "press"; key: string }
  | { type: "wait"; ms: number };

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

function TestBotCursorDesignInfo() {
  const [cursorPos, setCursorPos] = useState<CursorPosition>({ x: 50, y: 50 });
  const [isClicking, setIsClicking] = useState(false);
  const [activeKeys, setActiveKeys] = useState<KeyPress[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Refs for animation
  const containerRef = useRef<HTMLDivElement>(null);

  // Helper to add logs
  const addLog = (msg: string) => {
    setLogs((prev) => [msg, ...prev].slice(0, 5));
  };

  // Helper to trigger key press visualization
  const triggerKey = (key: string) => {
    const id = Math.random().toString(36).slice(2, 9);
    setActiveKeys((prev) => [...prev, { id, key, timestamp: Date.now() }]);
    setTimeout(() => {
      setActiveKeys((prev) => prev.filter((k) => k.id !== id));
    }, 2000); // Remove after 2s
  };

  // Helper to run sequence
  const runSequence = async (sequence: BotAction[]) => {
    if (isPlaying) return;
    setIsPlaying(true);
    addLog("Starting sequence...");

    for (const action of sequence) {
      if (!containerRef.current) break;

      switch (action.type) {
        case "move":
          // In a real bot, we'd interpolate. Here we use CSS transition for simplicity,
          // but we update state.
          // Coordinates are 0-100 percentages for this demo
          addLog(`Show cursor moving to ${action.x}%, ${action.y}%`);
          setCursorPos({ x: action.x, y: action.y });
          await new Promise((r) => setTimeout(r, action.duration || 500));
          break;

        case "click":
          addLog("Click event triggered");
          setIsClicking(true);
          await new Promise((r) => setTimeout(r, 150));
          setIsClicking(false);
          await new Promise((r) => setTimeout(r, 100));
          break;

        case "type":
          addLog(`Typing "${action.text}"`);
          for (const char of action.text.split("")) {
            triggerKey(char);
            await new Promise((r) => setTimeout(r, 100 + Math.random() * 50));
          }
          break;

        case "press":
          addLog(`Pressing key "${action.key}"`);
          triggerKey(action.key);
          await new Promise((r) => setTimeout(r, 300));
          break;

        case "wait":
          await new Promise((r) => setTimeout(r, action.ms));
          break;
      }
    }

    setIsPlaying(false);
    addLog("Sequence complete.");
  };

  // Demo Scenarios
  const demoFormFill = [
    { type: "move", x: 20, y: 30, duration: 800 }, // Move to input
    { type: "click" },
    { type: "type", text: "Hello World" },
    { type: "wait", ms: 500 },
    { type: "move", x: 20, y: 50, duration: 600 }, // Move to checkbox
    { type: "click" },
    { type: "wait", ms: 500 },
    { type: "move", x: 80, y: 80, duration: 1000 }, // Move to submit
    { type: "click" },
  ] as BotAction[];

  const demoShortcuts = [
    { type: "move", x: 50, y: 50, duration: 500 },
    { type: "press", key: "⌘ + K" },
    { type: "wait", ms: 800 },
    { type: "type", text: "> reload" },
    { type: "wait", ms: 500 },
    { type: "press", key: "Enter" },
  ] as BotAction[];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* 1. Header / Toolbar */}
      <header className="px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-indigo-200 shadow-lg">
            <MousePointer2 size={16} fill="currentColor" />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-sm tracking-tight">
              TestBot Visualizer
            </h1>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
              Design Prototype
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => runSequence(demoFormFill)}
            disabled={isPlaying}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm transition-all disabled:opacity-50"
          >
            <Play size={12} />
            Run Form Demo
          </button>
          <button
            type="button"
            onClick={() => runSequence(demoShortcuts)}
            disabled={isPlaying}
            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-xs font-medium text-slate-600 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm transition-all disabled:opacity-50"
          >
            <Keyboard size={12} />
            Run Shortcuts
          </button>
          <button
            type="button"
            onClick={() => {
              setLogs([]);
              setActiveKeys([]);
            }}
            className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </header>

      {/* 2. Main Canvas */}
      <main className="flex-1 p-6 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Grid Pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(#4f46e5 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        />

        {/* The "Screen" we are automating */}
        <div
          ref={containerRef}
          className="w-full max-w-4xl aspect-video bg-white rounded-xl shadow-2xl border border-slate-200/60 relative overflow-hidden group select-none"
        >
          {/* Mock UI Content */}
          <div className="absolute inset-0 p-8 flex flex-col gap-6 pointer-events-none">
            <div className="h-4 w-1/3 bg-slate-100 rounded mb-4" />

            {/* Input Target */}
            <div
              className="border border-slate-200 rounded-lg p-3 bg-slate-50 w-2/3 flex items-center gap-2"
              style={{ position: "absolute", left: "15%", top: "25%" }}
            >
              <Type size={14} className="text-slate-400" />
              <div className="h-2 w-20 bg-slate-200 rounded" />
            </div>

            {/* Checkbox Target */}
            <div
              className="flex items-center gap-3"
              style={{ position: "absolute", left: "15%", top: "45%" }}
            >
              <div className="w-5 h-5 rounded border border-slate-300 bg-white" />
              <div className="h-2 w-32 bg-slate-200 rounded" />
            </div>

            {/* Button Target */}
            <div
              className="px-6 py-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-200 text-white text-sm font-semibold flex items-center gap-2"
              style={{ position: "absolute", left: "75%", top: "75%" }}
            >
              Submit Action
            </div>

            {/* Random blocks */}
            <div className="absolute right-10 top-10 w-20 h-20 bg-slate-50 rounded-lg border border-slate-100" />
            <div className="absolute right-10 top-36 w-20 h-20 bg-slate-50 rounded-lg border border-slate-100" />
          </div>

          {/* 
            CURSOR LAYER 
            This is the core of the design.
          */}
          <div
            className="absolute z-50 pointer-events-none transition-all duration-[300ms] ease-[cubic-bezier(0.25,1,0.5,1)] will-change-transform"
            style={{
              left: `${cursorPos.x}%`,
              top: `${cursorPos.y}%`,
              transform: `translate(-50%, -50%) scale(${isClicking ? 0.9 : 1})`,
            }}
          >
            {/* The Mouse Pointer (premium SVG) */}
            <div className="relative">
              {/* Ripple Effect (when clicking) */}
              <div
                className={`absolute -inset-6 bg-indigo-500/30 rounded-full blur-sm transition-all duration-300 ${isClicking ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
              />
              <div
                className={`absolute -inset-10 border-2 border-indigo-500/20 rounded-full transition-all duration-500 ${isClicking ? "opacity-100 scale-100" : "opacity-0 scale-50"}`}
              />

              {/* Main Cursor Body */}
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                className={`transform transition-transform duration-100 ${isClicking ? "-rotate-12 translate-y-1" : "rotate-0"}`}
                style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.1))" }}
              >
                <path
                  d="M3.1 2.8C2.5 2.2 1.9 2.6 2.1 3.4L6.2 19.2C6.4 19.9 7.3 20.2 7.9 19.6L10.8 16.7L15.6 21.5C16.1 22.0 16.9 22.0 17.4 21.5L19.5 19.4C20.0 18.9 20.0 18.1 19.5 17.6L14.7 12.8L19.5 10.9C20.3 10.6 20.3 9.5 19.6 9.1L3.1 2.8Z"
                  fill="#4F46E5"
                  stroke="white"
                  strokeWidth="1.5"
                />
              </svg>

              {/* Optional Label (Wait/Action) */}
              {isClicking && (
                <div className="absolute left-6 top-6 bg-indigo-600 text-[10px] text-white px-1.5 py-0.5 rounded shadow-sm font-bold tracking-tight whitespace-nowrap animate-fade-in-up">
                  Click
                </div>
              )}
            </div>
          </div>

          {/* Key Press Visualizer Overlay (HUD) */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-2 pointer-events-none">
            {activeKeys.map((k) => (
              <div
                key={k.id}
                className="animate-key-pop bg-slate-900/90 backdrop-blur text-white px-3 py-2 rounded-lg shadow-xl border border-slate-700/50 font-mono text-sm font-bold min-w-[3rem] text-center flex items-center justify-center"
              >
                {k.key}
              </div>
            ))}
          </div>
        </div>

        {/* Info / Legend */}
        <div className="mt-8 flex gap-8 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            Active Cursor
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full ring-2 ring-indigo-200 bg-transparent" />
            Click Ripple
          </div>
          <div className="flex items-center gap-2">
            <div className="px-1 py-0.5 bg-slate-800 text-white rounded text-[10px]">
              K
            </div>
            Key HUD
          </div>
        </div>
      </main>

      {/* 3. Log Panel (Bottom Right or Sidebar) */}
      <div className="fixed bottom-4 right-4 w-64 bg-white/90 backdrop-blur border border-slate-200 rounded-lg shadow-lg p-3 font-mono text-[10px] text-slate-600">
        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
          <span className="font-bold text-slate-800">Event Log</span>
          <span className="text-slate-400">{logs.length} events</span>
        </div>
        <div className="flex flex-col gap-1.5 opacity-80">
          {logs.map((log, i) => (
            <div key={`${i}-${log}`} className="truncate animate-fade-in-left">
              <span className="text-indigo-500 mr-2">›</span>
              {log}
            </div>
          ))}
          {logs.length === 0 && (
            <span className="text-slate-400 italic">Waiting...</span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes key-pop {
          0% { transform: scale(0.9) translateY(10px); opacity: 0; }
          20% { transform: scale(1.1) translateY(0); opacity: 1; }
          100% { transform: scale(1) translateY(-20px); opacity: 0; }
        }
        .animate-key-pop {
          animation: key-pop 1.5s ease-out forwards;
        }
        @keyframes fade-in-up {
          from { transform: translateY(5px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.2s ease-out forwards;
        }
        @keyframes fade-in-left {
          from { transform: translateX(10px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        .animate-fade-in-left {
          animation: fade-in-left 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
