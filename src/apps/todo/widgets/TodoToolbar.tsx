import { todoSlice } from "@apps/todo/app";
import { UndoCommand, RedoCommand } from "@apps/todo/features/commands/history";
import { ClearCompleted } from "@apps/todo/features/commands/list";
import { ToggleView } from "@apps/todo/features/commands/ToggleView";
import { Trigger } from "@os/6-components/Trigger";
import {
    LayoutGrid,
    List,
    RotateCcw,
    RotateCw,
    Trash2,
} from "lucide-react";

export function TodoToolbar() {
    const state = todoSlice.useComputed((s) => s);

    if (!state) return null;

    const isBoard = state.ui.viewMode === "board";
    const hasHistoryPast = state.history?.past?.length > 0;
    const hasHistoryFuture = state.history?.future?.length > 0;

    // Calculate completed count
    const completedCount = Object.values(state.data.todos).filter(
        (t) => t.completed
    ).length;

    return (
        <div className="flex px-4 py-3 bg-white border-b border-slate-200 justify-between items-center sticky top-0 z-10">
            {/* Left: View Toggle */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <Trigger onPress={ToggleView({})}>
                    <button
                        className={`
              p-1.5 rounded-md transition-all flex items-center justify-center
              ${!isBoard ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}
            `}
                        title="List View"
                    >
                        <List size={16} />
                    </button>
                </Trigger>
                <Trigger onPress={ToggleView({})}>
                    <button
                        className={`
              p-1.5 rounded-md transition-all flex items-center justify-center
              ${isBoard ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}
            `}
                        title="Board View"
                    >
                        <LayoutGrid size={16} />
                    </button>
                </Trigger>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
                {/* Undo / Redo */}
                <div className="flex items-center bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                    <Trigger onPress={UndoCommand()}>
                        <button
                            disabled={!hasHistoryPast}
                            className="px-3 py-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors border-r border-slate-100"
                            title="Undo"
                        >
                            <RotateCcw size={14} />
                        </button>
                    </Trigger>
                    <Trigger onPress={RedoCommand()}>
                        <button
                            disabled={!hasHistoryFuture}
                            className="px-3 py-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                            title="Redo"
                        >
                            <RotateCw size={14} />
                        </button>
                    </Trigger>
                </div>

                {/* Clear Completed */}
                {completedCount > 0 && (
                    <Trigger onPress={ClearCompleted()}>
                        <button
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                            title="Clear Completed Tasks"
                        >
                            <Trash2 size={14} />
                            <span className="hidden sm:inline">Clear {completedCount}</span>
                        </button>
                    </Trigger>
                )}
            </div>
        </div>
    );
}
