# @kernel

> A universal command processing engine for building interactive applications.

**Status**: `@frozen 2026-02-11`

## Overview

Kernel is a framework-agnostic command processing engine that provides the foundation for building interactive applications. It processes commands through a scoped pipeline, manages application state, and executes side effects — all with full type safety.

```
Command → Handler → Effects → State Update
```

## Key Features

- **Command Pipeline** — Scoped dispatch with automatic bubble path resolution
- **Effects as Data** — Handlers declare effects; the engine executes them
- **Type-Safe Tokens** — Branded types prevent raw string errors at compile time
- **Closure-Based Instances** — No singletons, no `globalThis`
- **Middleware** — Before/after hooks with onion-model execution
- **State Lens** — Scoped state isolation
- **Time Travel** — Transaction log with state snapshots
- **React Integration** — `useComputed()` hook via `useSyncExternalStore`

## Quick Start

```typescript
import { createKernel } from "@kernel";

const kernel = createKernel<{ count: number }>({ count: 0 });

const INCREMENT = kernel.defineCommand(
  "INCREMENT",
  (ctx) => () => ({
    state: { ...ctx.state, count: ctx.state.count + 1 },
  }),
);

kernel.dispatch(INCREMENT());
console.log(kernel.getState()); // { count: 1 }
```

## Documentation

📖 **[Full Documentation →](../../docs/official/kernel/00-overview.md)**

| Guide | Description |
|---|---|
| [Overview](../../docs/official/kernel/00-overview.md) | Architecture and design philosophy |
| [Getting Started](../../docs/official/kernel/01-getting-started.md) | First kernel in under a minute |
| [Core Concepts](../../docs/official/kernel/02-core-concepts.md) | Commands, Effects, Context, Scope |
| [API Reference](../../docs/official/kernel/03-api-reference.md) | Complete API documentation |
| [Type System](../../docs/official/kernel/05-type-system.md) | Branded tokens and compile-time safety |
| [Patterns](../../docs/official/kernel/08-patterns.md) | Best practices |

## Source

```
packages/kernel/src/
├── index.ts              Public API exports
├── createKernel.ts       Kernel factory (~640 lines)
└── core/
    ├── tokens.ts         Type definitions
    └── transaction.ts    StateDiff computation
```

## License

Part of the Interactive OS project.
