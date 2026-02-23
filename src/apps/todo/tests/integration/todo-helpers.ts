/**
 * Shared test helpers for Todo BDD integration tests.
 *
 * Provides createTodoPage, addTodos, gotoList, gotoSidebar.
 * Each test file imports these helpers + the section-specific tests.
 */

import { beforeEach, afterEach, vi } from "vitest";
import {
    TodoApp,
    addTodo,
} from "@apps/todo/app";
import { ListView } from "@apps/todo/widgets/ListView";
import { createPage } from "@os/defineApp.page";
import type { AppPage } from "@os/defineApp.types";
import { _resetClipboardStore } from "@/os/collection/createCollectionZone";

type TodoState = ReturnType<typeof TodoApp.create>["state"];
export type TodoPage = AppPage<TodoState>;

export let page: TodoPage;
let now = 1000;

export function setupTodoPage() {
    beforeEach(() => {
        vi.spyOn(Date, "now").mockImplementation(() => ++now);
        _resetClipboardStore();
        page = createPage(TodoApp, ListView);
    });

    afterEach(() => {
        page.cleanup();
    });
}

/** Helper: add N todos and return their NEW IDs only */
export function addTodos(...texts: string[]): string[] {
    const before = new Set(page.state.data.todoOrder);
    for (const text of texts) {
        page.dispatch(addTodo({ text }));
    }
    return page.state.data.todoOrder.filter((id) => !before.has(id));
}

/** Helper: goto list zone */
export function gotoList(focusedItemId?: string | null) {
    const ids = page.state.data.todoOrder;
    page.goto("list", { focusedItemId: focusedItemId ?? ids[0] ?? null });
}

/** Helper: goto sidebar zone */
export function gotoSidebar(focusedItemId?: string | null) {
    const ids = page.state.data.categoryOrder;
    page.goto("sidebar", {
        focusedItemId: focusedItemId ?? ids[0] ?? null,
        config: {
            select: {
                followFocus: true,
                mode: "single",
                disallowEmpty: false,
                range: false,
                toggle: false,
            },
        },
    });
}
