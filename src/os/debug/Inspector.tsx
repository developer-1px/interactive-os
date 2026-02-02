import { useState, useEffect, useMemo } from "react";
import { useCommandEngine } from "@os/core/command/CommandContext";
import { getCanonicalKey } from "@os/core/input/keybinding";
import { KeyMonitor } from "@os/debug/inspector/KeyMonitor";
import type { KeyLog } from "@os/debug/inspector/KeyMonitor";
import { StateMonitor } from "@os/debug/inspector/StateMonitor";
import { RegistryMonitor } from "@os/debug/inspector/RegistryMonitor";
import { EventStream } from "@os/debug/inspector/EventStream";
import { DataStateViewer } from "@os/debug/inspector/DataStateViewer";

// --- Main Component ---

export function CommandInspector() {
  const { state, ctx, activeKeybindingMap, providerValue } = useCommandEngine() as any;
  // Cast to any for Inspector because it needs to inspect *Runtime* state which is generic.
  // Ideally we would have a 'DevToolsContext' but for now this unblocks the dependency.

  const [rawKeys, setRawKeys] = useState<KeyLog[]>([]);
  const [physicalZone, setPhysicalZone] = useState<string | null>("NONE");
  const [isInputActive, setIsInputActive] = useState(false);

  // Optimize Context for Registry:
  // We strip out volatile fields that don't affect command availability (like editDraft/draft text)
  // to prevent RegistryMonitor from re-rendering on every keystroke.
  const registryContext = useMemo(() => {
    if (!ctx) return {};
    const { editDraft, draft, ...stablePart } = ctx as any;
    return stablePart;
  }, [ctx]);

  const historyCount = state?.history?.past?.length || 0;
  const lastEntry =
    historyCount > 0 ? state.history.past[historyCount - 1] : null;
  const lastCommandId = lastEntry ? lastEntry.command.type : null;

  // Safe access to focusId (which is managed by OS/Store now, but we get current from providerValue or state)
  // providerValue.currentFocusId is what we want
  const currentFocusId = providerValue?.currentFocusId;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      setRawKeys((prev) =>
        [
          {
            key: getCanonicalKey(e),
            code: e.code,
            timestamp: Date.now(),
          },
          ...prev,
        ].slice(0, 3),
      );
    };
    const trackFocus = () => {
      const el = document.activeElement;
      const zone = el ? el.closest("[data-zone-id]") : null;
      setPhysicalZone(zone ? zone.getAttribute("data-zone-id") : "NONE");

      // Detect native input focus
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.getAttribute("contenteditable") === "true")
      ) {
        setIsInputActive(true);
      } else {
        setIsInputActive(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", trackFocus);
    document.addEventListener("focusout", trackFocus); // Also track blur/focusout

    // Initial check
    trackFocus();

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", trackFocus);
      document.removeEventListener("focusout", trackFocus);
    };
  }, []);

  if (!state) return <div className="p-4 text-white">Inspector Waiting for Engine...</div>;

  return (
    <div className="w-[640px] h-screen bg-slate-900/90 border-l border-white/10 flex flex-col shadow-[[-20px_0_50px_rgba(0,0,0,0.3)]] backdrop-blur-3xl overflow-hidden font-mono select-none flex-shrink-0 z-50 transition-all duration-300">
      {/* Header */}
      <div className="p-3 border-b border-white/5 bg-white/[0.02] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)] transition-colors duration-300 ${isInputActive ? "bg-pink-500 shadow-[0_0_8px_rgba(236,72,153,0.6)]" : "bg-indigo-500"}`}
          />
          <span className="text-[10px] font-black tracking-tighter text-white uppercase opacity-80">
            {isInputActive ? "Input Mode" : "System Inspector"}
          </span>
        </div>
        <div className="px-1.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[8px] text-indigo-400 font-bold uppercase">
          v2.5-modular
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Input & Logic */}
        <div className="w-1/2 flex flex-col overflow-auto custom-scrollbar border-r border-white/10">
          <KeyMonitor rawKeys={rawKeys} />
          <StateMonitor
            focusId={currentFocusId}
            activeZone={(ctx as any)?.activeZone}
            physicalZone={physicalZone || "NONE"}
            isInputActive={isInputActive}
          />
          <RegistryMonitor
            ctx={registryContext}
            registry={(providerValue as any)?.registry}
            activeKeybindingMap={activeKeybindingMap}
            isInputActive={isInputActive}
            lastCommandId={lastCommandId}
            historyCount={historyCount}
          />
          <EventStream history={state.history?.past || []} />
        </div>

        {/* Right Column: State Tree */}
        <div className="w-1/2 flex flex-col overflow-hidden">
          <DataStateViewer state={state.data} />
        </div>
      </div>

      {/* Sticky Footer Status */}
      <div className="p-2 border-t border-white/5 bg-black/40 flex items-center justify-between px-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[7px] text-slate-600 uppercase font-black tracking-widest">
              Buffer Status
            </span>
            <span className="text-[9px] text-emerald-500 font-bold">
              READY_STREAM
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[7px] text-slate-600 uppercase font-black block">
            Memory Usage
          </span>
          <span className="text-[9px] text-slate-400 font-bold tabular-nums">
            OPTIMIZED
          </span>
        </div>
      </div>
    </div>
  );
}
