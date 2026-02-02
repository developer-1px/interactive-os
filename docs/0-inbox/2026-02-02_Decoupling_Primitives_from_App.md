# Architecture Audit: Decoupling Zone/Item from App Logic

> [!IMPORTANT]
> **Verdict**: The user is correct. `Zone` and `Item` currently rely on `useCommandEngine()` which returns a `ctx` and `dispatch` that are implicitly tied to the TodoApp's specific engine.

## The Problem
1.  **Implicit Dependency**: `Zone.tsx` calls `useCommandEngine()`. This hook throws an error if `CommandContext` or `globalEngineHelper` isn't set.
2.  **App-Specific Logic in Primitive**:
    -   `evalContext(match.when, runtimeCtx)` -> Depends on the app's specific `ctx` shape.
    -   `dispatch({...})` -> Assumes a Redux-like dispatch exists.
3.  **Leaky Abstraction**: If we want to reuse `Zone` in a different app (e.g., "Settings App" or "Launcher"), we currently have to replicate the exact `TodoEngine` structure.

## The proposed "OS Kit" (Refactoring Plan)

We should split the "App" from the "OS".

### 1. `MainLayout` (The OS Layer)
The OS should provide the `FocusStore` and a generic `InputBus`.

### 2. `Zone` (The Primitive)
Should be **purely visual and topological**.
-   **Removes**: `useCommandEngine()`, `evalContext()`.
-   **Adds**: `onNavigate?: (dir) => void`, `bindingContext?: Record<string, any>`.

### 3. The "Smart Zone" Pattern (Composition)
Instead of `Zone` containing the Keybinding Logic, we lift that up to a `InputController` or keep it in the Engine, and `Zone` just reports "I am active".

**OR (Better for DX)**:
We keep `Zone` powerful, but inject the *Logic Strategy* via a standard Interface, not a concrete hook.

## Immediate Action: `Zone` Decoupling

We will refactor `Zone` to **not** import `useCommandEngine` directly. Instead, it should use a standard `OSContext` that provides:
1.  `activeZoneId` (from Zustand)
2.  `dispatch(action)` (Generic)

### Proposed Interface Change

```tsx
// Current (Coupled)
import { useCommandEngine } from '../CommandContext';

// New (Decoupled)
import { useInteractionSystem } from '../../os/InteractionSystem'; 
// ^ This generic system provides the dispatch bridge, 
// ensuring Zone doesn't know about "TodoContext".
```

## Recommendation
1.  Create `src/os/InteractionSystem.tsx` (Generic Context).
2.  Move `useCommandEngine` logic *into* the App layer, and have the App *provide* the `InteractionSystem` to the OS primitives.
3.  `Zone` consumes `InteractionSystem`, making it app-agnostic.
