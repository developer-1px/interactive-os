import { ElementPanel } from "@inspector/panels/ElementPanel.tsx";
import { InspectorAdapter } from "@inspector/panels/InspectorAdapter.tsx";
import { KeyMonitor } from "@inspector/panels/KeyMonitor.tsx";
import { useInputTelemetry } from "@inspector/panels/LoggedKey.ts";
import { RegistryMonitor } from "@inspector/panels/RegistryMonitor.tsx";
import { InspectorRegistry } from "@inspector/stores/InspectorRegistry.ts";
import { useInspectorStore } from "@inspector/stores/InspectorStore";
import { TestBotPanel } from "@inspector/testbot";

import { useEffect, useState } from "react";
import { kernel } from "@/os/kernel";

// --- Main Component ---

export function CommandInspector() {
  // v7.50: Use global InspectorStore for tab state
  const activeTab = useInspectorStore((s) => s.activeTab);

  // --- UI State ---
  const [physicalZone, setPhysicalZone] = useState<string | null>("NONE");
  const [isInputActive, setIsInputActive] = useState(false);

  // Telemetry from kernel transactions
  const transactions = kernel.inspector.getTransactions();
  const historyCount = transactions.length;
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

  const renderContent = () => {
    switch (activeTab) {
      case "ELEMENT":
        return <ElementPanel />;
      case "REGISTRY":
        return (
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <KeyMonitor rawKeys={rawKeys} />
            <RegistryMonitor historyCount={historyCount} />
          </div>
        );
      case "STATE":
        return <InspectorAdapter />;
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
            v8
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
