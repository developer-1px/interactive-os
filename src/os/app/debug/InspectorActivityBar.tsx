import { useInspectorStore } from "@os/features/inspector/InspectorStore";
import { Activity, Bug, Database, Keyboard, Settings } from "lucide-react";

export function InspectorActivityBar() {
  const activeTab = useInspectorStore((s) => s.activeTab);
  const setActiveTab = useInspectorStore((s) => s.setActiveTab);

  const tabs = [
    { id: "REGISTRY", icon: Keyboard, label: "Keymap" },
    { id: "STATE", icon: Database, label: "State" },
    { id: "EVENTS", icon: Activity, label: "Events" },
    { id: "TESTBOT", icon: Bug, label: "TestBot" },
    { id: "SETTINGS", icon: Settings, label: "Settings" },
  ] as const;

  return (
    <div className="w-[32px] h-full bg-[#f8f8f8] flex flex-col items-center py-1.5 border-l border-[#e5e5e5]">
      {tabs.map((tab) => (
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
