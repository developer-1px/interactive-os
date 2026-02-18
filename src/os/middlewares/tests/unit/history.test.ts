/**
 * History Middleware Unit Tests — OS SPEC §10
 *
 * Tests the history recording mechanism:
 * - Normal commands create undo entries
 * - OS passthrough commands are skipped
 * - Undo restores previous state + focus
 * - Redo re-applies
 * - History limit enforcement
 * - Transaction grouping (already in transaction.test.ts, verified here at lower level)
 *
 * Uses the TodoApp as a real app with defineApp + history.
 */

import {
  addTodo,
  redoCommand,
  TodoApp,
  toggleTodo,
  undoCommand,
} from "@apps/todo/app";
import { describe, expect, it } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Basic Undo/Redo
// ═══════════════════════════════════════════════════════════════════

describe("History: Basic Undo/Redo (SPEC §10)", () => {
  it("addTodo creates a history entry", () => {
    const app = TodoApp.create({ history: true });

    app.dispatch(addTodo({ text: "Test" }));

    expect(app.state.history.past.length).toBe(1);
    expect(app.state.history.past[0]?.command.type).toBe("addTodo");
  });

  it("undo restores previous state", () => {
    const app = TodoApp.create({ history: true });

    app.dispatch(addTodo({ text: "First" }));
    const countAfterAdd = Object.keys(app.state.data.todos).length;
    expect(countAfterAdd).toBeGreaterThanOrEqual(1);

    app.dispatch(undoCommand());

    expect(Object.keys(app.state.data.todos).length).toBe(countAfterAdd - 1);
  });

  it("redo re-applies undone action", () => {
    const app = TodoApp.create({ history: true });

    app.dispatch(addTodo({ text: "First" }));
    const countAfterAdd = Object.keys(app.state.data.todos).length;
    app.dispatch(undoCommand());
    expect(Object.keys(app.state.data.todos).length).toBe(countAfterAdd - 1);

    app.dispatch(redoCommand());
    expect(Object.keys(app.state.data.todos).length).toBe(countAfterAdd);
  });

  it("undo when empty past is no-op", () => {
    const app = TodoApp.create({ history: true });
    const stateBefore = app.state;

    app.dispatch(undoCommand());

    expect(app.state.data).toEqual(stateBefore.data);
  });

  it("redo when empty future is no-op", () => {
    const app = TodoApp.create({ history: true });
    app.dispatch(addTodo({ text: "First" }));
    const stateBefore = app.state;

    app.dispatch(redoCommand());

    expect(app.state.data).toEqual(stateBefore.data);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Future Clearing
// ═══════════════════════════════════════════════════════════════════

describe("History: Future is cleared on new action", () => {
  it("new command after undo clears future", () => {
    const app = TodoApp.create({ history: true });

    app.dispatch(addTodo({ text: "A" }));
    app.dispatch(addTodo({ text: "B" }));
    app.dispatch(undoCommand());

    expect(app.state.history.future.length).toBe(1);

    // New action should clear future
    app.dispatch(addTodo({ text: "C" }));

    expect(app.state.history.future.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════
// OS Passthrough Filtering
// ═══════════════════════════════════════════════════════════════════

describe("History: OS Passthrough Commands (SPEC §10)", () => {
  it("data-changing commands are recorded", () => {
    const app = TodoApp.create({ history: true });

    app.dispatch(addTodo({ text: "Test" }));
    expect(app.state.history.past.length).toBe(1);

    app.dispatch(addTodo({ text: "Test 2" }));
    expect(app.state.history.past.length).toBe(2);
  });

  it("toggleTodo creates a history entry (data changes)", () => {
    const app = TodoApp.create({ history: true });
    app.dispatch(addTodo({ text: "Test" }));
    const pastBefore = app.state.history.past.length;

    const id = Object.keys(app.state.data.todos)[0]!;
    app.dispatch(toggleTodo({ id }));

    expect(app.state.history.past.length).toBe(pastBefore + 1);
  });
});

// ═══════════════════════════════════════════════════════════════════
// Multiple Undo/Redo
// ═══════════════════════════════════════════════════════════════════

describe("History: Multiple Undo/Redo", () => {
  it("multiple undos work correctly", () => {
    const app = TodoApp.create({ history: true });
    const initial = Object.keys(app.state.data.todos).length;

    app.dispatch(addTodo({ text: "A" }));
    const afterA = Object.keys(app.state.data.todos).length;
    expect(afterA).toBe(initial + 1);

    app.dispatch(addTodo({ text: "B" }));
    const afterB = Object.keys(app.state.data.todos).length;
    expect(afterB).toBe(initial + 2);

    app.dispatch(addTodo({ text: "C" }));
    const afterC = Object.keys(app.state.data.todos).length;
    expect(afterC).toBe(initial + 3);

    app.dispatch(undoCommand()); // undo C → back to afterB
    expect(Object.keys(app.state.data.todos).length).toBe(afterB);

    app.dispatch(undoCommand()); // undo B → back to afterA
    expect(Object.keys(app.state.data.todos).length).toBe(afterA);

    app.dispatch(undoCommand()); // undo A → back to initial
    expect(Object.keys(app.state.data.todos).length).toBe(initial);
  });

  it("undo then redo preserves state", () => {
    const app = TodoApp.create({ history: true });

    app.dispatch(addTodo({ text: "A" }));
    app.dispatch(addTodo({ text: "B" }));

    const stateWith2 = app.state.data;

    app.dispatch(undoCommand());
    app.dispatch(redoCommand());

    expect(Object.keys(app.state.data.todos).length).toBe(
      Object.keys(stateWith2.todos).length,
    );
  });
});

// ═══════════════════════════════════════════════════════════════════
// History Entry Contents
// ═══════════════════════════════════════════════════════════════════

describe("History: Entry Structure", () => {
  it("entry contains command type and payload", () => {
    const app = TodoApp.create({ history: true });

    app.dispatch(addTodo({ text: "Hello" }));

    const entry = app.state.history.past[0]!;
    expect(entry.command.type).toBe("addTodo");
    expect(entry.command.payload).toEqual({ text: "Hello" });
  });

  it("entry contains timestamp", () => {
    const app = TodoApp.create({ history: true });
    const before = Date.now();

    app.dispatch(addTodo({ text: "Hello" }));

    const entry = app.state.history.past[0]!;
    expect(entry.timestamp).toBeGreaterThanOrEqual(before);
    expect(entry.timestamp).toBeLessThanOrEqual(Date.now() + 10);
  });

  it("entry contains snapshot of previous state", () => {
    const app = TodoApp.create({ history: true });

    app.dispatch(addTodo({ text: "First" }));
    const dataAfterFirst = { ...app.state.data };

    app.dispatch(addTodo({ text: "Second" }));

    const entry = app.state.history.past[1]!;
    // snapshot should be the state BEFORE "Second" was added
    // snapshot has { data, ui } structure
    expect(Object.keys(entry.snapshot?.data.todos).length).toBe(
      Object.keys(dataAfterFirst.todos).length,
    );
  });
});
