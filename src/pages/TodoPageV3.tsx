/**
 * TodoPageV3 — defineApp-based Todo page.
 * Uses TodoApp + Widgets (no manual Zone bindings in widgets).
 */

import { usePlaywrightSpecs } from "@inspector/testbot/playwright/loader";
import { SidebarV3 } from "@apps/todo/widgets-v3/SidebarV3";
import { TodoPanelV3 } from "@apps/todo/widgets-v3/TodoPanelV3";
import { OS } from "@os/AntigravityOS";
// Playwright spec — vite-plugin shim transforms for browser replay
// @ts-expect-error
import runTodoSpec from "../../e2e/todo/todo.spec.ts";

export default function TodoPageV3() {
    usePlaywrightSpecs("pw-todo-v3", [runTodoSpec]);

    return (
        <OS.Zone id="main" role="toolbar" className="h-full flex">
            <SidebarV3 />
            <TodoPanelV3 />
        </OS.Zone>
    );
}
