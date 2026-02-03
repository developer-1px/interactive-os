import { useEngine } from "@os/core/command/CommandContext";
import { BoardView } from "@apps/todo/widgets/BoardView";
import { ListView } from "@apps/todo/widgets/ListView";
import type { AppState } from "@apps/todo/model/types";

/**
 * TodoPanel: Switching container for List/Board views.
 * The 'main' Zone is now provided by TodoAppShell for global consistency.
 */
export function TodoPanel() {
    const { state } = useEngine<AppState>();
    if (!state) return null;
    const isBoard = state.ui.viewMode === "board";

    return isBoard ? <BoardView /> : <ListView />;
}
