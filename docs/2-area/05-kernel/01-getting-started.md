# Getting Started

> Create your first kernel instance and dispatch commands in under a minute.

---

## Installation

```typescript
import { createKernel, defineScope, GLOBAL } from "@kernel";
```

Kernel is available as the `@kernel` package alias within the interactive-os monorepo.

---

## Quick Start

### 1. Create a Kernel

```typescript
import { createKernel } from "@kernel";

// Define your state shape
interface AppState {
  count: number;
}

// Create a kernel instance with initial state
const kernel = createKernel<AppState>({ count: 0 });
```

Each `createKernel()` call creates a **completely independent instance**. No singletons. No shared global state.

### 2. Define an Effect

Effects are side effects that handlers can declare. Define them before commands that use them.

```typescript
const NOTIFY = kernel.defineEffect("NOTIFY", (msg: string) => {
  console.log(`📢 ${msg}`);
});
```

### 3. Define a Command

Commands are pure handler functions. They receive context (current state + injected values) and return an effect map.

```typescript
const INCREMENT = kernel.defineCommand(
  "INCREMENT",
  (ctx) => () => ({
    state: { ...ctx.state, count: ctx.state.count + 1 },
    [NOTIFY]: `count is now ${ctx.state.count + 1}`,
  }),
);
```

The handler signature is **curried**: `(ctx) => (payload?) => EffectMap`.

### 4. Dispatch

```typescript
kernel.dispatch(INCREMENT());

console.log(kernel.getState()); // { count: 1 }
// Console output: 📢 count is now 1
```

---

## The Flow

```
dispatch(Command)
  → find handler in scope chain
  → handler(ctx)(payload)
  → { state, ...effects }
  → update state
  → execute effects
  → record transaction
```

---

## Adding Payload

Commands can carry typed data:

```typescript
const SET_COUNT = kernel.defineCommand(
  "SET_COUNT",
  (ctx) => (value: number) => ({
    state: { ...ctx.state, count: value },
  }),
);

kernel.dispatch(SET_COUNT(42));
// kernel.getState().count === 42

SET_COUNT("wrong"); // ❌ Compile error — string ≠ number
```

---

## Using with React

```tsx
function Counter() {
  const count = kernel.useComputed((s) => s.count);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => kernel.dispatch(INCREMENT())}>
        Increment
      </button>
    </div>
  );
}
```

`useComputed` is built on `useSyncExternalStore` — it subscribes to kernel state and re-renders only when the selected value changes.

---

## Complete Example

```typescript
import { createKernel } from "@kernel";

// ── State ──
interface TodoState {
  todos: { id: string; text: string; done: boolean }[];
}

const kernel = createKernel<TodoState>({
  todos: [],
});

// ── Effects ──
const FOCUS_ID = kernel.defineEffect("FOCUS_ID", (id: string) => {
  document.getElementById(id)?.focus();
});

// ── Commands ──
const ADD_TODO = kernel.defineCommand(
  "ADD_TODO",
  (ctx) => (text: string) => {
    const id = `todo-${Date.now()}`;
    return {
      state: {
        ...ctx.state,
        todos: [...ctx.state.todos, { id, text, done: false }],
      },
      [FOCUS_ID]: id,
    };
  },
);

const TOGGLE = kernel.defineCommand(
  "TOGGLE",
  (ctx) => (id: string) => ({
    state: {
      ...ctx.state,
      todos: ctx.state.todos.map((t) =>
        t.id === id ? { ...t, done: !t.done } : t,
      ),
    },
  }),
);

// ── Usage ──
kernel.dispatch(ADD_TODO("Buy milk"));
kernel.dispatch(TOGGLE(kernel.getState().todos[0].id));
```

---

## Next

→ [Core Concepts](file:///Users/user/Desktop/interactive-os/docs/2-area/05-kernel/02-core-concepts.md) — Understand Commands, Effects, Context, and Scope in depth.
