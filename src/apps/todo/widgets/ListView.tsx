/**
 * ListView — v5 native (createZone + bind).
 *
 * <TodoList.Zone> with 0 bindings — all from zone.bind declaration.
 */

import { TodoApp, TodoDraft, TodoList, TodoSearch } from "@apps/todo/app";
import { selectVisibleTodoIds } from "@apps/todo/selectors";
import { TaskItem } from "@apps/todo/widgets/TaskItem";
import { Field } from "@os/6-components/field/Field";
import { useSelection } from "@os/5-hooks/useSelection";
import { os } from "@/os/kernel";
import { AlertTriangle, CheckCheck, Plus, Search, Trash2, X } from "lucide-react";

export function ListView() {
  const visibleTodoIds = TodoApp.useComputed(selectVisibleTodoIds);
  const pendingDeleteIds = TodoApp.useComputed((s) => s.ui.pendingDeleteIds);
  const searchQuery = TodoApp.useComputed((s) => s.ui.searchQuery);
  const selection = useSelection("list");
  const { DeleteDialog } = TodoList.triggers;
  const draft = ""; // Field manages its own value via FieldRegistry

  return (
    <div className="flex-1 flex flex-col h-full relative bg-white overflow-hidden font-sans">
      {/* Zero manual bindings — TodoList.Zone has everything from zone.bind */}
      <TodoList.Zone className="flex flex-col h-full">
        <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full z-10 p-8 sm:p-12 pb-6">
          {/* Header */}
          <header className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
              Tasks
            </h2>
            <p className="text-slate-500 text-sm font-medium">
              Manage your daily priorities
            </p>
          </header>

          {/* Search Bar */}
          <Field.Label className="group flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border transition-all bg-slate-50/80 border-slate-200 hover:border-slate-300 has-[[data-focused=true]]:border-indigo-400 has-[[data-focused=true]]:bg-white has-[[data-focused=true]]:ring-2 has-[[data-focused=true]]:ring-indigo-400/20 has-[[data-focused=true]]:shadow-sm mb-4">
            <Search size={15} className="text-slate-400 shrink-0 group-has-[[data-focused=true]]:text-indigo-500 transition-colors" />
            <TodoSearch.Field
              name="SEARCH"
              value={searchQuery}
              className="flex-1 bg-transparent outline-none text-slate-700 text-sm font-medium placeholder:text-slate-400"
              placeholder="Search tasks... (Cmd+F)"
            />
            {searchQuery && (
              <button
                type="button"
                className="p-0.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                onClick={() => os.dispatch(TodoSearch.commands.clearSearch())}
              >
                <X size={14} />
              </button>
            )}
          </Field.Label>

          <div className="flex-1 overflow-y-auto space-y-2 px-2 custom-scrollbar">
            {/* Draft Field — pre-bound via TodoDraft.Field */}
            <Field.Label className="group flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-text border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 has-[[data-focused=true]]:border-solid has-[[data-focused=true]]:border-indigo-400 has-[[data-focused=true]]:bg-white has-[[data-focused=true]]:ring-2 has-[[data-focused=true]]:ring-indigo-400/30 has-[[data-anchor=true]]:border-solid has-[[data-anchor=true]]:border-slate-300 has-[[data-anchor=true]]:bg-white has-[[data-anchor=true]]:ring-1 has-[[data-anchor=true]]:ring-slate-200">
              <div className="text-slate-400 group-has-[[data-focused=true]]:text-indigo-500 group-has-[[data-anchor=true]]:text-slate-400 transition-colors">
                <Plus size={18} strokeWidth={2.5} />
              </div>
              <TodoDraft.Field
                name="DRAFT"
                value={draft}
                className="flex-1 bg-transparent outline-none text-slate-700 text-[15px] font-medium placeholder:text-slate-400"
                placeholder="Add a new task..."
              />
            </Field.Label>

            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-4" />

            {/* Task Items */}
            <div className="space-y-2.5">
              {visibleTodoIds.map((id) => (
                <TaskItem key={id} todoId={id} />
              ))}
            </div>

            {visibleTodoIds.length === 0 && (
              <div className="py-24 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl opacity-20">
                    {searchQuery ? "🔍" : "📝"}
                  </span>
                </div>
                <h3 className="text-slate-900 font-semibold mb-1">
                  {searchQuery
                    ? `No results for "${searchQuery}"`
                    : "No tasks in this list"}
                </h3>
                <p className="text-slate-500 text-sm">
                  {searchQuery
                    ? "Try a different search term."
                    : "Create a new task to get started."}
                </p>
              </div>
            )}
          </div>
        </div>
      </TodoList.Zone>

      {/* Bulk Action Bar — appears when 2+ items selected */}
      {selection.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-5 py-2.5 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-900/20 animate-in slide-in-from-bottom-4 duration-200">
          <span className="text-sm font-semibold tabular-nums">
            {selection.length} selected
          </span>
          <div className="w-px h-5 bg-slate-700" />
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-red-300 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors"
            onClick={() =>
              os.dispatch(
                TodoList.commands.requestDeleteTodo({ ids: [...selection] }),
              )
            }
          >
            <Trash2 size={13} />
            Delete
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-300 hover:text-white hover:bg-emerald-500/20 rounded-lg transition-colors"
            onClick={() =>
              os.dispatch(
                TodoList.commands.bulkToggleCompleted({ ids: [...selection] }),
              )
            }
          >
            <CheckCheck size={13} />
            Complete
          </button>
        </div>
      )}

      {/* DeleteDialog — compound trigger with confirmation */}
      <DeleteDialog.Root>
        <DeleteDialog.Content title="Delete items?">
          <div className="flex items-start gap-3 py-3">
            <div className="p-2 bg-red-50 rounded-lg border border-red-100">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm text-slate-800 font-medium">
                {pendingDeleteIds.length > 1
                  ? `Delete ${pendingDeleteIds.length} items?`
                  : "Delete this item?"}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                This action cannot be undone. Are you sure?
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            {/* cancelDeleteTodo is dispatched to clear pending IDs, OS_OVERLAY_CLOSE happens via Dialog.Close implicitly if not prevented */}
            <DeleteDialog.Dismiss className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors font-medium cursor-pointer" onPress={TodoList.commands.cancelDeleteTodo()}>
              Cancel
            </DeleteDialog.Dismiss>
            {/* Confirm uses the command defined in createTrigger config */}
            <DeleteDialog.Confirm className="px-3 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors font-medium cursor-pointer">
              Delete
            </DeleteDialog.Confirm>
          </div>
        </DeleteDialog.Content>
      </DeleteDialog.Root>
    </div>
  );
}
