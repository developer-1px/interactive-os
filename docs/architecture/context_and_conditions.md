# Context & Named Conditions

The Context system governs "when" certain interactions are allowed. It prevents "Key Collision" and ensures logical consistency across the app.

## 1. Context State

The Context is a flat map of boolean or string flags derived from the main application state.
- `hasTodos`: `true` if list is not empty.
- `isEditing`: `true` if a todo is being edited.
- `focusId`: The ID of the currently focused element.

## 2. Named Conditions

Instead of repeating logic like `state.todos.length > 0` everywhere, we use the **Condition Registry**.

```typescript
export const TODO_CONDITIONS: ConditionDefinition<AppState>[] = [
    {
        id: 'hasTodos',
        description: 'True if there is at least one todo item',
        run: (s) => s.todos.length > 0
    }
];
```

Benefits:
- **Serialization**: Conditions are named and documented.
- **Transparency**: The Inspector can show exactly why a "Delete" shortcut is disabled.

## 3. The `when` Expression Engine

The system uses a compiled expression engine to evaluate requirements.
- **AND**: `listFocus && !isEditing`
- **OR**: `isEditing || isInputFocused`
- **NOT**: `!hasTodos`

### Optimization: Compile-Once
Expressions are compiled into JavaScript functions and cached. This ensures O(1) evaluation performance during high-frequency interaction.

## 4. Integration

Commands use the `when` property to bind themselves to these conditions. UI Primitives also use these conditions to manage their own visibility or enabled states.
