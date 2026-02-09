import { CommandInspector } from "@os/app/debug/CommandInspector";
import { InspectorActivityBar } from "@os/app/debug/InspectorActivityBar";
import { useInspectorStore } from "@os/inspector/InspectorStore";

export function InspectorShell() {
  const isPanelExpanded = useInspectorStore((s) => s.isPanelExpanded);

  return (
    <div className="h-full flex flex-row shadow-2xl z-50 overflow-hidden">
      {/* Expanded Panel Content */}
      {isPanelExpanded && (
        <div className="w-[320px] h-full bg-white border-l border-[#e5e5e5] shadow-lg">
          <CommandInspector />
        </div>
      )}

      {/* Always Visible Activity Bar */}
      <InspectorActivityBar />
    </div>
  );
}
