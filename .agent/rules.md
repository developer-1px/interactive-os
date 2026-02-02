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

