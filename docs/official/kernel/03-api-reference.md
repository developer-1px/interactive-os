# API Reference

> Complete API surface of the Kernel package.

---

## createKernel

Creates an independent kernel instance.

```typescript
function createKernel<S>(initialState: S): Kernel<S>
```

### Parameters

| Parameter | Type | Description |
|---|---|---|
| `initialState` | `S` | Initial state tree |

### Returns

A kernel instance combining the root Group API, Store API, React hooks, and Inspector API:

```typescript
type Kernel<S> = {
  // Group API (root scope = GLOBAL)
  defineCommand: DefineCommand<S>;
  defineEffect: DefineEffect;
  defineContext: DefineContext;
  group: GroupFactory<S>;
  dispatch: Dispatch;
  use: (middleware: Middleware) => void;
  reset: (newState: S) => void;

  // Store
  getState: () => S;
  setState: (updater: (prev: S) => S) => void;
  subscribe: (listener: () => void) => () => void;

  // React
  useComputed: <T>(selector: (state: S) => T) => T;

  // Inspector
  getTransactions: () => readonly Transaction[];
  getLastTransaction: () => Transaction | undefined;
  clearTransactions: () => void;
  travelTo: (id: number) => void;

  // Scope Tree
  getScopePath: (scope: ScopeToken) => ScopeToken[];
  getScopeParent: (scope: ScopeToken) => ScopeToken | null;

  // Fallback
  resolveFallback: (event: Event) => boolean;
}
```

### Example

```typescript
const kernel = createKernel<{ count: number }>({ count: 0 });
```

---

## defineScope

Creates a `ScopeToken` — a branded string identifier for scope namespacing.

```typescript
function defineScope<Id extends string>(id: Id): ScopeToken<Id>
```

### Example

```typescript
const TODO_LIST = defineScope("TODO_LIST");
const SIDEBAR = defineScope("SIDEBAR");
```

---

## Group API

Every kernel instance is a **Group** (rooted at `GLOBAL`). Groups can create child groups through `group()`.

### group.defineCommand

Registers a command handler and returns a `CommandFactory`.

```typescript
// No payload
defineCommand<T>(type: T, handler: (ctx: Ctx) => () => EffectMap | undefined): CommandFactory<T, void>

// With payload
defineCommand<T, P>(type: T, handler: (ctx: Ctx) => (payload: P) => EffectMap | undefined): CommandFactory<T, P>

// Per-command inject (no payload)
defineCommand<T>(type: T, tokens: ContextToken[], handler: (ctx: any) => () => EffectMap | undefined): CommandFactory<T, void>

// Per-command inject (with payload)
defineCommand<T, P>(type: T, tokens: ContextToken[], handler: (ctx: any) => (payload: P) => EffectMap | undefined): CommandFactory<T, P>
```

**Handler receives:**

| Field | Type | Description |
|---|---|---|
| `ctx.state` | `S` | Current state (or scoped slice via state lens) |
| `ctx.{token.__id}` | varies | Injected context values |
| `ctx.inject(token)` | varies | Alternative injection access |

**Handler returns:**

| Field | Type | Description |
|---|---|---|
| `state` | `S` | New state tree (or scoped slice) |
| `dispatch` | `BaseCommand \| BaseCommand[]` | Commands to re-dispatch |
| `[EffectToken]` | varies | Custom effect value |

Returns `undefined` to **bubble** to the parent scope.

### group.defineEffect

Registers an effect handler and returns an `EffectToken`.

```typescript
defineEffect<T extends string, V>(type: T, handler: (value: V) => void): EffectToken<T, V>
```

### group.defineContext

Registers a context provider and returns a `ContextToken`.

```typescript
defineContext<Id extends string, V>(id: Id, provider: () => V): ContextToken<Id, V>
```

### group.group

Creates a child group with optional scope, context injection, and state lens.

```typescript
group(config: {
  scope?: ScopeToken;
  inject?: ContextToken[];
  stateSlice?: {
    get: (full: S) => unknown;
    set: (full: S, slice: unknown) => S;
  };
}): Group
```

| Config | Description |
|---|---|
| `scope` | Scope token for this group (auto-registered in parent tree) |
| `inject` | Context tokens to inject into all handlers in this group |
| `stateSlice` | State lens for scope isolation (handlers see only their slice) |

### group.dispatch

Dispatches a command through the pipeline.

```typescript
dispatch(cmd: BaseCommand, options?: {
  scope?: ScopeToken[];
  meta?: Record<string, unknown>;
}): void
```

| Parameter | Description |
|---|---|
| `cmd` | Command object (from CommandFactory) |
| `options.scope` | Explicit scope chain override |
| `options.meta` | Metadata recorded in transaction (not passed to handler) |

### group.use

Registers middleware at this group's scope.

```typescript
use(middleware: Middleware): void
```

### group.reset

Resets state and clears transaction log. Registry is preserved.

```typescript
reset(newState: S): void
```

---

## Store API

### getState

Returns the current state tree.

```typescript
getState(): S
```

### setState

Directly updates state (bypasses dispatch pipeline).

```typescript
setState(updater: (prev: S) => S): void
```

> [!WARNING]
> `setState` bypasses the dispatch pipeline. No transaction is recorded, no effects are executed. Use only for initialization, testing, or escape hatches.

### subscribe

Subscribes a listener to state changes. Returns an unsubscribe function.

```typescript
subscribe(listener: () => void): () => void
```

---

## React API

### useComputed

Subscribes to a derived value from the state tree. Built on `useSyncExternalStore`.

```typescript
useComputed<T>(selector: (state: S) => T): T
```

```tsx
function TodoCount() {
  const count = kernel.useComputed((s) => s.todos.length);
  return <span>{count}</span>;
}
```

---

## Inspector API

### getTransactions

Returns the full transaction log (capped at 200, FIFO).

```typescript
getTransactions(): readonly Transaction[]
```

### getLastTransaction

Returns the most recent transaction, or `undefined` if none.

```typescript
getLastTransaction(): Transaction | undefined
```

### travelTo

Restores state to the snapshot captured after a given transaction.

```typescript
travelTo(transactionId: number): void
```

### clearTransactions

Clears the transaction log and resets the ID counter.

```typescript
clearTransactions(): void
```

---

## Scope Tree API

### getScopePath

Returns the full bubble path from a scope to GLOBAL.

```typescript
getScopePath(scope: ScopeToken): ScopeToken[]
// Example: [TODO_LIST, SIDEBAR, APP, GLOBAL]
```

### getScopeParent

Returns the parent scope, or `null` for root-level scopes.

```typescript
getScopeParent(scope: ScopeToken): ScopeToken | null
```

---

## Fallback API

### resolveFallback

Side channel for unhandled native events. Iterates GLOBAL middleware `fallback` hooks.

```typescript
resolveFallback(event: Event): boolean
```

Returns `true` if a middleware produced and dispatched a Command. Used by OS-layer listeners when their primary resolution fails.

---

## Constants

### GLOBAL

The built-in root scope. Always the last element in any bubble path.

```typescript
const GLOBAL: ScopeToken<"GLOBAL">
```

---

## Next

→ [Dispatch Pipeline](./04-dispatch-pipeline.md) — Deep dive into command processing.
