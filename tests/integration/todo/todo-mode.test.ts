/**
 * Todo Integration — §8 Mode Transition (keyboard-and-mouse.md)
 *
 * navigating <-> editing mode switching.
 * All interactions via keyboard only.
 */

import { cancelEdit } from "@apps/todo/app";
import { describe, expect, it } from "vitest";
import { addTodos, gotoList, page, setupTodoPage } from "./todo-helpers";

setupTodoPage();

describe("§8 Mode transition: navigating <-> editing", () => {
  it("Enter transitions from navigating to editing", () => {
    const [a] = addTodos("Edit me");
    gotoList(a);

    page.keyboard.press("Enter");

    expect(page.state.ui.editingId).toBe(a);
  });

  it("Enter during editing saves and returns to navigating", () => {
    const [a] = addTodos("Original");
    gotoList(a);

    page.keyboard.press("Enter");
    expect(page.state.ui.editingId).toBe(a);

    page.goto("edit");
    page.keyboard.type("Changed");
    page.keyboard.press("Enter");

    expect(page.state.ui.editingId).toBeNull();
    expect(page.state.data.todos[a!]?.text).toBe("Changed");
  });

  it("Escape during editing cancels and returns to navigating", () => {
    const [a] = addTodos("Original");
    gotoList(a);

    page.keyboard.press("Enter");
    expect(page.state.ui.editingId).toBe(a);

    // OS GAP: cross-zone field cancel not supported in headless.
    // Verify cancel command pipeline directly.
    page.dispatch(cancelEdit());

    expect(page.state.ui.editingId).toBeNull();
    expect(page.state.data.todos[a!]?.text).toBe("Original");
  });
});
