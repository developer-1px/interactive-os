import { useState, useEffect, useMemo } from "react";
import { useCommandEngine } from "@os/features/command/ui/CommandContext.tsx";
import { KeyMonitor } from "@os/app/debug/inspector/KeyMonitor.tsx";
import { StateMonitor } from "@os/app/debug/inspector/StateMonitor.tsx";
import { RegistryMonitor } from "@os/app/debug/inspector/RegistryMonitor.tsx";
import { EventStream } from "@os/app/debug/inspector/EventStream.tsx";
import { DataStateViewer } from "@os/app/debug/inspector/DataStateViewer.tsx";
import { OSStateViewer } from "@os/app/debug/inspector/OSStateViewer.tsx";
import { useInputTelemetry } from "@os/app/debug/inputTelemetry.ts";

// --- Main Component ---

export function CommandInspector() {
  const contextValue = useCommandEngine() as any;
  const { state, ctx, activeKeybindingMap, registry } = contextValue;
  // Cast to any for Inspector because it needs to inspect *Runtime* state which is generic.
  // Ideally we would have a 'DevToolsContext' but for now this unblocks the dependency.

  const [physicalZone, setPhysicalZone] = useState<string | null>("NONE");
  const [isInputActive, setIsInputActive] = useState(false);
  const [activeTab, setActiveTab] = useState<"DATA" | "OS">(() => {
    return (localStorage.getItem("antigravity_inspector_tab") as "DATA" | "OS") || "DATA";
  });

  useEffect(() => {
    localStorage.setItem("antigravity_inspector_tab", activeTab);
  }, [activeTab]);

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
  const lastPayload = lastEntry && "payload" in lastEntry.command ? lastEntry.command.payload : null;

  // Safe access to focusId (which is managed by OS/Store now, but we get current from providerValue or state)
  // providerValue.currentFocusId is what we want
  const currentFocusId = contextValue?.currentFocusId;

  // Input Telemetry (Global)
  // We strictly use the OS-level telemetry now.
  const rawKeys = useInputTelemetry((state) => state.logs);

  useEffect(() => {
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

    document.addEventListener("focusin", trackFocus);
    document.addEventListener("focusout", trackFocus); // Also track blur/focusout

    // Initial check
    trackFocus();

    return () => {
      document.removeEventListener("focusin", trackFocus);
      document.removeEventListener("focusout", trackFocus);
    };
  }, []);

  if (!state) return <div className="p-4 text-white">Inspector Waiting for Engine...</div>;

  return (
    <div className="w-full h-full bg-[#ffffff] flex flex-col shadow-2xl overflow-hidden font-sans select-none z-50 text-[#333333] border-l border-[#e5e5e5]">
      {/* Header */}
      <div className="h-6 px-3 border-b border-[#e5e5e5] bg-[#f8f8f8] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div
            className={`w-1 h-1 rounded-full transition-all duration-500 ${isInputActive ? "bg-[#f48771] shadow-[0_0_8px_#f48771]" : "bg-[#007acc] shadow-[0_0_8px_#007acc]"}`}
          />
          <span className="text-[9px] font-black tracking-widest text-[#999] uppercase italic leading-none">
            {isInputActive ? "Signal Lock" : "Antigravity Inspector"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-1 py-0.5 rounded bg-[#ffffff] text-[7px] text-[#aaaaaa] font-mono leading-none border border-[#e5e5e5]">
            v3.5
          </div>
        </div>
      </div>


      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Logic & Telemetry */}
        <div className="w-1/2 flex flex-col overflow-auto border-r border-[#e5e5e5] bg-[#ffffff] custom-scrollbar">
          <KeyMonitor rawKeys={rawKeys} />
          <StateMonitor
            focusId={currentFocusId}
            activeZone={(ctx as any)?.activeZone}
            focusPath={(ctx as any)?.focusPath}
            physicalZone={physicalZone || "NONE"}
            isInputActive={isInputActive}
          />
          <RegistryMonitor
            ctx={registryContext}
            registry={registry}
            activeKeybindingMap={activeKeybindingMap}
            isInputActive={isInputActive}
            lastCommandId={lastCommandId}
            lastPayload={lastPayload}
            historyCount={historyCount}
          />
        </div>

        {/* Right Column: Split Layout */}
        <div className="w-1/2 flex flex-col overflow-hidden bg-[#fafafa]">

          {/* Top: Fixed Event Stream (approx 3 items) */}
          <div className="h-[95px] flex-shrink-0 border-b border-[#e5e5e5] bg-[#ffffff] overflow-hidden flex flex-col">
            <EventStream history={state.history?.past || []} />
          </div>

          {/* Bottom: Tabs */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tab Header */}
            <div className="flex items-center bg-[#f3f3f3] h-6 border-b border-[#e5e5e5] flex-shrink-0">
              <button
                onClick={() => setActiveTab("DATA")}
                className={`h-full px-3 text-[9px] font-black uppercase tracking-widest transition-colors relative ${activeTab === "DATA"
                  ? "text-[#007acc] bg-[#ffffff] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-[#007acc]"
                  : "text-[#999999] hover:text-[#666666] hover:bg-[#ececec]"
                  }`}
              >
                Data
              </button>
              <button
                onClick={() => setActiveTab("OS")}
                className={`h-full px-3 text-[10px] font-black uppercase tracking-widest transition-colors relative ${activeTab === "OS"
                  ? "text-[#4ec9b0] bg-[#ffffff] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#4ec9b0]"
                  : "text-[#999999] hover:text-[#666666] hover:bg-[#ececec]"
                  }`}
              >
                OS
              </button>
            </div>

            <div className="flex-1 overflow-hidden relative">
              {activeTab === "DATA" ? (
                <DataStateViewer state={state.data} />
              ) : (
                <OSStateViewer />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Footer Status */}
      <div className="h-4 px-3 border-t border-[#e5e5e5] bg-[#f3f3f3] flex items-center justify-between flex-shrink-0 text-[#999]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[7px] font-black opacity-50 uppercase tracking-widest">
              STATE
            </span>
            <span className="text-[9px] uppercase font-bold text-[#666]">
              Live
            </span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-[#e5e5e5] pl-4">
            <span className="text-[8px] font-black opacity-50 uppercase tracking-widest">
              BUFFER
            </span>
            <span className="text-[9px] uppercase font-bold text-[#007acc]">
              Locked
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[8px] font-black opacity-50 uppercase tracking-widest">
            ENGINE
          </span>
          <span className="text-[9px] uppercase font-mono font-black text-[#4ec9b0]">
            V8-ZUSTAND
          </span>
        </div>
      </div>
    </div>
  );
}

