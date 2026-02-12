# Glossary

> Canonical terminology, naming conventions, and frozen design decisions.

---

## Terms

| Term | Definition | ❌ Do Not Use |
|---|---|---|
| **Kernel** | Universal command processing engine | runtime, core |
| **Group** | The only abstraction unit. Provides `defineCommand`, `defineEffect`, `defineContext`, `group`, `dispatch`, `use`, `reset`. Kernel itself is a Group. | module, namespace |
| **Command** | Immutable object `{ type, payload?, scope? }`. Created by CommandFactory. | event, action, message |
| **CommandFactory** | Function returned by `defineCommand()`. Creates typed Commands. `INC()` → `Command<"INC", void>`. | CommandToken, creator |
| **EffectMap** | Handler return value. `{ state?, [EffectToken]?, dispatch? }` | result, fx-map, response |
| **Effect** | Side-effect handler registered via `defineEffect()`. Executed by the engine, not the handler. | side-effect, fx |
| **EffectToken** | Branded string. Return value of `defineEffect()`. Used as computed key. | effect key, effect ID |
| **Context** | Read-only external data. `{ state, ...injected }`. Injected via `group({ inject })`. | cofx, coeffects |
| **ContextToken** | Wrapper object `{ __id, __phantom? }`. Return value of `defineContext()`. | context key |
| **Scope** | String ID for hierarchical command resolution. One per Group. | layer, level, namespace |
| **ScopeToken** | Branded string. Return value of `defineScope()`. | scope ID |
| **Middleware** | `{ id, before?, after?, fallback? }`. Cross-cutting hooks. | interceptor, plugin |
| **State** | Single immutable state tree. | db, DB, store, OSState |
| **Token** | Type-safe reference. Created only through `define*()`. Prevents raw string usage. | ID, key, tag |
| **Computed** | Derived state via `useComputed(selector)`. | subscription, selector |
| **State Lens** | `{ get, set }` pair for scope isolation. Handlers see only their slice. | reducer, slice |
| **Transaction** | Recorded command execution with state snapshots. Enables time travel. | event, log entry |
| **Bubble Path** | Ordered scope array from specific to general. `[TODO, SIDEBAR, APP, GLOBAL]` | scope chain |

---

## Naming Conventions

### SCREAMING_CASE for Tokens

All tokens (CommandFactory, EffectToken, ScopeToken, ContextToken) use `SCREAMING_CASE`:

```typescript
const INCREMENT = kernel.defineCommand("INCREMENT", handler);
const FOCUS_ID = kernel.defineEffect("FOCUS_ID", handler);
const TODO_LIST = defineScope("TODO_LIST");
const DOM_ITEMS = kernel.defineContext("DOM_ITEMS", provider);
```

The variable name **must match** the string literal for grep/find-replace consistency.

### Forbidden Abbreviations

| ❌ Abbreviation | ✅ Full Name |
|---|---|
| `db` | `state` |
| `fx` | `effect` |
| `cofx` | `ctx` (context) |
| `mw` | `middleware` |
| `sub` | `computed` |
| `cmd` | `command` |

---

## Design Decisions

These decisions are **frozen** and should not be changed without a full design review.

### D1: Command, Not Event

Dispatch data is called **Command** (not Event). This avoids collision with DOM `Event` — kernels process Commands, browsers process Events.

### D2: Effects as Data

Handlers don't execute side effects. They return an `EffectMap` declaring what should happen. The engine executes effects after the handler returns. This keeps handlers **pure and testable**.

### D3: CommandFactory Pattern

No dispatch overloading. `dispatch(CMD())` is the only form. The factory creates the Command; dispatch receives it.

**Rationale:** `dispatch(TOKEN, payload)` causes **LLM hallucination** — AI models often generate incorrect overloaded forms. A single signature eliminates this class of errors.

### D4: Branded Types

Every token uses TypeScript branded types (`unique symbol`). This prevents structural subtyping — `{ type: "INCREMENT" }` is not a valid `Command` because it lacks the brand symbol. Only `CommandFactory` can create branded Commands.

### D5: Index Signature Removal

`EffectMap` and Context do not use index signatures (`[key: string]: unknown`). Only explicitly defined keys are valid. This catches typos and unregistered keys at compile time.

### D6: ContextToken as Wrapper Object

ContextToken uses a wrapper object `{ __id, __phantom? }` instead of a branded string because TypeScript's mapped types fail to infer `Value` from branded strings. The wrapper form enables `InjectResult<Tokens>` to work correctly.

### D7: Group = The Only Interface

Kernel itself is a Group (`GLOBAL` scope). There is no separate "kernel API" vs "group API" — it's the same interface. This minimizes API surface and learning cost.

### D8: Middleware Model

Middleware uses `{ id, before, after }` — inspired by re-frame's interceptor model. Not Redux's `(next) => (state, action) => ...` chaining.

### D9: Scope is Explicit

Commands carry their scope in `cmd.scope`. This is explicit, deterministic, and replayable — unlike implicit scope derived from call-site or context.

### D10: Kernel is Input-Agnostic

Kernel knows nothing about input sources. Keyboards, mice, clipboards — all are OS concerns. Kernel receives Commands and doesn't care where they came from.

### D11: Closure, Not Singleton

`createKernel()` uses closures for all internal state. No `globalThis`, no singleton registry. Each instance is independent, making it HMR-safe and testing-friendly.

---

## Inspirations

| Source | What We Took |
|---|---|
| **re-frame** | Effects as data, interceptor model, coeffects → inject |
| **Redux** | Single state tree, middleware, time travel |
| **Zustand** | Closure-based store, `useSyncExternalStore` |
| **Elm** | Cmd pattern (effects returned by update function) |
| **DOM** | Event bubbling → scope bubbling |

---

## Frozen Status

> `@frozen 2026-02-11 — Reviewed and locked. Do not modify without design review.`

The kernel source code (`packages/kernel/src/`) is frozen. This means:

- No new features without a formal design review
- Bug fixes only with regression tests
- All documentation in this folder reflects the frozen state
- The API surface documented here is the **final** public API
