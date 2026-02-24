/**
 * Bulk Delete + Undo — Issue Reproduction
 *
 * Mission: bulk 삭제 후 undo 시 무슨 문제가 있는지 로그로 관찰.
 * Strategy: 3개 todo 생성 → 2개 bulk 선택 → 삭제 → undo → 상태 비교
 */

import {
  addTodo,
  confirmDeleteTodo,
  requestDeleteTodo,
  TodoApp,
  undoCommand,
} from "@apps/todo/app";
import { dumpTransactions } from "@inspector/utils/dumpTransactions";
import { createPage } from "@os/defineApp.page";
import type { AppPage } from "@os/defineApp.types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { os } from "@/os/kernel";
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

describe("Bulk Delete + Undo — Reproduction", () => {
  it("bulk delete 2 items → undo → should restore ALL 2 items", () => {
    const [a, b, c] = addTodos("Alpha", "Beta", "Gamma");

    console.log(`\n[SETUP] Created todos: ${JSON.stringify({ a, b, c })}`);
    console.log(
      `[SETUP] todoOrder: ${JSON.stringify(page.state.data.todoOrder)}`,
    );

    // Setup: go to list zone with all items
    page.goto("list", {
      items: [a!, b!, c!],
      focusedItemId: a!,
    });

    os.inspector.clearTransactions();

    // Step 1: Request delete for 2 items (bulk)
    console.log(`\n── Step 1: requestDeleteTodo([${a}, ${b}]) ──`);
    page.dispatch(requestDeleteTodo({ ids: [a!, b!] }));
    console.log(
      `pendingDeleteIds: ${JSON.stringify(page.state.ui.pendingDeleteIds)}`,
    );

    // Step 2: Confirm delete
    console.log(`\n── Step 2: confirmDeleteTodo ──`);
    page.dispatch(confirmDeleteTodo());

    const afterDelete = {
      todoOrder: [...page.state.data.todoOrder],
      todosKeys: Object.keys(page.state.data.todos),
      pendingDeleteIds: [...page.state.ui.pendingDeleteIds],
    };
    console.log(`[AFTER DELETE] ${JSON.stringify(afterDelete, null, 2)}`);

    dumpTransactions(os, "Delete Phase");

    // Step 3: Undo
    os.inspector.clearTransactions();
    console.log(`\n── Step 3: Undo ──`);
    page.dispatch(undoCommand());

    const afterUndo = {
      todoOrder: [...page.state.data.todoOrder],
      todosKeys: Object.keys(page.state.data.todos),
      todosTexts: Object.values(page.state.data.todos).map((t) => t.text),
    };
    console.log(`[AFTER UNDO] ${JSON.stringify(afterUndo, null, 2)}`);

    dumpTransactions(os, "Undo Phase");

    // Assertions: both items should be restored
    console.log(`\n── Verification ──`);
    console.log(`  Expected: ${a} and ${b} restored in todoOrder`);
    console.log(
      `  Actual todoOrder: ${JSON.stringify(page.state.data.todoOrder)}`,
    );
    console.log(`  Has ${a}: ${page.state.data.todoOrder.includes(a!)}`);
    console.log(`  Has ${b}: ${page.state.data.todoOrder.includes(b!)}`);
    console.log(`  Has ${c}: ${page.state.data.todoOrder.includes(c!)}`);

    // These assertions capture the expected behavior
    expect(page.state.data.todoOrder).toContain(a);
    expect(page.state.data.todoOrder).toContain(b);
    expect(page.state.data.todoOrder).toContain(c);
    expect(Object.keys(page.state.data.todos)).toContain(a);
    expect(Object.keys(page.state.data.todos)).toContain(b);
  });
});
