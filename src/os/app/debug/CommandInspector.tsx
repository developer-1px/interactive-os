import { useState, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useCommandEngine } from "@os/features/command/ui/CommandContext.tsx";
import { useFocusRegistry } from "@os/features/focus/registry/FocusRegistry";
import { evalContext } from "@os/features/logic/lib/evalContext";
import { KeyMonitor } from "@os/app/debug/inspector/KeyMonitor.tsx";
import { StateMonitor } from "@os/app/debug/inspector/StateMonitor.tsx";
import { RegistryMonitor } from "@os/app/debug/inspector/RegistryMonitor.tsx";
import { EventStream } from "@os/app/debug/inspector/EventStream.tsx";
import { DataStateViewer } from "@os/app/debug/inspector/DataStateViewer.tsx";
import { OSStateViewer } from "@os/app/debug/inspector/OSStateViewer.tsx";
import { useInputTelemetry } from "@os/app/debug/LoggedKey.ts";

// --- Main Component ---

export function CommandInspector() {
  const contextValue = useCommandEngine() as any;
  const { state, registry, contextMap } = contextValue;

  // --- Direct Zustand subscriptions (no React Context middleman) ---
  const activeZoneId = useFocusRegistry((s) => s.activeZoneId);
  const zones = useFocusRegistry((s) => s.zones);

  const focusPath = useFocusRegistry(
    useShallow((s) => {
      if (!s.activeZoneId) return [];
      const path: string[] = [];
      let currentId: string | null = s.activeZoneId;
      while (currentId) {
        path.unshift(currentId);
        const entry = s.zones.get(currentId);
        currentId = entry?.parentId || null;
        if (path.length > 100) break;
      }
      return path;
    })
  );

  const activeZoneStore = activeZoneId ? zones.get(activeZoneId)?.store : null;
  const focusedItemId = activeZoneStore?.getState().focusedItemId ?? null;

  // Build ctx on-demand
  const ctx = useMemo(() => {
    const baseContext = {
      activeZone: activeZoneId ?? undefined,
      focusPath,
      focusedItemId,
    };
    if (contextMap && state !== undefined) {
      return {
        ...baseContext,
        ...contextMap(state, {
          activeZoneId: activeZoneId || null,
          focusPath,
          focusedItemId: focusedItemId || null,
        })
      };
    }
    return baseContext;
  }, [activeZoneId, focusPath, focusedItemId, state, contextMap]);

  // Build activeKeybindingMap on-demand
  const keybindings = useMemo(() => registry?.getKeybindings() || [], [registry]);
  const activeKeybindingMap = useMemo(() => {
    const res = new Map<string, boolean>();
    keybindings.forEach((kb: any) => {
      const isLogicEnabled = evalContext(kb.when, ctx);
      const isScopeEnabled = !kb.zoneId || focusPath.includes(kb.zoneId);
      res.set(kb.key, !!(isLogicEnabled && isScopeEnabled));
    });
    return res;
  }, [keybindings, ctx, focusPath]);

  // --- UI State ---
  const [physicalZone, setPhysicalZone] = useState<string | null>("NONE");
  const [isInputActive, setIsInputActive] = useState(false);
  const [activeTab, setActiveTab] = useState<"DATA" | "OS">(() => {
    return (localStorage.getItem("antigravity_inspector_tab") as "DATA" | "OS") || "DATA";
  });

  useEffect(() => {
    localStorage.setItem("antigravity_inspector_tab", activeTab);
  }, [activeTab]);

  // Optimize Context for Registry
  const registryContext = useMemo(() => {
    if (!ctx) return {};
    const { editDraft, draft, ...stablePart } = ctx as any;
    return stablePart;
  }, [ctx]);

  const historyCount = state?.history?.past?.length || 0;
  const lastEntry = historyCount > 0 ? state.history.past[historyCount - 1] : null;
  const lastCommandId = lastEntry ? lastEntry.command.type : null;
  const lastPayload = lastEntry && "payload" in lastEntry.command ? lastEntry.command.payload : null;
  const currentFocusId = focusedItemId;
  const rawKeys = useInputTelemetry((s) => s.logs);

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
    <div className="w-full h-full bg-[#ffffff] flex flex-col shadow-2xl overflow-hidden font-sans z-50 text-[#333333] border-l border-[#e5e5e5]">
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
            focusId={currentFocusId ?? undefined}
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

