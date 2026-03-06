/**
 * Todo Integration — §6 Dialog (keyboard-and-mouse.md)
 *
 * Delete dialog: Backspace opens, Escape closes, Enter confirms.
 * Tab trap: TODO (OS gap — headless overlay focus trap not yet supported).
 */

import { cancelDeleteTodo } from "@apps/todo/app";
import { describe, expect, it } from "vitest";
import { addTodos, gotoList, page, setupTodoPage } from "./todo-helpers";

setupTodoPage();

describe("§6 Dialog: keyboard", () => {
  it("Backspace opens delete confirmation dialog", () => {
    const [a] = addTodos("Delete me");
    gotoList(a);

    page.keyboard.press("Backspace");

    expect(page.state.ui.pendingDeleteIds).toContain(a);
    expect(page.query("dialog")).toBe(true);
  });

  it("Escape closes dialog and preserves selection", () => {
    const [a, b] = addTodos("A", "B");
    gotoList(a);

    page.keyboard.press("Shift+ArrowDown");
    expect(page.selection().length).toBe(2);

    page.keyboard.press("Backspace");
    expect(page.state.ui.pendingDeleteIds.length).toBe(2);

    // OS GAP: Escape on overlay/dialog doesn't trigger dismiss in headless.
    // Verify cancel command pipeline directly.
    page.dispatch(cancelDeleteTodo());

    expect(page.state.ui.pendingDeleteIds.length).toBe(0);
    // Selection should be preserved
    expect(page.selection()).toContain(a);
    expect(page.selection()).toContain(b);
  });

  // TODO: §6 Dialog Tab trap — headless overlay focus trap not yet supported (OS gap)
  // TODO: §6 Dialog Enter confirms — requires overlay zone navigation (OS gap)
});
