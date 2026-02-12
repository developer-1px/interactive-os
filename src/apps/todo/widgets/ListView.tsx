/**
 * ListView - Premium Todo List Implementation
 *
 * Uses TaskItem components with full ZIFT pattern (Zone-Item-Field-Trigger).
 */

import {
  CopyTodo,
  CutTodo,
  PasteTodo,
} from "@apps/todo/features/commands/clipboard";
import { RedoCommand, UndoCommand } from "@apps/todo/features/commands/history";
import {
  AddTodo,
  DeleteTodo,
  MoveItemDown,
  MoveItemUp,
  StartEdit,
  SyncDraft,
  ToggleTodo,
} from "@apps/todo/features/commands/list";
import { TaskItem } from "@apps/todo/widgets/TaskItem";
import { OS } from "@os/AntigravityOS";
import { todoSlice } from "@apps/todo/app";
import { Plus } from "lucide-react";

export function ListView() {
  const state = todoSlice.useComputed((s) => s);
  if (!state || !state.data) return null;

  const todoOrder = state.data.todoOrder ?? [];
  const todos = state.data.todos ?? {};
  const visibleTodoIds = todoOrder.filter(
    (id) => todos[id]?.categoryId === state.ui.selectedCategoryId,
  );
  const visibleTodos = visibleTodoIds
    .map((id) => todos[id])
    .filter((t): t is NonNullable<typeof t> => !!t);

  // Edit state
  const editingId = state.ui.editingId;
  const editDraft = state.ui.editDraft ?? "";
  const draft = state.ui.draft ?? "";

  return (
    <div className="flex-1 flex flex-col h-full relative bg-white overflow-hidden font-sans">
      <OS.Zone
        id="listView"
        role="listbox"
        // ARIA Standard Commands
        onCheck={ToggleTodo({ id: OS.FOCUS as any })}
        onAction={StartEdit({ id: OS.FOCUS as any })}
        // Clipboard Commands (Muscle Memory)
        onCopy={CopyTodo({ id: OS.FOCUS as any })}
        onCut={CutTodo({ id: OS.FOCUS as any })}
        onPaste={PasteTodo({ id: OS.FOCUS as any })}
        // Editing Commands (Muscle Memory)
        onDelete={DeleteTodo({ id: OS.FOCUS as any })}
        // Reorder Commands (Meta+Arrow)
        onMoveUp={MoveItemUp({ focusId: OS.FOCUS as any })}
        onMoveDown={MoveItemDown({ focusId: OS.FOCUS as any })}
        // History Commands (Temporal Control)
        onUndo={UndoCommand()}
        onRedo={RedoCommand()}
        className="flex flex-col h-full"
      >
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

          <div className="flex-1 overflow-y-auto space-y-2 px-2 custom-scrollbar">
            {/* Draft Item - Label expands hit area to entire box */}
            <OS.Field.Label className="group flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-text border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 has-[[data-focused=true]]:border-solid has-[[data-focused=true]]:border-indigo-400 has-[[data-focused=true]]:bg-white has-[[data-focused=true]]:ring-2 has-[[data-focused=true]]:ring-indigo-500/20">
              <div className="text-slate-400 group-has-[[data-focused=true]]:text-indigo-500 transition-colors">
                <Plus size={18} strokeWidth={2.5} />
              </div>
              <OS.Field
                name="DRAFT"
                value={draft}
                onChange={SyncDraft}
                onSubmit={AddTodo}
                className="flex-1 bg-transparent outline-none text-slate-700 text-[15px] font-medium placeholder:text-slate-400"
                placeholder="Add a new task..."
              />
            </OS.Field.Label>

            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-4" />

            {/* Task Items */}
            <div className="space-y-2.5">
              {visibleTodos.map((todo) => (
                <TaskItem
                  key={todo.id}
                  todo={todo}
                  isEditing={editingId === todo.id}
                  editDraft={editDraft}
                />
              ))}
            </div>

            {visibleTodos.length === 0 && (
              <div className="py-24 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl opacity-20">📝</span>
                </div>
                <h3 className="text-slate-900 font-semibold mb-1">
                  No tasks in this list
                </h3>
                <p className="text-slate-500 text-sm">
                  Create a new task to get started.
                </p>
              </div>
            )}
          </div>
        </div>
      </OS.Zone>
    </div>
  );
}
