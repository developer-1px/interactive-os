/**
 * TodoPanelV3 — defineApp/createWidget version.
 */

import { TodoApp } from "@apps/todo/v3/app";
import { ListViewV3 } from "@apps/todo/widgets-v3/ListViewV3";
import { TodoToolbarV3 } from "@apps/todo/widgets-v3/TodoToolbarV3";

export function TodoPanelV3() {
    const state = TodoApp.useComputed((s) => s);

    if (!state || !state.ui) return null;

    return (
        <div className="flex flex-col h-full w-full bg-slate-50">
            <TodoToolbarV3 />
            <div className="flex-1 overflow-hidden relative">
                <ListViewV3 />
            </div>
        </div>
    );
}
