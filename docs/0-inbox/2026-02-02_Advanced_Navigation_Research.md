# Insight: Advanced Focus Management & Spatial Navigation (2026)

To elevate the Interactive OS navigation to a "Universal" standard (TV/Game/Web/Desktop), we must adopt patterns that abstract "Focus" from "DOM Source Order".

## 1. The "Roving Tabindex" Standard
**The Standard**: For composite widgets (Grids, Lists, Toolbars), **only one** element has `tabindex="0"` (the active one). All others are `tabindex="-1"`.
- **Why**: Allows users to "Tab" *into* the component, then use "Arrows" *inside* it without tabbing through every single item (which is tedious).
- **Interactive OS Alignment**: Our `Item` primitive already mimics this by checking `currentFocusId`. We should strictly enforce `tabindex={isActive ? 0 : -1}`.

## 2. Spatial Navigation (LRUD) vs Source Order
**Problem**: DOM order (Tab) is linear. Visual layout (Kanban, Grid) is 2D. 
**Solution**: **Spatial Navigation Algorithms**.
- **Netflix Pattern**: "Focusable Tree" + "LRUD" (Left/Right/Up/Down). Focus moves based on *visual coordinates* (`getBoundingClientRect`) or *declarative topology*.
- **Polyfills**: `js-spatial-navigation` uses geometric proximity.
- **Interactive OS Alignment**:
    - **Current**: Direct Keybinding mappings (`ArrowRight -> NAVIGATE_COLUMN`). This is "Declarative Topology" but hardcoded.
    - **Future**: A **"Focus Graph"** where Zones define *neighbors*, not commands.
        ```ts
        // SpatialGraph Definition
        {
          "zone_inbox": { right: "zone_work" },
          "zone_work":  { left: "zone_inbox", right: "zone_personal" }
        }
        ```
    - **Engine Logic**: `ArrowRight` => `Graph.findTarget(activeZone, 'right')` => `dispatch(SET_FOCUS, target)`.

## 3. "Ghost Focus" & Virtualization
**Problem**: In virtualized lists (like our future roadmap), the "next" item might not exist in the DOM.
**Solution**: **Virtual Focus cursors**.
- The "Focused Index" is a state number. The DOM element for that index receives styling *if* it renders.
- If it doesn't render (off-screen), the Engine still holds the state, and the Virtualizer scrolls it into view, *then* it renders and receives focus.

## Recommendation: The "Navigation Layer"
We should decouple **Keybindings** from **Navigation Intent**.
1.  **Input**: `ArrowDown`
2.  **Intent**: `NAVIGATE_DIRECTION(down)`
3.  **Resolution (The Layer)**:
    - Is there a `FocusGraph` neighbor? -> Go Zone.
    - Is there a `VirtualList` next index? -> Go Item.
    - Fallback -> Native Browser behavior.

This allows us to write `<Zone neighbors={{ right: 'details' }} />` without writing a single generic `ArrowRight` command.
