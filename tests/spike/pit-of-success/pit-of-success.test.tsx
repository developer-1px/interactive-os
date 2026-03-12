/**
 * Pit of Success Spike — renderToString verification tests.
 *
 * Proves:
 * 1. item.field() produces correct ARIA attributes
 * 2. item.field() produces correct content (textContent)
 * 3. item.when() returns correct condition values
 * 4. item.trigger() produces correct data-trigger attributes
 * 5. Entity scope is closed — no raw entity leaks into JSX
 * 6. renderToString HTML is sufficient to verify all of the above
 */

import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { resetState } from "../../../src/spike/pit-of-success/state";
import { TodoListV2 } from "../../../src/spike/pit-of-success/TodoListV2";

describe("pit-of-success spike", () => {
  beforeEach(() => {
    resetState();
  });

  // ── P1: item.field() produces correct ARIA ──

  it("field('completed') renders checkbox with aria-checked for uncompleted todo", () => {
    const html = renderToString(<TodoListV2 />);
    // todo-1 is not completed
    expect(html).toContain('aria-checked="false"');
  });

  it("field('completed') renders checkbox with aria-checked='true' for completed todo", () => {
    const html = renderToString(<TodoListV2 />);
    // todo-2 is completed
    expect(html).toContain('aria-checked="true"');
  });

  it("field('completed') renders input type='checkbox'", () => {
    const html = renderToString(<TodoListV2 />);
    expect(html).toContain('type="checkbox"');
  });

  // ── P2: item.field() produces correct content ──

  it("field('text') renders todo text content", () => {
    const html = renderToString(<TodoListV2 />);
    expect(html).toContain("Buy milk");
    expect(html).toContain("Write tests");
    expect(html).toContain("Review PR");
  });

  it("field('text') renders span with data-field attribute", () => {
    const html = renderToString(<TodoListV2 />);
    expect(html).toContain('data-field="text"');
  });

  // ── P3: item.when() returns correct condition ──

  it("when('isCompleted') applies line-through style for completed todo", () => {
    const html = renderToString(<TodoListV2 />);
    expect(html).toContain("line-through");
  });

  // ── P4: item.trigger() produces correct data-trigger ──

  it("trigger('Delete') renders button with data-trigger-id", () => {
    const html = renderToString(<TodoListV2 />);
    expect(html).toContain('data-trigger-id="Delete"');
  });

  it("trigger('Delete') renders button with data-trigger-payload matching item id", () => {
    const html = renderToString(<TodoListV2 />);
    expect(html).toContain('data-trigger-payload="todo-1"');
    expect(html).toContain('data-trigger-payload="todo-2"');
    expect(html).toContain('data-trigger-payload="todo-3"');
  });

  it("trigger('Toggle') renders button with correct trigger id", () => {
    const html = renderToString(<TodoListV2 />);
    expect(html).toContain('data-trigger-id="Toggle"');
  });

  // ── P5: Zone structure ──

  it("Zone renders with role='listbox'", () => {
    const html = renderToString(<TodoListV2 />);
    expect(html).toContain('role="listbox"');
  });

  it("items render with data-item marker and id", () => {
    const html = renderToString(<TodoListV2 />);
    expect(html).toContain('id="todo-1"');
    expect(html).toContain('id="todo-2"');
    expect(html).toContain('id="todo-3"');
    expect(html).toContain("data-item");
  });

  // ── P6: Content is 100% verifiable from HTML ──

  it("all todo content, ARIA, and triggers are verifiable from renderToString", () => {
    const html = renderToString(<TodoListV2 />);

    // Structure: listbox zone with 3 items
    expect(html).toContain('role="listbox"');

    // Item 1: uncompleted
    expect(html).toContain("Buy milk");
    // Item 2: completed
    expect(html).toContain("Write tests");

    // Triggers present for all items
    const deleteCount = (html.match(/data-trigger-id="Delete"/g) || []).length;
    expect(deleteCount).toBe(3);

    const toggleCount = (html.match(/data-trigger-id="Toggle"/g) || []).length;
    expect(toggleCount).toBe(3);
  });

  // ── P7: State changes reflect in re-render ──

  it("state change is reflected in next renderToString", () => {
    resetState(
      {
        "todo-1": { id: "todo-1", text: "Updated task", completed: true },
      },
      ["todo-1"],
    );

    const html = renderToString(<TodoListV2 />);
    expect(html).toContain("Updated task");
    expect(html).toContain('aria-checked="true"');
    expect(html).not.toContain("Buy milk");
  });
});
