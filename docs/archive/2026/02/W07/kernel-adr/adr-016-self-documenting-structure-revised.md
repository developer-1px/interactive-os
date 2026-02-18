# [kernel] Usage-Aligned File Structure (Revised)

## Principle

> **Filenames = Group Methods = API Usage**
> `kernel.defineCommand(...)` → `defineCommand.ts`
> `kernel.dispatch(...)` → `dispatch.ts`

---

## Revised Structure

```
packages/kernel/src/
│
│  ── Methods (Top-Level API) ──
│
├── createKernel.ts     // Entry point
├── defineCommand.ts    // defineCommand type/factory logic? (Actually factory is inside createKernel closure)
├── defineEffect.ts     // defineEffect type/token logic
├── defineContext.ts    // defineContext implementation
├── group.ts            // Group interface definition (or createGroup factory?)
├── dispatch.ts         // global dispatch (and internal dispatch logic?)
├── use.ts              // global use() (middleware registration)
├── reset.ts            // global reset() (resetKernel?)
│
│  ── Core Implementation (Hidden) ──
│
├── core/
│   ├── processCommand.ts
│   ├── executeEffects.ts
│   ├── registry.ts      // Maps
│   ├── store.ts         // bindStore, createStore shim
│   └── ...
```

Wait, `defineCommand` is a method of `Group` instance, not a top-level export (except types).
However, `defineContext` IS a top-level export.
`state` IS a top-level export.

Usage:
```typescript
import { createKernel, defineContext } from "@kernel";

const kernel = createKernel({...});
kernel.defineCommand(...);
```

So `createKernel.ts` is the main entry.

But the user wants:
> "interface definition (Group methods) matches filenames"

If `kernel.defineCommand` is a method, we can't export `defineCommand` as top-level function unless we change the API (we just unified it to Group API, so we won't go back).

BUT, we can organize the **Source Code** so that `defineCommand` implementation lives in `core/defineCommand.ts`?
Or expose types via `defineCommand.ts`?

The user's request:
> "interface definition (Group methods) ... filenames should match usage"

Example:
`defineCommand(type, handler)` -> `defineCommand.ts` (Type/Factory definition?)
`defineEffect(...)` -> `defineEffect.ts`
`group(...)` -> `group.ts`
`dispatch(...)` -> `dispatch.ts`

If I create `defineCommand.ts`, what does it export?
It could export the `CommandFactory` types and maybe the `InternalCommandHandler` types.

Let's refine the public surface (top-level files):

```typescript
// packages/kernel/src/

// 1. The Main Entry
createKernel.ts       // exports createKernel, state, defineScope

// 2. The Context Definition (Top-level)
defineContext.ts      // exports defineContext

// 3. The Global Dispatch (Top-level wrapper)
dispatch.ts           // exports dispatch (global instance accessor?)

// 4. The Global Middleware (Top-level wrapper)
use.ts                // exports use? (No, `use` is method of group/kernel)

// 5. Inspection
inspect.ts            // getTransactions...
```

The user's list:
`defineCommand`, `defineEffect`, `defineContext`, `group`, `dispatch`, `use`, `reset`.

Implementation Plan:
Move the logic for creating these *functions* (the closures returned by `createGroup`) into separate files in `core/` or even top-level if they are pure?
They depend on the `scope` and `registries`.

If I split `createGroup` into helper functions:

```typescript
// core/groups/defineCommand.ts
export function makeDefineCommand(scope: string, inject: Tokens) { ... }
```

Then `createKernel.ts` imports them.

But the user asked for:
> "interface definition (files) ... representative of usage"

So:

```
src/
  defineCommand.ts    // exports Types? Or logic?
  defineEffect.ts
  defineContext.ts
  group.ts
  dispatch.ts
  use.ts
  reset.ts
```

If these files exist, they document the API.
Even if `defineCommand` is not a top-level function (it's a method), having `defineCommand.ts` containing the *types* and *documentation* for it is valuable.

Revised Proposal:

Top-level files:
- `createKernel.ts`: The factory.
- `defineCommand.ts`: Re-exports Command types, maybe `CommandFactory`.
- `defineEffect.ts`: Re-exports EffectToken types.
- `defineContext.ts`: The actual function.
- `group.ts`: Re-exports Group interface?
- `dispatch.ts`: The actual global dispatch function.
- `use.ts`: Shim for global `use`? Or documentation? (Middleware types)
- `reset.ts`: Shim for `resetKernel` / `resetState`.

And `core/` for heavy lifting.

Let's ask/confirm or just execute this interpretation?
User said "good! go".
So I should interpret "filenames = interface usage".

I will create these files.

**File Mapping:**

1.  `defineCommand.ts`
    - Content: `Command`, `CommandFactory`, `InternalCommandHandler` types.
    - (Extracted from registry.ts/tokens.ts)

2.  `defineEffect.ts`
    - Content: `EffectToken`, `InternalEffectHandler` types.

3.  `defineContext.ts`
    - Content: `defineContext` function + `ContextToken` type.

4.  `group.ts`
    - Content: `createGroup` implementation (factory) + `Group` interface.

5.  `dispatch.ts`
    - Content: `dispatch` function + `processCommand` logic (or import from core).

6.  `use.ts`
    - Content: `Middleware`, `MiddlewareContext` types. `registerMiddleware` function.

7.  `reset.ts`
    - Content: `resetKernel`, `resetState`.

8.  `createKernel.ts`
    - Content: `createKernel`, `state`, `defineScope`.

9.  `index.ts`
    - Re-exports all above.

And `core/` for pure internal logic (`processCommand`, `executeEffects`, `transaction`, `registries`, `store`).

Wait, `dispatch.ts` needs `processCommand`. `processCommand` needs `registries`.
So `dispatch.ts` will call `core/process.ts`.

This looks structure-aligned with usage.

Let's execute this.

**Step-by-step Execution Check for "God Module" split:**
1.  **Extract Types** (`tokens.ts` -> split into `defineCommand.ts`, `defineEffect.ts` etc.?)
    - `tokens.ts` is currently a clean "Type Definition" file. Splitting it might be messy if circular deps exist.
    - But user wants "File = Usage".
    - `defineCommand` needs `Command` type.
    - `defineEffect` needs `EffectToken` type.
    - `group` needs `ScopeToken`.
    - It is better to keep `tokens.ts` as `types.ts` (common types) to avoid circularity, and have `defineCommand.ts` re-export/augment.
    - OR, just keep `tokens.ts` as the base, and `defineCommand.ts` is the *logic* (factory creator) + types re-export.

Let's try to make `defineCommand.ts` contain the *implementation logic* for `defineCommand`.
Currently `defineCommand` is a closure inside `createGroup`.
I can extract it to a factory function:
`const defineCommand = createDefineCommand(scope, registries);`

This is strict "Separation of Concerns".

**Plan:**

1.  Create `core/registries.ts` (The State/Maps).
2.  Create `core/process.ts` (`dispatch` implementation details).
3.  Create `core/effects.ts` (`executeEffects`).
4.  Create `core/middleware.ts` (middleware logic).

Then top-level files:
1.  `dispatch.ts` -> imports `core/process`.
2.  `use.ts` -> imports `core/middleware`.
3.  `defineContext.ts` -> (existing `context.ts` moved/renamed).
4.  `group.ts` -> contains `createGroup` logic, which creates the object `{ defineCommand, defineEffect ... }`.
    - It can import helpers if we extract them.
5.  `createKernel.ts` -> calls `createGroup(GLOBAL)`.

This looks viable.

Let's start by creating `core/` and moving `registries`.

(I will delete `registry.ts` at the end).

Start.
