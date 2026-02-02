# Command System Architecture

The Command System is the backbone of the application logic. It decouples "What to do" from "How it's triggered".

## 1. Command Definition

A command is defined using the `CommandDefinition` interface.

```typescript
export interface CommandDefinition<S, P = any> {
    id: string;               // Unique ID (e.g., 'ADD_TODO')
    kb?: string[];            // Default keybindings
    when?: string;            // Contextual requirement
    description?: string;     // Human-readable purpose
    run: (state: S, payload: P) => S; // Pure state transformation
}
```

## 2. The Registry

All commands must be registered in the `CommandRegistry`. This allows the system to:
- Generate a searchable list of commands for the **Inspector**.
- Automatically bind keybindings.
- Provide a single source of truth for all system "Verbs".

## 3. Execution Flow

1.  **Dispatch**: A UI primitive or a Keybinding listener dispatches a `TodoCommand`.
2.  **Validation**: The system checks the `when` clause against the current `Context`.
3.  **Transformation**: If valid, the `run` function executes, taking the current state and returning a new state.
4.  **Logging**: Every execution is traced by the `AntigravityLogger` (in dev mode), showing Prev/Next state diffs.

## 4. Pure Command Pattern

To maintain a "Pure View", commands should be designed to be self-sufficient.
- Instead of the UI passing complex data, the UI should sync raw input to a "Draft" state.
- The Command then reads from that "Draft" state during execution.
