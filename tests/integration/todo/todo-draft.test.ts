/**
 * Todo Integration — §3 Draft Zone (keyboard-and-mouse.md)
 *
 * Enter adds todo, empty Enter rejected, Escape blurs.
 * All interactions via keyboard only.
 */

import { FieldRegistry } from "@os-core/engine/registries/fieldRegistry";
import { describe, expect, it } from "vitest";
import { gotoDraft, page, setupTodoPage } from "./todo-helpers";

setupTodoPage();

describe("§3 Draft Zone: keyboard", () => {
  it("Type + Enter adds todo and resets field", () => {
    gotoDraft();
    const beforeCount = page.state.data.todoOrder.length;

    page.keyboard.type("Buy milk");
    expect(FieldRegistry.getValue("DRAFT")).toBe("Buy milk");

    page.keyboard.press("Enter");

    expect(page.state.data.todoOrder.length).toBe(beforeCount + 1);
    const lastId = page.state.data.todoOrder.at(-1)!;
    expect(page.state.data.todos[lastId]?.text).toBe("Buy milk");
    expect(FieldRegistry.getValue("DRAFT")).toBe("");
  });

  it("Enter on empty field is rejected (schema min 1)", () => {
    gotoDraft();
    const beforeCount = page.state.data.todoOrder.length;

    page.keyboard.press("Enter");

    expect(page.state.data.todoOrder.length).toBe(beforeCount);
  });

  it("Consecutive creates preserve order", () => {
    gotoDraft();
    const beforeCount = page.state.data.todoOrder.length;

    page.keyboard.type("First");
    page.keyboard.press("Enter");
    page.keyboard.type("Second");
    page.keyboard.press("Enter");
    page.keyboard.type("Third");
    page.keyboard.press("Enter");

    expect(page.state.data.todoOrder.length).toBe(beforeCount + 3);
    const order = page.state.data.todoOrder;
    const texts = order.slice(-3).map((id) => page.state.data.todos[id]?.text);
    expect(texts).toEqual(["First", "Second", "Third"]);
  });
});
