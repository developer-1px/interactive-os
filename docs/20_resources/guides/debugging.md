# Debugging & Observability

Antigravity is designed to be fully transparent during development.

## 1. Professional Logger (`AntigravityLogger`)

The custom logger provides styled badges for different system layers:
- `[ENGINE]`: State changes and command results.
- `[KEYMAP]`: Keyboard match results.
- `[CONTEXT]`: Flag synchronizations and condition compilations.
- `[PRIMITIVE]`: User interactions like clicks or input commits.
- `[SYSTEM]`: Registration and initialization logs.

### Trace Command
When a command executes, the logger creates a group showing:
- **Payload**: The data sent with the command.
- **Prev State**: The state snapshot before execution.
- **Next State**: The state snapshot after execution.

## 2. Command Inspector

The right side panel provides a real-time view of the "Interaction OS" internals.

### Command Registry
- View all registered commands.
- See their bound keybindings.
- Monitor active/inactive status via green/gray indicators based on their `when` conditions.

### Global State
- Live view of the `AppState`.
- Real-time `editDraft` and `focusId` tracking.

## 3. Best Practices
- **Console Filtering**: Filter by `[KEYMAP]` to debug why a shortcut isn't firing.
- **Group Inspection**: Expand `Action: COMMAND_ID` groups to find logic errors in `run` functions.
- **Dev Mode**: Logging and the Inspector are automatically disabled in production builds via `import.meta.env.DEV`.
