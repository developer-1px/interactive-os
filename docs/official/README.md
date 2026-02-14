# Interactive OS — Official Documentation

> Technical documentation for the Interactive OS project.

---

## Kernel

A universal command processing engine for building interactive applications.

| Guide | Description |
|---|---|
| [Overview](./kernel/00-overview.md) | What is Kernel? Architecture and design philosophy |
| [Getting Started](./kernel/01-getting-started.md) | Installation and first kernel in under a minute |
| [Core Concepts](./kernel/02-core-concepts.md) | Commands, Effects, Context, Scope, Middleware, State |
| [API Reference](./kernel/03-api-reference.md) | Complete API surface with signatures and types |
| [Dispatch Pipeline](./kernel/04-dispatch-pipeline.md) | How commands flow from dispatch to state update |
| [Type System](./kernel/05-type-system.md) | Branded tokens and compile-time safety |
| [Middleware](./kernel/06-middleware.md) | Before/after hooks with onion-model execution |
| [State Management](./kernel/07-state-management.md) | Single state tree, Store, and State Lens |
| [Patterns & Recipes](./kernel/08-patterns.md) | Best practices and common patterns |
| [Glossary](./kernel/09-glossary.md) | Canonical terminology and frozen design decisions |

## OS Layer

*Coming soon.*

## Architecture

```
┌──────────────────────────────────────────────┐
│  Layer 3: App                                │
│  Domain logic (Todo, Kanban, Mail, etc.)     │
├──────────────────────────────────────────────┤
│  Layer 2: OS                                 │
│  Focus, Zone, Navigation, ARIA, Keybindings  │
├──────────────────────────────────────────────┤
│  Layer 1: Kernel                             │
│  dispatch, defineCommand, defineEffect       │
└──────────────────────────────────────────────┘
```

---

## Status

| Package | Status | Documentation |
|---------|--------|---------------|
| **Kernel** | `@frozen 2026-02-11` | ✅ Complete |
| **OS** | In development | 🚧 Planned |
