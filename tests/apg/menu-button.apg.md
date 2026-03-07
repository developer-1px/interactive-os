# APG Menu Button

> Pattern: [Menu Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/)
> Example: [Menu Button Actions Example](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/examples/menu-button-actions/)
>
> Status: 🟢 20/26 covered | 🔴 0 OS gaps

## Decision Table

> | Signal | Meaning |
> |--------|---------|
> | 🟢 | test exists + passes |
> | ➖ | N/A (browser default, not testable headless) |

### Menu Navigation (vertical, loop)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| N1 | 🟢 | action-cut focused | `press("ArrowDown")` | action-copy focused | "Down Arrow: Moves focus to the next item." | `ArrowDown moves focus to next item` |
| N2 | 🟢 | action-copy focused | `press("ArrowUp")` | action-cut focused | "Up Arrow: Moves focus to the previous item." | `ArrowUp moves focus to previous item` |
| N3 | 🟢 | action-delete (last) | `press("ArrowDown")` | action-cut (first) | "Optionally wraps from last to first." | `ArrowDown at last item wraps to first (loop)` |
| N4 | 🟢 | action-cut (first) | `press("ArrowUp")` | action-delete (last) | (loop wraps first to last) | `ArrowUp at first item wraps to last (loop)` |
| N5 | 🟢 | action-paste focused | `press("Home")` | action-cut focused | "Home: Moves focus to first item." | `Home moves focus to first item` |
| N6 | 🟢 | action-copy focused | `press("End")` | action-delete focused | "End: Moves focus to last item." | `End moves focus to last item` |
| N7 | 🟢 | action-copy focused | `press("ArrowLeft")` | focus unchanged | vertical menu: horizontal keys ignored | `ArrowLeft has no effect (vertical menu)` |
| N8 | 🟢 | action-copy focused | `press("ArrowRight")` | focus unchanged | vertical menu: horizontal keys ignored | `ArrowRight has no effect (vertical menu)` |

### Activation (Enter)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| A1 | 🟢 | action-cut focused | `press("Enter")` | activation dispatched | "Enter: Activates the item and closes the menu." | `Enter on menuitem dispatches OS_ACTIVATE` |
| A2 | 🟢 | action-paste focused | `press("Enter")` | activation dispatched | (Enter on any item) | `Enter on any menuitem dispatches activation` |

### Dismiss (Escape)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| D1 | 🟢 | menu open, action-copy focused | `press("Escape")` | activeZone=null | "Escape: Closes the menu." | `Escape closes menu (clears active zone)` |
| D2 | 🟢 | menu open, action-delete focused | `press("Escape")` | activeZone=null | (Escape from any item) | `Escape from any focused item closes menu` |

### Tab Behavior (focus trap)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| FT1 | 🟢 | action-delete (last) focused | `press("Tab")` | action-cut (first) focused | "Tab: focus wraps within menu." | `Tab at last item wraps to first (focus trap)` |
| FT2 | 🟢 | action-cut (first) focused | `press("Shift+Tab")` | action-delete (last) focused | "Shift+Tab: wraps backward." | `Shift+Tab at first item wraps to last (focus trap)` |
| FT3 | 🟢 | action-copy focused | `press("Tab")` | zone stays active | "Tab does not leave menu." | `Tab does not escape the menu zone` |

### Click

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| C1 | 🟢 | action-cut focused | `click("action-paste")` | action-paste focused | click = focus | `click on menu item focuses it` |

### No Selection

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| NS1 | 🟢 | navigate multiple times | (assert) | `selection()` empty | menu uses activation, not selection | `navigation does not create selection` |

### ARIA Attributes

| # | Signal | Element | Role | Attribute | W3C Wording | Test |
|---|--------|---------|------|-----------|-------------|------|
| AR1 | 🟢 | menu item | `menuitem` | — | "Each item in the menu has role menuitem." | `menu items have role=menuitem` |
| AR2 | 🟢 | focused item | — | `tabIndex=0`, others `-1` | roving tabindex | `focused item tabIndex=0, others -1` + `tabIndex follows focus after navigation` |
| AR3 | 🟢 | focused item | — | `data-focused="true"` | OS focus indicator | `focused item has data-focused=true` |
| AR4 | ➖ | trigger button | — | `aria-haspopup="true"` | "The element that opens the menu has aria-haspopup set to true." | N/A — browser TestBot only (Trigger component) |
| AR5 | ➖ | trigger button | — | `aria-expanded` | "Set to true when menu is displayed." | N/A — browser TestBot only |
| AR6 | ➖ | trigger button | — | `aria-controls` | "References the menu element." | N/A — React rendering |
| AR7 | ➖ | menu container | `menu` | — | "Container has role menu." | N/A — React rendering |
| AR8 | ➖ | menu | — | `aria-label` / `aria-labelledby` | "Accessible name for the menu." | N/A — React rendering |
| AR9 | ➖ | menu item (disabled) | — | `aria-disabled="true"` | (disabled state) | N/A — not in showcase |

## Coverage

```
🟢 20  ➖ 6  🔴 0  total 26
```

| Signal | Count | Rows |
|--------|-------|------|
| 🟢 | 20 | N1-N8, A1-A2, D1-D2, FT1-FT3, C1, NS1, AR1-AR3 |
| ➖ | 6 | AR4-AR9 |
