# Architecture Debate: Focus Middleware vs. Explicit Command Handling

> [!NOTE]
> This document captures the Red Team / Blue Team debate regarding the role of Middleware in Focus Management.
> **Date**: 2026-02-02
> **Context**: The `todoPhysicsMiddleware` currently handles `focusRequest` signals from commands, resolving them into actual focus changes using strategies like Clamp/Wrap and Zone Registry lookups.

---

## 🔵 Blue Team: The "Physics Engine" Proponents
**Core Thesis**: Focus is a cross-cutting concern (Physics) that should be separated from Business Logic (Chemistry).

### Arguments
1.  **Separation of Concerns**: Commands like `NAVIGATE_DOWN` should not need to know *what* is below. They essentially apply a "force" (Move Down). The Middleware acts as the Physics Engine, interpreting that force based on the current environment (List boundaries, Zone, Folding execution).
2.  **Consistency**: By centralizing focus logic in middleware, we guarantee standard behavior (e.g., Clamping at the end of a list) across *all* interaction points. If we fix a bug in navigation calculation, it fixes it everywhere.
3.  **Headless-First**: The `focusRequest` pattern effectively decouples the State Machine from the UI. The State Machine says "I want to go down", and the Middleware resolves that against the data. This is crucial for maintaining a pure model.
4.  **Side-Effect Isolation**: Focus changes trigger scrolling, aria-updates, and other side effects. Keeping this in a dedicated layer prevents pollution of the command reducers, which should remain pure data transformations.

### Blue Layout
```typescript
// Command: Pure Intent
run: (state) => ({ ...state, ui: { focusRequest: "NAVIGATE_DOWN" } })

// Middleware: The "Physics" Resolution
if (request === "NAVIGATE_DOWN") {
   const nextId = Strategy.resolve(currentId, +1);
   FocusStore.set(nextId);
}
```

---

## 🔴 Red Team: The "Explicit Control" Proponents
**Core Thesis**: Middleware obfuscates control flow ("Magic"). Focus should be explicit and determined at the point of dispatch or execution.

### Arguments
1.  **Indirection Hell**: Debugging "Why did focus go here?" requires tracing 1) The Command, 2) The State Update, 3) The Middleware Interception, 4) The Strategy resolution. This high cognitive load leads to "Ghost Focus" bugs.
2.  **Type Safety Gaps**: `focusRequest` is often a string or a loose contract. explicit return types in commands are strictly typed.
3.  **Performance overhead**: Running a complex middleware on *every* state change (even strictly data ones) introduces unnecessary latency.
4.  **Violation of Colocation**: The logic for "Moving Item Up" implies knowing where it lands. Splitting the "Data Move" (Command) from the "Focus Follow-up" (Middleware) means we have to share state (indices) across two boundaries, leading to synchronization risks.
5.  **Re-inventing React**: React's effect model or event handlers are designed for this. Why build a custom event loop?

### Red Layout
```typescript
// Command: Explicit Control
run: (state) => {
   // Calculate Data Move
   const newOrder = swap(state.data, index, index - 1);
   
   // Calculate Focus result DIRECTLY
   const nextFocus = newOrder[index - 1];
   
   return { 
     ...state, 
     data: { ...state.data, todoOrder: newOrder },
     // Explicit instruction, or better yet, return a side-effect description
     effects: [{ type: "FOCUS", id: nextFocus }] 
   };
}
```

---

## 🏁 Synthesis & Resolution Path

### The "Gravity" Compromise (Current State)
We currently lean **Blue**. The `todoPhysicsMiddleware` acts as the gravity engine. However, we recently introduced `injectFocus` (Red tactic) to inject dependencies *before* the command runs.

### Proposed Evolution
1.  **Keep "Physics" for Navigation**: Generic up/down/left/right should remain in Middleware. It is truly "Physics" (Environmental resolution).
2.  **Use "Explicit" for Mutation**: For specific actions like "Delete" or "Move Item", the Command should likely dictate the focus result more directly, or at least provide strong hints, rather than relying on a generic blind physics engine to "figure it out".
3.  **Normalization**: Ensure `focusRequest` is typed as a Discriminated Union, not a string, to satisfy Red Team's safety concerns.

### Verdict to be decided by User
- **Option A (Blue Strong)**: Double down on Middleware. Refine `focusStrategies.ts` to be even smarter.
- **Option B (Red Strong)**: Deprecate `focusRequest`. Commands return `Effect` objects that are handled by a dumb runner, not a smart middleware.
