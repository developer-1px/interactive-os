# Architecture Strategy: Decoupling Focus from Data

> [!NOTE]
> **User Question**: "Focus cannot be completely unrelated to data. How can we decouple them?"

## The Core Concept: "Topology vs. Content"

We must distinguish between **Where the focus interacts** (Topology/OS) and **What the focus targets** (Content/App).

### 1. The OS Responsibility: Topology (The "Container")
The OS (`Zone`) controls the *spatial map* and the *entry gates*.
-   "I am the Sidebar Zone."
-   "My neighbor to the right is the TodoList Zone."
-   "User pressed `ArrowRight`. I am deactivated. Activating neighbor..."

### 2. The App Responsibility: Content (The "Tenant")
The App controls the *population* and *selection logic* within the Zone.
-   "When TodoList Zone activates, the actual item to select is `todos[0]`."
-   "If `todos` is empty, select `DRAFT` input."

## The Mechanism: "The Focus Delegate Pattern"

Instead of `Zone` internally importing `TodoContext` to find the ID, it should expose **Lifecycle Hooks**.

### Current (Coupled)
```tsx
// ❌ Zone knows too much
function Zone({ id }) {
  const { state } = useTodoEngine(); // DIRECT DEPENDENCY
  const defaultId = state.todos[0]?.id; // DATA LOGIC 
  
  // Implementation...
}
```

### Proposed (Decoupled)
```tsx
// ✅ Zone is generic
function Zone({ id, onEnter }) {
  // OS logic calls onEnter when focus lands here
}

// ✅ App binds Logic
<Zone 
  id="todoList" 
  onEnter={(direction) => {
    // App Logic lives here!
    const targetId = todos.length > 0 ? todos[0].id : 'DRAFT';
    dispatch({ type: 'SET_FOCUS', payload: { id: targetId } });
  }}
/>
```

## Summary of Changes

1.  **Remove `defaultFocusId` logic from `Zone` internals**.
2.  **Add `onZoneActivate` / `onZoneEnter` props**.
3.  **The App (TodoPanel)** acts as the **Controller**, verifying data state and telling the OS which specific Item ID to highlight.

This ensures:
-   **OS** handles keyboard routing ("User went Right").
-   **App** handles data resolution ("Focus Task #1").
-   **Zero Coupling**: `Zone` works for Settings, Launcher, or Games without knowing what a "Todo" is.
