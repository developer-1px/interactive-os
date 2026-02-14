/**
 * defineApp v5 — Usage PoC
 *
 * Verifies:
 *   1. Condition: named boolean predicate, branded, when guard
 *   2. Selector: named data derivation, branded
 *   3. Command: app-level + zone-level, when = dispatch guard
 *   4. Zone: child scope, bindings, keybindings with when
 *   5. TestInstance: dispatch respects when, evaluate/select APIs
 *   6. DevTools: conditions()/selectors() enumeration
 */

import { produce } from "immer";
import { defineApp } from "./defineApp-v5";

// ═══════════════════════════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════════════════════════

interface TodoState {
  data: {
    todos: Record<number, { id: number; text: string; completed: boolean }>;
    todoOrder: number[];
    nextId: number;
  };
  ui: {
    draft: string;
    editingId: number | null;
    editDraft: string;
    clipboard: { id: number; text: string; completed: boolean } | null;
  };
  history: {
    past: TodoState[];
    future: TodoState[];
  };
}

const INITIAL: TodoState = {
  data: { todos: {}, todoOrder: [], nextId: 1 },
  ui: { draft: "", editingId: null, editDraft: "", clipboard: null },
  history: { past: [], future: [] },
};

// ═══════════════════════════════════════════════════════════════════
// App
// ═══════════════════════════════════════════════════════════════════

const TodoApp = defineApp<TodoState>("todo", INITIAL, { history: true });

// ═══════════════════════════════════════════════════════════════════
// Conditions — named boolean predicates
// ═══════════════════════════════════════════════════════════════════

const canUndo = TodoApp.condition("canUndo", (s) => s.history.past.length > 0);
const canRedo = TodoApp.condition(
  "canRedo",
  (s) => s.history.future.length > 0,
);
const isEditing = TodoApp.condition(
  "isEditing",
  (s) => s.ui.editingId !== null,
);
const isNotEditing = TodoApp.condition(
  "isNotEditing",
  (s) => s.ui.editingId === null,
);
const hasClipboard = TodoApp.condition(
  "hasClipboard",
  (s) => s.ui.clipboard !== null,
);
const hasTodos = TodoApp.condition(
  "hasTodos",
  (s) => s.data.todoOrder.length > 0,
);
const hasCompletedTodos = TodoApp.condition("hasCompletedTodos", (s) =>
  Object.values(s.data.todos).some((t) => t.completed),
);

// ═══════════════════════════════════════════════════════════════════
// Selectors — named data derivation
// ═══════════════════════════════════════════════════════════════════

const visibleTodos = TodoApp.selector("visibleTodos", (s) =>
  s.data.todoOrder.map((id) => s.data.todos[id]!),
);

const stats = TodoApp.selector("stats", (s) => {
  const all = Object.values(s.data.todos);
  return {
    total: all.length,
    completed: all.filter((t) => t.completed).length,
  };
});

const editingTodo = TodoApp.selector("editingTodo", (s) =>
  s.ui.editingId !== null ? (s.data.todos[s.ui.editingId] ?? null) : null,
);

// ═══════════════════════════════════════════════════════════════════
// App-level Commands (UNDO, REDO — not zone-specific)
// ═══════════════════════════════════════════════════════════════════

const undo = TodoApp.command(
  "UNDO",
  (ctx) => ({
    // when: canUndo guarantees past is non-empty
    state: produce(ctx.state, (d) => {
      const prev = d.history.past.pop()!;
      d.history.future.unshift(ctx.state);
      d.data = prev.data;
      d.ui = prev.ui;
    }),
  }),
  { when: canUndo },
);

const redo = TodoApp.command(
  "REDO",
  (ctx) => ({
    // when: canRedo guarantees future is non-empty
    state: produce(ctx.state, (d) => {
      const next = d.history.future.shift()!;
      d.history.past.push(ctx.state);
      d.data = next.data;
      d.ui = next.ui;
    }),
  }),
  { when: canRedo },
);

const clearCompleted = TodoApp.command(
  "CLEAR_COMPLETED",
  (ctx) => ({
    state: produce(ctx.state, (d) => {
      for (const id of d.data.todoOrder) {
        if (d.data.todos[id]?.completed) delete d.data.todos[id];
      }
      d.data.todoOrder = d.data.todoOrder.filter(
        (id) => d.data.todos[id] !== undefined,
      );
    }),
  }),
  { when: hasCompletedTodos },
);

// ═══════════════════════════════════════════════════════════════════
// Zone: list
// ═══════════════════════════════════════════════════════════════════

const listZone = TodoApp.createZone("list");

const toggleTodo = listZone.command(
  "TOGGLE_TODO",
  (ctx, payload: { id: number }) => ({
    state: produce(ctx.state, (d) => {
      const todo = d.data.todos[payload.id];
      if (todo) todo.completed = !todo.completed;
    }),
  }),
);

const deleteTodo = listZone.command(
  "DELETE_TODO",
  (ctx, payload: { id: number }) => ({
    state: produce(ctx.state, (d) => {
      delete d.data.todos[payload.id];
      d.data.todoOrder = d.data.todoOrder.filter((i) => i !== payload.id);
    }),
  }),
);

const startEdit = listZone.command(
  "START_EDIT",
  (ctx, payload: { id: number }) => ({
    state: produce(ctx.state, (d) => {
      d.ui.editingId = payload.id;
      d.ui.editDraft = d.data.todos[payload.id]?.text ?? "";
    }),
  }),
  { when: isNotEditing },
);

const copyTodo = listZone.command(
  "COPY_TODO",
  (ctx, payload: { id: number }) => {
    const todo = ctx.state.data.todos[payload.id];
    if (!todo) return;
    return {
      state: produce(ctx.state, (d) => {
        d.ui.clipboard = {
          id: todo.id,
          text: todo.text,
          completed: todo.completed,
        };
      }),
    };
  },
);

const pasteTodo = listZone.command(
  "PASTE_TODO",
  (ctx) => {
    const clip = ctx.state.ui.clipboard!; // when: hasClipboard guarantees non-null
    const newId = ctx.state.data.nextId;
    return {
      state: produce(ctx.state, (d) => {
        d.data.todos[newId] = { id: newId, text: clip.text, completed: false };
        d.data.todoOrder.push(newId);
        d.data.nextId = newId + 1;
      }),
    };
  },
  { when: hasClipboard },
);

const duplicateTodo = listZone.command(
  "DUPLICATE_TODO",
  (ctx, payload: { id: number }) => {
    const todo = ctx.state.data.todos[payload.id];
    if (!todo) return;
    const newId = ctx.state.data.nextId;
    return {
      state: produce(ctx.state, (d) => {
        d.data.todos[newId] = { ...todo, id: newId };
        const idx = d.data.todoOrder.indexOf(payload.id);
        d.data.todoOrder.splice(idx + 1, 0, newId);
        d.data.nextId = newId + 1;
      }),
    };
  },
);

// ── Bind: list zone ──

const TodoListUI = listZone.bind({
  role: "listbox",
  onCheck: toggleTodo,
  onAction: startEdit,
  onDelete: deleteTodo,
  onCopy: copyTodo,
  onPaste: pasteTodo,
  onUndo: undo, // ← app-level command, bound in zone
  onRedo: redo, // ← app-level command, bound in zone
  keybindings: [
    { key: "Meta+D", command: duplicateTodo },
    { key: "Meta+Z", command: undo, when: canUndo },
    { key: "Meta+Shift+Z", command: redo, when: canRedo },
  ],
});

// ═══════════════════════════════════════════════════════════════════
// Zone: draft
// ═══════════════════════════════════════════════════════════════════

const draftZone = TodoApp.createZone("draft");

const syncDraft = draftZone.command(
  "SYNC_DRAFT",
  (ctx, payload: { text: string }) => ({
    state: { ...ctx.state, ui: { ...ctx.state.ui, draft: payload.text } },
  }),
);

const addTodo = draftZone.command("ADD_TODO", (ctx) => {
  const text = ctx.state.ui.draft.trim();
  if (!text) return;
  const newId = ctx.state.data.nextId;
  return {
    state: produce(ctx.state, (d) => {
      d.data.todos[newId] = { id: newId, text, completed: false };
      d.data.todoOrder.push(newId);
      d.data.nextId = newId + 1;
      d.ui.draft = "";
    }),
  };
});

const TodoDraftUI = draftZone.bind({
  role: "textbox",
  field: {
    onChange: syncDraft,
    onSubmit: addTodo,
  },
});

// ═══════════════════════════════════════════════════════════════════
// Zone: edit
// ═══════════════════════════════════════════════════════════════════

const editZone = TodoApp.createZone("edit");

const syncEditDraft = editZone.command(
  "SYNC_EDIT_DRAFT",
  (ctx, payload: { text: string }) => ({
    state: { ...ctx.state, ui: { ...ctx.state.ui, editDraft: payload.text } },
  }),
);

const commitEdit = editZone.command(
  "COMMIT_EDIT",
  (ctx) => {
    const { editingId, editDraft } = ctx.state.ui;
    // when: isEditing guarantees editingId !== null
    return {
      state: produce(ctx.state, (d) => {
        const todo = d.data.todos[editingId!];
        if (todo) todo.text = editDraft;
        d.ui.editingId = null;
        d.ui.editDraft = "";
      }),
    };
  },
  { when: isEditing },
);

const cancelEdit = editZone.command(
  "CANCEL_EDIT",
  (ctx) => ({
    state: produce(ctx.state, (d) => {
      d.ui.editingId = null;
      d.ui.editDraft = "";
    }),
  }),
  { when: isEditing },
);

const TodoEditUI = editZone.bind({
  role: "textbox",
  field: {
    onChange: syncEditDraft,
    onSubmit: commitEdit,
    onCancel: cancelEdit,
  },
});

// ═══════════════════════════════════════════════════════════════════
// TEST: dispatch with when guard
// ═══════════════════════════════════════════════════════════════════

const app = TodoApp.create();

// ── Add a todo ──
app.dispatch(syncDraft({ text: "Buy milk" }));
app.dispatch(addTodo());
console.assert(app.state.data.todoOrder.length === 1, "should have 1 todo");
console.assert(
  app.state.data.todos[1]!.text === "Buy milk",
  "text should match",
);

// ── Toggle ──
app.dispatch(toggleTodo({ id: 1 }));
console.assert(
  app.state.data.todos[1]!.completed === true,
  "should be completed",
);

// ── when guard: UNDO blocked when history is empty ──
const undoResult = app.dispatch(undo());
console.assert(undoResult === false, "undo should be blocked — no history");

// ── when guard: PASTE blocked when clipboard is empty ──
const pasteResult = app.dispatch(pasteTodo());
console.assert(pasteResult === false, "paste should be blocked — no clipboard");

// ── Copy then paste ──
app.dispatch(copyTodo({ id: 1 }));
console.assert(
  app.evaluate(hasClipboard) === true,
  "clipboard should have data",
);
const pasteResult2 = app.dispatch(pasteTodo());
console.assert(
  pasteResult2 === true,
  "paste should succeed — clipboard has data",
);
console.assert(app.state.data.todoOrder.length === 2, "should have 2 todos");

// ── when guard: CLEAR_COMPLETED passes when completed todos exist ──
console.assert(
  app.evaluate(hasCompletedTodos) === true,
  "should have completed",
);
const clearResult = app.dispatch(clearCompleted());
console.assert(clearResult === true, "clear should succeed");
console.assert(
  app.state.data.todoOrder.length === 1,
  "completed todos removed",
);

// ── Condition evaluation ──
console.assert(app.evaluate(canUndo) === false, "no history");
console.assert(app.evaluate(isEditing) === false, "not editing");
console.assert(app.evaluate(isNotEditing) === true, "not editing (inverse)");
console.assert(app.evaluate(hasTodos) === true, "has todos");

// ── Selector evaluation ──
const todosData = app.select(visibleTodos);
console.assert(todosData.length === 1, "1 visible todo");
const statsData = app.select(stats);
console.assert(statsData.total === 1, "1 total");
console.assert(statsData.completed === 0, "0 completed");

// ── Start edit (when: isNotEditing) ──
app.dispatch(startEdit({ id: app.state.data.todoOrder[0]! }));
console.assert(app.evaluate(isEditing) === true, "now editing");

// ── Start edit again (when: isNotEditing → should block) ──
const editResult = app.dispatch(
  startEdit({ id: app.state.data.todoOrder[0]! }),
);
console.assert(editResult === false, "start edit blocked — already editing");

// ── Commit edit (when: isEditing) ──
app.dispatch(syncEditDraft({ text: "Updated" }));
app.dispatch(commitEdit());
console.assert(app.evaluate(isEditing) === false, "editing done");

// ── DevTools: enumerate all conditions ──
const allConditions = TodoApp.conditions();
console.assert(allConditions.length === 7, "should have 7 conditions");

// ── DevTools: enumerate all selectors ──
const allSelectors = TodoApp.selectors();
console.assert(allSelectors.length === 3, "should have 3 selectors");

// ── Condition duplicate name → throws ──
let duplicateThrew = false;
try {
  TodoApp.condition("canUndo", () => false); // duplicate!
} catch {
  duplicateThrew = true;
}
console.assert(
  duplicateThrew === true,
  "duplicate condition name should throw",
);

// ── Selector duplicate name → throws ──
let selectorDuplicateThrew = false;
try {
  TodoApp.selector("stats", (s) => s.data);
} catch {
  selectorDuplicateThrew = true;
}
console.assert(
  selectorDuplicateThrew === true,
  "duplicate selector name should throw",
);

// ═══════════════════════════════════════════════════════════════════
// TYPE TESTS
// ═══════════════════════════════════════════════════════════════════

// ✅ Condition accepted in when
TodoApp.command("TEST_A", (ctx) => ({ state: ctx.state }), { when: canUndo });

// ✅ Selector NOT accepted in when (type error)
// @ts-expect-error — Selector<S, Todo[]> is not Condition<S>
TodoApp.command("TEST_B", (ctx) => ({ state: ctx.state }), {
  when: visibleTodos,
});

// ✅ Inline lambda NOT accepted in when (not branded)
// @ts-expect-error — plain function is not Condition<S>
TodoApp.command("TEST_C", (ctx) => ({ state: ctx.state }), {
  when: (s: TodoState) => s.ui.editingId !== null,
});

// ✅ Payload enforcement
// @ts-expect-error — missing required payload
toggleTodo();

// ✅ Void command — no args needed
clearCompleted();

// ✅ Command type literal
console.assert(toggleTodo.commandType === "TOGGLE_TODO", "commandType literal");

// ✅ Bound components produce React nodes
console.assert(typeof TodoListUI.Zone === "function", "Zone component");
console.assert(typeof TodoDraftUI.Field === "function", "Field component");
console.assert(typeof TodoEditUI.When === "function", "When component");

// ✅ cancelEdit blocked when not editing
console.assert(
  app.dispatch(cancelEdit()) === false,
  "cancel blocked — not editing",
);

// ✅ editingTodo selector returns null when idle
console.assert(app.select(editingTodo) === null, "no editing todo");
