# Project Rules & Standards

## Naming Conventions
- **Match Filenames to Exports**: File names must exactly match the name of the main component, function, or interface they export.
  - **Components**: Use PascalCase (e.g., `TodoItem.tsx`, not `todo-item.tsx`).
  - **Hooks/Functions**: Use camelCase (e.g., `useCommand.ts`, not `use-command.ts`).
  - **Avoid Kebab-case**: Do not use kebab-case for filenames unless the file exports strictly just constants or configuration that doesn't map to a single symbol (and even then, prefer camelCase if possible).
- **No Abbreviations**: Avoid using abbreviations. Use full, descriptive names.
  - **Example**: Use `category` instead of `cat`.
  - **General Rule**: Do not shorten words; write them out fully to maximize clarity.
  - **Exceptions**: Widely accepted domain standards are permitted:
    - `ctx` (Context)
    - `cmd` (Command)
    - `id` (Identifier)
    - `ref` (Reference)
    - `props` (Properties)
    - `e` (Event)

## Directory Structure
- **No Barrel Files (`index.ts`/`index.tsx`)**: Avoid using `index.tsx` or `index.ts` files to re-export modules.
  - **Preferred**: `components/TodoItem/TodoItem.tsx`
  - **Avoid**: `components/TodoItem/index.tsx`
- **Exception**: Barrel files are permitted ONLY for large, encapsulated modules where the API is strictly internal/private and a single entry point is necessary for encapsulation.

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

