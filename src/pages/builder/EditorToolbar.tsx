import {
  Eye,
  Hand,
  Monitor,
  MousePointer2,
  Redo2,
  Smartphone,
  Square,
  Tablet,
  Undo2,
} from "lucide-react";
import {
  BuilderApp,
  canRedo,
  canUndo,
  redoCommand,
  undoCommand,
} from "@/apps/builder/app";
import { os } from "@/os/kernel";

export type ViewportMode = "desktop" | "tablet" | "mobile";

/**
 * EditorToolbar — Floating Center Pill
 *
 * Only the center tool palette floats over the canvas.
 * Left (Logo) → integrated into SectionSidebar header
 * Right (Actions) → integrated into PropertiesPanel header
 */
export function EditorToolbar({
  currentViewport,
  onViewportChange,
}: {
  currentViewport: ViewportMode;
  onViewportChange: (mode: ViewportMode) => void;
}) {
  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      <div className="flex items-center gap-1 px-1.5 py-1 bg-white/80 backdrop-blur-2xl rounded-xl ring-1 ring-slate-900/[0.06] shadow-lg shadow-slate-900/[0.04]">
        {/* Tool group */}
        <div className="flex items-center gap-0.5 px-0.5">
          <ToolButton icon={<MousePointer2 size={15} />} active />
          <ToolButton icon={<Hand size={15} />} />
          <ToolButton icon={<Square size={15} />} />
        </div>

        <Divider />

        {/* Undo/Redo */}
        <div className="flex items-center gap-0.5 px-0.5">
          <ToolButton
            icon={<Undo2 size={15} />}
            disabled={!BuilderApp.useComputed(canUndo.evaluate)}
            onClick={() => os.dispatch(undoCommand())}
          />
          <ToolButton
            icon={<Redo2 size={15} />}
            disabled={!BuilderApp.useComputed(canRedo.evaluate)}
            onClick={() => os.dispatch(redoCommand())}
          />
        </div>

        <Divider />

        {/* Device Preview */}
        <div className="flex items-center gap-0.5 px-0.5">
          <DeviceButton
            icon={<Monitor size={14} />}
            active={currentViewport === "desktop"}
            onClick={() => onViewportChange("desktop")}
            label="Desktop"
          />
          <DeviceButton
            icon={<Tablet size={14} />}
            active={currentViewport === "tablet"}
            onClick={() => onViewportChange("tablet")}
            label="Tablet"
          />
          <DeviceButton
            icon={<Smartphone size={14} />}
            active={currentViewport === "mobile"}
            onClick={() => onViewportChange("mobile")}
            label="Mobile"
          />
        </div>
      </div>
    </div>
  );
}

// ── Shared pill divider ──
function Divider() {
  return <div className="w-px h-5 bg-slate-200/80 mx-0.5" />;
}

function ToolButton({
  icon,
  active,
  disabled,
  onClick,
}: {
  icon: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150
        ${disabled ? "text-slate-300 cursor-not-allowed" : ""}
        ${active
          ? "bg-slate-800 text-white shadow-sm"
          : disabled
            ? ""
            : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/80"
        }
      `}
    >
      {icon}
    </button>
  );
}

function DeviceButton({
  icon,
  active,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  active?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150
        ${active
          ? "bg-slate-800 text-white shadow-sm"
          : "text-slate-400 hover:text-slate-600 hover:bg-slate-100/80"
        }
      `}
    >
      {icon}
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}
