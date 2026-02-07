import {
  CopyTodo,
  CutTodo,
  PasteTodo,
} from "@apps/todo/features/commands/clipboard";
import {
  UndoCommand,
  RedoCommand,
} from "@apps/todo/features/commands/history";
import {
  DeleteTodo,
  StartEdit,
  ToggleTodo,
} from "@apps/todo/features/commands/list";
import { ToggleView } from "@apps/todo/features/commands/ToggleView";
import type { AppState } from "@apps/todo/model/types";
import { Trigger } from "@os/app/export/primitives/Trigger";
import { Zone } from "@os/app/export/primitives/Zone";
import { OS } from "@os/features/AntigravityOS";
import { useEngine } from "@os/features/command/ui/CommandContext";
import { List } from "lucide-react";
import { TaskItem } from "./TaskItem";

export function BoardView() {
  const { state } = useEngine<AppState>();
  if (!state) return null;
  const { categoryOrder, categories, todos, todoOrder } = state.data;
  const { selectedCategoryId } = state.ui;
  const activeCategory = categories[selectedCategoryId];

  return (
    <div className="flex-1 flex flex-col h-full relative bg-slate-50 overflow-hidden font-sans">
      {/* Header */}
      <div className="px-8 pt-8 pb-4 flex-none border-b border-slate-200/60 bg-white z-20">
        <header className="flex items-end justify-between max-w-[1800px] mx-auto w-full">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-1">
              Board
            </h2>
            <p className="text-slate-500 font-medium text-sm">
              {activeCategory?.text || "All Projects"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Trigger onPress={ToggleView({})} asChild>
              <button
                className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all shadow-sm"
                title="Switch to List View"
              >
                <List size={18} />
              </button>
            </Trigger>
          </div>
        </header>
      </div>

      {/* Board Scroll Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar bg-slate-50">
        <div className="h-full min-w-max p-8">
          {/* Top-Level Board FocusGroup: Spatial Navigation between Columns */}
          <Zone
            id="board"
            role="group"
            options={{
              navigate: { entry: "restore", orientation: "horizontal" },
            }}
            className="flex gap-8 h-full"
          >
            {categoryOrder.map((categoryId) => {
              const category = categories[categoryId];
              const activeColumn = selectedCategoryId === categoryId;
              const categoryTodos = todoOrder
                .filter((id) => todos[id]?.categoryId === categoryId)
                .map((id) => todos[id]);

              return (
                <Zone
                  key={categoryId}
                  id={`col-${categoryId}`}
                  role="listbox"
                  options={{
                    navigate: { orientation: "vertical", entry: "restore" },
                  }}
                  // ARIA Standard Commands
                  onSelect={ToggleTodo({ id: OS.FOCUS })}
                  onAction={StartEdit({ id: OS.FOCUS })}
                  // Clipboard Commands (Muscle Memory)
                  onCopy={CopyTodo({ id: OS.FOCUS })}
                  onCut={CutTodo({ id: OS.FOCUS })}
                  onPaste={PasteTodo({ id: OS.FOCUS })}
                  // Editing Commands (Muscle Memory)
                  onDelete={DeleteTodo({ id: OS.FOCUS })}
                  // History Commands (Temporal Control)
                  onUndo={UndoCommand({})}
                  onRedo={RedoCommand({})}
                  className={`
                        w-80 flex-shrink-0 flex flex-col max-h-full rounded-2xl bg-slate-100/50 border transition-all duration-300 outline-none
                        ${activeColumn ? "border-indigo-200 bg-white shadow-xl shadow-indigo-100/50 ring-1 ring-indigo-500/10" : "border-slate-200/60 hover:border-slate-300"}
                    `}
                // When column receives focus, we might want to set it as active category?
                // Logic for that is usually side-effect based, but FocusZone doesn't do it automatically.
                >
                  <div
                    className={`
                        p-4 border-b flex justify-between items-center rounded-t-2xl transition-colors
                        ${activeColumn ? "border-indigo-100 bg-indigo-50/50" : "border-slate-100 bg-slate-50"}
                    `}
                  >
                    <h3
                      className={`font-bold text-xs uppercase tracking-wider ${activeColumn ? "text-indigo-700" : "text-slate-500"}`}
                    >
                      {category.text}
                    </h3>
                    <span
                      className={`
                        text-[10px] font-bold px-2.5 py-1 rounded-md
                        ${activeColumn ? "bg-indigo-100 text-indigo-700" : "bg-white border border-slate-200 text-slate-400"}
                      `}
                    >
                      {categoryTodos.length}
                    </span>
                  </div>

                  {/* Card List */}
                  <div className="p-3 space-y-3 flex-1 overflow-y-auto custom-scrollbar min-h-[100px]">
                    {categoryTodos.map((todo) => (
                      <TaskItem
                        key={todo.id}
                        todo={todo}
                        isEditing={state.ui.editingId === todo.id}
                        editDraft={state.ui.editDraft}
                      />
                    ))}

                    {categoryTodos.length === 0 && (
                      <div className="h-32 flex flex-col items-center justify-center text-slate-300 gap-2 border-2 border-dashed border-slate-200/50 rounded-xl bg-slate-50/30">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                          No Items
                        </span>
                      </div>
                    )}
                  </div>
                </Zone>
              );
            })}
          </Zone>
        </div>
      </div>
    </div>
  );
}
