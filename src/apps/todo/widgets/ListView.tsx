/**
 * ListView Test - Pure Primitives Only
 * 
 * Testing if FocusGroup > FocusItem works without facades.
 */

import { FocusGroup } from "@os/features/focus/primitives/FocusGroup";
import { FocusItem } from "@os/features/focus/primitives/FocusItem";
import { useEngine } from "@os/features/command/ui/CommandContext";
import type { AppState } from "@apps/todo/model/types";

export function ListView() {
    const { state } = useEngine<AppState>();
    if (!state || !state.data) return null;

    const visibleTodoIds = state.data.todoOrder.filter(
        (id) => state.data.todos[id]?.categoryId === state.ui.selectedCategoryId,
    );
    const visibleTodos = visibleTodoIds.map((id) => state.data.todos[id]);

    return (
        <div className="flex-1 flex flex-col h-full relative bg-white overflow-hidden font-sans">
            <FocusGroup
                id="listView"
                role="listbox"
                navigate={{ entry: 'restore', orientation: 'vertical' }}
                className="flex flex-col h-full"
            >
                <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full z-10 p-8 sm:p-12 pb-6">
                    {/* Header */}
                    <header className="mb-8">
                        <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
                            Tasks
                        </h2>
                        <p className="text-slate-500 text-sm font-medium">Manage your daily priorities</p>
                    </header>

                    <div className="flex-1 overflow-y-auto space-y-2">
                        {/* Draft Item */}
                        <FocusItem
                            id="DRAFT"
                            className="group flex items-center gap-4 p-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 transition-all cursor-text text-slate-500 hover:text-indigo-600"
                        >
                            <span className="text-sm font-medium">Add a new task...</span>
                        </FocusItem>

                        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-4" />

                        {/* Task Items */}
                        <div className="space-y-2.5">
                            {visibleTodos.map((todo) => (
                                <FocusItem
                                    key={todo.id}
                                    id={String(todo.id)}
                                    // Note: Visuals are handled by TaskItem, but FocusItem wraps it? 
                                    // Wait, ListView uses FocusItem directly but wrapped content? 
                                    // Actually, ListView implementation in step 22 shows it maps visibleTodos to FocusItem with inline content.
                                    // But Reference says TaskItem encapsulates ZIFT.
                                    // Let's check ListView again. Step 22 shows it effectively inlining the content basically recreating TaskItem simplified?
                                    // Wait, line 50 in Step 22: visibleTodos.map... FocusItem...
                                    // This seems to be a "Primitive Test" version as stated in the comment.
                                    // The plan said "Remove Primitive Test text".
                                    // Should I use TaskItem here instead?
                                    // The Ref Implementation Overview (Step 12) says "ListView... Renders visibleTodos as a list of <TaskItem> components."
                                    // But Step 22 content shows it using inline FocusItem.
                                    // This matches "Primitive Test" description.
                                    // I should probably switch to using TaskItem if I want "Premium Design" or at least style this inline version to match TaskItem.
                                    // Given the goal is "Refine Design", I should probably use the TaskItem component if available and meant to be used, OR make this inline version look good.
                                    // Since TaskItem.tsx exists and is used in BoardView, I should probably use it here too for consistency?
                                    // But `ListView.tsx` explicitly says "Primitive Test - Pure Primitives Only".
                                    // If I just style it to look good, I maintain the "Primitive Test" nature but make it look like a real app.
                                    // Let's stick to styling for now, but I will import TaskItem if I can. 
                                    // Actually, let's look at TaskItem again. It wraps Item. FocusItem is an alias or primitive? 
                                    // FocusItem is from @os/features/focus/primitives/FocusItem. TaskItem uses Item from export/primitives/Item.
                                    // They are likely compatible.
                                    // However, simpler is to just use TaskItem.
                                    // But `ListView` in step 22 is explicitly a test of "FocusGroup > FocusItem without facades".
                                    // I will stick to improving the styles in-place to respect the "Primitive Test" architectural goal, but make it LOOK premium.

                                    className={`
                                        group flex items-center gap-4 p-4 rounded-xl border transition-all duration-200
                                        ${todo.completed
                                            ? "bg-slate-50 border-transparent opacity-60"
                                            : "bg-white border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md"
                                        }
                                        outline-none
                                        data-[focused=true]:ring-2 data-[focused=true]:ring-indigo-500 data-[focused=true]:border-indigo-500 data-[focused=true]:z-10
                                    `}
                                >
                                    {/* Checkbox */}
                                    <div className={`
                                        w-5 h-5 rounded-full border-[1.5px] flex items-center justify-center transition-colors
                                        ${todo.completed ? "bg-indigo-600 border-indigo-600" : "border-slate-300 group-hover:border-indigo-400"}
                                    `}>
                                        {todo.completed && <span className="text-white text-[10px] font-bold">✓</span>}
                                    </div>

                                    {/* Text */}
                                    <span className={`text-[15px] ${todo.completed ? "line-through text-slate-400 decoration-slate-300" : "text-slate-700 font-medium"}`}>
                                        {todo.text}
                                    </span>
                                </FocusItem>
                            ))}
                        </div>

                        {visibleTodos.length === 0 && (
                            <div className="py-24 flex flex-col items-center justify-center text-center">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <span className="text-2xl opacity-20">📝</span>
                                </div>
                                <h3 className="text-slate-900 font-semibold mb-1">No tasks in this list</h3>
                                <p className="text-slate-500 text-sm">Create a new task to get started.</p>
                            </div>
                        )}
                    </div>
                </div>
            </FocusGroup>
        </div>
    );
}
