# Architecture Update: Effect Queue & Middleware Pipeline

> [!NOTE]
> **Summary**: We have replaced the "Transient Field" (`ui.focusRequest`) with a formal **"Effect Queue"** (`state.effects`) processed by a dedicated **Middleware Pipeline** (`navigationMiddleware`).

## 1. The Core Problem
Previously, we used a "Mailbox Pattern" (`ui.focusRequest`) where commands set a value that the middleware immediately cleared. This felt "strange" because it mixed state with events.

## 2. The Solution: Effect Queue
We now treat side effects (Focus, Navigation, Scrolling) as **Events** stored in a queue.

### New State Structure
```typescript
interface AppState {
  // ...
  effects: AppEffect[]; // FIFO Queue
}

type AppEffect = 
  | { type: 'FOCUS_ID', id: string }
  | { type: 'NAVIGATE', direction: 'UP' | 'DOWN' ... }
```

### The Pipeline
1.  **Command**: Pushes an effect to the queue.
    ```typescript
    state.effects.push({ type: 'NAVIGATE', direction: 'DOWN' });
    ```
2.  **Middleware** (`navigationMiddleware`):
    -   Reads the queue.
    -   Executes the logic (Physics/Strategies).
    -   **Consumes** (Clears) the queue.
3.  **OS**: Updates actual focus state (`useFocusStore`).

## 3. Benefits
-   **Explicit Intent**: "I am queuing a navigation event" vs "I am setting a string".
-   **Standard Architecture**: Matches typical Redux/Game Loop patterns (Command -> Event -> System).
-   **Debuggable**: We can inspect the `effects` array in the Inspector to see pending operations.
