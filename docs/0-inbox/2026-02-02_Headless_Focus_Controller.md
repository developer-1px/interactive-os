# Architecture Design: Headless Focus Controller (Zero-Logic UI)

> [!IMPORTANT]
> **Goal**: Ensure React UI components (`TodoPanel`, `Sidebar`) contain **Zero Logic**. AI should be able to generate UI structure without knowing about focus strategies.

## The Problem with Inline Handlers
```tsx
// ❌ Rejected Pattern: Inline Logic
<Zone 
  id="todoList"
  onEnter={() => pickFirstTodo()} // Logic inside UI
/>
```
If an AI generates a new page, it might forget `onEnter` or write wrong logic. Logic is scattered across VDOM.

## The Solution: Centralized Behavior Registry

We separate the **"Physical Map"** (React UI) from the **"Behavioral Rules"** (Engine/Store).

### 1. The UI (Pure & Dumb)
The UI only declares the **Identity** and **Structure**.
```tsx
// ✅ Zone only knows "Who am I?" and "Who is next to me?" (Topology)
<Zone id="todoList" neighbors={{ left: 'sidebar' }} />
```

### 2. The Logic (Centralized & Pure)
Behavior is defined in the **Engine** or **Domain Layer**, tied to the ID.
```typescript
// src/logic/focusStrategies.ts
export const focusStrategies = {
  'todoList': {
    // Pure function: (State) -> TargetID
    resolveEntry: (state: TodoState) => {
      return state.data.todoOrder[0] || 'DRAFT';
    }
  },
  'sidebar': {
    resolveEntry: (state: TodoState) => {
      return state.ui.selectedCategoryId;
    }
  }
};
```

### 3. The Wiring (OS/Engine Bridge)
The `TodoEngine` registers these strategies into the OS `FocusStore` at boot time.

```typescript
// src/lib/todoEngine.tsx
// On boot:
focusStore.registerStrategies(focusStrategies);
```

### 4. The OS Mechanics
When `Zone('todoList')` is activated via `ArrowRight`:
1.  **OS** (`Zone` primitive) looks up `FocusStore.getStrategy('todoList')`.
2.  **OS** executes `strategy.resolveEntry(currentState)`.
3.  **OS** dispatches `SET_FOCUS(result)`.

## Benefits
1.  **AI-Proof UI**: AI can generate `<Zone id="foo" />` and it "just works" if the ID matches a known pattern or default.
2.  **Testable Logic**: `focusStrategies` are pure functions. Easy to unit test without rendering React.
3.  **Separation of Concerns**: 
    -   **Designer**: Touches `TodoPanel.tsx` (Layout/Colors).
    -   **Engineer**: Touches `focusStrategies.ts` (Behavior).

## Implementation Plan
1.  Define `FocusStrategy` interface in OS.
2.  Add `strategies` registry to `FocusStore`.
3.  Update `Zone` to consult `FocusStore` on activation.
4.  Move current "logic" from `BoardView`/`TodoPanel` into `src/lib/strategies.ts`.
