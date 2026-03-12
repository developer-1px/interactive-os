/**
 * Pit of Success — defineApp adapter for testbot integration.
 *
 * Wraps spike state (state.ts) as an OS App so that TestScript
 * tests can run through runScenarios → createPage → OS pipeline.
 *
 * This is TEST INFRASTRUCTURE, not production code.
 */

import { defineApp } from "@os-sdk/app/defineApp";
import {
  createCollectionZone,
  fromEntities,
} from "@os-sdk/library/collection/createCollectionZone";
import { produce } from "immer";

// ═══════════════════════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════════════════════

interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

interface PitState {
  todos: Record<string, Todo>;
  todoOrder: string[];
}

const INITIAL: PitState = {
  todos: {
    "todo-1": { id: "todo-1", text: "Buy milk", completed: false },
    "todo-2": { id: "todo-2", text: "Write tests", completed: true },
    "todo-3": { id: "todo-3", text: "Review PR", completed: false },
  },
  todoOrder: ["todo-1", "todo-2", "todo-3"],
};

// ═══════════════════════════════════════════════════════════════════
// App
// ═══════════════════════════════════════════════════════════════════

export const PitApp = defineApp<PitState>("pit-spike", INITIAL);

// ═══════════════════════════════════════════════════════════════════
// Collection Zone — listbox with toggle/delete triggers
// ═══════════════════════════════════════════════════════════════════

const listCollection = createCollectionZone(PitApp, "pit-todo-list", {
  ...fromEntities(
    (s: PitState) => s.todos,
    (s: PitState) => s.todoOrder,
  ),
});

export const toggleTodo = listCollection.command(
  "toggleTodo",
  (ctx, payload: { id: string }) => ({
    state: produce(ctx.state, (draft) => {
      const todo = draft.todos[payload.id];
      if (todo) todo.completed = !todo.completed;
    }),
  }),
);

export const PitListUI = listCollection.bind("listbox", {
  onCheck: (cursor) => toggleTodo({ id: cursor.focusId }),
  onDelete: (cursor) => listCollection.remove({ id: cursor.focusId }),
});
