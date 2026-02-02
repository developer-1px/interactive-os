import { Zone } from "../lib/primitives/Zone";
import { useTodoEngine } from "../lib/todoEngine";
import { Item } from "../lib/primitives/Item";
import { ToggleTodo } from "../lib/todoCommands";
import { Check } from "lucide-react";
import { Trigger } from "../lib/primitives/Trigger";

export function BoardView() {
  const { state } = useTodoEngine();
  const { categoryOrder, categories, todos, todoOrder } = state.data;
  const { selectedCategoryId } = state.ui;
  // Note: focusId is no longer in state.ui, we use OS-level focus via Zone/Item

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 flex h-full gap-6 overflow-x-auto p-8 custom-scrollbar items-start">
        {categoryOrder.map((catId, index) => {
          const category = categories[catId];
          const activeColumn = selectedCategoryId === catId;

          // Filter todos for this category
          const catTodos = todoOrder
            .filter((id) => todos[id]?.categoryId === catId)
            .map((id) => todos[id]);

          // Dynamic Neighbors for Declarative Navigation
          const prevZone =
            index > 0 ? `board_col_${categoryOrder[index - 1]}` : "sidebar";
          const nextZone =
            index < categoryOrder.length - 1
              ? `board_col_${categoryOrder[index + 1]}`
              : undefined;

          return (
            <Zone
              key={catId}
              id={`board_col_${catId}`}
              area="boardView"
              neighbors={{ left: prevZone, right: nextZone }}
              items={[`board_col_${catId}_header`, ...catTodos.map((t) => String(t.id))]}
              layout="column" // Items in column stack vertically
            >
              <div
                // We treat the column container itself as a visual group
                className={`w-80 flex-shrink-0 flex flex-col max-h-full rounded-xl bg-white/[0.02] border transition-all duration-300
                                ${activeColumn ? "border-indigo-500/30 bg-indigo-500/[0.03]" : "border-white/5"}
                            `}
              >
                {/* Column Header (Focusable fallback) */}
                <Item id={`board_col_${catId}_header`} className="outline-none">
                  <div className="p-4 border-b border-white/5 flex justify-between items-center cursor-pointer hover:bg-white/5 transition-colors rounded-t-xl">
                    <h3
                      className={`font-medium text-sm tracking-wide ${activeColumn ? "text-indigo-300" : "text-slate-400"}`}
                    >
                      {category.text}
                    </h3>
                    <span className="text-xs font-mono text-slate-600 bg-white/5 px-2 py-1 rounded">
                      {catTodos.length}
                    </span>
                  </div>
                </Item>

                {/* Column Content */}
                <div className="p-3 space-y-3 flex-1 overflow-y-auto custom-scrollbar min-h-[100px]">
                  {catTodos.map((todo) => {
                    const isCompleted = todo.completed;

                    return (
                      <Item
                        key={todo.id}
                        id={todo.id}
                        className={`group flex flex-col gap-2 p-3 rounded-lg border border-transparent transition-all duration-200 relative bg-white/[0.02] hover:bg-white/[0.04]
                                                data-[active=true]:bg-indigo-500/20 data-[active=true]:border-indigo-500/30 data-[active=true]:shadow-lg
                                            `}
                      >
                        <div className="flex items-start gap-3">
                          <Trigger command={ToggleTodo({ id: todo.id })}>
                            <div
                              className={`w-4 h-4 mt-1 rounded border flex items-center justify-center transition-all cursor-pointer flex-shrink-0 
                                                        ${isCompleted
                                  ? "bg-indigo-500 border-indigo-500"
                                  : "border-slate-600 hover:border-slate-400"
                                }`}
                            >
                              {isCompleted && (
                                <Check
                                  size={10}
                                  className="text-white"
                                  strokeWidth={4}
                                />
                              )}
                            </div>
                          </Trigger>

                          <span
                            className={`text-sm leading-snug flex-1 ${isCompleted ? "text-slate-500 line-through" : "text-slate-200"}`}
                          >
                            {todo.text}
                          </span>
                        </div>

                        {/* Footer metadata could go here */}
                      </Item>
                    );
                  })}

                  {catTodos.length === 0 && (
                    <div className="h-20 flex items-center justify-center text-slate-600 text-xs italic">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            </Zone>
          );
        })}
      </div>
    </div>
  );
}
