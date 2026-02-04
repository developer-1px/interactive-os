import { Zone } from "@os/ui/Zone";
import { Item } from "@os/ui/Item";
import { Field } from "@os/ui/Field";
import { Trigger } from "@os/ui/Trigger";
import { useEngine } from "@os/core/command/CommandContext";
import type { AppState } from "@apps/todo/model/types";
import {
    AddTodo,
    ToggleTodo,
    DeleteTodo,
    SyncEditDraft,
    UpdateTodoText,
    CancelEdit,
    StartEdit,
    SyncDraft,
} from "@apps/todo/features/commands/list";
import { ToggleView } from "@apps/todo/features/commands/board";
import {
    Plus,
    Check,
    CornerDownLeft,
    Trash2,
    Sparkles,
    Loader2,
    Kanban,
} from "lucide-react";

export function ListView() {
    const { state } = useEngine<AppState>();
    if (!state) return null;
    const activeCategory = state.data.categories[state.ui.selectedCategoryId];

    const visibleTodoIds = state.data.todoOrder.filter(
        (id) => state.data.todos[id]?.categoryId === state.ui.selectedCategoryId,
    );
    const visibleTodos = visibleTodoIds.map((id) => state.data.todos[id]);

    return (
        <div className="flex-1 flex flex-col h-full relative bg-white overflow-hidden">
            <Zone
                id="listView"
                area="listView"
                role="listbox"
            >
                <div className="p-12 pb-6 max-w-3xl mx-auto w-full flex-1 flex flex-col z-10">
                    <header className="mb-8 flex items-end justify-between border-b border-slate-100 pb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">
                                Tasks
                            </h2>
                            <p className="text-slate-500 font-medium text-sm">
                                {activeCategory?.text || "Inbox"}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                                {visibleTodos.filter((todo) => todo.completed).length} /{" "}
                                {visibleTodos.length} done
                            </div>
                            <Trigger command={ToggleView({})} asChild>
                                <button className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                                    <Kanban size={18} />
                                </button>
                            </Trigger>
                        </div>
                    </header>

                    <div className="space-y-2 pb-20 overflow-y-auto custom-scrollbar flex-1 pr-2">
                        {/* DRAFT ITEM */}
                        <Item
                            id="DRAFT"
                            className="group flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-white transition-all duration-75 relative mb-6 shadow-sm
                  data-[focused=true]:border-indigo-500 data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-500/30
              "
                        >
                            <div className="w-5 h-5 rounded-md border-2 border-slate-300 border-dashed flex-shrink-0 opacity-50 text-indigo-500 sticky top-0 flex items-center justify-center">
                                <Plus size={14} />
                            </div>
                            <Field
                                name="DRAFT"
                                value={state.ui.draft}
                                placeholder="What needs to be done?"
                                className="flex-1 bg-transparent outline-none text-base text-slate-900 placeholder:text-slate-400 font-medium"
                                syncCommand={SyncDraft({ text: "" })}
                                commitCommand={AddTodo({})}
                                commitOnBlur={false}
                                blurOnInactive={true}
                            />
                            <div className="opacity-0 group-data-[focused=true]:opacity-100 transition-opacity duration-75">
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 flex items-center gap-1">
                                    <CornerDownLeft size={10} /> ENTER
                                </span>
                            </div>
                        </Item>

                        {/* TODO ITEMS */}
                        {visibleTodos.map((todo) => {
                            const isEditing = state.ui.editingId === todo.id;
                            return (
                                <Item
                                    key={todo.id}
                                    id={todo.id}
                                    className={`group flex items-center gap-4 p-3.5 rounded-xl border transition-colors duration-75 relative
                      ${todo.completed ? "opacity-60 bg-slate-50 border-transparent" : "bg-white border-transparent hover:border-slate-200"}
                      data-[focused=true]:border-indigo-400 data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-400/20 data-[focused=true]:bg-indigo-50/10 data-[focused=true]:hover:border-indigo-400
                      ${isEditing && "bg-indigo-50 border-indigo-200"}
                  `}
                                >
                                    <Trigger command={ToggleTodo({ id: todo.id })}>
                                        <div
                                            className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-75 cursor-pointer flex-shrink-0 ${todo.completed
                                                ? "bg-indigo-600 border-indigo-600 shadow-sm shadow-indigo-200"
                                                : "border-slate-300 bg-white hover:border-indigo-400"
                                                }`}
                                        >
                                            {todo.completed && (
                                                <Check
                                                    size={12}
                                                    className="text-white"
                                                    strokeWidth={4}
                                                />
                                            )}
                                        </div>
                                    </Trigger>

                                    <div className="flex-1 min-w-0">
                                        {isEditing ? (
                                            <Field
                                                name="EDIT"
                                                value={state.ui.editDraft}
                                                active={true}
                                                autoFocus
                                                syncCommand={SyncEditDraft({ text: "" })}
                                                commitCommand={UpdateTodoText({})} // Enter saves
                                                cancelCommand={CancelEdit({})} // Esc cancels
                                                className="w-full bg-transparent outline-none text-slate-900 text-base font-medium border-b-2 border-indigo-500 pb-1"
                                                blurOnInactive={true}
                                            />
                                        ) : (
                                            <span
                                                className={`block truncate text-base transition-all duration-75 pointer-events-none ${todo.completed
                                                    ? "text-slate-400 line-through decoration-slate-300"
                                                    : "text-slate-700 font-medium"
                                                    }`}
                                            >
                                                {todo.text}
                                            </span>
                                        )}
                                    </div>

                                    {/* Action Hints */}
                                    <div className="opacity-0 group-data-[focused=true]:opacity-100 group-hover:opacity-100 flex items-center gap-3 transition-opacity duration-75">
                                        {!isEditing && (
                                            <>
                                                <Trigger
                                                    command={StartEdit({ id: todo.id })}
                                                    asChild
                                                >
                                                    <span className="text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors flex items-center gap-1 bg-slate-100 px-1.5 py-1 rounded">
                                                        <CornerDownLeft size={12} />
                                                    </span>
                                                </Trigger>
                                                <Trigger
                                                    command={DeleteTodo({ id: todo.id })}
                                                    asChild
                                                >
                                                    <span className="text-slate-400 cursor-pointer hover:text-red-500 transition-colors flex items-center gap-1 bg-slate-100 px-1.5 py-1 rounded">
                                                        <Trash2 size={12} />
                                                    </span>
                                                </Trigger>
                                            </>
                                        )}
                                        {isEditing && (
                                            <span className="text-indigo-600 flex items-center gap-1">
                                                <Loader2 size={12} className="animate-spin" />
                                            </span>
                                        )}
                                    </div>
                                </Item>
                            );
                        })}

                        {visibleTodos.length === 0 && (
                            <div className="py-20 flex flex-col items-center justify-center text-center opacity-40">
                                <div className="mb-4 text-slate-300">
                                    <Sparkles size={40} strokeWidth={1} />
                                </div>
                                <p className="text-slate-400 font-medium text-sm">No tasks in this list</p>
                            </div>
                        )}
                    </div>
                </div>
            </Zone>
        </div >
    );
}
