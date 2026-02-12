import { todoSlice } from "@apps/todo/app";
import { BoardView } from "@apps/todo/widgets/BoardView";
import { ListView } from "@apps/todo/widgets/ListView";
import { TodoToolbar } from "@apps/todo/widgets/TodoToolbar";

/**
 * TodoPanel: Switching container for List/Board views.
 * The 'main' Zone is now provided by TodoAppShell for global consistency.
 */
export function TodoPanel() {
  const state = todoSlice.useComputed((s) => s);

  if (!state || !state.ui) return null;

  const isBoard = state.ui.viewMode === "board";

  return (
    <div className="flex flex-col h-full w-full bg-slate-50">
      <TodoToolbar />
      <div className="flex-1 overflow-hidden relative">
        {isBoard ? <BoardView /> : <ListView />}
      </div>
    </div>
  );
}
