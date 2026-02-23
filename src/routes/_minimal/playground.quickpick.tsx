import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  QuickPick,
  type QuickPickItem,
} from "@/os/6-components/quickpick/QuickPick";

export const Route = createFileRoute("/_minimal/playground/quickpick")({
  component: QuickPickPage,
});

function QuickPickPage() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<QuickPickItem | null>(null);
  const [activeSet, setActiveSet] = useState<QuickPickItem[]>(DEMO_ITEMS);
  const [mode, setMode] = useState("Files");

  const openWith = (name: string, items: QuickPickItem[]) => {
    setMode(name);
    setActiveSet(items);
    setOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 font-sans">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            OS QuickPick
          </h1>
          <p className="text-lg text-gray-500">
            A high-performance, virtual-focused command palette primitive.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <span className="text-sm font-medium text-gray-600">
              Try keyboard shortcut:
            </span>
            <div className="flex gap-2">
              <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-sm font-mono shadow-sm">
                Cmd
              </kbd>
              <span className="text-gray-400">+</span>
              <kbd className="px-2 py-1 bg-white border border-gray-200 rounded text-sm font-mono shadow-sm">
                K
              </kbd>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => openWith("Files", DEMO_ITEMS)}
              className="flex flex-col items-center p-6 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 hover:shadow-md transition-all group"
            >
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                📂
              </span>
              <span className="font-semibold text-gray-700 group-hover:text-indigo-700">
                File Picker
              </span>
              <span className="text-xs text-gray-400 mt-1">Open files...</span>
            </button>

            <button
              type="button"
              onClick={() => openWith("Themes", THEME_ITEMS)}
              className="flex flex-col items-center p-6 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50 hover:shadow-md transition-all group"
            >
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                🎨
              </span>
              <span className="font-semibold text-gray-700 group-hover:text-indigo-700">
                Theme Switcher
              </span>
              <span className="text-xs text-gray-400 mt-1">
                Change visual style...
              </span>
            </button>
          </div>

          {selected && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 p-4 rounded-xl bg-green-50 border border-green-100 text-green-800 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-lg">
                {selected.icon || "✓"}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-green-600/70">
                  Last Action
                </p>
                <p className="font-medium">
                  Selected: <span className="font-bold">{selected.label}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="ml-auto text-green-400 hover:text-green-600"
              >
                ✕
              </button>
            </div>
          )}
        </div>

        <div className="text-center text-xs text-gray-400">
          Powered by Interactive OS Kernel • virtualFocus Enabled
        </div>
      </div>

      <QuickPick
        id="quickpick-demo"
        isOpen={open}
        onClose={() => setOpen(false)}
        items={activeSet}
        onSelect={(item) => {
          setSelected(item);
          setOpen(false);
        }}
        placeholder={`Search ${mode}...`}
        typeahead
      />
    </div>
  );
}

const DEMO_ITEMS: QuickPickItem[] = [
  { id: "1", label: "App.tsx", description: "src/App.tsx", icon: "⚛️" },
  { id: "2", label: "index.tsx", description: "src/index.tsx", icon: "📄" },
  { id: "3", label: "styles.css", description: "src/styles.css", icon: "🎨" },
  {
    id: "4",
    label: "package.json",
    description: "Root configuration",
    icon: "📦",
  },
  { id: "5", label: "README.md", description: "Documentation", icon: "📝" },
  {
    id: "6",
    label: "tsconfig.json",
    description: "TypeScript Config",
    icon: "🔧",
  },
];

const THEME_ITEMS: QuickPickItem[] = [
  {
    id: "light",
    label: "Light Mode",
    description: "Default bright appearance",
    icon: "☀️",
  },
  {
    id: "dark",
    label: "Dark Mode",
    description: "Easy on the eyes",
    icon: "🌙",
  },
  {
    id: "system",
    label: "System Default",
    description: "Follow OS settings",
    icon: "💻",
  },
  {
    id: "sepia",
    label: "Sepia",
    description: "Warm tones for reading",
    icon: "📖",
  },
];
