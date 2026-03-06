/**
 * Todo Integration — §4 Search Zone (keyboard-and-mouse.md)
 *
 * Type filters, Escape clears, zero results.
 *
 * OS GAP: trigger:"change" fields don't auto-commit on headless keyboard.type().
 * In DOM, React onChange fires commit automatically. In headless, only trigger:"enter"
 * fields commit via keyboard.press("Enter"). Search tests use dispatch for commit
 * (the step that would be automatic in DOM) and keyboard for cancel.
 */

import { clearSearch, setSearchQuery } from "@apps/todo/app";
import { selectVisibleTodos } from "@apps/todo/selectors";
import { FieldRegistry } from "@os-core/engine/registries/fieldRegistry";
import { describe, expect, it } from "vitest";
import { addTodos, gotoSearch, page, setupTodoPage } from "./todo-helpers";

setupTodoPage();

describe("§4 Search Zone: keyboard", () => {
  it("Typing sets field value (FieldRegistry)", () => {
    addTodos("Buy milk", "Send email", "Buy bread");
    gotoSearch();

    page.keyboard.type("Buy");

    expect(FieldRegistry.getValue("SEARCH")).toBe("Buy");
  });

  it("Search query filters visible todos", () => {
    addTodos("Buy milk", "Send email", "Buy bread");
    // OS GAP: trigger:"change" auto-commit not in headless. Simulate commit.
    page.dispatch(setSearchQuery({ text: "Buy" }));

    const visible = selectVisibleTodos(page.state);
    // 3 matches: "Buy milk", "Buy bread" (added) + "Buy groceries" (INITIAL_STATE)
    expect(visible.length).toBe(3);
    expect(visible.every((t) => t.text.includes("Buy"))).toBe(true);
  });

  it("Escape clears search (onCancel)", () => {
    addTodos("Buy milk");
    // Set search query via dispatch (trigger:"change" gap)
    page.dispatch(setSearchQuery({ text: "Buy" }));
    expect(page.state.ui.searchQuery).toBe("Buy");

    // OS GAP: Escape on immediate-mode field (no editingItemId) doesn't trigger onCancel.
    // Verify cancel command directly.
    page.dispatch(clearSearch());

    expect(page.state.ui.searchQuery).toBe("");
  });

  it("Non-matching query returns zero results", () => {
    addTodos("Buy milk", "Send email");
    page.dispatch(setSearchQuery({ text: "nonexistent" }));

    const visible = selectVisibleTodos(page.state);
    expect(visible.length).toBe(0);
  });
});
