import {
  CancelEdit,
  DeleteTodo,
  MoveItemDown,
  MoveItemUp,
  StartEdit,
  SyncEditDraft,
  ToggleTodo,
  UpdateTodoText,
} from "@apps/todo/features/commands/list";
import type { Todo } from "@apps/todo/model/types";
import { OS } from "@os/AntigravityOS";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CornerDownLeft,
  GripVertical,
  Loader2,
  Trash2,
} from "lucide-react";
import { useState } from "react";

interface TaskItemProps {
  todo: Todo;
  isEditing: boolean;
  editDraft: string;
  onActivate?: () => void;
}

export function TaskItem({ todo, isEditing, editDraft }: TaskItemProps) {
  const isCompleted = todo.completed;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <OS.Item
      id={String(todo.id)}
      role="checkbox"
      aria-checked={isCompleted}
      className={`
                group relative flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200
                ${
                  isCompleted
                    ? "bg-slate-50/50 border-transparent opacity-60 hover:opacity-100"
                    : "bg-white border-slate-200 shadow-sm hover:border-indigo-200 hover:shadow-md hover:-translate-y-0.5"
                }
                outline-none
                data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-500/50 data-[focused=true]:border-indigo-300 data-[focused=true]:z-10
                data-[selected=true]:bg-indigo-50/80 data-[selected=true]:border-indigo-200 data-[selected=true]:shadow-sm
                ${isEditing ? "bg-white ring-2 ring-indigo-500 border-transparent shadow-lg z-20" : ""}
            `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag Handle (Visual Only for now) */}
      <div
        className={`
                mt-1 -ml-1 text-slate-300 cursor-grab active:cursor-grabbing transition-opacity
                ${isHovered ? "opacity-100" : "opacity-0"}
            `}
      >
        <GripVertical size={16} />
      </div>

      {/* Checkbox Trigger */}
      <OS.Trigger onPress={ToggleTodo({ id: todo.id })}>
        <div
          className={`
                        w-5 h-5 mt-0.5 rounded-full border-[1.5px] flex items-center justify-center transition-all cursor-pointer flex-shrink-0
                        ${
                          isCompleted
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
      </OS.Trigger>

      {/* Content Area */}
      <div className="flex-1 min-w-0 pt-0.5">
        {isEditing ? (
          <OS.Field
            name="EDIT"
            value={editDraft}
            autoFocus
            onChange={SyncEditDraft}
            onSubmit={UpdateTodoText}
            onCancel={CancelEdit()}
            className="w-full bg-transparent outline-none text-slate-900 text-[15px] font-medium leading-relaxed placeholder:text-slate-400"
            placeholder="What needs to be done?"
            blurOnInactive={true}
          />
        ) : (
          <span
            className={`
                            block text-[15px] leading-relaxed transition-all select-none
                            ${
                              isCompleted
                                ? "text-slate-400 line-through decoration-slate-300"
                                : "text-slate-700 font-medium"
                            }
                        `}
          >
            {todo.text}
          </span>
        )}

        {/* Metadata Row (Tags, Dates - Future proofing) */}
        {!isEditing && (
          <div className="h-0 group-hover:h-auto overflow-hidden transition-all" />
        )}
      </div>

      {/* Quick Actions */}
      <div
        className={`
                flex items-center gap-1 transition-all
                ${isEditing || isHovered ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"}
            `}
      >
        {isEditing ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100">
            <Loader2 size={12} className="animate-spin" />
            <span>Saving...</span>
          </div>
        ) : (
          <>
            <OS.Trigger onPress={StartEdit({ id: todo.id })}>
              <button
                type="button"
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Edit (Enter)"
              >
                <CornerDownLeft size={14} />
              </button>
            </OS.Trigger>

            <div className="w-px h-3 bg-slate-200 mx-1" />

            <OS.Trigger onPress={MoveItemUp({ focusId: todo.id })}>
              <button
                type="button"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Move Up (Cmd+Up)"
              >
                <ArrowUp size={14} />
              </button>
            </OS.Trigger>
            <OS.Trigger onPress={MoveItemDown({ focusId: todo.id })}>
              <button
                type="button"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                title="Move Down (Cmd+Down)"
              >
                <ArrowDown size={14} />
              </button>
            </OS.Trigger>

            <div className="w-px h-3 bg-slate-200 mx-1" />

            <OS.Trigger onPress={DeleteTodo({ id: todo.id })}>
              <button
                type="button"
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </OS.Trigger>
          </>
        )}
      </div>

      {/* Active Indicator Bar */}
      <div className="absolute left-0 top-3 bottom-3 w-1 bg-indigo-500 rounded-r-full opacity-0 data-[focused=true]:opacity-100 transition-opacity" />
    </OS.Item>
  );
}
