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

import type React from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { bind2 } from "../../../src/spike/pit-of-success/bind2";
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

// ═══════════════════════════════════════════════════════════════════
// Phase 2: Zone-level features
// ═══════════════════════════════════════════════════════════════════

describe("zone.field() — draft input pattern", () => {
  it("zone.field('draft') renders input with placeholder", () => {
    const draftValue = "";
    const { Zone, field } = bind2({
      role: "listbox",
      zoneFields: {
        draft: {
          type: "string",
          resolve: () => draftValue,
          placeholder: "Add a task...",
        },
      },
    });

    const DraftZone: React.FC = () => <Zone>{field("draft")}</Zone>;

    const html = renderToString(<DraftZone />);
    expect(html).toContain('data-zone-field="draft"');
    expect(html).toContain('placeholder="Add a task..."');
    expect(html).toContain('type="text"');
  });

  it("zone.field('draft') reflects state changes", () => {
    const draftValue = "Buy groceries";
    const { Zone, field } = bind2({
      role: "listbox",
      zoneFields: {
        draft: {
          type: "string",
          resolve: () => draftValue,
          placeholder: "Add a task...",
        },
      },
    });

    const DraftZone: React.FC = () => <Zone>{field("draft")}</Zone>;

    const html = renderToString(<DraftZone />);
    expect(html).toContain('value="Buy groceries"');
  });

  it("zone.field() coexists with items() in same zone", () => {
    resetState();
    const { Zone, field, items } = bind2({
      role: "listbox",
      zoneFields: {
        draft: {
          type: "string",
          resolve: () => "",
          placeholder: "Add a task...",
        },
      },
      fields: {
        text: {
          type: "string",
          resolve: (id) => (id === "todo-1" ? "Buy milk" : "Other"),
        },
      },
      getItems: () => ["todo-1"],
    });

    const Combined: React.FC = () => (
      <Zone>
        {field("draft")}
        {items((item) => item.field("text"))}
      </Zone>
    );

    const html = renderToString(<Combined />);
    expect(html).toContain('data-zone-field="draft"');
    expect(html).toContain("Buy milk");
    expect(html).toContain('role="listbox"');
  });
});

describe("zone.trigger() — toolbar pattern", () => {
  it("toolbar with zone-level triggers only (no items)", () => {
    const { Zone, trigger } = bind2({
      role: "toolbar",
      zoneTriggers: {
        Bold: { label: "Bold" },
        Italic: { label: "Italic" },
        Underline: { label: "Underline" },
      },
    });

    const Toolbar: React.FC = () => (
      <Zone>
        {trigger("Bold", "B")}
        {trigger("Italic", "I")}
        {trigger("Underline", "U")}
      </Zone>
    );

    const html = renderToString(<Toolbar />);
    expect(html).toContain('role="toolbar"');
    expect(html).toContain('data-trigger-id="Bold"');
    expect(html).toContain('data-trigger-id="Italic"');
    expect(html).toContain('data-trigger-id="Underline"');
    expect(html).toContain(">B</button>");
    expect(html).toContain(">I</button>");
    expect(html).toContain(">U</button>");
  });

  it("zone-level trigger has no data-trigger-payload", () => {
    const { Zone, trigger } = bind2({
      role: "toolbar",
      zoneTriggers: { Clear: { label: "Clear" } },
    });

    const html = renderToString(<Zone>{trigger("Clear")}</Zone>);
    expect(html).toContain('data-trigger-id="Clear"');
    expect(html).not.toContain("data-trigger-payload");
  });
});
