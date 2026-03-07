# APG Menu and Menubar

> Pattern: [Menu and Menubar](https://www.w3.org/WAI/ARIA/apg/patterns/menu/)
> Example: [Editor Menubar Example](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/examples/menubar-editor/)
>
> Status: 🟢 24/30 covered | 🔴 0 OS gaps

## Decision Table

> | Signal | Meaning |
> |--------|---------|
> | 🟢 | test exists + passes |
> | ➖ | N/A (browser default, not testable) |

### Menubar Navigation (horizontal, loop)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| N1 | 🟢 | mb-file focused | `press("ArrowRight")` | mb-edit focused | "Right Arrow: Moves focus to the next item." | `assertHorizontalNav` |
| N2 | 🟢 | mb-edit focused | `press("ArrowLeft")` | mb-file focused | "Left Arrow: Moves focus to the previous item." | `assertHorizontalNav` |
| N3 | 🟢 | mb-view (last) focused | `press("ArrowRight")` | mb-file (first) focused | "Optionally, wraps from last to first." | `N1: Right Arrow at last item wraps to first (loop)` |
| N4 | 🟢 | mb-file (first) focused | `press("ArrowLeft")` | mb-view (last) focused | (loop wraps first to last) | `N2: Left Arrow at first item wraps to last (loop)` |

### Menu Navigation (vertical, loop, Home/End)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| M1 | 🟢 | cmd-new focused | `press("ArrowDown")` | cmd-open focused | "Down Arrow: Moves focus to the next item." | `assertVerticalNav` |
| M2 | 🟢 | cmd-open focused | `press("ArrowUp")` | cmd-new focused | "Up Arrow: Moves focus to the previous item." | `assertVerticalNav` |
| M3 | 🟢 | radio-right (last) focused | `press("ArrowDown")` | cmd-new (first) focused | "Wraps from last to first." | `N3: Down Arrow at last wraps to first` |
| M4 | 🟢 | cmd-new (first) focused | `press("ArrowUp")` | radio-right (last) focused | "Wraps from first to last." | `N4: Up Arrow at first wraps to last` |
| M5 | 🟢 | any focused | `press("Home")` | cmd-new (first) focused | "Home: Moves focus to first item." | `assertHomeEnd` |
| M6 | 🟢 | any focused | `press("End")` | radio-right (last) focused | "End: Moves focus to last item." | `assertHomeEnd` |

### Activation (Enter)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| A1 | 🟢 | cmd-new focused in menu | `press("Enter")` | activation triggered | "Enter: Activates the item and closes the menu." | `A1: Enter on menuitem triggers activation` |
| A2 | 🟢 | menu open, cmd-new focused | `press("Escape")` + stack pop | focus returns to menubar invoker | "Closing restores focus to invoker." | `A2: Escape closes menu + stack pop restores focus to invoker` |

### Checkbox Toggle (menuitemcheckbox)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| C1 | 🟢 | check-ruler unchecked | `OS_CHECK` | check-ruler checked | "Space: toggles checked state of menuitemcheckbox." | `C1: OS_CHECK toggles checked state for checkbox item` |
| C2 | 🟢 | check-ruler checked | `OS_CHECK` | check-ruler unchecked | (toggle off) | `C1: OS_CHECK toggles checked state for checkbox item` |
| C3 | 🟢 | check-ruler toggled | (assert zone) | menu stays open | "Checkbox toggle does NOT close menu." | `C1: OS_CHECK does NOT close menu` |
| C4 | 🟢 | check-ruler + check-grid | `OS_CHECK` both | both checked independently | "Multiple checkboxes toggle independently." | `C1: multiple checkboxes toggle independently` |

### Radio Toggle (menuitemradio)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| R1 | 🟢 | radio-left unchecked | `OS_CHECK` | radio-left checked | "Space: checks radio item." | `C2: OS_CHECK checks radio item` |
| R2 | 🟢 | radio-left toggled | (assert zone) | menu stays open | "Radio check does NOT close menu." | `C2: OS_CHECK does NOT close menu` |

### Dismiss (Escape)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| D1 | 🟢 | menu open | `press("Escape")` | menu zone deactivated | "Escape: Closes the menu." | `assertEscapeClose` |
| D2 | 🟢 | menu open | `press("Escape")` + stack pop | focus returns to menubar invoker | "Escape returns focus to the element that invoked the menu." | `Escape + stack pop: restores focus to invoker` |

### No Selection

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| NS1 | 🟢 | menubar: navigate | (assert) | `selection()` empty | menubar uses activation, not selection | `assertNoSelection` (menubar) |
| NS2 | 🟢 | menu: navigate | (assert) | `selection()` empty | menu uses activation, not selection | `assertNoSelection` (menu) |

### ARIA Attributes

| # | Signal | Element | Role | Attribute | W3C Wording | Test |
|---|--------|---------|------|-----------|-------------|------|
| AR1 | 🟢 | menubar item | `menuitem` | — | "Each item in the menubar has role menuitem." | `R1: menubar items have role=menuitem` |
| AR2 | 🟢 | menubar item (focused) | — | `tabIndex=0` | roving tabindex | `R2: menubar focused item tabIndex=0, others -1` |
| AR3 | 🟢 | menu item | `menuitem` | — | "Each item in the menu has role menuitem." | `R3: menu items have role=menuitem` |
| AR4 | 🟢 | menu item (focused) | — | `tabIndex=0` | roving tabindex | `R4: menu focused item tabIndex=0, others -1` |
| AR5 | 🟢 | focused item | — | `data-focused="true"` | OS focus indicator | `R5: focused item has data-focused=true` |
| AR6 | ➖ | menubar container | `menubar` | — | "Container has role menubar." | N/A — React rendering |
| AR7 | ➖ | menu container | `menu` | — | "Container has role menu." | N/A — React rendering |
| AR8 | ➖ | menubar/menu | — | `aria-label` / `aria-labelledby` | "Accessible name for the menubar." | N/A — React rendering |
| AR9 | ➖ | menu item (disabled) | — | `aria-disabled="true"` | (disabled state) | N/A — not in showcase |
| AR10 | ➖ | submenu trigger | — | `aria-haspopup="true"` | "aria-haspopup for submenu triggers." | N/A — no submenus in showcase |
| AR11 | ➖ | submenu trigger | — | `aria-expanded` | "aria-expanded for submenu open state." | N/A — no submenus in showcase |

## Coverage

```
🟢 24  ➖ 6  🔴 0  total 30
```

| Signal | Count | Rows |
|--------|-------|------|
| 🟢 | 24 | N1-N4, M1-M6, A1-A2, C1-C4, R1-R2, D1-D2, NS1-NS2, AR1-AR5 |
| ➖ | 6 | AR6-AR11 |
