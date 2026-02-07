import { useEngine } from "@os/features/command/ui/CommandContext";
import { DeselectAll, BulkDeleteCards, BulkMoveCards, BulkSetPriority } from "@apps/kanban/features/commands/selection";
import { Trash2, ArrowRight, X, Flame, ArrowUp, Minus, ArrowDown } from "lucide-react";
import type { KanbanState, Priority } from "@apps/kanban/model/appState";
import { useState } from "react";

export function BulkActionBar() {
    const { state, dispatch } = useEngine<KanbanState>();
    const [showMoveMenu, setShowMoveMenu] = useState(false);
    const [showPriorityMenu, setShowPriorityMenu] = useState(false);

    if (!state) return null;

    const selectedCount = state.ui.selectedCardIds.length;
    if (selectedCount === 0) return null;

    const columns = state.data.columnOrder.map((id) => state.data.columns[id]).filter(Boolean);

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
            <div className="flex items-center gap-3 bg-slate-900 text-white rounded-2xl px-5 py-3 shadow-2xl border border-slate-700">
                {/* Count */}
                <span className="text-sm font-bold">
                    {selectedCount} card{selectedCount > 1 ? "s" : ""} selected
                </span>

                <div className="w-px h-5 bg-slate-700" />

                {/* Move To */}
                <div className="relative">
                    <button
                        onClick={() => { setShowMoveMenu(!showMoveMenu); setShowPriorityMenu(false); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                        <ArrowRight size={12} />
                        Move to
                    </button>
                    {showMoveMenu && (
                        <div className="absolute bottom-full mb-2 left-0 bg-white text-slate-700 rounded-xl border border-slate-200 shadow-xl py-1.5 min-w-[160px]">
                            {columns.map((col) => (
                                <button
                                    key={col.id}
                                    onClick={() => {
                                        dispatch(BulkMoveCards({ targetColumnId: col.id }));
                                        setShowMoveMenu(false);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium hover:bg-slate-50 text-left transition-colors"
                                >
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                                    {col.title}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Set Priority */}
                <div className="relative">
                    <button
                        onClick={() => { setShowPriorityMenu(!showPriorityMenu); setShowMoveMenu(false); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                        <Flame size={12} />
                        Priority
                    </button>
                    {showPriorityMenu && (
                        <div className="absolute bottom-full mb-2 left-0 bg-white text-slate-700 rounded-xl border border-slate-200 shadow-xl py-1.5 min-w-[140px]">
                            {(["urgent", "high", "medium", "low", "none"] as Priority[]).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => {
                                        dispatch(BulkSetPriority({ priority: p }));
                                        setShowPriorityMenu(false);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium hover:bg-slate-50 text-left transition-colors capitalize"
                                >
                                    <div
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: p === "urgent" ? "#ef4444" : p === "high" ? "#f97316" : p === "medium" ? "#eab308" : p === "low" ? "#3b82f6" : "#94a3b8" }}
                                    />
                                    {p}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Delete */}
                <button
                    onClick={() => dispatch(BulkDeleteCards({}))}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600/20 text-red-300 hover:bg-red-600/40 transition-colors"
                >
                    <Trash2 size={12} />
                    Delete
                </button>

                <div className="w-px h-5 bg-slate-700" />

                {/* Deselect */}
                <button
                    onClick={() => dispatch(DeselectAll({}))}
                    className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
                    title="Deselect All (Escape)"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}
