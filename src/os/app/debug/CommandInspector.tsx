import { useState, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useCommandEngine } from "@os/features/command/ui/CommandContext.tsx";
import { useFocusRegistry } from "@os/features/focus/registry/FocusRegistry";
import { useInspectorStore } from "@os/features/inspector/InspectorStore"; // [NEW] Subscription
import { useCommandTelemetryStore } from "@os/features/command/store/CommandTelemetryStore";
import { evalContext } from "@os/features/logic/lib/evalContext";
import { KeyMonitor } from "@os/app/debug/inspector/KeyMonitor.tsx";
import { StateMonitor } from "@os/app/debug/inspector/StateMonitor.tsx";
import { RegistryMonitor } from "@os/app/debug/inspector/RegistryMonitor.tsx";
import { EventStream } from "@os/app/debug/inspector/EventStream.tsx";
import { DataStateViewer } from "@os/app/debug/inspector/DataStateViewer.tsx";
import { OSStateViewer } from "@os/app/debug/inspector/OSStateViewer.tsx";
import { useInputTelemetry } from "@os/app/debug/LoggedKey.ts";

// --- Main Component ---

// --- Main Component ---

export function CommandInspector() {
  const contextValue = useCommandEngine() as any;
  const { state, registry, contextMap } = contextValue;

  // v7.50: Use global InspectorStore for tab state
  const activeTab = useInspectorStore(s => s.activeTab);

  // --- Direct Zustand subscriptions (no React Context middleman) ---
  const activeGroupId = useFocusRegistry((s) => s.activeGroupId);
  const groups = useFocusRegistry((s) => s.groups);

  const focusPath = useFocusRegistry(
    useShallow((s) => {
      if (!s.activeGroupId) return [];
      const path: string[] = [];
      let currentId: string | null = s.activeGroupId;
      while (currentId) {
        path.unshift(currentId);
        const entry = s.groups.get(currentId);
        currentId = entry?.parentId || null;
        if (path.length > 100) break;
      }
      return path;
    })
  );

  const activeGroupStore = activeGroupId ? groups.get(activeGroupId)?.store : null;
  const focusedItemId = activeGroupStore?.getState().focusedItemId ?? null;

  // Build ctx on-demand
  const ctx = useMemo(() => {
    const baseContext = {
      activeZone: activeGroupId ?? undefined,
      focusPath,
      focusedItemId,
    };
    if (contextMap && state !== undefined) {
      return {
        ...baseContext,
        ...contextMap(state, {
          activeGroupId: activeGroupId || null,
          focusPath,
          focusedItemId: focusedItemId || null,
        })
      };
    }
    return baseContext;
  }, [activeGroupId, focusPath, focusedItemId, state, contextMap]);

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

  // Optimize Context for Registry
  const registryContext = useMemo(() => {
    if (!ctx) return {};
    const { editDraft, draft, ...stablePart } = ctx as any;
    return stablePart;
  }, [ctx]);

  // Global telemetry for RegistryMonitor flash pattern
  const telemetryEntries = useCommandTelemetryStore(s => s.entries);
  const historyCount = telemetryEntries.length;
  const lastEntry = historyCount > 0 ? telemetryEntries[historyCount - 1] : null;
  const lastCommandId = lastEntry ? lastEntry.command : null;
  const lastPayload = lastEntry?.payload ?? null;
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

  if (!state) return <div className="p-4 text-slate-500 text-xs">Inspector Waiting for Engine...</div>;

  const renderContent = () => {
    switch (activeTab) {
      case 'REGISTRY':
        return (
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
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
        );
      case 'STATE':
        return (
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {/* Panel 1: History (min 3 visible) */}
            <div className="shrink-0 max-h-[270px] overflow-y-auto">
              <EventStream />
            </div>
            {/* Panel 2: Data State */}
            <div className="flex-1 overflow-hidden border-t border-[#e5e5e5]">
              <DataStateViewer state={state.data} />
            </div>
          </div>
        );
      case 'EVENTS':
        return (
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <EventStream />
          </div>
        );
      case 'SETTINGS':
        return (
          <div className="flex-1 flex flex-col overflow-hidden bg-white p-4">
            <div className="text-xs font-bold text-slate-500 mb-2">OS SETTINGS</div>
            <OSStateViewer />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-full bg-[#ffffff] flex flex-col overflow-hidden font-sans text-[#333333]">
      {/* Header */}
      <div className="h-9 px-3 border-b border-[#e5e5e5] bg-[#f8f8f8] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div
            className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${isInputActive ? "bg-[#f48771] shadow-[0_0_8px_#f48771]" : "bg-[#007acc] shadow-[0_0_8px_#007acc]"}`}
          />
          <span className="text-[10px] font-bold tracking-wide text-[#666] uppercase">
            {activeTab} MONITOR
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-1.5 py-0.5 rounded bg-[#ffffff] text-[8px] text-[#aaaaaa] font-mono leading-none border border-[#e5e5e5]">
            v7.50
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {renderContent()}
      </div>

      {/* Footer */}
      <div className="h-6 px-3 border-t border-[#e5e5e5] bg-[#f8f8f8] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-[9px] text-slate-400 font-mono">
          <span>{physicalZone}</span>
          <span className="text-slate-300">|</span>
          <span className={isInputActive ? 'text-red-400' : 'text-slate-400'}>{isInputActive ? 'INPUT_LOCK' : 'NAV_MODE'}</span>
        </div>
      </div>
    </div>
  );
}

