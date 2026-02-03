import { useTodoEngine } from "@apps/todo/lib/todoEngine";
import { BoardView } from "@apps/todo/widgets/BoardView";
import { ListView } from "@apps/todo/widgets/ListView";

/**
 * TodoPanel: Switching container for List/Board views.
 * The 'main' Zone is now provided by TodoAppShell for global consistency.
 */
export function TodoPanel() {
    const { state } = useTodoEngine();
    const isBoard = state.ui.viewMode === "board";

    return isBoard ? <BoardView /> : <ListView />;
}
