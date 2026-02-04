# Navigation Refactoring Proposal: Natural Focus & Input Policy

## Objective
Remove the reliance on `Meta+Arrow` bindings for navigation and eliminate the complex `allowInInput` configuration. Instead, rely on natural focus behaviors where:
1.  **Single-line Inputs (Field)**: Allow `ArrowUp`/`ArrowDown` to bubble up to the OS, triggering standard Zone navigation.
2.  **Multi-line Inputs**: Trap focus for text editing, requiring explicit exit (e.g., `Escape` or `Tab`) or modifier-based navigation only if necessary.
3.  **Non-Input Elements**: `Arrow` keys work naturally for navigation.

## Current State Analysis

### 1. `InputEngine` (Hardware Layer)
Currently, `InputEngine` intercepts **all** keydown events globally.
- It checks if the target is an input (`isInput`).
- It iterates through the `registry` (Keybindings).
- If a match is found:
    - It checks `b.allowInInput`.
    - If `isInput` is true and `!allowInInput`, the binding is **ignored** (event flows to input).
    - If `!isInput` OR `allowInInput`, the binding consumes the event (`preventDefault`, `stopPropagation`).

### 2. Navigation Commands
Currently, navigation commands (`NAVIGATE_UP`, etc.) are often bound to `Meta+ArrowUp` to ensure they work even when inside an input (because plain `ArrowUp` inside an input usually moves the caret).

### 3. `Field` Component (Recent Changes)
We recently modified `src/os/ui/Field.tsx` to distinguish modes:
- **Single-line**: `ArrowUp`/`ArrowDown` events are **not** stopped (they bubble).
- **Multi-line**: `ArrowUp`/`ArrowDown` events are `stopPropagation`'d (trapped).

## Proposed Architecture: "Natural Focus"

### 1. Remove `Meta+` Navigation Bindings
We can bind OS Navigation commands directly to plain `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`.

### 2. Remove `allowInInput` Concept
We no longer need to explicitly "allow" navigation in inputs via a config flag. Instead, we rely on the **Event Propagation Chain**.

**Logic Flow:**
1.  **User presses `ArrowDown` in a Single-line Field.**
    *   `Field` component sees it. `multiline={false}`.
    *   `Field` does **NOT** `stopPropagation`.
    *   Event bubbles up to `window` (caught by `InputEngine`).
    *   `InputEngine` sees `ArrowDown`.
    *   `InputEngine` matches `ArrowDown` -> `NAVIGATE_DOWN`.
    *   **CRITICAL CHANGE**: Use `e.target` check instead of `allowInInput`.
        *   If `isInput`, should we execution navigation?
        *   **YES**, because the Input **chose** to let it bubble!
        *   If the Input wanted to keep focus (e.g. Multi-line), it would have called `stopPropagation`, and `InputEngine` (listening on window) would never see it (if utilizing Capture phase correct, or bubbling phase).
        *   *Wait*: `InputEngine` listens on `window` (Bubbling phase by default).
        *   So if `Field` calls `stopPropagation`, `InputEngine` does **NOT** receive it.
        *   This creates a perfect "Opt-out" system.

### 3. Refactoring `InputEngine`
We need to modify `InputEngine.tsx` to stop guarding against `isInput` for commands.

**Current Logic:**
```typescript
if (isInput && !b.allowInInput) return false;
```

**New Logic:**
Remove this check entirely.
- If the event reached `InputEngine` (window level), it means no focused element intercepted it.
- Therefore, it is safe to execute the command.

### 4. Edge Cases & Safety
- **Native Browser Inputs**: If a standard HTML `<input>` is used (not our `Field`), it naturally bubbles arrow keys.
    - Default behavior: Moves caret.
    - If we execute navigation, we prevent default?
    - `InputEngine` calls `preventDefault()`.
    - So plain inputs will navigate instead of moving caret?
    - **Issue**: Standard inputs usually want Arrow Left/Right for caret.
    - **Solution**:
        - `Field` (Single-line) **should** consume Left/Right (stopPropagation) but **allow** Up/Down.
        - `Field` (Multi-line) should consume All.
        - Standard `<input>` consumes None (bubbles all).
        - If we remove `allowInInput` check, `InputEngine` will hijack Left/Right in standard inputs if `ArrowLeft` is bound to `NAVIGATE_LEFT`.
    - **Refinement**:
        - We still need a policy for "Standard HTML Elements" if we want to query them.
        - However, in our OS, we should prefer `Field` component usage which explicitly manages this policy.
        - For "Unknown Inputs" (e.g. inside an iframe or 3rd party lib), we might still strictly block commands unless `force` is allowed?
        - **Decision**: For the "Natural Focus" system to work, `InputEngine` relies on the component to `stopPropagation`. If a component doesn't, the OS takes over. This is consistent with "OS Priority".

## Execution Plan

1.  **Modify `Field`**: Ensure `ArrowLeft`/`ArrowRight` **always** `stopPropagation` (even in single-line) to allow caret movement. Only exit on edge boundary (optional feature, skip for now).
2.  **Modify `InputEngine`**: Remove `allowInInput` check. Trust the bubble.
3.  **Update Keybindings**: Change `Meta+Arrow` bindings to simple `Arrow`.
4.  **Verify**: Test in `Field` (Single/Multi) and plain Zone navigation.
