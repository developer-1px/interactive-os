/**
 * Todo — Headless Interaction Tests
 *
 * Uses createPage(TodoApp) to verify OS-level interaction.
 * Goal: Find OS gaps by dogfooding the headless test API.
 *
 * Known OS Gaps (recorded in docs/5-backlog/todo-dogfooding-os-gaps.md):
 * - Gap 1: goto() doesn't auto-focus first item (must pass focusedItemId manually)
 * - Gap 2: inputmap (Space → OS_CHECK) not applied in headless
 * - Gap 3: AppPage lacks zone() accessor
 */

import { type AppPage, createPage } from "@os-devtool/testing/page";
import { beforeEach, describe, expect, it } from "vitest";
import {
  addTodo,
  TodoApp,
} from "@apps/todo/app";
import type { AppState } from "@apps/todo/model/appState";

/** Helper: goto a zone with auto-focus on first item (workaround for Gap 1) */
function gotoWithFocus(page: AppPage<AppState>, zoneId: string) {
  page.goto(zoneId);
  // Gap 1 workaround: manually read items and set focus to first
  const items = getZoneItems(page, zoneId);
  if (items.length > 0 && page.focusedItemId(zoneId) === null) {
    page.goto(zoneId, { focusedItemId: items[0] });
  }
}

/** Helper: get zone items from app state */
function getZoneItems(page: AppPage<AppState>, zoneId: string): string[] {
  if (zoneId === "list") {
    return page.state.data.todoOrder.filter((id) => {
      const todo = page.state.data.todos[id];
      return todo && todo.categoryId === page.state.ui.selectedCategoryId;
    });
  }
  if (zoneId === "sidebar") {
    return page.state.data.categoryOrder;
  }
  return [];
}

describe("Todo Headless — Zone Navigation", () => {
  let page: AppPage<AppState>;

  beforeEach(() => {
    page = createPage(TodoApp);
  });

  it("can goto the list zone", () => {
    page.goto("list");
    expect(page.activeZoneId()).toBe("list");
  });

  it("can goto the sidebar zone", () => {
    page.goto("sidebar");
    expect(page.activeZoneId()).toBe("sidebar");
  });

  it("can goto the draft zone", () => {
    page.goto("draft");
    expect(page.activeZoneId()).toBe("draft");
  });
});

describe("Todo Headless — List Interaction", () => {
  let page: AppPage<AppState>;

  beforeEach(() => {
    page = createPage(TodoApp);
    page.dispatch(addTodo({ text: "Task A" }));
    page.dispatch(addTodo({ text: "Task B" }));
    page.dispatch(addTodo({ text: "Task C" }));
    gotoWithFocus(page, "list");
  });

  it("has a focused item after goto", () => {
    expect(page.focusedItemId("list")).not.toBeNull();
  });

  it("arrow down moves focus to next item", () => {
    const firstId = page.focusedItemId("list");
    page.keyboard.press("ArrowDown");
    const secondId = page.focusedItemId("list");
    expect(secondId).not.toBe(firstId);
  });

  it("arrow up moves focus to previous item", () => {
    page.keyboard.press("ArrowDown");
    const secondId = page.focusedItemId("list");
    page.keyboard.press("ArrowUp");
    const backToFirst = page.focusedItemId("list");
    expect(backToFirst).not.toBe(secondId);
  });

  it("Enter triggers onAction (startEdit)", () => {
    const focusId = page.focusedItemId("list")!;
    page.keyboard.press("Enter");
    expect(page.state.ui.editingId).toBe(focusId);
  });

  // Gap 2: Space → OS_CHECK mapping not applied in headless
  // This test documents the gap — Space dispatches OS_SELECT instead of OS_CHECK
  it.skip("Space triggers onCheck (toggleTodo) — BLOCKED by Gap 2: inputmap not applied in headless", () => {
    const focusId = page.focusedItemId("list")!;
    const wasBefore = page.state.data.todos[focusId]?.completed;
    page.keyboard.press("Space");
    expect(page.state.data.todos[focusId]?.completed).toBe(!wasBefore);
  });

  it("click on item sets focus", () => {
    const items = getZoneItems(page, "list");
    if (items.length > 1) {
      const secondId = items[1]!;
      page.click(secondId);
      expect(page.focusedItemId("list")).toBe(secondId);
    }
  });

  it("Delete key triggers requestDeleteTodo", () => {
    const focusId = page.focusedItemId("list")!;
    page.keyboard.press("Delete");
    expect(page.state.ui.pendingDeleteIds).toContain(focusId);
  });
});

describe("Todo Headless — Sidebar Interaction", () => {
  let page: AppPage<AppState>;

  beforeEach(() => {
    page = createPage(TodoApp);
    gotoWithFocus(page, "sidebar");
  });

  it("has a focused item after goto", () => {
    expect(page.focusedItemId("sidebar")).not.toBeNull();
  });

  it("Enter on category selects it", () => {
    const focusId = page.focusedItemId("sidebar")!;
    page.keyboard.press("Enter");
    expect(page.state.ui.selectedCategoryId).toBe(focusId);
  });

  it("arrow down navigates categories", () => {
    const firstId = page.focusedItemId("sidebar");
    page.keyboard.press("ArrowDown");
    expect(page.focusedItemId("sidebar")).not.toBe(firstId);
  });
});

describe("Todo Headless — Selection", () => {
  let page: AppPage<AppState>;

  beforeEach(() => {
    page = createPage(TodoApp);
    page.dispatch(addTodo({ text: "Select A" }));
    page.dispatch(addTodo({ text: "Select B" }));
    gotoWithFocus(page, "list");
  });

  it("Shift+ArrowDown extends selection", () => {
    page.keyboard.press("Shift+ArrowDown");
    const selection = page.selection("list");
    expect(selection.length).toBeGreaterThanOrEqual(1);
  });
});
