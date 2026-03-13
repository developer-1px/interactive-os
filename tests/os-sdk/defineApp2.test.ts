/**
 * defineApp2 — Red tests for Projection v2.2 SDK factory.
 *
 * Spec scenarios S1-S5, S7 (T8).
 * Architecture task — no Zone interaction, no page, plain unit tests.
 *
 * These tests verify the API shape and type-level contract of defineApp2.
 * They should FAIL until defineApp2 is implemented (/green).
 */

import { defineApp2 } from "@os-sdk/app/defineApp2";
import { describe, expect, it } from "vitest";

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

// ── Role preset ──

const listboxRole = { name: "listbox" } as const;

// ── Phantom helper ──

function phantom<E>(): E {
  return undefined as unknown as E;
}

// ═══════════════════════════════════════════════════════════════════
// S1: defineApp2가 AppHandle2를 반환한다
// ═══════════════════════════════════════════════════════════════════

describe("S1: defineApp2 returns AppHandle2", () => {
  it("has command, createZone, useComputed methods", () => {
    const app = defineApp2<TodoState>("todo-v2-test", INITIAL_STATE);

    expect(typeof app.command).toBe("function");
    expect(typeof app.createZone).toBe("function");
    expect(typeof app.useComputed).toBe("function");
  });

  it("has __appId matching the provided id", () => {
    const app = defineApp2<TodoState>("todo-v2-test", INITIAL_STATE);

    expect(app.__appId).toBe("todo-v2-test");
  });

  it("has __zoneBindings as a Map", () => {
    const app = defineApp2<TodoState>("todo-v2-test", INITIAL_STATE);

    expect(app.__zoneBindings).toBeInstanceOf(Map);
  });
});

// ═══════════════════════════════════════════════════════════════════
// S2: command()가 CommandFactory를 반환한다
// ═══════════════════════════════════════════════════════════════════

describe("S2: command() returns CommandFactory", () => {
  it("returns a callable factory", () => {
    const app = defineApp2<TodoState>("todo-v2-cmd", INITIAL_STATE);

    const toggleTodo = app.command(
      "TOGGLE_TODO",
      (ctx, _payload: { id: string }) => ({
        state: ctx.state, // no-op for now
      }),
    );

    expect(typeof toggleTodo).toBe("function");
  });

  it("factory() produces a BaseCommand with correct type", () => {
    const app = defineApp2<TodoState>("todo-v2-cmd2", INITIAL_STATE);

    const toggleTodo = app.command(
      "TOGGLE_TODO",
      (ctx, _payload: { id: string }) => ({
        state: ctx.state,
      }),
    );

    const cmd = toggleTodo({ id: "t1" });
    expect(cmd).toBeDefined();
    expect((cmd as { type: string }).type).toBe("TOGGLE_TODO");
  });
});

// ═══════════════════════════════════════════════════════════════════
// S3: createZone이 ZoneHandle<E,C>를 반환한다
// ═══════════════════════════════════════════════════════════════════

describe("S3: createZone returns ZoneHandle<E,C>", () => {
  it("returns an object with Zone FC", () => {
    const app = defineApp2<TodoState>("todo-v2-zone", INITIAL_STATE);

    const deleteTodo = app.command(
      "DELETE_TODO",
      (ctx, _payload: { id: string }) => ({ state: ctx.state }),
    );
    const toggleTodo = app.command(
      "TOGGLE_TODO_Z",
      (ctx, _payload: { id: string }) => ({ state: ctx.state }),
    );

    const TodoList = app.createZone("list", {
      role: listboxRole,
      entity: phantom<Todo>(),
      commands: { deleteTodo, toggleTodo },
      data: (state: TodoState) =>
        state.todoOrder.map((id) => state.todos[id] as Todo),
    });

    expect(TodoList).toBeDefined();
    expect(TodoList.Zone).toBeDefined();
    expect(typeof TodoList.Zone).toBe("function"); // React FC
  });
});

// ═══════════════════════════════════════════════════════════════════
// S4: ZoneConfig의 data accessor가 전달된다
// ═══════════════════════════════════════════════════════════════════

describe("S4: data accessor is preserved", () => {
  it("data accessor is callable and returns entities", () => {
    const dataAccessor = (state: TodoState): Todo[] =>
      state.todoOrder.map((id) => state.todos[id] as Todo);

    const app = defineApp2<TodoState>("todo-v2-data", INITIAL_STATE);
    const cmd = app.command("NOOP", (ctx) => ({ state: ctx.state }));

    const TodoList = app.createZone("list", {
      role: listboxRole,
      entity: phantom<Todo>(),
      commands: { cmd },
      data: dataAccessor,
    });

    // The data accessor should be retrievable (exact mechanism TBD in /green)
    // For now, verify that createZone accepts it without error
    expect(TodoList).toBeDefined();
    expect(TodoList.Zone).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════
// S5: __zoneBindings에 zone 정보가 등록된다
// ═══════════════════════════════════════════════════════════════════

describe("S5: __zoneBindings populated after createZone", () => {
  it("has entry for the created zone", () => {
    const app = defineApp2<TodoState>("todo-v2-bindings", INITIAL_STATE);
    const cmd = app.command("NOOP2", (ctx) => ({ state: ctx.state }));

    app.createZone("my-list", {
      role: listboxRole,
      entity: phantom<Todo>(),
      commands: { cmd },
      data: (s: TodoState) => s.todoOrder.map((id) => s.todos[id] as Todo),
    });

    expect(app.__zoneBindings.has("my-list")).toBe(true);
  });

  it("entry contains role information", () => {
    const app = defineApp2<TodoState>("todo-v2-bindings2", INITIAL_STATE);
    const cmd = app.command("NOOP3", (ctx) => ({ state: ctx.state }));

    app.createZone("my-list", {
      role: listboxRole,
      entity: phantom<Todo>(),
      commands: { cmd },
      data: (s: TodoState) => s.todoOrder.map((id) => s.todos[id] as Todo),
    });

    const entry = app.__zoneBindings.get("my-list");
    expect(entry).toBeDefined();
    expect(entry?.role).toBe("listbox");
  });
});
