/**
 * Transaction Primitive — Unit Tests
 *
 * Tests that transaction(fn) groups multiple dispatches into
 * a single undo/redo entry via history.groupId.
 */

import {
  addTodo,
  deleteTodo,
  redoCommand,
  TodoApp,
  toggleTodo,
  undoCommand,
} from "@apps/todo/app";
import { describe, expect, it } from "vitest";

const defineApp = TodoApp;

describe("History Transaction", () => {
  describe("Transaction grouping", () => {
    it("multiple deletes in a transaction create single undo entry", () => {
      const app = defineApp.create();

      // Add 3 items
      app.dispatch(addTodo({ text: "Alpha" }));
      app.dispatch(addTodo({ text: "Bravo" }));
      app.dispatch(addTodo({ text: "Charlie" }));
      const countBefore = Object.keys(app.state.data.todos).length;
      expect(countBefore).toBeGreaterThanOrEqual(3);

      // Delete 2 in a transaction
      const ids = Object.keys(app.state.data.todos);
      const [idA, idB] = [ids[ids.length - 2]!, ids[ids.length - 1]!];

      app.transaction(() => {
        app.dispatch(deleteTodo({ id: idA }));
        app.dispatch(deleteTodo({ id: idB }));
      });
      expect(Object.keys(app.state.data.todos).length).toBe(countBefore - 2);

      // Single undo should restore both
      app.dispatch(undoCommand());
      expect(Object.keys(app.state.data.todos).length).toBe(countBefore);
    });

    it("single redo re-applies entire transaction", () => {
      const app = defineApp.create();

      app.dispatch(addTodo({ text: "Alpha" }));
      app.dispatch(addTodo({ text: "Bravo" }));
      app.dispatch(addTodo({ text: "Charlie" }));
      const countBefore = Object.keys(app.state.data.todos).length;

      const ids = Object.keys(app.state.data.todos);
      const [idA, idB] = [ids[ids.length - 2]!, ids[ids.length - 1]!];

      app.transaction(() => {
        app.dispatch(deleteTodo({ id: idA }));
        app.dispatch(deleteTodo({ id: idB }));
      });

      // Undo
      app.dispatch(undoCommand());
      expect(Object.keys(app.state.data.todos).length).toBe(countBefore);

      // Redo should re-delete both
      app.dispatch(redoCommand());
      expect(Object.keys(app.state.data.todos).length).toBe(countBefore - 2);
    });

    it("mixed commands in transaction are undone together", () => {
      const app = defineApp.create();

      app.dispatch(addTodo({ text: "Alpha" }));
      app.dispatch(addTodo({ text: "Bravo" }));
      const countBefore = Object.keys(app.state.data.todos).length;

      const ids = Object.keys(app.state.data.todos);
      const idA = ids[ids.length - 2]!;
      const idB = ids[ids.length - 1]!;

      app.transaction(() => {
        app.dispatch(toggleTodo({ id: idA }));
        app.dispatch(deleteTodo({ id: idB }));
      });

      expect(Object.keys(app.state.data.todos).length).toBe(countBefore - 1);
      expect(app.state.data.todos[idA]?.completed).toBe(true);

      // Single undo restores both toggle and delete
      app.dispatch(undoCommand());
      expect(Object.keys(app.state.data.todos).length).toBe(countBefore);
      expect(app.state.data.todos[idA]?.completed).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("empty transaction is no-op (no history entry)", () => {
      const app = defineApp.create();
      app.dispatch(addTodo({ text: "Alpha" }));
      const pastLenBefore = app.state.history.past.length;

      app.transaction(() => {
        // no dispatches
      });

      expect(app.state.history.past.length).toBe(pastLenBefore);
    });

    it("single command in transaction behaves like normal dispatch", () => {
      const app = defineApp.create();
      app.dispatch(addTodo({ text: "Alpha" }));
      const countBefore = Object.keys(app.state.data.todos).length;

      const ids = Object.keys(app.state.data.todos);
      const lastId = ids[ids.length - 1]!;

      app.transaction(() => {
        app.dispatch(deleteTodo({ id: lastId }));
      });
      expect(Object.keys(app.state.data.todos).length).toBe(countBefore - 1);

      app.dispatch(undoCommand());
      expect(Object.keys(app.state.data.todos).length).toBe(countBefore);
    });

    it("nested transactions flatten to outer group", () => {
      const app = defineApp.create();

      app.dispatch(addTodo({ text: "A" }));
      app.dispatch(addTodo({ text: "B" }));
      app.dispatch(addTodo({ text: "C" }));
      app.dispatch(addTodo({ text: "D" }));
      app.dispatch(addTodo({ text: "E" }));
      app.dispatch(addTodo({ text: "F" }));
      app.dispatch(addTodo({ text: "G" }));

      const countBefore = Object.keys(app.state.data.todos).length;
      const ids = Object.keys(app.state.data.todos);

      app.transaction(() => {
        app.dispatch(deleteTodo({ id: ids[ids.length - 1]! }));
        app.transaction(() => {
          app.dispatch(deleteTodo({ id: ids[ids.length - 2]! }));
          app.dispatch(deleteTodo({ id: ids[ids.length - 3]! }));
        });
      });

      expect(Object.keys(app.state.data.todos).length).toBe(countBefore - 3);

      // Single undo should restore all (nested txn flattened)
      app.dispatch(undoCommand());
      expect(Object.keys(app.state.data.todos).length).toBe(countBefore);
    });
  });
});
