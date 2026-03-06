/**
 * Shared test helpers for Todo headless integration tests.
 *
 * Provides setupTodoPage, addTodos, gotoList, gotoSidebar, gotoDraft, gotoEdit, gotoSearch.
 * Each test file imports these helpers + the section-specific tests.
 */

import { addTodo, startEdit, TodoApp } from "@apps/todo/app";
import { ListView } from "@apps/todo/widgets/ListView";
import { createPage } from "@os-devtool/testing/page";
import type { AppPageInternal } from "@os-sdk/app/defineApp/types";
import { _resetClipboardStore } from "@os-sdk/library/collection/createCollectionZone";
import { afterEach, beforeEach, vi } from "vitest";

type TodoState = ReturnType<typeof TodoApp.create>["state"];
export type TodoPage = AppPageInternal<TodoState>;

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

/** Helper: add N todos and return their NEW IDs only (setup dispatch — not under test) */
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
  page.goto("sidebar", { focusedItemId: focusedItemId ?? ids[0] ?? null });
}

/** Helper: goto draft zone (textbox field) */
export function gotoDraft() {
  page.goto("draft");
}

/** Helper: goto edit zone — sets up editing state for the given item (setup dispatch) */
export function gotoEdit(itemId: string) {
  page.dispatch(startEdit({ id: itemId }));
  page.goto("edit", { focusedItemId: itemId });
}

/** Helper: goto search zone (textbox field) */
export function gotoSearch() {
  page.goto("search");
}
