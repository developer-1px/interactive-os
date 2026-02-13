/**
 * TodoToolbar — defineApp/createWidget/createTrigger version.
 *
 * Simple triggers + ClearDialog compound — zero OS import.
 */

import { TodoApp, TodoList, TodoToolbar } from "@apps/todo/app-v3";
import { ClearDialog } from "@apps/todo/triggers";
import {
  AlertTriangle,
  LayoutGrid,
  List,
  RotateCcw,
  RotateCw,
  Trash2,
} from "lucide-react";

// Simple triggers — defined inline here (or import from triggers.ts)
const ToggleViewButton = TodoApp.createTrigger(TodoToolbar.commands.toggleView);
const UndoButton = TodoApp.createTrigger(TodoList.commands.undoCommand);
const RedoButton = TodoApp.createTrigger(TodoList.commands.redoCommand);

export function TodoToolbarView() {
  const state = TodoApp.useComputed((s) => s);
  if (!state) return null;

  const isBoard = state.ui.viewMode === "board";
  const hasHistoryPast = state.history?.past?.length > 0;
  const hasHistoryFuture = state.history?.future?.length > 0;
  const completedCount = Object.values(state.data.todos).filter(
    (t) => t.completed,
  ).length;

  return (
    <div className="flex px-4 py-3 bg-white border-b border-slate-200 justify-between items-center sticky top-0 z-10">
      {/* Left: View Toggle */}
      <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
        <ToggleViewButton>
          <button
            className={`p-1.5 rounded-md transition-all flex items-center justify-center ${!isBoard ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            title="List View"
          >
            <List size={16} />
          </button>
        </ToggleViewButton>
        <ToggleViewButton>
          <button
            className={`p-1.5 rounded-md transition-all flex items-center justify-center ${isBoard ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
            title="Board View"
          >
            <LayoutGrid size={16} />
          </button>
        </ToggleViewButton>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
          <UndoButton>
            <button
              disabled={!hasHistoryPast}
              className="px-3 py-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors border-r border-slate-100"
              title="Undo"
            >
              <RotateCcw size={14} />
            </button>
          </UndoButton>
          <RedoButton>
            <button
              disabled={!hasHistoryFuture}
              className="px-3 py-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Redo"
            >
              <RotateCw size={14} />
            </button>
          </RedoButton>
        </div>

        {/* ClearDialog — compound trigger with confirmation */}
        {completedCount > 0 && (
          <ClearDialog.Root>
            <ClearDialog.Trigger>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
                title="Clear Completed Tasks"
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">Clear {completedCount}</span>
              </button>
            </ClearDialog.Trigger>

            <ClearDialog.Content title="Clear completed tasks?">
              <div className="flex items-start gap-3 py-3">
                <div className="p-2 bg-amber-50 rounded-lg">
                  <AlertTriangle size={20} className="text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">
                    This will permanently remove{" "}
                    <strong>{completedCount}</strong> completed task
                    {completedCount > 1 ? "s" : ""}.
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    You can undo this action.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <ClearDialog.Dismiss>
                  <button className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
                    Cancel
                  </button>
                </ClearDialog.Dismiss>
                <ClearDialog.Confirm>
                  <button className="px-3 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors font-medium">
                    Clear All
                  </button>
                </ClearDialog.Confirm>
              </div>
            </ClearDialog.Content>
          </ClearDialog.Root>
        )}
      </div>
    </div>
  );
}
