# App Architecture & Middleware Lifecycle: The Antigravity Standard

> **Captured**: 2026-02-03
> **Topic**: App Creation, Middleware Integration, and OS Responsibilities
> **Context**: Refactoring of Todo App to v4 Architecture

## 1. Core Philosophy: "Smart Core, Dumb App"

The fundamental shift in our architecture is moving infrastructure responsibility from the Application to the OS Core.

- **App Responsibility**: Defines *Domain Logic* (Commands), *Data Structure* (State), and *UI* (Components).
- **OS Responsibility**: Provides *Input Handling*, *Focus Management*, *Persistence*, *Undo/Redo*, and *Observability*.

## 2. The Anatomy of an App

An Antigravity App consists of three distinct layers:

### A. The Definition Layer (Static)
This layer defines "What the app is" without running it.
*   **Model**: `types.ts` (AppState, Domain Objects).
*   **Commands**: `commands/list.ts` (Immer producers define state transitions).
*   **Keymap**: `keys.ts` (Mapping inputs to Command IDs).
*   **Registry**: `UNIFIED_REGISTRY` (The catalog of all capabilities).

### B. The Engine Layer (Runtime)
This is where the app comes alive. We use a **Headless Engine Pattern**.
*   **`createCommandStore`**: The factory that binds the Registry to the State.
*   **Declarative Persistence**: Configured here (not coded).
*   **Middleware Injection**: Where domain-specific logic (like `navigationMiddleware`) is attached.

### C. The View Layer (Reactive)
*   **`useTodoEngine`**: A hook that exposes the Engine's state and methods to the UI.
*   **Context Mapping**: Transforming AppState into OS-readable Context (`mapStateToContext`) for global services.

## 3. The Middleware Pipeline

We have established a specific pipeline for how Actions flow into State Changes:

1.  **Input/Trigger**: User presses Key or clicks Button.
2.  **Dispatcher**: OS resolves the Command ID.
3.  **Interceptor (`onDispatch`)**: *Rarely used now.* Replaced by "Context Receivers" in commands.
4.  **Command Execution**: The `run` function (Immer producer) executes.
5.  **Middleware (`onStateChange`)**:
    *   **Logic Resolution**: Did a Todo get added? Do we need to sort the list?
    *   **Effect Generation**: Does this action require changing Focus? (App -> OS Communication).
6.  **OS Hooks**:
    *   **Persistence**: Auto-saves if configured.
    *   **Logging**: Traces the transaction.

## 4. Key Patterns & Evolution

| Feature | Old Way (v1-v3) | New Standard (v4) |
| :--- | :--- | :--- |
| **Persistence** | Manual `saveState()` in middleware | `persistence: { key: ... }` in Store Config |
| **Undo/Redo** | Manual History array manipulation | OS Command Store (Universal History) |
| **Focus** | App patches focus (`ensureIntegrity`) | OS `Zone` system & Auto-Healing |
| **Navigation** | App handles Arrow Keys | OS `InputEngine` handles standard nav |
| **Middleware** | Mixed Bag (Logic + IO + Side Effects) | **Pure Logic** only (Returns State + Effects) |

## 5. Next Steps for Discussion
- **Effect Consumption**: Currently `navigationMiddleware` pushes effects, but how do we robustly guarantee they are consumed?
- **Universal History**: We removed manual Undo/Redo. We need to confirm the OS Command Store's history implementation is sufficient.
- **Middleware Composition**: As apps grow, how do we combine multiple middlewares? (Currently just one `navigationMiddleware`).

---
**Status**: Draft for discussion.
