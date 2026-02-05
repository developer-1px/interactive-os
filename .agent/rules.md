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
| `slice*` | State slice group | `cursor.ts`, `items.ts` |
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
  ├── GroupMetadata.ts     # interface GroupMetadata
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

---

## AI-Native Architecture (AI 친화적 설계)

### 핵심 철학
> **"AI가 실수해도 구조가 잡아주고, 깨져도 빠르게 복구할 수 있는 시스템"**

AI 에이전트가 코드를 생성/수정할 때 **완벽한 원샷을 기대하지 않는다**. 대신 다음 4가지 속성으로 복원력을 확보한다:

| 속성 | 의미 |
|------|------|
| **관찰 가능성** (Observability) | 모든 파이프라인 단계가 명시적 → 로그/트레이싱 용이 |
| **검증 가능성** (Verifiability) | 각 단계가 순수 함수 → 입출력만 테스트하면 됨 |
| **재현 가능성** (Reproducibility) | 불변 상태 + 액션 로그 → 정확히 같은 상태 재현 |
| **복구 가능성** (Recoverability) | 스냅샷 기반 → 언제든 이전 상태로 롤백 |

### 1. 요구사항의 불변 (Invariant Requirements)
- **Requirements are Invariants**: "Enter 키 → 저장", "ArrowDown → 다음 아이템"과 같은 요구사항은 변하지 않는다.
- **Pre-register Commands**: 커맨드를 미리 등록해두면 AI가 "어떤 동작들이 가능한지" 명확히 파악한다.
- **Schema Stability**: 데이터 스키마는 왠만해서는 불변에 가깝다. zod/TypeScript로 미리 정의한다.

### 2. 선언적 정의 (Declarative Definitions)
- **Keymap = 선언**: 키 → 커맨드 매핑을 선언적으로 정의한다.
- **Registry = 목록**: 모든 Command, Schema, Rule을 한 곳에 등록한다.
- **부수효과 분리**: 코어 로직에서 Side Effect를 완전히 격리한다.

### 3. Pure Functions Only
- **AI generates pure functions**: AI가 작성하는 코드는 `(state, action) => state` 형태의 순수 함수여야 한다.
- **타입 = 제약**: 타입이 맞으면 OK. 타입이 곧 규칙이다.
- **No implicit state**: 전역 상태나 암묵적 의존성 금지.

### 4. 코드 = 테스트 (Self-Verifying Code)
- **타입이 곧 명세**: `Make Illegal States Unrepresentable` 원칙을 따른다.
- **스키마가 곧 검증기**: zod 스키마로 런타임 검증을 코드에 내장한다.
- **불변식(Invariant) 내장**: Reducer에서 상태 불변식을 직접 체크한다.

```typescript
// 예시: 코드 자체가 테스트
function reducer(state: State, action: Action): State {
  const next = actualLogic(state, action);
  
  // 불변식 체크 (코드 = 테스트)
  invariant(next.focusedId === null || state.items.some(i => i.id === next.focusedId),
    "Focused item must exist in items");
  
  return next;
}
```

### 5. AI 작업 분리 원칙
- **AI는 React + TypeScript를 가장 잘 한다**: 그 강점을 활용한다.
- **순수 함수만 작성하게 하라**: Side Effect, 외부 의존성은 구조가 처리한다.
- **구조가 검증한다**: AI가 틀려도 타입/스키마/불변식이 잡아준다.

