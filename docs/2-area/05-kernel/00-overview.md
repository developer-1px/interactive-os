# Kernel

> A universal command processing engine for building interactive applications.

---

## What is Kernel?

Kernel is a **framework-agnostic command processing engine** that provides the foundation for building interactive applications. It processes commands through a scoped pipeline, manages application state, and executes side effects — all with full type safety.

```
Command → Handler → Effects → State Update
```

Kernel does not know about keyboards, mice, focus, ARIA, or any specific domain. It only knows about **Commands, Effects, Context, Scopes, Middleware, and State**.

---

## Key Features

| Feature | Description |
|---|---|
| **Command Pipeline** | Scoped dispatch with automatic bubble path resolution |
| **Effects as Data** | Handlers declare effects; the engine executes them |
| **Type-Safe Tokens** | Branded types prevent raw string errors at compile time |
| **Closure-Based Instances** | No singletons, no `globalThis` — each kernel is independent |
| **Middleware** | Before/after hooks with onion-model execution |
| **State Lens** | Scoped state isolation — handlers see only their slice |
| **Context Injection** | External data injection via declarative `group({ inject })` |
| **Time Travel** | Transaction log with state snapshots and `travelTo()` |
| **React Integration** | `useComputed()` hook via `useSyncExternalStore` |
| **HMR Safe** | Re-registration silently overwrites — no stale handlers |

---

## Architecture

Kernel sits at the bottom of a 3-layer architecture. It is the universal foundation that knows nothing about the layers above it.

```
┌──────────────────────────────────────────────┐
│  Layer 3: App                                │
│  TodoState, KanbanState, domain commands     │
│  → Domain logic. Doesn't know about OS.      │
├──────────────────────────────────────────────┤
│  Layer 2: OS                                 │
│  Focus, Zone, Navigation, ARIA, Keybindings  │
│  → System services built on top of Kernel.   │
├──────────────────────────────────────────────┤
│  Layer 1: Kernel                             │
│  dispatch, defineCommand, defineEffect       │
│  → Universal command engine.                 │
└──────────────────────────────────────────────┘
```

### Dependency Rules

| Direction | Allowed |
|---|---|
| Kernel → OS | ❌ Kernel does not know OS |
| Kernel → App | ❌ Kernel does not know Apps |
| OS → Kernel | ✅ OS uses Kernel API |
| App → Kernel | ✅ App can use `defineCommand` directly |
| App → OS | ✅ App uses OS primitives |
| OS → App | ❌ OS does not know Apps |

### Input Agnostic

Kernel does not know where commands come from. Sensors (keyboard, mouse, clipboard) belong to the OS layer. Every sensor translates its input into a Command and calls `dispatch()`.

```
KeyboardSensor → "Enter" → dispatch(ACTIVATE())
MouseSensor    → click   → dispatch(ACTIVATE())
ClipboardSensor → paste  → dispatch(PASTE())
TestBot        → direct  → dispatch(ACTIVATE())
```

---

## Source Structure

```
packages/kernel/src/
├── index.ts              Public API exports
├── createKernel.ts       Kernel factory — the entire engine (~640 lines)
└── core/
    ├── tokens.ts         Type definitions (Command, EffectToken, etc.)
    └── transaction.ts    StateDiff computation
```

---

## Design Philosophy

1. **Effects as Data** — Handlers are pure functions. They declare what should happen; the engine executes it. Inspired by [re-frame](https://day8.github.io/re-frame/).

2. **No Implicit Anything** — Every ID is a typed Token created through `define*()`. Raw strings cause compile errors. This is critical for LLM-assisted development.

3. **CommandFactory Pattern** — No dispatch overloading. `dispatch(INCREMENT())` is the single form. The factory creates the Command; dispatch receives it.

4. **Closure, Not Singleton** — Each `createKernel()` call creates an independent instance with its own state, registry, and transaction log. No `globalThis`. HMR-safe.

5. **Scope Bubbling** — Commands traverse a scope chain from specific to general (widget → app → GLOBAL), similar to DOM event bubbling. Handlers can intercept or pass through.

---

## Next Steps

| Guide | Description |
|---|---|
| [Getting Started](file:///Users/user/Desktop/interactive-os/docs/2-area/05-kernel/01-getting-started.md) | Installation and first kernel |
| [Core Concepts](file:///Users/user/Desktop/interactive-os/docs/2-area/05-kernel/02-core-concepts.md) | Commands, Effects, Context, Scope |
| [API Reference](file:///Users/user/Desktop/interactive-os/docs/2-area/05-kernel/03-api-reference.md) | Complete API documentation |
| [Dispatch Pipeline](file:///Users/user/Desktop/interactive-os/docs/2-area/05-kernel/04-dispatch-pipeline.md) | Command processing deep dive |
| [Type System](file:///Users/user/Desktop/interactive-os/docs/2-area/05-kernel/05-type-system.md) | Tokens and type safety |
| [Middleware](file:///Users/user/Desktop/interactive-os/docs/2-area/05-kernel/06-middleware.md) | Before/after hooks |
| [State Management](file:///Users/user/Desktop/interactive-os/docs/2-area/05-kernel/07-state-management.md) | State, Store, State Lens |
| [Patterns & Recipes](file:///Users/user/Desktop/interactive-os/docs/2-area/05-kernel/08-patterns.md) | Best practices |
| [Glossary](file:///Users/user/Desktop/interactive-os/docs/2-area/05-kernel/09-glossary.md) | Terminology & design decisions |
