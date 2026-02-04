import { OS } from "@os/ui";
import { Copy, Clipboard, Trash2, Plus, Move, RotateCcw } from "lucide-react";

/**
 * ActionToolbar
 * 
 * 복사/붙여넣기/삭제/복제 등 기본 액션 버튼 테스트.
 * Trigger + Item 조합.
 */
export function ActionToolbar() {
    return (
        <section className="py-12 px-8 max-w-6xl mx-auto">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-800">Action Toolbar</h2>
                <p className="text-sm text-slate-500 mt-1">
                    Trigger 컴포넌트로 액션 버튼 테스트. 클릭 또는 Enter로 실행.
                </p>
            </div>

            <OS.Zone
                id="toolbar-zone"
                role="toolbar"
                direction="h"
                className="bg-white rounded-2xl border border-slate-200 p-4"
            >
                <div className="flex items-center gap-2">
                    <ToolbarButton id="action-copy" icon={<Copy size={18} />} label="복사" shortcut="⌘C" />
                    <ToolbarButton id="action-paste" icon={<Clipboard size={18} />} label="붙여넣기" shortcut="⌘V" />
                    <div className="w-px h-8 bg-slate-200 mx-2" />
                    <ToolbarButton id="action-duplicate" icon={<Plus size={18} />} label="복제" shortcut="⌘D" />
                    <ToolbarButton id="action-delete" icon={<Trash2 size={18} />} label="삭제" shortcut="⌫" variant="danger" />
                    <div className="w-px h-8 bg-slate-200 mx-2" />
                    <ToolbarButton id="action-move" icon={<Move size={18} />} label="이동" />
                    <ToolbarButton id="action-undo" icon={<RotateCcw size={18} />} label="되돌리기" shortcut="⌘Z" />
                </div>
            </OS.Zone>
        </section>
    );
}

interface ToolbarButtonProps {
    id: string;
    icon: React.ReactNode;
    label: string;
    shortcut?: string;
    variant?: "default" | "danger";
}

function ToolbarButton({ id, icon, label, shortcut, variant = "default" }: ToolbarButtonProps) {
    const isDanger = variant === "danger";

    return (
        <OS.Item id={id}>
            {({ isFocused }: { isFocused: boolean }) => (
                <OS.Trigger command={{ type: "NOOP" }} asChild>
                    <button
                        className={`
              flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
              transition-all duration-200 outline-none
              ${isFocused
                                ? isDanger
                                    ? "bg-red-500 text-white shadow-lg shadow-red-500/30 scale-105"
                                    : "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 scale-105"
                                : isDanger
                                    ? "bg-red-50 text-red-600 hover:bg-red-100"
                                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }
            `}
                    >
                        {icon}
                        <span>{label}</span>
                        {shortcut && (
                            <span
                                className={`
                  ml-1 px-1.5 py-0.5 rounded text-[10px] font-mono
                  ${isFocused ? "bg-white/20" : "bg-slate-200 text-slate-500"}
                `}
                            >
                                {shortcut}
                            </span>
                        )}
                    </button>
                </OS.Trigger>
            )}
        </OS.Item>
    );
}
