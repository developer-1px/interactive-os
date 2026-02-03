import { OS } from "@os/ui";
import { useTodoEngine } from "@apps/todo/lib/todoEngine";
import { ToggleTodo } from "@apps/todo/features/commands/list";
import { ToggleView } from "@apps/todo/features/commands/board";
import { Check, List } from "lucide-react";

export function BoardView() {
  const { state } = useTodoEngine();
  const { categoryOrder, categories, todos, todoOrder } = state.data;
  const { selectedCategoryId } = state.ui;
  const activeCategory = categories[selectedCategoryId];

  return (
    <div className="flex-1 flex flex-col h-full relative bg-white overflow-hidden">
      <div className="p-12 pb-6 max-w-[1600px] mx-auto w-full flex-1 flex flex-col z-10">
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
            <OS.Trigger command={ToggleView({})} asChild>
              <button className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <List size={18} />
              </button>
            </OS.Trigger>
          </div>
        </header>

        <div className="flex-1 overflow-hidden -mx-12 px-12 pb-12">
          <div className="flex-1 flex h-full gap-6 overflow-x-auto custom-scrollbar items-start bg-white">
            {/* Top-Level Board Zone: Spatial Navigation between Columns */}
            <OS.Zone
              id="board"
              strategy="spatial"
              preset="seamless"
              layout="row"
              area="boardView"
            >
              {categoryOrder.map((categoryId) => {
                const category = categories[categoryId];
                const activeColumn = selectedCategoryId === categoryId;
                const categoryTodos = todoOrder
                  .filter((id) => todos[id]?.categoryId === categoryId)
                  .map((id) => todos[id]);

                return (
                  <OS.Zone
                    key={categoryId}
                    id={`col-${categoryId}`}
                    focusable
                    payload={category}
                    strategy="roving"
                    preset="seamless"
                    layout="column"
                    area="boardView"
                    className={`w-80 flex-shrink-0 flex flex-col max-h-full rounded-2xl bg-slate-50/50 border transition-colors duration-200 outline-none
                              ${activeColumn ? "border-indigo-200 bg-white" : "border-slate-100"}
                          `}
                  >
                    {/* Column Header */}
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors rounded-t-2xl">
                      <h3 className={`font-black text-xs uppercase tracking-widest ${activeColumn ? "text-indigo-600" : "text-slate-400"}`}>
                        {category.text}
                      </h3>
                      <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                        {categoryTodos.length}
                      </span>
                    </div>

                    {/* Card List */}
                    <div className="p-4 space-y-3 flex-1 overflow-y-auto custom-scrollbar min-h-[100px]">
                      {categoryTodos.map((todo) => {
                        const isCompleted = todo.completed;
                        return (
                          <OS.Item
                            key={todo.id}
                            id={todo.id}
                            payload={todo}
                            className="outline-none"
                          >
                            {({ isFocused, isSelected }) => (
                              <div
                                className={`group flex flex-col gap-2 p-4 rounded-xl border transition-colors duration-200 relative bg-white
                                  ${isFocused ? "border-indigo-500 ring-2 ring-indigo-200" : "border-slate-100 hover:border-indigo-100"}
                                  ${isSelected ? "bg-indigo-50" : ""}
                                `}
                              >
                                <div className="flex items-start gap-3">
                                  <OS.Trigger
                                    command={ToggleTodo({ id: todo.id })}
                                    className={`w-5 h-5 mt-0.5 rounded-lg border flex items-center justify-center transition-all cursor-pointer flex-shrink-0 
                                          ${isCompleted ? "bg-indigo-600 border-indigo-600 shadow-sm shadow-indigo-200" : "border-slate-300 bg-slate-50 hover:border-indigo-400"}`}
                                  >
                                    {isCompleted && <Check size={12} className="text-white" strokeWidth={4} />}
                                  </OS.Trigger>

                                  <OS.Field
                                    value={todo.text}
                                    name={`todo-${todo.id}`}
                                    active={false}
                                    className={`text-[14px] font-medium leading-relaxed flex-1 bg-transparent border-none p-0 focus:ring-0 ${isCompleted ? "text-slate-400 line-through" : "text-slate-700 font-semibold"}`}
                                  />
                                </div>
                              </div>
                            )}
                          </OS.Item>
                        );
                      })}
                      {categoryTodos.length === 0 && (
                        <div className="h-24 flex flex-col items-center justify-center text-slate-300 gap-2 border-2 border-dashed border-slate-100 rounded-2xl">
                          <span className="text-[10px] font-black uppercase tracking-widest">Empty Space</span>
                        </div>
                      )}
                    </div>
                  </OS.Zone>
                );
              })}
            </OS.Zone>
          </div>
        </div>
      </div>
    </div>
  );
}
