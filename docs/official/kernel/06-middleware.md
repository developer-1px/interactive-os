# Middleware

> Cross-cutting logic with before/after hooks.

---

## Overview

Middleware adds logic that runs **before** and **after** every command at a given scope. Inspired by re-frame's interceptor model.

```typescript
type Middleware = {
  id: string;
  scope?: ScopeToken;
  before?: (ctx: MiddlewareContext) => MiddlewareContext;
  after?: (ctx: MiddlewareContext) => MiddlewareContext;
  fallback?: (event: Event) => BaseCommand | null;
};
```

---

## Registration

```typescript
kernel.use({
  id: "LOGGER",
  before: (ctx) => {
    console.group(`[dispatch] ${ctx.command.type}`);
    return ctx;
  },
  after: (ctx) => {
    console.groupEnd();
    return ctx;
  },
});
```

- `kernel.use()` registers at **GLOBAL** scope
- `scopedGroup.use()` registers at that group's scope
- Omitting `scope` in the middleware object defaults to GLOBAL

---

## Execution Model

### Onion Pattern

Middleware executes in an onion pattern. `before` hooks run in registration order; `after` hooks run in **reverse** order.

```
A:before → B:before → C:before → [handler] → C:after → B:after → A:after
```

### Full Pipeline (Per Scope)

At each scope in the bubble path:

```
1. scope before-middleware (A → B → C)
2. per-command inject interceptors
3. handler execution
4. per-command inject interceptors (after, reverse)
5. scope after-middleware (C → B → A)
```

---

## MiddlewareContext

The context object flows through all middleware hooks and can be transformed:

```typescript
type MiddlewareContext = {
  command: Command;              // the command being processed
  state: unknown;                // current state snapshot
  handlerScope: string;          // which scope we're currently at
  effects: Record<string, unknown> | null;  // handler result (null in before)
  injected: Record<string, unknown>;        // injected context values
};
```

---

## Patterns

### Logging

```typescript
kernel.use({
  id: "LOGGER",
  before: (ctx) => {
    console.group(`[kernel] ${ctx.command.type}`);
    console.log("state:", ctx.state);
    return ctx;
  },
  after: (ctx) => {
    console.log("effects:", ctx.effects);
    console.groupEnd();
    return ctx;
  },
});
```

### Command Aliasing

Transform a command type in the `before` hook:

```typescript
kernel.use({
  id: "ALIAS",
  before: (ctx) => {
    if (ctx.command.type === "LEGACY_ACTION") {
      return { ...ctx, command: { ...ctx.command, type: "NEW_ACTION" } };
    }
    return ctx;
  },
});
```

### Effect Transformation

Modify effect values in the `after` hook:

```typescript
kernel.use({
  id: "UPPERCASE_NOTIFY",
  after: (ctx) => {
    if (ctx.effects?.NOTIFY) {
      return {
        ...ctx,
        effects: {
          ...ctx.effects,
          NOTIFY: (ctx.effects.NOTIFY as string).toUpperCase(),
        },
      };
    }
    return ctx;
  },
});
```

### Context Injection

Inject additional data into the handler context:

```typescript
kernel.use({
  id: "TIMESTAMP",
  before: (ctx) => ({
    ...ctx,
    injected: { ...ctx.injected, __timestamp: Date.now() },
  }),
});
```

### Fallback Handler

Handle native Events that no listener could resolve:

```typescript
kernel.use({
  id: "KEYBOARD_FALLBACK",
  fallback: (event: Event) => {
    if (event instanceof KeyboardEvent && event.key === "F5") {
      return REFRESH();  // returns a Command
    }
    return null;  // pass to next middleware
  },
});
```

Fallback is invoked via `kernel.resolveFallback(event)` — a separate path from normal dispatch.

---

## Deduplication

Middleware with the same `id` at the same scope is **replaced**, not duplicated:

```typescript
kernel.use({ id: "logger", before: v1Handler });
kernel.use({ id: "logger", before: v2Handler });
// → only v2Handler runs
```

This makes middleware **HMR-safe** — re-registration during hot reload doesn't create duplicates.

---

## Scoped Middleware

Middleware can be scoped to run only for commands processed at a specific scope:

```typescript
const todoGroup = kernel.group({ scope: TODO_LIST });

todoGroup.use({
  id: "TODO_VALIDATOR",
  before: (ctx) => {
    // Only runs for commands at TODO_LIST scope
    console.log(`[todo] Processing: ${ctx.command.type}`);
    return ctx;
  },
});
```

Scoped middleware only executes when the pipeline is **evaluating that scope**. If a command doesn't reach that scope (handled earlier in the bubble path), the middleware won't run.

---

## Next

→ [State Management](./07-state-management.md) — State, Store, and State Lens for scope isolation.
