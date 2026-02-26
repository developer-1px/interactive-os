/**
 * OS AppPage — Integration Test
 *
 * Verifies that defineApp.createPage() provides a Playwright-isomorphic
 * headless integration test interface.
 *
 * "Same test code, different runtime."
 *
 * RED phase: these tests define the desired API.
 * The implementation (defineApp.page.ts) does not exist yet.
 */

// ── Todo App imports ──
import { addTodo, TodoApp } from "@apps/todo/app";
import { selectVisibleTodoIds } from "@apps/todo/selectors";
import { createPage } from "@os/defineApp.page";
import { describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// S1: Page creation + basic structure
// ═══════════════════════════════════════════════════════════════════

describe("AppPage: Factory", () => {
  it("createPage returns a AppPage with keyboard, click, attrs, goto", () => {
    const page = createPage(TodoApp);

    expect(page).toBeDefined();
    expect(page.keyboard).toBeDefined();
    expect(typeof page.keyboard.press).toBe("function");
    expect(typeof page.click).toBe("function");
    expect(typeof page.attrs).toBe("function");
    expect(typeof page.goto).toBe("function");
    expect(typeof page.focusedItemId).toBe("function");
    expect(typeof page.selection).toBe("function");
    expect(page.state).toBeDefined();
  });

  it("createPage uses preview sandbox — dispatch writes to preview, not production", () => {
    const page = createPage(TodoApp);
    const initialCount = Object.keys(page.state.data.todos).length;

    page.dispatch(addTodo({ text: "Preview only" }));

    expect(Object.keys(page.state.data.todos).length).toBe(initialCount + 1);

    // After cleanup, preview is cleared and production state is restored
    page.cleanup();
  });
});

// ═══════════════════════════════════════════════════════════════════
// S2: goto + navigation
// ═══════════════════════════════════════════════════════════════════

describe("AppPage: Navigation", () => {
  it("goto activates a zone and sets items", () => {
    const page = createPage(TodoApp);

    // Add some todos to get IDs
    page.dispatch(addTodo({ text: "Alpha" }));
    page.dispatch(addTodo({ text: "Beta" }));
    page.dispatch(addTodo({ text: "Charlie" }));



    // Navigate to the list zone
    page.goto("list");

    // Zone should be active
    expect(page.activeZoneId()).toBe("list");
  });

  it("keyboard.press ArrowDown navigates focus", () => {
    const page = createPage(TodoApp);

    page.dispatch(addTodo({ text: "Alpha" }));
    page.dispatch(addTodo({ text: "Beta" }));
    page.dispatch(addTodo({ text: "Charlie" }));

    // Use visible (filtered) IDs — getItems applies config.filter
    const ids = selectVisibleTodoIds(page.state);
    page.goto("list", { focusedItemId: ids[0] ?? null });

    page.keyboard.press("ArrowDown");

    expect(page.focusedItemId()).toBe(ids[1]);
  });

  it("attrs returns correct ARIA attributes", () => {
    const page = createPage(TodoApp);

    page.dispatch(addTodo({ text: "Alpha" }));
    page.dispatch(addTodo({ text: "Beta" }));

    const ids = selectVisibleTodoIds(page.state);
    page.goto("list", { focusedItemId: ids[0] ?? null });

    // Focused item has tabIndex 0
    expect(page.attrs(ids[0]!).tabIndex).toBe(0);
    // Non-focused item has tabIndex -1
    expect(page.attrs(ids[1]!).tabIndex).toBe(-1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// S3: click
// ═══════════════════════════════════════════════════════════════════

describe("AppPage: Click", () => {
  it("click focuses and selects an item", () => {
    const page = createPage(TodoApp);

    page.dispatch(addTodo({ text: "Alpha" }));
    page.dispatch(addTodo({ text: "Beta" }));

    const ids = selectVisibleTodoIds(page.state);
    page.goto("list", { focusedItemId: ids[0] ?? null });

    page.click(ids[1]!);

    expect(page.focusedItemId()).toBe(ids[1]);
    expect(page.attrs(ids[1]!)["aria-selected"]).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// S4: Full Stack — keyboard triggers app commands
// ═══════════════════════════════════════════════════════════════════

describe("AppPage: Full Stack Integration", () => {
  it("Space toggles todo completed (onCheck)", () => {
    const page = createPage(TodoApp);

    page.dispatch(addTodo({ text: "Toggle me" }));
    const ids = selectVisibleTodoIds(page.state);
    const id = ids[ids.length - 1]!; // last added

    page.goto("list", { focusedItemId: id });

    // Space → onCheck → toggleTodo
    page.keyboard.press("Space");

    expect(page.state.data.todos[id]?.completed).toBe(true);
  });

  it("Enter starts edit (onAction)", () => {
    const page = createPage(TodoApp);

    page.dispatch(addTodo({ text: "Edit me" }));
    const ids = selectVisibleTodoIds(page.state);
    const id = ids[ids.length - 1]!;

    page.goto("list", { focusedItemId: id });

    // Enter → onAction → startEdit
    page.keyboard.press("Enter");

    expect(page.state.ui.editingId).toBe(id);
  });

  it("Delete requests delete (onDelete)", () => {
    const page = createPage(TodoApp);

    page.dispatch(addTodo({ text: "Delete me" }));
    const ids = selectVisibleTodoIds(page.state);
    const id = ids[ids.length - 1]!;

    page.goto("list", { focusedItemId: id });

    // Delete → onDelete → requestDeleteTodo
    page.keyboard.press("Delete");

    expect(page.state.ui.pendingDeleteIds).toContain(id);
  });
});
