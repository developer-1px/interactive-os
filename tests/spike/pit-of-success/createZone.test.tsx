/**
 * createZone spike — Red tests.
 *
 * Verifies the bind-less createZone pattern:
 *   - createZone(config) → { Zone } (no bind step)
 *   - <Zone>{(zone) => ...}</Zone> — zone callback
 *   - zone.items((item) => JSX) — entity scope closure
 *   - item.프로퍼티 (TS-inferred from fields config, not stringly-typed)
 *   - zone-level: zone.count, zone.triggerName(), zone.fieldName()
 *
 * These tests MUST FAIL — createZone does not exist yet.
 */

import type React from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it } from "vitest";
import { createZone } from "../../../src/spike/pit-of-success/createZone";
import {
  getTodoOrder,
  getTodos,
  resetState,
} from "../../../src/spike/pit-of-success/state";

// ═══════════════════════════════════════════════════════════════════
// Config — same data, new API shape
// ═══════════════════════════════════════════════════════════════════

const TodoList = createZone({
  role: "listbox",
  getItems: () => getTodoOrder(),
  fields: {
    completed: {
      type: "boolean" as const,
      resolve: (id: string) => getTodos()[id]?.completed ?? false,
    },
    text: {
      type: "string" as const,
      resolve: (id: string) => getTodos()[id]?.text ?? "",
    },
  },
  triggers: {
    Delete: { label: "Delete" },
    Toggle: { label: "Toggle" },
  },
});

// ═══════════════════════════════════════════════════════════════════
// T1: createZone returns { Zone } — Zone accepts (zone) => callback
// ═══════════════════════════════════════════════════════════════════

describe("T1: createZone returns Zone with (zone) => callback", () => {
  beforeEach(() => resetState());

  it("Zone renders with role attribute", () => {
    const App: React.FC = () => (
      <TodoList.Zone>{(_zone) => <div>content</div>}</TodoList.Zone>
    );
    const html = renderToString(<App />);
    expect(html).toContain('role="listbox"');
  });

  it("Zone passes zone context to callback", () => {
    const App: React.FC = () => (
      <TodoList.Zone>
        {(zone) => <div data-has-zone="true">{zone.count}</div>}
      </TodoList.Zone>
    );
    const html = renderToString(<App />);
    expect(html).toContain('data-has-zone="true"');
  });
});

// ═══════════════════════════════════════════════════════════════════
// T2: zone context — items(), count, triggers, fields
// ═══════════════════════════════════════════════════════════════════

describe("T2: zone context object", () => {
  beforeEach(() => resetState());

  it("zone.items() iterates all items with entity scope closure", () => {
    const App: React.FC = () => (
      <TodoList.Zone>
        {(zone) => zone.items((item) => <div data-item>{item.id}</div>)}
      </TodoList.Zone>
    );
    const html = renderToString(<App />);
    expect(html).toContain("todo-1");
    expect(html).toContain("todo-2");
    expect(html).toContain("todo-3");
  });

  it("zone.count returns total item count", () => {
    const App: React.FC = () => (
      <TodoList.Zone>
        {(zone) => <span data-count>{zone.count}</span>}
      </TodoList.Zone>
    );
    const html = renderToString(<App />);
    expect(html).toContain(">3<");
  });

  it("zone.items wraps each item with id and data-item marker", () => {
    const App: React.FC = () => (
      <TodoList.Zone>
        {(zone) => zone.items((_item) => <span>item</span>)}
      </TodoList.Zone>
    );
    const html = renderToString(<App />);
    expect(html).toContain('id="todo-1"');
    expect(html).toContain('id="todo-2"');
    expect(html).toContain("data-item");
  });
});

// ═══════════════════════════════════════════════════════════════════
// T3: item context — typed properties from fields/triggers config
// ═══════════════════════════════════════════════════════════════════

describe("T3: item properties — TS-inferred from config", () => {
  beforeEach(() => resetState());

  it("item.completed renders checkbox with aria-checked (boolean field)", () => {
    const App: React.FC = () => (
      <TodoList.Zone>
        {(zone) => zone.items((item) => <div>{item.completed}</div>)}
      </TodoList.Zone>
    );
    const html = renderToString(<App />);
    expect(html).toContain('type="checkbox"');
    expect(html).toContain('aria-checked="false"'); // todo-1 uncompleted
    expect(html).toContain('aria-checked="true"'); // todo-2 completed
  });

  it("item.text renders span with text content (string field)", () => {
    const App: React.FC = () => (
      <TodoList.Zone>
        {(zone) => zone.items((item) => <div>{item.text}</div>)}
      </TodoList.Zone>
    );
    const html = renderToString(<App />);
    expect(html).toContain("Buy milk");
    expect(html).toContain("Write tests");
    expect(html).toContain("Review PR");
    expect(html).toContain('data-field="text"');
  });

  it("item.Delete() renders trigger button with data-trigger-id", () => {
    const App: React.FC = () => (
      <TodoList.Zone>
        {(zone) => zone.items((item) => <div>{item.Delete("×")}</div>)}
      </TodoList.Zone>
    );
    const html = renderToString(<App />);
    expect(html).toContain('data-trigger-id="Delete"');
    expect(html).toContain(">×</button>");
  });

  it("item.Toggle() renders trigger button with payload", () => {
    const App: React.FC = () => (
      <TodoList.Zone>
        {(zone) => zone.items((item) => <div>{item.Toggle("✓")}</div>)}
      </TodoList.Zone>
    );
    const html = renderToString(<App />);
    expect(html).toContain('data-trigger-id="Toggle"');
    expect(html).toContain('data-trigger-payload="todo-1"');
    expect(html).toContain('data-trigger-payload="todo-2"');
  });

  it("item.id is accessible as string", () => {
    const ids: string[] = [];
    const App: React.FC = () => (
      <TodoList.Zone>
        {(zone) =>
          zone.items((item) => {
            ids.push(item.id);
            return <div>{item.id}</div>;
          })
        }
      </TodoList.Zone>
    );
    renderToString(<App />);
    expect(ids).toEqual(["todo-1", "todo-2", "todo-3"]);
  });
});

// ═══════════════════════════════════════════════════════════════════
// T4: TodoList integration — full pattern
// ═══════════════════════════════════════════════════════════════════

describe("T4: TodoList integration — createZone full pattern", () => {
  beforeEach(() => resetState());

  it("complete todo app renders with all fields, triggers, and zone structure", () => {
    const App: React.FC = () => (
      <TodoList.Zone>
        {(zone) => (
          <>
            <span data-count>{zone.count}</span>
            {zone.items((item) => (
              <div>
                {item.completed}
                {item.text}
                {item.Delete("×")}
                {item.Toggle("✓")}
              </div>
            ))}
          </>
        )}
      </TodoList.Zone>
    );

    const html = renderToString(<App />);

    // Zone structure
    expect(html).toContain('role="listbox"');

    // Count
    expect(html).toContain(">3<");

    // Fields
    expect(html).toContain("Buy milk");
    expect(html).toContain('aria-checked="true"'); // todo-2

    // Triggers
    const deleteCount = (html.match(/data-trigger-id="Delete"/g) || []).length;
    expect(deleteCount).toBe(3);

    // Items
    expect(html).toContain('id="todo-1"');
    expect(html).toContain('id="todo-2"');
    expect(html).toContain('id="todo-3"');
  });

  it("state change reflects in re-render", () => {
    resetState(
      { "todo-1": { id: "todo-1", text: "Updated task", completed: true } },
      ["todo-1"],
    );

    const App: React.FC = () => (
      <TodoList.Zone>
        {(zone) => (
          <>
            <span data-count>{zone.count}</span>
            {zone.items((item) => (
              <div>
                {item.completed}
                {item.text}
              </div>
            ))}
          </>
        )}
      </TodoList.Zone>
    );

    const html = renderToString(<App />);
    expect(html).toContain("Updated task");
    expect(html).toContain('aria-checked="true"');
    expect(html).toContain(">1<"); // count = 1
    expect(html).not.toContain("Buy milk");
  });
});

// ═══════════════════════════════════════════════════════════════════
// T6: zone-level features — zone.field, zone.trigger
// ═══════════════════════════════════════════════════════════════════

describe("T6: zone-level field and trigger", () => {
  it("zone-level trigger renders button without payload", () => {
    const Toolbar = createZone({
      role: "toolbar",
      zoneTriggers: {
        Bold: { label: "Bold" },
        Italic: { label: "Italic" },
      },
    });

    const App: React.FC = () => (
      <Toolbar.Zone>
        {(zone) => (
          <>
            {zone.Bold("B")}
            {zone.Italic("I")}
          </>
        )}
      </Toolbar.Zone>
    );

    const html = renderToString(<App />);
    expect(html).toContain('role="toolbar"');
    expect(html).toContain('data-trigger-id="Bold"');
    expect(html).toContain('data-trigger-id="Italic"');
    expect(html).toContain(">B</button>");
    expect(html).not.toContain("data-trigger-payload");
  });

  it("zone-level field renders input with placeholder", () => {
    const Draft = createZone({
      role: "textbox",
      zoneFields: {
        DRAFT: {
          type: "string" as const,
          resolve: () => "",
          placeholder: "Add a task...",
        },
      },
    });

    const App: React.FC = () => (
      <Draft.Zone>
        {(zone) => zone.DRAFT({ placeholder: "Add a task..." })}
      </Draft.Zone>
    );

    const html = renderToString(<App />);
    expect(html).toContain('data-zone-field="DRAFT"');
    expect(html).toContain('placeholder="Add a task..."');
    expect(html).toContain('type="text"');
  });

  it("zone.items() + zone-level trigger coexist", () => {
    resetState();
    const ListWithToolbar = createZone({
      role: "listbox",
      getItems: () => getTodoOrder(),
      fields: {
        text: {
          type: "string" as const,
          resolve: (id: string) => getTodos()[id]?.text ?? "",
        },
      },
      zoneTriggers: {
        ClearAll: { label: "Clear All" },
      },
    });

    const App: React.FC = () => (
      <ListWithToolbar.Zone>
        {(zone) => (
          <>
            {zone.ClearAll("Clear")}
            {zone.items((item) => (
              <div>{item.text}</div>
            ))}
          </>
        )}
      </ListWithToolbar.Zone>
    );

    const html = renderToString(<App />);
    expect(html).toContain('data-trigger-id="ClearAll"');
    expect(html).toContain("Buy milk");
    expect(html).toContain('role="listbox"');
  });
});
