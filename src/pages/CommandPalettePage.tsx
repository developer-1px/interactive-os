/**
 * CommandPalettePage — Playground for Command Palette E2E testing
 *
 * This page exists to provide a route where command-palette e2e specs
 * can be registered with TestBot. The CommandPalette itself is rendered
 * globally in __root.tsx, so this page just provides context + trigger.
 */


import { OS_OVERLAY_OPEN } from "@/os/3-commands";
import { os } from "@/os/kernel";

export default function CommandPalettePage() {


  const openPalette = () => {
    os.dispatch(OS_OVERLAY_OPEN({ id: "command-palette", type: "dialog" }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
          Command Palette
        </h1>
        <p className="text-sm text-gray-500 mt-1 mb-6">
          ⌘K / Shift+Shift to open. E2E specs run via TestBot on this page.
        </p>

        <button
          type="button"
          onClick={openPalette}
          className="px-4 py-2 bg-zinc-800 text-white text-sm rounded-lg hover:bg-zinc-700 transition-colors shadow-sm flex items-center gap-2"
        >
          <span>Open Command Palette</span>
          <kbd className="text-xs bg-zinc-600 px-1.5 py-0.5 rounded">⌘K</kbd>
        </button>
      </div>
    </div>
  );
}
