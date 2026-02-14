# Patterns & Recipes

> Best practices and common patterns for building with Kernel.

---

## App Registration Pattern

Register an app dynamically at runtime with its own scoped state:

```typescript
import { createKernel, defineScope } from "@kernel";

// ── Kernel ──
interface AppState {
  os: OSState;
  apps: Record<string, unknown>;
}

const kernel = createKernel<AppState>({
  os: initialOSState,
  apps: {},
});

// ── App Registration ──
interface TodoState {
  todos: { id: string; text: string; done: boolean }[];
}

const TODO_SCOPE = defineScope("TODO");

// 1. Inject initial state
kernel.setState((prev) => ({
  ...prev,
  apps: { ...prev.apps, todo: { todos: [] } },
}));

// 2. Create scoped group with state lens
const todoGroup = kernel.group({
  scope: TODO_SCOPE,
  stateSlice: {
    get: (full) => full.apps.todo as TodoState,
    set: (full, slice) => ({
      ...full,
      apps: { ...full.apps, todo: slice },
    }),
  },
});

// 3. Define commands — handlers see only TodoState
const ADD_TODO = todoGroup.defineCommand(
  "ADD_TODO",
  (ctx) => (text: string) => ({
    state: {
      ...ctx.state,
      todos: [
        ...ctx.state.todos,
        { id: `todo-${Date.now()}`, text, done: false },
      ],
    },
  }),
);
```

---

## Command + Effect Combo

The most common pattern: state update + side effect.

```typescript
const FOCUS_ID = kernel.defineEffect("FOCUS_ID", (id: string) => {
  document.querySelector(`[data-item-id="${id}"]`)?.focus();
});

const SCROLL_TO = kernel.defineEffect("SCROLL_TO", (id: string) => {
  document.querySelector(`[data-item-id="${id}"]`)?.scrollIntoView({
    block: "nearest",
  });
});

const NAVIGATE = kernel.defineCommand(
  "NAVIGATE",
  (ctx) => (direction: "up" | "down") => {
    const targetId = resolveNext(ctx.state, direction);
    return {
      state: { ...ctx.state, focusedId: targetId },
      [FOCUS_ID]: targetId,
      [SCROLL_TO]: targetId,
    };
  },
);
```

---

## Command Chaining

Dispatch multiple commands from a single handler:

```typescript
const RESET_AND_RELOAD = kernel.defineCommand(
  "RESET_AND_RELOAD",
  (ctx) => () => ({
    state: { ...ctx.state, count: 0 },
    dispatch: [FETCH_DATA(), NOTIFY_USER("Reset complete")],
  }),
);
```

Commands in `dispatch` are queued and processed sequentially after the current one.

---

## Conditional Handling (Guard Pattern)

Return `undefined` to pass on a command:

```typescript
const ACTIVATE = scopedGroup.defineCommand(
  "ACTIVATE",
  (ctx) => () => {
    // Guard: only handle if zone is active
    if (!ctx.state.isActive) return undefined; // bubble

    return {
      state: { ...ctx.state, activated: true },
    };
  },
);
```

---

## Scope Override Chain

Use multi-scope commands for OS-level features where the scope depends on runtime context:

```typescript
// OS layer computes dynamic scope chain from focus state
function handleKeyDown(key: string) {
  const focusedZoneId = kernel.getState().os.focus.activeZoneId;
  const scopeChain = kernel.getScopePath(focusedZoneId);

  kernel.dispatch(ACTION(), { scope: scopeChain });
  // → searches focused zone → parent → ... → GLOBAL
}
```

---

## Derived State (React)

Use `useComputed` for efficient derived state:

```typescript
// ✅ Fine-grained subscription
function TodoCount() {
  const total = kernel.useComputed((s) =>
    (s.apps.todo as TodoState).todos.length,
  );
  const done = kernel.useComputed((s) =>
    (s.apps.todo as TodoState).todos.filter((t) => t.done).length,
  );
  return <span>{done} / {total}</span>;
}

// ✅ Boolean derived state
function useFocused(itemId: string): boolean {
  return kernel.useComputed(
    (s) => s.os.focus.focusedItemId === itemId,
  );
}
```

---

## Testing Pattern

Kernel instances are independent — perfect for isolated tests:

```typescript
function createTestKernel() {
  const kernel = createKernel<TestState>({ count: 0 });

  const INCREMENT = kernel.defineCommand(
    "INCREMENT",
    (ctx) => () => ({
      state: { ...ctx.state, count: ctx.state.count + 1 },
    }),
  );

  return { kernel, INCREMENT };
}

// Each test gets a fresh instance
test("increment", () => {
  const { kernel, INCREMENT } = createTestKernel();
  kernel.dispatch(INCREMENT());
  expect(kernel.getState().count).toBe(1);
});

test("independent state", () => {
  const { kernel } = createTestKernel();
  expect(kernel.getState().count).toBe(0); // not affected by other test
});
```

### Transaction-Based Assertions

```typescript
test("effects are recorded", () => {
  const { kernel, NAVIGATE } = createTestKernel();
  kernel.dispatch(NAVIGATE({ direction: "down" }));

  const tx = kernel.getLastTransaction()!;
  expect(tx.command.type).toBe("NAVIGATE");
  expect(tx.handlerScope).toBe("GLOBAL");
  expect(tx.changes).toContainEqual({
    path: "focusedId",
    from: null,
    to: "item-1",
  });
});
```

---

## Anti-Patterns

### ❌ Side Effects in Handlers

```typescript
// ❌ BAD: Direct DOM manipulation
kernel.defineCommand("BAD", (ctx) => () => {
  document.getElementById("x")?.focus(); // side effect!
  return { state: ctx.state };
});

// ✅ GOOD: Declare effect
kernel.defineCommand("GOOD", (ctx) => () => ({
  state: ctx.state,
  [FOCUS_ID]: "x", // engine handles it
}));
```

### ❌ Raw String Dispatch

```typescript
// ❌ These will not compile
dispatch({ type: "INCREMENT" });
dispatch("INCREMENT");
dispatch("SET_COUNT", 42);

// ✅ CommandFactory only
dispatch(INCREMENT());
dispatch(SET_COUNT(42));
```

### ❌ Mutating State

```typescript
// ❌ Never mutate
kernel.defineCommand("BAD", (ctx) => () => {
  ctx.state.count = 99; // mutation!
  return { state: ctx.state };
});

// ✅ Spread or use immer's produce()
kernel.defineCommand("GOOD", (ctx) => () => ({
  state: { ...ctx.state, count: 99 },
}));
```

### ❌ setState in Handlers

```typescript
// ❌ Never call kernel.setState inside a handler
kernel.defineCommand("BAD", (ctx) => () => {
  kernel.setState(() => ({ count: 99 })); // ❌ bypasses pipeline
  return {};
});

// ✅ Return state in effect map
kernel.defineCommand("GOOD", (ctx) => () => ({
  state: { ...ctx.state, count: 99 },
}));
```

---

## Next

→ [Glossary](./09-glossary.md) — Terminology and design decisions.
