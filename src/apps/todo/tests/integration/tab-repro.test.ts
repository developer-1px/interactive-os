/**
 * Tab Issue Reproduction — Full page, sidebar ↔ list zone transition
 *
 * Issue: Tab doesn't work in the Todo app (browser).
 * Strategy: createPage(TodoApp, TodoPage) — full page projection,
 * 마지막 아이템에서 Tab을 눌러서 zone 전환되는지 관찰.
 */

import { afterEach, beforeEach, describe, it, vi } from "vitest";
import { TodoApp, addTodo } from "@apps/todo/app";
import { createPage } from "@os/defineApp.page";
import type { AppPage } from "@os/defineApp.types";
import { os } from "@/os/kernel";
import { dumpTransactions } from "@inspector/utils/dumpTransactions";
import TodoPage from "@/pages/TodoPage";

type TodoState = ReturnType<typeof TodoApp.create>["state"];
type Page = AppPage<TodoState>;

let page: Page;
let now = 9000;

beforeEach(() => {
    vi.spyOn(Date, "now").mockImplementation(() => ++now);
    page = createPage(TodoApp, TodoPage);
});

afterEach(() => {
    page.cleanup();
});

function addTodos(...texts: string[]): string[] {
    const before = new Set(page.state.data.todoOrder);
    for (const text of texts) {
        page.dispatch(addTodo({ text }));
    }
    return page.state.data.todoOrder.filter((id) => !before.has(id));
}

describe("Tab Issue — Full Page Reproduction", () => {
    it("Sidebar last item → Tab → should escape to list zone", () => {
        addTodos("Alpha", "Beta");

        const cats = page.state.data.categoryOrder;
        const lastCat = cats[cats.length - 1]!;

        // Register sidebar zone with items, focused on LAST item
        page.goto("sidebar", {
            items: cats,
            focusedItemId: lastCat,
        });

        // Also register list zone so there's somewhere to escape to
        const ids = page.state.data.todoOrder;
        page.goto("list", { items: ids, focusedItemId: ids[0] ?? null });

        // Go back to sidebar, last item
        page.goto("sidebar", { items: cats, focusedItemId: lastCat });

        os.inspector.clearTransactions();
        console.log(`\n[BEFORE] activeZone=${page.activeZoneId()}, focusedItem=${page.focusedItemId()}`);
        console.log(`[BEFORE] cats=${JSON.stringify(cats)}, lastCat=${lastCat}`);

        page.keyboard.press("Tab");

        console.log(`[AFTER Tab] activeZone=${page.activeZoneId()}, focusedItem=${page.focusedItemId()}`);
        dumpTransactions(os, "Sidebar last item → Tab");
    });

    it("List last item → Tab → should escape to sidebar zone", () => {
        const ids = addTodos("Alpha", "Beta");
        const lastId = ids[ids.length - 1]!;

        // Register both zones
        const cats = page.state.data.categoryOrder;
        page.goto("sidebar", { items: cats, focusedItemId: cats[0] ?? null });
        page.goto("list", { items: ids, focusedItemId: lastId });

        os.inspector.clearTransactions();
        console.log(`\n[BEFORE] activeZone=${page.activeZoneId()}, focusedItem=${page.focusedItemId()}`);
        console.log(`[BEFORE] ids=${JSON.stringify(ids)}, lastId=${lastId}`);

        page.keyboard.press("Tab");

        console.log(`[AFTER Tab] activeZone=${page.activeZoneId()}, focusedItem=${page.focusedItemId()}`);
        dumpTransactions(os, "List last item → Tab");
    });
});
