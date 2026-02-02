# Architecture Review: TodoEngine Coupling

**Date:** 2026-02-02
**Status:** Review
**Source:** User Request (`/inbox @[src/lib/todoEngine.tsx]`)

## Problem Statement
The file `src/lib/todoEngine.tsx` currently acts as a "God Object" for the application instance. It indiscriminately mixes:
1.  **OS-Layer Concerns:** Focus Registry registration, Context bridging, generic Undo/Redo physics.
2.  **App-Layer Concerns:** `INITIAL_STATE`, `loadState`/`saveState`, specific Navigation Logic (`PREV`/`NEXT` implementation), `TodoContext` mapping.

This makes the "Engine" (OS) non-reusable and the "App" (Todo) hard to test in isolation.

## Analysis of `todoEngine.tsx`

| Segment | Responsibility | Layer | Issue |
| :--- | :--- | :--- | :--- |
| `ENGINE_REGISTRY` | Registers specific Keymaps/Commands | App | Hardware/OS should be initialized separately from App definitions. |
| `focusRegistry.register(...)` | Defines how to find IDs (strategies) | Bridge | Strategies are defined inline, coupled to `AppState` shape. Should be injected modules. |
| `loadState`/`saveState` | Persistence | App | Business logic inside the engine file. |
| `useTodoStore` | State Container | App | Contains a massive `onStateChange` middleware that implements specific navigation physics (`PREV`, `NEXT`). |
| `state.ui.focusRequest` | Signaling | Bridge | The "Protocol" `focusRequest` is handled by ad-hoc procedural logic inside the store updates. |

## Proposed Refactoring Strategy

### 1. Extract Persistence
Move state loading/saving to a unified data layer.
- `src/lib/todo/persistence.ts`

### 2. Extract Focus Strategies
Move `listStrategy`, `boardStrategy`, `sidebarStrategy` to a dedicated strategy module.
- `src/lib/todo/focusStrategies.ts`

### 3. Extract Navigation Physics
The complex `onStateChange` logic that calculates `targetId` based on `PREV`/`NEXT` is effectively the "Physics Engine" for this specific app.
- `src/lib/todo/navigationPhysics.ts`
- Should export a function `resolveFocusRequest(state, request) -> targetId`

### 4. Thin Down `todoEngine.tsx`
The file should ideally only be the **Integration Point**:
```tsx
// Theoretical thinner implementation
export function useTodoEngine() {
  // 1. Hook up Store
  const store = useTodoStore(); 
  
  // 2. Hook up OS
  useFocusBridge(store, todoFocusStrategies);
  
  // 3. Hook up Context
  useContextBridge(store, mapStateToContext);
  
  return store;
}
```

## Next Steps
- [ ] Move persistence logic to `src/lib/logic/persistence.ts`
- [ ] Refactor `onStateChange` into a testable pure function `processFocusRequest(state)`.
- [ ] Define `FocusStrategy` interface clearly in OS primitives.
