/**
 * Todo Headless Playground
 *
 * Renders the full Todo app with headless TestBot tests registered.
 * Open the TestBot inspector panel to run all headless state-transition tests.
 */

import { useTodoHeadlessBotRoutes } from "@apps/todo/tests/TodoHeadlessBot";
import { Sidebar } from "@apps/todo/widgets/Sidebar";
import { TodoPanel } from "@apps/todo/widgets/TodoPanel";
import { Zone } from "@os/6-components/primitives/Zone.tsx";

export default function TodoHeadlessPlaygroundPage() {
    useTodoHeadlessBotRoutes();

    return (
        <Zone id="main" role="toolbar" className="h-full flex">
            <Sidebar />
            <TodoPanel />
        </Zone>
    );
}
