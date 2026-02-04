# Project Rules & Standards

## Naming Conventions

### Core Principle: File = Export
- **Match Filenames to Exports**: File names must exactly match the name of the main component, function, or interface they export.
  - **Components**: Use PascalCase (e.g., `TodoItem.tsx`, not `todo-item.tsx`).
  - **Hooks/Functions**: Use camelCase (e.g., `useCommand.ts`, not `use-command.ts`).
  - **Avoid Kebab-case**: Do not use kebab-case for filenames.

### Cohesion-Based Prefix Grouping
- **Rule**: When multiple files share a central concept for cohesion, use that concept as a **prefix** so files group alphabetically.
- **Pattern**:
  ```
  ❌ BAD (scattered)              ✅ GOOD (grouped)
  clipboardCommands.ts           commandsClipboard.ts
  cursorSlice.ts                 sliceCursor.ts
  directionHandler.ts            handlerDirection.ts
  rovingNavigation.ts            navigationRoving.ts
  ```

### Postfix Key Pool (Single Responsibility Files)
| Postfix | Usage | Example |
|---------|-------|---------|
| `Store` | Zustand store | `focusStore.ts` → `useFocusStore()` |
| `Registry` | Registry class | `CommandRegistry.ts` → `CommandRegistry` |
| `Context` | React Context | `JurisdictionContext.tsx` |
| `Resolver` | Resolver function | `behaviorResolver.ts` → `resolveBehavior()` |
| `Pipeline` | Pipeline logic | `focusPipeline.ts` → `runFocusPipeline()` |
| `Presets` | Preset definitions | `behaviorPresets.ts` → `FOCUS_PRESETS` |

### Prefix Key Pool
| Prefix | Usage | Example |
|--------|-------|---------|
| `use` | React Hook | `useCommandCenter.ts` → `useCommandCenter()` |
| `create` | Factory function | `createCommandFactory.ts` → `createCommandFactory()` |
| `commands*` | Command definitions group | `commandsNavigation.ts`, `commandsClipboard.ts` |
| `handler*` | Handler group | `handlerDirection.ts`, `handlerEdge.ts` |
| `slice*` | State slice group | `sliceCursor.ts`, `sliceZone.ts` |
| `navigation*` | Navigation logic group | `navigationRoving.ts`, `navigationSpatial.ts` |

### No Abbreviations
- **Avoid abbreviations**. Use full, descriptive names.
- **Exceptions**: Widely accepted domain standards:
  - `ctx` (Context), `cmd` (Command), `id` (Identifier), `ref` (Reference), `props` (Properties), `e` (Event)

## Directory Structure

### FSD Segment Strategy
- **Feature-Sliced Design (FSD)** segments within each feature:

| Segment | Role | Naming Pattern |
|---------|------|----------------|
| `model/` | State management (Store, Slice) | `*Store.ts`, `slice*.ts`, `*Registry.ts` |
| `lib/` | Pure functions, utilities | `*Handler.ts`, `*Resolver.ts`, `*Pipeline.ts` |
| `ui/` | React components | `*Context.tsx`, `*.tsx` |

### No Barrel Files (`index.ts`)
- **STRICTLY PROHIBITED**: Do not use `index.ts` to re-export modules.
- **Reason**: AI and developers confuse similarly-named modules. Direct path imports are mandatory.
- **Preferred**: `import { useFocusStore } from "@os/features/focus/model/focusStore"`
- **Avoid**: `import { useFocusStore } from "@os/features/focus"`

### Entity Files (`entities/`)
- **1 File = 1 Interface** rule for domain entities.
- **File name = Interface name** exactly.
- **Example**:
  ```
  entities/
  ├── ZoneMetadata.ts      # interface ZoneMetadata
  ├── NavContext.ts        # interface NavContext
  ├── CommandDefinition.ts # interface CommandDefinition
  └── Direction.ts         # type Direction
  ```


## Code Style & Formatting
- **Formatter**: Use `biome` for formatting and linting.
- **Indentation**: 2 spaces (Enforced by `biome.json`).
- **Imports**: Organized automatically by Biome.

## Architectural Principles
- **Strict Type Safety**: NO `any` allowed. Use Strict Union Patterns for all registries and state.
- **Logic-First Architecture**: Logic must be purely separated from UI. Use the Pure Command Pattern.
- **Zero-Latency Design**: All interactions must default to Optimistic Updates.
- **OS-First Engineering**: When implementing a requirement, do not simply "make it work" in the component. Design it as an OS-level primitive (e.g., Focus Strategy, Command Middleware) to ensure system-wide consistency and reusability.

## Detailed Design Principles

### 1. Code Minimalism (Less is More)
- **Liability of Code**: Every line of code is a liability. If it doesn't serve a feature, delete it.
- **No Speculative Code**: Do not write code for "future use" (YAGNI).
- **Boilerplate-Zero**: Favor factory functions (`createCommandFactory`) over manual repetition.
- **No Ad-Hoc Logic**: Never hardcode feature-specific logic (e.g., `if (id === 'DRAFT')`) inside generic primitives. Use configuration or strict data-driven patterns.

### 2. Single Responsibility (SRP)
- **Atomic File Integrity**: One file per logical unit (Component, Hook, or Utility).
- **Limit Complexity**: If a file exceeds 200 lines, it is a candidate for splitting.
- **Colocation**: Tests and styles must live next to their implementation.

### 3. Layered Architecture (Framework Standard)
**Strict Unidirectional Flow**: `UI -> Action -> State -> UI`
- **L1 Core (`src/lib`)**: Pure TypeScript logic. No UI dependencies.
- **L2 State (`src/stores`)**: Global state management and side-effects.
- **L3 View (`src/components`)**: Dumb components. Data in, Events out.
- **L4 App (`src/pages`)**: Composition and Routing.
> **Constraint**: Lower layers (L1) MUST NOT import from Higher layers (L3/L4).

### 4. Modern FE Standards (Verified)
- **Headless-First**: Design the logic/state machine *before* thinking about pixels.
- **Immutable State**: Usage of `immer` is mandatory for complex state updates.
- **Composition > Inheritance**: Use Hooks and Component Composition.
- **Strict Inference**: Do not strictly type variable declarations if TS can infer them correctly (keeps code minimal).

## Agent & Automation Rules

### Workflow & Config Path Priority
- **Resolution Strategy**: When searching for slash command workflows (`/inbox`, `/fix`, etc.) or project configuration, the Agent MUST **always** look in the **Current Workspace Root** first (e.g., `./.agent/...`).
- **Fallback Policy**: The User Home Directory (`~/.agent/...`) should only be checked if the file is confirmed missing from the workspace root.
- **Safety**: Do not assume global paths exist. Always `list_dir` on the project root first to discover local capabilities.

### Uncertainty Principle
- **Ask Before Implementing**: If you are unsure about a requirement or implementation detail, DO NOT implement it. Ask the user for clarification first.

---

## Decoupling & Pipeline Patterns

### 1. No God Functions
- **Anti-Pattern**: A single function that knows about and calls multiple independent subsystems sequentially.
- **Bad Example**:
  ```typescript
  function executeNavigation(ctx) {
      prepareStickyAnchor(...);   // restore axis
      findNextTarget(...);         // direction axis
      shouldTrapAtEdge(...);       // edge axis
      resolveEntry(...);           // entry axis
  }
  ```
- **Solution**: Use **Pipeline Pattern** - each handler only knows about itself and receives/returns a shared context.
- **Good Example**:
  ```typescript
  const pipeline = [restoreAxis, directionAxis, edgeAxis, entryAxis];
  const executeNavigation = (ctx) => runPipeline(pipeline, ctx);
  ```

### 2. File Split ≠ Decoupling
- **Warning**: Splitting code into separate files does NOT automatically reduce coupling.
- **True Decoupling Requires**:
  1. Each module has a **single responsibility**
  2. Modules communicate through **shared interfaces**, not direct function calls
  3. Adding/removing a module should NOT require modifying the orchestrator

### 3. Unified Context Over Multiple Interfaces
- **Anti-Pattern**: Creating separate interface types for each subsystem (`RestoreContext`, `EntryContext`, `TabContext`, etc.)
- **Problem**: Interface proliferation increases cognitive load and creates coupling
- **Solution**: Use a **single unified context type** that flows through the pipeline
- **Good Example**:
  ```typescript
  interface NavContext {
      direction: Direction;
      focusPath: string[];
      targetId?: string;
      shouldTrap?: boolean;
      // ... all handlers can read/write
  }
  ```

### 4. Handler Signature Consistency
- **Rule**: All handlers in a pipeline MUST share the same signature.
- **Pattern**: `type AxisHandler = (ctx: NavContext) => NavContext | null;`
- **Benefits**:
  - Handlers are interchangeable
  - Order can be rearranged declaratively
  - Easy to add/remove handlers without code changes

