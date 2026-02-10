import { InspectorRegistry } from "@inspector/stores/InspectorRegistry.ts";
import { useInspectorStore } from "@inspector/stores/InspectorStore";
import {
  Bug,
  Cpu,
  Crosshair,
  Database,
  Keyboard,
  Settings,
} from "lucide-react";
import { useSyncExternalStore } from "react";

export function InspectorActivityBar() {
  const activeTab = useInspectorStore((s) => s.activeTab);
  const setActiveTab = useInspectorStore((s) => s.setActiveTab);

  /* eslint-disable-next-line react-hooks/exhaustive-deps */
  const dynamicPanels = useSyncExternalStore(
    (cb) => InspectorRegistry.subscribe(cb),
    () => InspectorRegistry.getPanels(),
    () => [],
  );

  const staticTabs = [
    { id: "ELEMENT", icon: Crosshair, label: "Element" },
    { id: "REGISTRY", icon: Keyboard, label: "Keymap" },
    { id: "STATE", icon: Database, label: "State" },
    { id: "TESTBOT", icon: Bug, label: "TestBot" },
    { id: "SETTINGS", icon: Settings, label: "Settings" },
  ] as const;

  // Merge static tabs and dynamic panels
  // Dynamic panels get a default icon (Cpu)
  const allTabs = [
    ...staticTabs,
    ...dynamicPanels.map((p) => ({
      id: p.id,
      icon: Cpu, // Default icon for dynamic panels
      label: p.label,
    })),
  ];

  return (
    <div className="w-[32px] h-full bg-[#f8f8f8] flex flex-col items-center py-1.5 border-l border-[#e5e5e5]">
      {allTabs.map((tab) => (
        <button
          type="button"
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`w-6 h-6 mb-1 rounded flex items-center justify-center transition-all ${
            activeTab === tab.id
              ? "bg-white text-[#007acc] shadow-sm border border-[#e0e0e0]"
              : "text-[#999] hover:text-[#666] hover:bg-white/50"
          }`}
          title={tab.label}
        >
          <tab.icon size={14} strokeWidth={1.5} />
        </button>
      ))}

      {/* Spacer */}
      <div className="flex-1" />
    </div>
  );
}
