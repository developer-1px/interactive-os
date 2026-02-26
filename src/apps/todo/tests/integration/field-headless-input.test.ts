/**
 * Red Test: field-headless-input
 *
 * Tests that headless AppPage can simulate the full draft input pipeline:
 *   keyboard.type("text") → keyboard.press("Enter") → todo created
 *
 * This is the gap identified in field-headless-input discussion:
 * - AppPage has no keyboard.type() / fill()
 * - keyboard.press("Enter") doesn't trigger Field commit in headless
 *   (Field.tsx handles Enter via DOM keydown, outside OS pipeline)
 *
 * Decision table: docs/1-project/field-headless-input/notes/2026-0225-decision-table-draft-input.md
 */

import { describe, expect, it } from "vitest";
import { FieldRegistry } from "@/os/6-components/field/FieldRegistry";
import { page, setupTodoPage } from "./todo-helpers";

setupTodoPage();

describe("Feature: Draft field → Enter → todo created (headless full pipeline)", () => {
  // ────────────────────────────────────────────────────────
  // #1: keyboard.type() sets FieldRegistry value
  // ────────────────────────────────────────────────────────

  it("#1 keyboard.type('Buy milk') → FieldRegistry value = 'Buy milk'", () => {
    // Given: draft zone focused
    page.goto("draft");

    // When: type text through AppPage API
    // @ts-expect-error keyboard.type() does not exist yet on AppPage
    page.keyboard.type("Buy milk");

    // Then: FieldRegistry has the value
    const fieldValue = FieldRegistry.getValue("DRAFT");
    expect(fieldValue).toBe("Buy milk");
  });

  // ────────────────────────────────────────────────────────
  // #2: Enter on field with text → todo created + field reset
  // ────────────────────────────────────────────────────────

  it("#2 field has text + press('Enter') → todo created, field reset", () => {
    // Given: draft zone focused, field has value
    page.goto("draft");
    FieldRegistry.updateValue("DRAFT", "Buy milk");
    const beforeCount = page.state.data.todoOrder.length;

    // When: press Enter through OS keyboard pipeline
    page.keyboard.press("Enter");

    // Then: todo was created
    expect(page.state.data.todoOrder.length).toBe(beforeCount + 1);

    // Then: field was reset
    expect(FieldRegistry.getValue("DRAFT")).toBe("");
  });

  // ────────────────────────────────────────────────────────
  // #3: Enter on empty field → no todo created (schema reject)
  // ────────────────────────────────────────────────────────

  it("#3 field empty + press('Enter') → no todo (schema min 1)", () => {
    // Given: draft zone focused, field empty
    page.goto("draft");
    const beforeCount = page.state.data.todoOrder.length;

    // When: press Enter on empty field
    page.keyboard.press("Enter");

    // Then: no todo created
    expect(page.state.data.todoOrder.length).toBe(beforeCount);
  });

  // ────────────────────────────────────────────────────────
  // #4: Full path — type + Enter in sequence
  // ────────────────────────────────────────────────────────

  it("#4 full path: type('Buy milk') → press('Enter') → todo created", () => {
    // Given: draft zone focused
    page.goto("draft");
    const beforeCount = page.state.data.todoOrder.length;

    // When: type text then press Enter (full user flow)
    // @ts-expect-error keyboard.type() does not exist yet on AppPage
    page.keyboard.type("Buy milk");
    page.keyboard.press("Enter");

    // Then: todo was created with correct text
    expect(page.state.data.todoOrder.length).toBe(beforeCount + 1);
    const lastId =
      page.state.data.todoOrder[page.state.data.todoOrder.length - 1];
    expect(page.state.data.todos[lastId!]?.text).toBe("Buy milk");
  });
});
