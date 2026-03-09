/**
 * TodoToolbar — v5 native (zone.trigger + zone.overlay).
 *
 * Triggers declared top-down in app.ts — imported here for JSX rendering.
 * ClearDialog uses ModalPortal + onAction for confirm.
 */

import { clearCompleted, TodoApp, TodoToolbar } from "@apps/todo/app";
import { ModalPortal } from "@os-react/6-project/widgets/ModalPortal";
import { Item } from "@os-react/internal";
import { OS_OVERLAY_CLOSE } from "@os-sdk/os";

const ClearDialog = TodoToolbar.ClearDialog;
const { ToggleView, Undo, Redo } = TodoToolbar.triggers;

import {
  AlertTriangle,
  LayoutGrid,
  List,
  RotateCcw,
  RotateCw,
  Trash2,
} from "lucide-react";

export function TodoToolbarView() {
  const isBoard = TodoApp.useComputed((s) => s.ui.viewMode === "board");
  const hasHistoryPast = TodoApp.useComputed((s) => s.history.past.length > 0);
  const hasHistoryFuture = TodoApp.useComputed(
    (s) => s.history.future.length > 0,
  );
  const completedCount = TodoApp.useComputed(
    (s) => Object.values(s.data.todos).filter((t) => t.completed).length,
  );

  return (
    <div className="flex px-4 py-3 bg-white border-b border-slate-200 justify-between items-center sticky top-0 z-10">
      {/* Left: View Toggle */}
      <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
        <button
          {...ToggleView()}
          type="button"
          className={`p-1.5 rounded-md transition-all flex items-center justify-center ${!isBoard ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          title="List View"
        >
          <List size={16} />
        </button>
        <button
          {...ToggleView()}
          type="button"
          className={`p-1.5 rounded-md transition-all flex items-center justify-center ${isBoard ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          title="Board View"
        >
          <LayoutGrid size={16} />
        </button>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
          <button
            {...Undo()}
            type="button"
            disabled={!hasHistoryPast}
            className="px-3 py-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors border-r border-slate-100"
            title="Undo"
          >
            <RotateCcw size={14} />
          </button>
          <button
            {...Redo()}
            type="button"
            disabled={!hasHistoryFuture}
            className="px-3 py-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            title="Redo"
          >
            <RotateCw size={14} />
          </button>
        </div>

        {/* ClearDialog — ModalPortal + onAction for confirm */}
        {completedCount > 0 && (
          <>
            <button
              {...ClearDialog.trigger()}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-100"
              title="Clear Completed Tasks"
            >
              <Trash2 size={14} />
              <span className="hidden sm:inline">Clear {completedCount}</span>
            </button>

            <ModalPortal
              overlayId={ClearDialog.overlayId}
              role="alertdialog"
              title="Clear completed tasks?"
              onAction={(cursor) => {
                if (cursor.focusId === "confirm") {
                  return [
                    clearCompleted(),
                    OS_OVERLAY_CLOSE({ id: ClearDialog.overlayId }),
                  ];
                }
                return OS_OVERLAY_CLOSE({ id: ClearDialog.overlayId });
              }}
            >
              <div className="text-sm font-semibold text-gray-700 pb-2 border-b border-gray-200 mb-1">
                Clear completed tasks?
              </div>
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
                <Item
                  id={`${ClearDialog.overlayId}-close`}
                  as="button"
                  className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  Cancel
                </Item>
                <Item
                  id="confirm"
                  as="button"
                  className="px-3 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors font-medium"
                >
                  Clear All
                </Item>
              </div>
            </ModalPortal>
          </>
        )}
      </div>
    </div>
  );
}
