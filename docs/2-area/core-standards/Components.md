# Components: Core Primitives (TFIZ)

Interaction OS is built on four "Sovereign Primitives" (TFIZ) that act as the interface between the DOM and the Command Engine.

## 1. `<Zone />` (Jurisdiction)
Defines the spatial context for focus and keybindings. Only one Zone is "Active" at a time.

```tsx
<Zone id="sidebar" defaultFocusId="inbox">
  {/* Items go here */}
</Zone>
```

- **Props**: `id` (required), `area` (grouping), `defaultFocusId`.

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
    syncCommand={{ type: 'UPDATE_DRAFT', payload: { id: todo.id } }}
    commitCommand={{ type: 'SAVE_TODO', payload: { id: todo.id } }}
/>
```

- **Props**: `value`, `syncCommand` (onChange), `commitCommand` (Enter/Blur), `cancelCommand` (Escape).

## 4. `<Trigger />` (Verb)
Wraps buttons, checkboxes, or any element that triggers an action.

```tsx
<Trigger command={{ type: 'DELETE_TODO', payload: { id: 1 } }}>
  <button>Delete</button>
</Trigger>
```

- **Props**: `command` (required), `allowPropagation`.

## Implementation Principles
- **Separation of Concerns**: These primitives handle the "How" (DOM events, refs), allowing the developer to focus on the "What" (Commands).
- **No Prop Drilling**: Components connect directly to the engine or context, avoiding deep prop trees.
