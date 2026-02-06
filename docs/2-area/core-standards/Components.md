# Components: Core Primitives (ZIFT)

Interaction OS is built on four "Sovereign Primitives" (ZIFT) that act as the interface between the DOM and the Command Engine.

## 1. `<Zone />` (Jurisdiction)
Defines the spatial context for focus and keybindings. Only one Zone is "Active" at a time.

```tsx
<Zone id="sidebar" role="listbox">
  {/* Items go here */}
</Zone>
```

- **Props**: `id` (required), `role` (ARIA role preset).
- **Command Binding**: `onAction` (Enter), `onSelect` (Space/selection change).

## 2. `<Item />` (Object)
Represents an individual, interactable object within a Zone. Handles selection and focus visibility.

```tsx
<Item id="task-1" className="flex row p-2">
  <span>Buy Milk</span>
</Item>
```

- **Props**: `id` (required), `asChild` (Radix pattern).

## 3. `<Field />` (Property)
A command-aware input primitive connecting key strokes to the engine.

```tsx
<Field
    value={todo.text}
    onChange={UpdateDraft({ id: todo.id })}
    onSubmit={SaveTodo({ id: todo.id })}
/>
```

- **Props**: `value`, `onChange` (realtime sync), `onSubmit` (Enter/Blur), `onCancel` (Escape).

## 4. `<Trigger />` (Verb)
Wraps buttons, checkboxes, or any element that triggers an action.

```tsx
<Trigger onPress={DeleteTodo({ id: 1 })}>
  <button>Delete</button>
</Trigger>
```

- **Props**: `onPress` (required), `allowPropagation`.

## Implementation Principles
- **Separation of Concerns**: These primitives handle the "How" (DOM events, refs), allowing the developer to focus on the "What" (Commands).
- **No Prop Drilling**: Components connect directly to the engine or context, avoiding deep prop trees.
