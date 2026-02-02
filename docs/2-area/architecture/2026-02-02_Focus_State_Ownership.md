# Architectural Decision: Ownership of Focus State in Headless Systems

> [!IMPORTANT]
> **Core Principle**: "Physics belongs to the Engine; Intent belongs to the Command."

## 1. Who owns `currentFocusItem` and `currentFocusZone`?

**Answer: The OS (Focus Store)**.

Currently effectively:
- `useFocusStore` (Zustand) is the **Single Source of Truth** for "What is effectively focused right now?"
- `AppState` (Domain Store) is the **Single Source of Truth** for "Data and Business Logic".

### Why separation?
If we store `focusId` in `AppState`, every focus change (cursor movement) triggers a full re-render of the domain logic and creates a history entry (Undo/Redo). Moving your cursor is **not** a state mutation you want to Undo. Therefore, Focus is "Ephemeral Interface State" (OS level), while Data is "Durable Domain State".

## 2. How should Commands access it while remaining Pure?

To keep `run: (state, payload) => newState` pure and headless, a Command **must never** import `useFocusStore` directly.

### Approach A: Dependency Injection (The "Payload" Pattern)
The Dispatcher (Engine) is the "dirty" bridge. It reads the separate FocusStore and injects the ID into the command's payload.

**Command Definition (Pure):**
```typescript
// Strict Contract: "I need an ID to toggle"
const ToggleTodo = defineCommand({
  id: "TOGGLE",
  run: (state, payload: { id: number }) => {
    // Pure logic: I toggle the ID given to me. 
    // I don't care if it came from focus, a mouse click, or a cron job.
    return produce(state, draft => { ... })
  }
});
```

**Dispatcher (Dirty Bridge in `todoEngine.tsx`):**
```typescript
const dispatch = (action) => {
   if (action.type === "TOGGLE" && !action.payload.id) {
       // "Smart" Injection from Environment
       const focusId = useFocusStore.getState().focusedItemId;
       action.payload.id = focusId; 
   }
   store.dispatch(action);
}
```
*Current Status*: We just implemented `injectFocus: true` to standardize this!

### Approach B: "Signal" Return (The "Request" Pattern)
When a command wants to *change* focus (e.g., "Move Down"), it shouldn't calculate the result itself (which requires knowing the DOM/List state). It should return a **Signal**.

**Command:**
```typescript
run: (state) => ({
  ...state,
  ui: { focusRequest: "NAVIGATE_DOWN" } // "I want to go down"
})
```

**Middleware (The Physics Engine):**
The Middleware sees the signal, looks at the FocusStore + State, calculates where "Down" is, and updates the FocusStore.

## Summary for Implementation

| Concept | Owner | Access Pattern |
| :--- | :--- | :--- |
| **Source of Truth** | `useFocusStore` | `getState()` (Middleware only) |
| **Read Access (Views)** | `useContextService` | `mapStateToContext` (Derived) |
| **Write Access (Logic)** | `Middleware` | `focusRequest` signal |
| **Cmd Execution** | `Dispatcher` | Payload Injection (`injectFocus`) |

## Verification Checklist
1. [ ] Commands must NOT import `useFocusStore`.
2. [ ] `todoEngine.tsx` is the only place allowed to glue `FocusStore` to `CommandStore`.
3. [ ] `todoPhysicsMiddleware` is the only place allowed to resolve `focusRequest`.
