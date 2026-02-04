# 2026-02-03 Navigation Policy: Macro vs Micro Focus

## Context
The user raised a conflict in UX expectations:
1.  **Todo Navigation (Macro):** When moving between items (Up/Down), the current item should blur, and the next item should become active. The text cursor/input focus is lost.
2.  **Autocomplete Navigation (Micro):** When a popup (mention/command) is open, Up/Down keys should navigate the *list*, but the text cursor MUST remain active in the input field (Prevent Blur).

## Architecture Resolution
We need to distinguish between two layers of navigation:

### 1. Macro Navigation (OS Level)
-   **Scope:** Moving between distinct interaction nodes (Zones, Items).
-   **Behavior:** Moves `OS.focusedItemId`.
-   **Effect:** Previous item blurs, new item focuses.
-   **Trigger:** Unhandled Arrow Keys.

### 2. Micro Navigation (Widget Level)
-   **Scope:** Transient UI overlays (Autocompletes, Dropdowns, Datepickers) *inside* an Item.
-   **Behavior:** Updates local widget state (e.g., `highlightedIndex`). `OS.focusedItemId` remains unchanged (the Input).
-   **Effect:** Input stays focused (cursor blinks). Visual highlight moves in the popup.
-   **Trigger:** Arrow Keys *trapped* by the widget (Stop Propagation).

## Policy Rule: The "Trap" Pattern
-   **Condition:** If `SuggestionsOpen === true`:
    -   **Input Component** captures `KeyDown`.
    -   If Key is `Up` or `Down`:
        -   `e.stopPropagation()` (Prevent OS Navigate).
        -   Dispatch `WIDGET_NEXT`/`WIDGET_PREV`.
    -   If Key is `Enter`:
        -   `e.stopPropagation()` (Prevent OS/Form Submit).
        -   Dispatch `WIDGET_SELECT`.
-   **Condition:** If `SuggestionsOpen === false`:
    -   Events bubble up.
    -   `Zone` or `OS` handles `OS_NAVIGATE` (Macro move).
