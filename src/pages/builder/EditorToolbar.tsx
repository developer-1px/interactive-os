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

export type ViewportMode = "desktop" | "tablet" | "mobile";

/**
 * EditorToolbar
 *
 * Light Theme Editor Toolbar - Clean professional design
 */
export function EditorToolbar({
  onToggleTest,
  testActive,
  currentViewport,
  onViewportChange,
}: {
  onToggleTest?: () => void;
  testActive?: boolean;
  currentViewport: ViewportMode;
  onViewportChange: (mode: ViewportMode) => void;
}) {
  return (
    <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Left: Logo + Page Title */}
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-800 text-sm font-medium">
              Landing Page
            </span>
            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded">
              SAVED
            </span>
          </div>
        </div>

        {/* Center: Tool Palette */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-4">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <ToolButton icon={<MousePointer2 size={16} />} active />
            <ToolButton icon={<Hand size={16} />} />
            <ToolButton icon={<Square size={16} />} />
            <div className="w-px h-5 bg-slate-300 mx-1" />
            <ToolButton icon={<Undo2 size={16} />} />
            <ToolButton icon={<Redo2 size={16} />} />
          </div>

          <div className="w-px h-6 bg-slate-200" />

          {/* Device Preview */}
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <DeviceButton
              icon={<Monitor size={15} />}
              active={currentViewport === "desktop"}
              onClick={() => onViewportChange("desktop")}
              label="Desktop"
            />
            <DeviceButton
              icon={<Tablet size={15} />}
              active={currentViewport === "tablet"}
              onClick={() => onViewportChange("tablet")}
              label="Tablet"
            />
            <DeviceButton
              icon={<Smartphone size={15} />}
              active={currentViewport === "mobile"}
              onClick={() => onViewportChange("mobile")}
              label="Mobile"
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {onToggleTest && (
            <button
              type="button"
              onClick={onToggleTest}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-all rounded-md ${
                testActive
                  ? "bg-amber-100 text-amber-700 ring-1 ring-amber-300"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              🧪 Test
            </button>
          )}
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
          >
            <Eye size={15} />
            Preview
          </button>
          <button
            type="button"
            className="px-4 py-1.5 bg-violet-600 text-white text-sm font-semibold rounded-lg hover:bg-violet-700 transition-colors shadow-sm"
          >
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}

function ToolButton({
  icon,
  active,
}: {
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`
        w-8 h-8 rounded-md flex items-center justify-center transition-all
        ${
          active
            ? "bg-white text-slate-800 shadow-sm"
            : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
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
        flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all
        ${
          active
            ? "bg-white text-slate-800 shadow-sm"
            : "text-slate-400 hover:text-slate-600"
        }
      `}
    >
      {icon}
      <span className="hidden xl:inline">{label}</span>
    </button>
  );
}
