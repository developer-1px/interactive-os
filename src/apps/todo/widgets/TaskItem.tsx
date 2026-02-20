/**
 * TaskItem — v5 native (createZone + bind).
 *
 * Uses TodoList.Item (maps to OS.Item).
 * Uses TodoList.triggers for mouse actions — headless-first, no raw OS imports.
 */

import { TodoApp, TodoEdit, TodoList } from "@apps/todo/app";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CornerDownLeft,
  GripVertical,
  Loader2,
  Trash2,
} from "lucide-react";

interface TaskItemProps {
  todoId: string;
}

function TaskItemEditor() {
  const editDraft = ""; // Field manages its own value via FieldRegistry

  return (
    <TodoEdit.Field
      name="EDIT"
      value={editDraft}
      autoFocus
      className="w-full bg-transparent outline-none text-slate-900 text-[15px] font-medium leading-relaxed placeholder:text-slate-400"
      placeholder="What needs to be done?"
      blurOnInactive={true}
    />
  );
}

export function TaskItem({ todoId }: TaskItemProps) {
  const todo = TodoApp.useComputed((s) => s.data.todos[todoId]);
  const isEditing = TodoApp.useComputed((s) => s.ui.editingId === todoId);

  if (!todo) return null;

  const isCompleted = todo.completed;

  return (
    <TodoList.Item
      id={String(todo.id)}
      className={`
                group relative flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200
                ${isCompleted
          ? "bg-slate-50/50 border-transparent opacity-60 hover:opacity-100"
          : "bg-white border-slate-200 shadow-sm hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5"
        }
                outline-none
                data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400 data-[focused=true]:border-indigo-300 data-[focused=true]:z-10
                data-[anchor=true]:ring-1 data-[anchor=true]:ring-slate-200 data-[anchor=true]:z-10
                data-[selected=true]:bg-indigo-50/80 data-[selected=true]:border-indigo-200 data-[selected=true]:shadow-sm
                ${isEditing ? "bg-white ring-2 ring-indigo-500 border-transparent shadow-lg z-20" : ""}
            `}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {/* Drag Handle */}
        <div className="mt-1 -ml-1 text-slate-300 cursor-grab active:cursor-grabbing transition-opacity opacity-0 group-hover:opacity-100">
          <GripVertical size={16} />
        </div>

        {/* Checkbox Trigger */}
        <TodoList.triggers.ToggleTodo payload={{ id: todo.id }}>
          <div
            className={`
                            w-5 h-5 mt-0.5 rounded-full border-[1.5px] flex items-center justify-center transition-all cursor-pointer flex-shrink-0
                            ${isCompleted
                ? "bg-indigo-600 border-indigo-600 scale-100"
                : "border-slate-300 bg-white hover:border-indigo-400 group-hover:border-indigo-300"
              }
                        `}
          >
            <Check
              size={12}
              className={`text-white transition-transform ${isCompleted ? "scale-100" : "scale-0"}`}
              strokeWidth={3}
            />
          </div>
        </TodoList.triggers.ToggleTodo>

        {/* Content Area */}
        <div className="flex-1 min-w-0 pt-0.5">
          {isEditing ? (
            <TaskItemEditor />
          ) : (
            <span
              className={`block text-[15px] leading-relaxed transition-all select-none ${isCompleted
                ? "text-slate-400 line-through decoration-slate-300"
                : "text-slate-700 font-medium"
                }`}
            >
              {todo.text}
            </span>
          )}

          {!isEditing && (
            <div className="h-0 group-hover:h-auto overflow-hidden transition-all" />
          )}
        </div>

        {/* Quick Actions */}
        <div
          className={`flex items-center gap-1 transition-all ${isEditing ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"}`}
        >
          {isEditing ? (
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
              <Loader2 size={12} className="animate-spin" />
              <span>Saving...</span>
            </div>
          ) : (
            <>
              <TodoList.triggers.StartEdit payload={{ id: todo.id }}>
                <button
                  type="button"
                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Edit (Enter)"
                >
                  <CornerDownLeft size={14} />
                </button>
              </TodoList.triggers.StartEdit>

              <div className="w-px h-3 bg-slate-200 mx-1" />

              <TodoList.triggers.MoveItemUp payload={{ id: todo.id }}>
                <button
                  type="button"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Move Up (Cmd+Up)"
                >
                  <ArrowUp size={14} />
                </button>
              </TodoList.triggers.MoveItemUp>
              <TodoList.triggers.MoveItemDown payload={{ id: todo.id }}>
                <button
                  type="button"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Move Down (Cmd+Down)"
                >
                  <ArrowDown size={14} />
                </button>
              </TodoList.triggers.MoveItemDown>

              <div className="w-px h-3 bg-slate-200 mx-1" />

              <TodoList.triggers.DeleteTodo payload={{ id: todo.id }}>
                <button
                  type="button"
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </TodoList.triggers.DeleteTodo>
            </>
          )}
        </div>
      </div>

      {/* Active Indicator Bar */}
      <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-r-full opacity-0 data-[focused=true]:opacity-100 transition-opacity" />
    </TodoList.Item>
  );
}
