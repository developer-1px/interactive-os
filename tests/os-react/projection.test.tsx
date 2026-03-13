/**
 * Projection v2.2 — React component rendering tests.
 *
 * Spec scenarios S8-S12 + DT1-DT4 (T9).
 * Zone interaction task — tests verify DOM output from projection components.
 *
 * These tests verify that defineApp2.createZone().Zone renders correct DOM
 * with ARIA attributes injected via cloneElement (asChild pattern).
 * They should FAIL until projection components are implemented (/green).
 *
 * Exception: plain describe/it — these are React rendering tests, not headless
 * page interaction tests. No page.keyboard.press() or page.click().
 */

import { defineApp2 } from "@os-sdk/app/defineApp2";
import type React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";

// ── Test entity + state ──

interface Todo {
  readonly id: string;
  readonly text: string;
  readonly completed: boolean;
}

interface TodoState {
  todos: Record<string, Todo>;
  todoOrder: string[];
}

const INITIAL_STATE: TodoState = {
  todos: {
    t1: { id: "t1", text: "Buy milk", completed: false },
    t2: { id: "t2", text: "Write code", completed: true },
  },
  todoOrder: ["t1", "t2"],
};

// ── Helpers ──

const listboxRole = { name: "listbox" } as const;

function phantom<E>(): E {
  return undefined as unknown as E;
}

let container: HTMLDivElement;
let root: ReturnType<typeof createRoot>;

function renderComponent(element: React.ReactElement): void {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  flushSync(() => {
    root.render(element);
  });
}

afterEach(() => {
  if (root) {
    flushSync(() => root.unmount());
  }
  if (container) {
    container.remove();
  }
});

// ── App + Zone setup ──

function createTestApp() {
  const app = defineApp2<TodoState>("todo-proj-test", INITIAL_STATE);

  const deleteTodo = app.command(
    "DELETE_TODO",
    (ctx, _payload: { id: string }) => ({ state: ctx.state }),
  );
  const toggleTodo = app.command(
    "TOGGLE_TODO",
    (ctx, _payload: { id: string }) => ({ state: ctx.state }),
  );

  const TodoList = app.createZone("list", {
    role: listboxRole,
    entity: phantom<Todo>(),
    commands: { deleteTodo, toggleTodo },
    data: (state: TodoState) =>
      state.todoOrder.map((id) => state.todos[id] as Todo),
  });

  return { app, TodoList, deleteTodo, toggleTodo };
}

// ═══════════════════════════════════════════════════════════════════
// S8: ProjectionZone이 container ARIA를 asChild로 주입한다
// ═══════════════════════════════════════════════════════════════════

describe("S8: ProjectionZone asChild ARIA injection", () => {
  it("injects role=listbox on the child element", () => {
    const { TodoList } = createTestApp();

    renderComponent(
      <TodoList.Zone>
        {(_zone) => (
          <ul className="my-list">
            <li>placeholder</li>
          </ul>
        )}
      </TodoList.Zone>,
    );

    const ul = container.querySelector("ul");
    expect(ul).not.toBeNull();
    expect(ul?.getAttribute("role")).toBe("listbox");
  });

  it("produces 0 framework wrapper elements", () => {
    const { TodoList } = createTestApp();

    renderComponent(
      <TodoList.Zone>
        {(_zone) => (
          <ul className="my-list">
            <li>placeholder</li>
          </ul>
        )}
      </TodoList.Zone>,
    );

    // Zone should clone into <ul> directly — no wrapper divs
    const firstChild = container.firstElementChild;
    expect(firstChild?.tagName).toBe("UL");
    expect(firstChild?.className).toContain("my-list");
  });
});

// ═══════════════════════════════════════════════════════════════════
// S9: zone.Items가 entity 데이터를 callback으로 전달한다
// ═══════════════════════════════════════════════════════════════════

describe("S9: zone.Items entity data callback", () => {
  it("calls callback with item data for each entity", () => {
    const { TodoList } = createTestApp();
    const receivedItems: Array<{ id: string; text: string }> = [];

    renderComponent(
      <TodoList.Zone>
        {(zone) => (
          <ul>
            <zone.Items>
              {(item) => {
                receivedItems.push({ id: item.id, text: item.text });
                return <li key={item.id}>{item.text}</li>;
              }}
            </zone.Items>
          </ul>
        )}
      </TodoList.Zone>,
    );

    expect(receivedItems).toHaveLength(2);
    expect(receivedItems[0]?.id).toBe("t1");
    expect(receivedItems[0]?.text).toBe("Buy milk");
    expect(receivedItems[1]?.id).toBe("t2");
    expect(receivedItems[1]?.text).toBe("Write code");
  });
});

// ═══════════════════════════════════════════════════════════════════
// S10: Items가 각 item에 ARIA attrs를 asChild로 주입한다
// ═══════════════════════════════════════════════════════════════════

describe("S10: Items ARIA attrs injection on item elements", () => {
  it("injects role=option and id on each item element", () => {
    const { TodoList } = createTestApp();

    renderComponent(
      <TodoList.Zone>
        {(zone) => (
          <ul>
            <zone.Items>
              {(item) => <li key={item.id}>{item.text}</li>}
            </zone.Items>
          </ul>
        )}
      </TodoList.Zone>,
    );

    const items = container.querySelectorAll("li");
    expect(items.length).toBe(2);

    // Each <li> should have role="option" and data-item injected via cloneElement
    const first = items[0];
    expect(first?.getAttribute("role")).toBe("option");
    expect(first?.hasAttribute("data-item")).toBe(true);
    expect(first?.id).toBe("t1");
  });
});

// ═══════════════════════════════════════════════════════════════════
// S11: Item.fieldName이 asChild field wrapper로 동작한다
// ═══════════════════════════════════════════════════════════════════

describe("S11: Item.fieldName asChild field wrapper", () => {
  it("injects data-field attr on the child element", () => {
    const { TodoList } = createTestApp();

    renderComponent(
      <TodoList.Zone>
        {(zone) => (
          <ul>
            <zone.Items>
              {(item, Item) => (
                <li key={item.id}>
                  <Item.text>
                    <span>{item.text}</span>
                  </Item.text>
                </li>
              )}
            </zone.Items>
          </ul>
        )}
      </TodoList.Zone>,
    );

    const span = container.querySelector("span");
    expect(span).not.toBeNull();
    expect(span?.getAttribute("data-field")).toBe("text");
  });
});

// ═══════════════════════════════════════════════════════════════════
// S12: zone.Trigger가 data-trigger-id를 주입한다
// ═══════════════════════════════════════════════════════════════════

describe("S12: zone.Trigger data-trigger-id injection", () => {
  it("injects data-trigger-id on the child button", () => {
    const { TodoList } = createTestApp();

    renderComponent(
      <TodoList.Zone>
        {(zone) => (
          <ul>
            <zone.Items>
              {(item) => (
                <li key={item.id}>
                  <zone.Trigger
                    onPress={(cmd) => cmd.deleteTodo({ id: item.id })}
                  >
                    <button type="button">Delete</button>
                  </zone.Trigger>
                </li>
              )}
            </zone.Items>
          </ul>
        )}
      </TodoList.Zone>,
    );

    const button = container.querySelector("button");
    expect(button).not.toBeNull();
    expect(button?.hasAttribute("data-trigger-id")).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// DT1: listbox + flat data + field + trigger
// ═══════════════════════════════════════════════════════════════════

describe("DT1: listbox flat data with field + trigger", () => {
  it("renders <ul role=listbox><li role=option> structure", () => {
    const { TodoList } = createTestApp();

    renderComponent(
      <TodoList.Zone>
        {(zone) => (
          <ul>
            <zone.Items>
              {(item, Item) => (
                <li key={item.id}>
                  <Item.text>
                    <span>{item.text}</span>
                  </Item.text>
                  <zone.Trigger
                    onPress={(cmd) => cmd.toggleTodo({ id: item.id })}
                  >
                    <button type="button">Toggle</button>
                  </zone.Trigger>
                </li>
              )}
            </zone.Items>
          </ul>
        )}
      </TodoList.Zone>,
    );

    const ul = container.querySelector("ul");
    expect(ul?.getAttribute("role")).toBe("listbox");

    const lis = container.querySelectorAll("li");
    expect(lis.length).toBe(2);
    expect(lis[0]?.getAttribute("role")).toBe("option");

    // Field wrapper
    const span = lis[0]?.querySelector("span");
    expect(span?.getAttribute("data-field")).toBe("text");

    // Trigger
    const btn = lis[0]?.querySelector("button");
    expect(btn?.hasAttribute("data-trigger-id")).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════
// DT3: listbox + empty data
// ═══════════════════════════════════════════════════════════════════

describe("DT3: listbox empty data", () => {
  it("renders container only, no items", () => {
    const app = defineApp2<TodoState>("todo-proj-dt3", {
      todos: {},
      todoOrder: [],
    });
    const cmd = app.command("NOOP", (ctx) => ({ state: ctx.state }));
    const EmptyList = app.createZone("empty-list", {
      role: listboxRole,
      entity: phantom<Todo>(),
      commands: { cmd },
      data: (s: TodoState) => s.todoOrder.map((id) => s.todos[id] as Todo),
    });

    renderComponent(
      <EmptyList.Zone>
        {(zone) => (
          <ul>
            <zone.Items>
              {(item) => <li key={item.id}>{item.text}</li>}
            </zone.Items>
          </ul>
        )}
      </EmptyList.Zone>,
    );

    const ul = container.querySelector("ul");
    expect(ul).not.toBeNull();
    expect(ul?.getAttribute("role")).toBe("listbox");

    const items = container.querySelectorAll("li");
    expect(items.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// DT4: listbox + 1 item, no field usage
// ═══════════════════════════════════════════════════════════════════

describe("DT4: listbox 1 item, no field usage", () => {
  it("renders ARIA-injected <li> without data-field", () => {
    const app = defineApp2<TodoState>("todo-proj-dt4", {
      todos: { t1: { id: "t1", text: "Only item", completed: false } },
      todoOrder: ["t1"],
    });
    const cmd = app.command("NOOP", (ctx) => ({ state: ctx.state }));
    const SingleList = app.createZone("single-list", {
      role: listboxRole,
      entity: phantom<Todo>(),
      commands: { cmd },
      data: (s: TodoState) => s.todoOrder.map((id) => s.todos[id] as Todo),
    });

    renderComponent(
      <SingleList.Zone>
        {(zone) => (
          <ul>
            <zone.Items>
              {(item) => (
                <li key={item.id}>
                  <span>{item.text}</span>
                </li>
              )}
            </zone.Items>
          </ul>
        )}
      </SingleList.Zone>,
    );

    const items = container.querySelectorAll("li");
    expect(items.length).toBe(1);
    expect(items[0]?.getAttribute("role")).toBe("option");
    expect(items[0]?.id).toBe("t1");

    // No data-field since Item.fieldName not used
    expect(container.querySelector("[data-field]")).toBeNull();
  });
});
