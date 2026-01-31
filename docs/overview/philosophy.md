# Interaction OS: Architecture Philosophy

## 1. Core Principles

The Antigravity system is built on the **Interaction OS** philosophy, which treats a web application not as a collection of views, but as a sovereign operating system for user interaction.

### Command-Centricity (The "Verb" First)
In traditional apps, logic is buried in `onClick` handlers. In Interaction OS, every meaningful action is a **Command Object**.
- **Serializable**: Commands are plain objects that can be logged, replayed, or sent over a wire.
- **Decoupled**: The View doesn't know *how* a task is deleted; it only knows how to `dispatch({ type: 'DELETE_TODO' })`.

### Pure View (The "Passive" UI)
The View (React components) is strictly a reflection of state and a bridge for commands.
- **No Local Logic**: No complex `useEffect` or `useCallback` for business logic inside components.
- **Primitive Bound**: Components use Primitives (`Action`, `Field`, `Option`) to interact with the engine.

### Context-Driven Sovereignty
Keybindings and UI states are governed by a global **Context**. 
- **Named Conditions**: Transitions (like entering Edit Mode) are governed by registered `ConditionDefinitions`.
- **Visibility**: If a command's `when` clause isn't met, the system ensures it cannot be triggered, and the UI reflects this automatically.

## 2. The 5-Layer Model

1.  **Transport/Signal**: Physical keystrokes and clicks.
2.  **Resolution**: Mapping signals to Commands via Keybindings and Context.
3.  **Command Registry**: The library of all available "Verbs" in the system.
4.  **State Engine**: The central logic that processes Commands and produces a new Immutable State.
5.  **Projection (View)**: The React layer that renders the state and provides interaction Primitives.
