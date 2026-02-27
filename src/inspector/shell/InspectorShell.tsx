import { CommandInspector } from "@inspector/panels/CommandInspector";
import { InspectorActivityBar } from "@inspector/shell/InspectorActivityBar";
import { useInspectorStore } from "@inspector/stores/InspectorStore";
import { useCallback, useRef, useState } from "react";

const MIN_WIDTH = 260;
const MAX_WIDTH = 800;
const DEFAULT_WIDTH = 320;

export function InspectorShell() {
  const isPanelExpanded = useInspectorStore((s) => s.isPanelExpanded);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const isDragging = useRef(false);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      isDragging.current = true;
      const startX = e.clientX;
      const startWidth = width;

      const onMove = (ev: PointerEvent) => {
        // Panel is on the right side, so dragging left = wider
        const delta = startX - ev.clientX;
        const next = Math.min(
          MAX_WIDTH,
          Math.max(MIN_WIDTH, startWidth + delta),
        );
        setWidth(next);
      };

      const onUp = () => {
        isDragging.current = false;
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [width],
  );

  return (
    <div className="h-full flex flex-row shadow-2xl z-50 overflow-hidden">
      {/* Expanded Panel Content */}
      {isPanelExpanded && (
        <div className="h-full flex flex-row" style={{ width }}>
          {/* Resize Handle */}
          <div
            onPointerDown={onPointerDown}
            className="w-[6px] h-full cursor-col-resize shrink-0 group relative -mr-[5px] z-10"
          >
            <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-transparent group-hover:bg-[#007acc]/40 transition-colors" />
          </div>
          {/* Panel */}
          <div className="flex-1 h-full bg-white shadow-lg overflow-hidden">
            <CommandInspector />
          </div>
        </div>
      )}

      {/* Always Visible Activity Bar */}
      <InspectorActivityBar />
    </div>
  );
}
