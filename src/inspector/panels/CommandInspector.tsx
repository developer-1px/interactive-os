import { DataStateViewer } from "@inspector/panels/DataStateViewer.tsx";
import { ElementPanel } from "@inspector/panels/ElementPanel.tsx";
import { EventStream } from "@inspector/panels/EventStream.tsx";
import { InspectorAdapter } from "@inspector/panels/InspectorAdapter.tsx";
import { KeyMonitor } from "@inspector/panels/KeyMonitor.tsx";
import { useInputTelemetry } from "@inspector/panels/LoggedKey.ts";
import { OSStateViewer } from "@inspector/panels/OSStateViewer.tsx";
import { RegistryMonitor } from "@inspector/panels/RegistryMonitor.tsx";
import { StateMonitor } from "@inspector/panels/StateMonitor.tsx";
import { InspectorRegistry } from "@inspector/stores/InspectorRegistry.ts";
import { useInspectorStore } from "@inspector/stores/InspectorStore";
import { TestBotPanel } from "@inspector/testbot";
import { todoSlice } from "@apps/todo/app";

import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { kernel } from "@/os-new/kernel";

// --- Main Component ---

export function CommandInspector() {
  const state = todoSlice.getState() as any;

  // v7.50: Use global InspectorStore for tab state
  const activeTab = useInspectorStore((s) => s.activeTab);

  // --- Kernel state subscriptions ---
  const activeGroupId = kernel.useComputed(
    (s) => s.os.focus.activeZoneId,
  );

  const focusedItemId = kernel.useComputed(
    (s) => {
      const zoneId = s.os.focus.activeZoneId;
      return zoneId ? s.os.focus.zones[zoneId]?.focusedItemId ?? null : null;
    },
  );

  // Build ctx on-demand (simplified — no contextMap)
  const ctx = useMemo(() => ({
    activeZone: activeGroupId ?? undefined,
    focusPath: [] as string[],
    focusedItemId,
  }), [activeGroupId, focusedItemId]);

  // Keybinding map — empty for now (was powered by legacy CommandRegistry)
  const activeKeybindingMap = useMemo(() => new Map<string, boolean>(), []);

  // --- UI State ---
  const [physicalZone, setPhysicalZone] = useState<string | null>("NONE");
  const [isInputActive, setIsInputActive] = useState(false);

  // Optimize Context for Registry
  const registryContext = useMemo(() => {
    if (!ctx) return {};
    return ctx;
  }, [ctx]);

  // Telemetry from kernel transactions
  const transactions = kernel.getTransactions();
  const historyCount = transactions.length;
  const lastEntry = historyCount > 0 ? transactions[historyCount - 1] : null;
  const lastCommandId = lastEntry ? lastEntry.command?.type : null;
  const lastPayload = lastEntry?.command?.payload ?? null;
  const currentFocusId = focusedItemId;
  const rawKeys = useInputTelemetry((s) => s.logs);

  useEffect(() => {
    const trackFocus = () => {
      const el = document.activeElement;
      const zone = el ? el.closest("[data-zone-id]") : null;
      setPhysicalZone(zone ? zone.getAttribute("data-zone-id") : "NONE");

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
    document.addEventListener("focusout", trackFocus);
    trackFocus();

    return () => {
      document.removeEventListener("focusin", trackFocus);
      document.removeEventListener("focusout", trackFocus);
    };
  }, []);

  // --- Temporary: Register Unified Mock ---
  useEffect(() => {
    if (!InspectorRegistry.getPanel("UNIFIED")) {
      InspectorRegistry.register("UNIFIED", "Vision", <InspectorAdapter />);
    }
  }, []);

  if (!state)
    return (
      <div className="p-4 text-slate-500 text-xs">
        Inspector Waiting for Engine...
      </div>
    );

  const renderContent = () => {
    switch (activeTab) {
      case "ELEMENT":
        return <ElementPanel />;
      case "REGISTRY":
        return (
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <KeyMonitor rawKeys={rawKeys} />
            <StateMonitor
              focusId={currentFocusId ?? null}
              activeZone={(ctx as any)?.activeZone ?? ""}
              focusPath={(ctx as any)?.focusPath}
              physicalZone={physicalZone || "NONE"}
              isInputActive={isInputActive}
            />
            <RegistryMonitor
              ctx={registryContext}
              activeKeybindingMap={activeKeybindingMap}
              isInputActive={isInputActive}
              lastCommandId={lastCommandId}
              lastPayload={lastPayload}
              historyCount={historyCount}
            />
          </div>
        );
      case "STATE":
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
      case "SETTINGS":
        return (
          <div className="flex-1 flex flex-col overflow-hidden bg-white p-4">
            <div className="text-xs font-bold text-slate-500 mb-2">
              OS SETTINGS
            </div>
            <OSStateViewer />
          </div>
        );
      case "TESTBOT":
        return <TestBotPanel />;
      default: {
        const dynamicPanel = InspectorRegistry.getPanel(activeTab);
        if (dynamicPanel) return <>{dynamicPanel.content}</>;
        return null;
      }
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
      <div className="flex-1 flex overflow-hidden">{renderContent()}</div>

      {/* Footer */}
      <div className="h-6 px-3 border-t border-[#e5e5e5] bg-[#f8f8f8] flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 text-[9px] text-slate-400 font-mono">
          <span>{physicalZone}</span>
          <span className="text-slate-300">|</span>
          <span className={isInputActive ? "text-red-400" : "text-slate-400"}>
            {isInputActive ? "INPUT_LOCK" : "NAV_MODE"}
          </span>
        </div>
      </div>
    </div>
  );
}
