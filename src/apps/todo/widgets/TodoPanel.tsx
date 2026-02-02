import { Zone } from "@os/ui/Zone";
import { Item } from "@os/ui/Item";
import { Field } from "@os/ui/Field";
import { Trigger } from "@os/ui/Trigger";
import { useTodoEngine } from "@apps/todo/lib/todoEngine";
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
    List,
} from "lucide-react";
import { BoardView } from "@apps/todo/widgets/BoardView";

export function TodoPanel() {
    const { state } = useTodoEngine();

    // Derived View based on Order & Lookup
    const visibleTodoIds = state.data.todoOrder.filter(
        (id) => state.data.todos[id]?.categoryId === state.ui.selectedCategoryId,
    );
    const visibleTodos = visibleTodoIds.map((id) => state.data.todos[id]);

    const activeCategory = state.data.categories[state.ui.selectedCategoryId];
    const isBoard = state.ui.viewMode === "board";

    return (
        <>
            {isBoard ? (
                // Board View manages its own Zones (Columns)
                <div className="flex-1 flex flex-col h-full relative bg-[#090A0C] overflow-hidden">
                    {/* Ambient Background */}
                    <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />
                    <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />

                    <div className="p-12 pb-6 max-w-3xl mx-auto w-full flex-1 flex flex-col z-10">
                        <header className="mb-10 flex items-end justify-between border-b border-white/5 pb-6">
                            <div>
                                <h2 className="text-4xl font-light text-white tracking-tight mb-2">
                                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                                        Tasks
                                    </span>
                                </h2>
                                <p className="text-slate-500 font-medium text-sm">
                                    {activeCategory?.text || "Inbox"}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                                <Trigger command={ToggleView({})} asChild>
                                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                                        <List size={18} />
                                    </button>
                                </Trigger>
                            </div>
                        </header>

                        <div className="flex-1 overflow-hidden -mx-12 px-12 pb-12">
                            <BoardView />
                        </div>
                    </div>
                </div>
            ) : (
                <Zone
                    id="listView"
                    area="main"
                    defaultFocusId="DRAFT"
                    neighbors={{ left: "sidebar" }}
                    items={["DRAFT", ...visibleTodoIds.map(String)]}
                    layout="column"
                >
                    <div className="flex-1 flex flex-col h-full relative bg-[#090A0C] overflow-hidden">
                        {/* Ambient Background */}
                        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />
                        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none" />

                        <div className="p-12 pb-6 max-w-3xl mx-auto w-full flex-1 flex flex-col z-10">
                            <header className="mb-10 flex items-end justify-between border-b border-white/5 pb-6">
                                <div>
                                    <h2 className="text-4xl font-light text-white tracking-tight mb-2">
                                        <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                                            Tasks
                                        </span>
                                    </h2>
                                    <p className="text-slate-500 font-medium text-sm">
                                        {activeCategory?.text || "Inbox"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-xs font-mono text-slate-600 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                        {visibleTodos.filter((t) => t.completed).length} /{" "}
                                        {visibleTodos.length} done
                                    </div>
                                    <Trigger command={ToggleView({})} asChild>
                                        <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                                            <Kanban size={18} />
                                        </button>
                                    </Trigger>
                                </div>
                            </header>

                            <div className="space-y-3 pb-20 overflow-y-auto custom-scrollbar flex-1 pr-2">
                                {/* DRAFT ITEM */}
                                <Item
                                    id="DRAFT"
                                    className="group flex items-center gap-4 p-4 rounded-2xl border border-white/5 bg-white/[0.02] transition-all duration-300 relative overflow-hidden
                                        data-[active=true]:bg-indigo-500/5
                                        before:absolute before:left-0 before:top-4 before:bottom-4 before:w-[3px] before:bg-indigo-400 before:rounded-r-full before:opacity-0 data-[active=true]:before:opacity-100 before:transition-opacity
                                    "
                                >
                                    <div className="w-5 h-5 rounded-md border-2 border-slate-700 border-dashed flex-shrink-0 opacity-50 text-indigo-400 sticky top-0 flex items-center justify-center">
                                        <Plus size={14} />
                                    </div>
                                    <Field
                                        name="DRAFT"
                                        value={state.ui.draft}
                                        placeholder="What needs to be done?"
                                        className="flex-1 bg-transparent outline-none text-lg text-white placeholder:text-slate-600 font-medium"
                                        syncCommand={SyncDraft({ text: "" })}
                                        commitCommand={AddTodo({})}
                                        commitOnBlur={false}
                                        blurOnInactive={true}
                                    />
                                    <div className="opacity-0 group-data-[active=true]:opacity-100 transition-opacity">
                                        <span className="text-[10px] font-bold text-indigo-300 bg-indigo-500/20 px-2 py-1 rounded border border-indigo-500/20 flex items-center gap-1">
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
                                            className={`group flex items-center gap-4 p-4 rounded-lg transition-all duration-200 relative
                                                ${todo.completed ? "opacity-60" : "opacity-100"}
                                                data-[active=true]:bg-white/[0.03]
                                                before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-indigo-500/50 before:rounded-r-full before:opacity-0 data-[active=true]:before:opacity-100 before:transition-opacity
                                                ${!isEditing && "border border-transparent"}
                                                ${isEditing && "bg-indigo-900/20"}
                                            `}
                                        >
                                            <Trigger command={ToggleTodo({ id: todo.id })}>
                                                <div
                                                    className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all duration-300 cursor-pointer flex-shrink-0 ${todo.completed
                                                        ? "bg-indigo-500 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)] scale-110"
                                                        : "border-slate-600 bg-transparent"
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
                                                        className="w-full bg-transparent outline-none text-white text-lg font-medium border-b border-indigo-500/50 pb-1"
                                                        blurOnInactive={true}
                                                    />
                                                ) : (
                                                    <span
                                                        className={`block truncate text-lg transition-all duration-300 pointer-events-none ${todo.completed
                                                            ? "text-slate-500 line-through decoration-slate-600"
                                                            : "text-slate-200 font-medium"
                                                            }`}
                                                    >
                                                        {todo.text}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Action Hints */}
                                            <div className="opacity-0 group-data-[active=true]:opacity-100 flex items-center gap-3 transition-opacity duration-200">
                                                {!isEditing && (
                                                    <>
                                                        <Trigger
                                                            command={StartEdit({ id: todo.id })}
                                                            asChild
                                                        >
                                                            <span className="text-slate-500 cursor-pointer hover:text-indigo-400 transition-colors flex items-center gap-1 bg-white/5 px-1.5 py-1 rounded">
                                                                <CornerDownLeft size={12} />
                                                            </span>
                                                        </Trigger>
                                                        <Trigger
                                                            command={DeleteTodo({ id: todo.id })}
                                                            asChild
                                                        >
                                                            <span className="text-slate-500 cursor-pointer hover:text-red-400 transition-colors flex items-center gap-1 bg-white/5 px-1.5 py-1 rounded">
                                                                <Trash2 size={12} />
                                                            </span>
                                                        </Trigger>
                                                    </>
                                                )}
                                                {isEditing && (
                                                    <span className="text-indigo-300 animate-pulse flex items-center gap-1">
                                                        <Loader2 size={12} className="animate-spin" />
                                                    </span>
                                                )}
                                            </div>
                                        </Item>
                                    );
                                })}

                                {visibleTodos.length === 0 && (
                                    <div className="py-20 flex flex-col items-center justify-center text-center opacity-30">
                                        <div className="mb-4 text-slate-500">
                                            <Sparkles size={48} strokeWidth={1} />
                                        </div>
                                        <p className="text-slate-400 font-light">Zone Empty</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Zone>
            )}
        </>
    );
}
