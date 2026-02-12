/**
 * Smoke test: state lens + context injection
 *
 * Validates that:
 * 1. App commands see only their scoped state (state lens)
 * 2. Context injection provides OS info without OS.FOCUS placeholder
 * 3. App state mutations don't bleed into OS state
 * 4. dispatch effect from app command triggers OS-level command
 */

import { createKernel, defineScope } from "../src/createKernel.ts";

// ─── State Shape ───

type OSState = {
  focus: { activeZoneId: string; focusedItemId: string | null };
};

type TodoState = {
  todos: { id: string; text: string; done: boolean }[];
};

type AppState = {
  os: OSState;
  apps: Record<string, unknown>;
};

// ─── Setup: Kernel starts with NO app state ───

const kernel = createKernel<AppState>({
  os: { focus: { activeZoneId: "list", focusedItemId: "todo-1" } },
  apps: {}, // ← apps 비어있음. 커널은 앱을 모름.
});

// ─── App Registration (mirrors registerAppSlice) ───

const todoScope = defineScope("todo");

// 1. 앱이 자기 state를 등록 (런타임에 동적으로)
const todoInitial: TodoState = {
  todos: [
    { id: "todo-1", text: "Buy milk", done: false },
    { id: "todo-2", text: "Walk dog", done: false },
  ],
};
kernel.setState((prev) => ({
  ...prev,
  apps: { ...prev.apps, todo: todoInitial },
}));

// 2. Context: Focus info (replaces OS.FOCUS placeholder)
const FocusInfo = kernel.defineContext("focus-info", () => ({
  focusedItemId: kernel.getState().os.focus.focusedItemId,
  activeZoneId: kernel.getState().os.focus.activeZoneId,
}));

// 3. Scoped group with state lens (앱은 자기 slice만 봄)
const todoGroup = kernel.group({
  scope: todoScope,
  inject: [FocusInfo],
  stateSlice: {
    get: (full: AppState) => full.apps.todo as TodoState,
    set: (full: AppState, slice: unknown) => ({
      ...full,
      apps: { ...full.apps, todo: slice },
    }),
  },
});

// ─── Test 1: State Lens — handler sees only TodoState ───

const TOGGLE_FOCUSED = todoGroup.defineCommand(
  "TOGGLE_FOCUSED",
  (ctx: {
    state: TodoState;
    inject: (t: typeof FocusInfo) => { focusedItemId: string | null };
  }) =>
    () => {
      const focusedId = ctx.inject(FocusInfo).focusedItemId;
      if (!focusedId) return undefined;

      return {
        state: {
          ...ctx.state,
          todos: ctx.state.todos.map((t) =>
            t.id === focusedId ? { ...t, done: !t.done } : t,
          ),
        },
      };
    },
);

// ─── Test 2: State Lens — handler with payload (no OS.FOCUS needed) ───

const ADD_TODO = todoGroup.defineCommand(
  "ADD_TODO",
  (ctx: { state: TodoState }) => (payload: { text: string }) => ({
    state: {
      ...ctx.state,
      todos: [
        ...ctx.state.todos,
        {
          id: `todo-${ctx.state.todos.length + 1}`,
          text: payload.text,
          done: false,
        },
      ],
    },
  }),
);

// ─── Gap 3: App Effects via defineEffect (replaces state.effects[]) ───

const effectLog: string[] = [];

const focusId = todoGroup.defineEffect("focusId", (id: string) => {
  effectLog.push(`focus:${id}`);
});

const scrollIntoView = todoGroup.defineEffect(
  "scrollIntoView",
  (id: string) => {
    effectLog.push(`scroll:${id}`);
  },
);

const ADD_TODO_WITH_EFFECTS = todoGroup.defineCommand(
  "ADD_TODO_FX",
  (ctx: { state: TodoState }) => (payload: { text: string }) => {
    const newId = `todo-${ctx.state.todos.length + 1}`;
    return {
      state: {
        ...ctx.state,
        todos: [
          ...ctx.state.todos,
          { id: newId, text: payload.text, done: false },
        ],
      },
      // Effects returned directly — no state.effects[] array needed
      [focusId]: newId,
      [scrollIntoView]: newId,
    };
  },
);

// ─── Run Tests ───

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${message}`);
  } else {
    failed++;
    console.error(`  ❌ ${message}`);
  }
}

console.log("\n🧪 Kernel State Lens + Context Injection Tests\n");

// Test 1: TOGGLE_FOCUSED via context injection (no OS.FOCUS)
console.log("Test 1: TOGGLE_FOCUSED reads focus from context injection");
kernel.dispatch(TOGGLE_FOCUSED());
const afterToggle = kernel.getState();
const todoState1 = afterToggle.apps.todo as TodoState;
assert(todoState1.todos[0].done === true, "todo-1 toggled to done=true");
assert(todoState1.todos[1].done === false, "todo-2 unchanged");

// Test 2: OS state is untouched
console.log("\nTest 2: OS state is untouched after app command");
assert(afterToggle.os.focus.focusedItemId === "todo-1", "OS focus unchanged");
assert(
  afterToggle.os.focus.activeZoneId === "list",
  "OS activeZoneId unchanged",
);

// Test 3: ADD_TODO with payload (no placeholder needed)
console.log("\nTest 3: ADD_TODO with payload — no OS.FOCUS placeholder");
kernel.dispatch(ADD_TODO({ text: "New task" }));
const afterAdd = kernel.getState();
const todoState2 = afterAdd.apps.todo as TodoState;
assert(todoState2.todos.length === 3, "3 todos after add");
assert(todoState2.todos[2].text === "New task", "new todo has correct text");

// Test 4: Toggle again — second toggle undoes the first
console.log("\nTest 4: Toggle again — undoes the first toggle");
kernel.dispatch(TOGGLE_FOCUSED());
const afterToggle2 = kernel.getState();
const todoState3 = afterToggle2.apps.todo as TodoState;
assert(todoState3.todos[0].done === false, "todo-1 toggled back to done=false");

// Test 5: OS state still completely intact
console.log("\nTest 5: OS state still intact after multiple app commands");
assert(
  afterToggle2.os === afterToggle.os,
  "OS state reference identity preserved (no mutation)",
);

// Test 6: App effects via defineEffect (Gap 3)
console.log(
  "\nTest 6: App effects via defineEffect — replaces state.effects[]",
);
effectLog.length = 0;
kernel.dispatch(ADD_TODO_WITH_EFFECTS({ text: "Effect task" }));
const afterFx = kernel.getState();
const todoStateFx = afterFx.apps.todo as TodoState;
assert(todoStateFx.todos.length === 4, "4 todos after ADD_TODO_FX");
assert(todoStateFx.todos[3].text === "Effect task", "new todo text correct");
assert(
  effectLog.includes("focus:todo-4"),
  "focusId effect fired with correct id",
);
assert(
  effectLog.includes("scroll:todo-4"),
  "scrollIntoView effect fired with correct id",
);
assert(effectLog.length === 2, "exactly 2 effects fired");

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) process.exit(1);
