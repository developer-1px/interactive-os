import {
  BulkDeleteCards,
  BulkMoveCards,
  BulkSetPriority,
  DeselectAll,
  ToggleBulkMenu,
} from "@apps/kanban/features/commands/selection";
import type { KanbanState, Priority } from "@apps/kanban/model/appState";
import { Trigger } from "@os/app/export/primitives/Trigger";
import { useEngine } from "@os/features/command/ui/CommandContext";
import { ArrowRight, Flame, Trash2, X } from "lucide-react";

export function BulkActionBar() {
  const { state } = useEngine<KanbanState>();

  if (!state) return null;

  const selectedCount = state.ui.selectedCardIds.length;
  if (selectedCount === 0) return null;

  const columns = state.data.columnOrder
    .map((id) => state.data.columns[id])
    .filter(Boolean);

  const showMoveMenu = state.ui.bulkMenuOpen === "move";
  const showPriorityMenu = state.ui.bulkMenuOpen === "priority";

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
          <Trigger
            onPress={ToggleBulkMenu({ menu: "move" })}
            asChild
            allowPropagation
          >
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              type="button"
              <ArrowRight size={12} />
              Move to
            </button>
          </Trigger>
          {showMoveMenu && (
            <div className="absolute bottom-full mb-2 left-0 bg-white text-slate-700 rounded-xl border border-slate-200 shadow-xl py-1.5 min-w-[160px]">
              {columns.map((col) => (
                <Trigger
                  key={col.id}
                  onPress={BulkMoveCards({ targetColumnId: col.id })}
                  asChild
                  allowPropagation
                >
                  <button
                    type="button"
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium hover:bg-slate-50 text-left transition-colors"
                  >
                    type="button"
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: col.color }}
                    />
                    {col.title}
                  </button>
                </Trigger>
              ))}
            </div>
          )}
        </div>

        {/* Set Priority */}
        <div className="relative">
          <Trigger
            onPress={ToggleBulkMenu({ menu: "priority" })}
            asChild
            allowPropagation
          >
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              type="button"
              <Flame size={12} />
              Priority
            </button>
          </Trigger>
          {showPriorityMenu && (
            <div className="absolute bottom-full mb-2 left-0 bg-white text-slate-700 rounded-xl border border-slate-200 shadow-xl py-1.5 min-w-[140px]">
              {(["urgent", "high", "medium", "low", "none"] as Priority[]).map(
                (p) => (
                  <Trigger
                    key={p}
                    onPress={BulkSetPriority({ priority: p })}
                    asChild
                    allowPropagation
                  >
                    <button
                      type="button"
                      className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-medium hover:bg-slate-50 text-left transition-colors capitalize"
                    >
                      type="button"
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            p === "urgent"
                              ? "#ef4444"
                              : p === "high"
                                ? "#f97316"
                                : p === "medium"
                                  ? "#eab308"
                                  : p === "low"
                                    ? "#3b82f6"
                                    : "#94a3b8",
                        }}
                      />
                      {p}
                    </button>
                  </Trigger>
                ),
              )}
            </div>
          )}
        </div>

        {/* Delete */}
        <Trigger onPress={BulkDeleteCards({})} asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600/20 text-red-300 hover:bg-red-600/40 transition-colors"
          >
            type="button"
            <Trash2 size={12} />
            Delete
          </button>
        </Trigger>

        <div className="w-px h-5 bg-slate-700" />

        {/* Deselect */}
        <Trigger onPress={DeselectAll({})} asChild>
          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-700"
            title="Deselect All (Escape)"
          >
            <X size={14} />
          </button>
        </Trigger>
      </div>
    </div>
  );
}
