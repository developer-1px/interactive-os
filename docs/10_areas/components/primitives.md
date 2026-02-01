# UI Primitives: Bound Interaction

Antigravity provides a set of "Bound Primitives" that act as the interface between the DOM and the Command Engine.

## 1. `<Action />`
Used for buttons or clickable elements.
- **`command`**: The Command Object to dispatch.
- **`asChild`**: Follows the Radix UI pattern to merge functionality into a custom child component.

## 2. `<Field />` (Command-Aware)
The primary input primitive. It handles the lifecycle of an input field through commands.
- **`syncCommand`**: Fired on every keystroke to keep the engine in sync.
- **`commitCommand`**: Fired on `Enter` or `Blur` to save the value.
- **`cancelCommand`**: Fired on `Escape` to discard changes.

### Key Logic: Event Merging
When using `asChild`, `Field` automatically merges its internal handlers (like Enter-to-save) with any existing handlers on the child, ensuring no logic is lost.

## 3. `<Option />`
Used for selectable or focusable items in a list.
- **Interactive**: Automatically dispatches `SET_FOCUS` commands on focus/hover.
- **Controlled Focus**: Syncs its focus state with the global `focusId`.

## 4. Why Use Primitives?
- **Zero-Logic Views**: The component file stays clean of `handleX` functions.
- **Consistency**: All buttons and fields behave identically across the app.
- **Observability**: Every interaction with a primitive is automatically logged by the system.
