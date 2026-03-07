# APG Dropdown Menu (Locale Switcher)

> Pattern: [Menu Button](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) (dropdown variant)
> Example: Locale Switcher — dropdown-as-menu proof
>
> Status: 🟢 8/13 covered | 🔴 0 OS gaps

## Decision Table

> | Signal | Meaning |
> |--------|---------|
> | 🟢 | test exists + passes |
> | ➖ | N/A (browser default, not testable) |

### Navigation (vertical, loop)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| N1 | 🟢 | ko focused | `press("ArrowDown")` | en focused | "Down Arrow: Moves focus to next item." | `Arrow Down moves to next locale` |
| N2 | 🟢 | ko (first) focused | `press("ArrowUp")` | zh (last) focused | "Up wraps from first to last (loop)." | `Arrow Up from first item loops to last` |
| N3 | 🟢 | zh (last) focused | `press("ArrowDown")` | ko (first) focused | "Down wraps from last to first (loop)." | `Arrow Down from last item loops to first` |

### Activation (Enter)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| A1 | 🟢 | en focused | `press("Enter")` | activation triggered | "Enter: Activates the item." | `Enter on focused item triggers activation` |

### Dismiss (Escape)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| D1 | 🟢 | menu open | `press("Escape")` | activeZone=null | "Escape: Closes the menu." | `Escape closes the dropdown` |
| D2 | 🟢 | menu open | `press("Escape")` + stack pop | focus returns to trigger | "Focus returns to invoker." | `Escape + stack pop restores focus to trigger button` |

### AutoFocus + Tab Trap

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| AF1 | 🟢 | menu just opened | (assert) | ko (first) focused | "Focus on first item when menu opens." | `menu opens with focus on first item` |
| TT1 | 🟢 | en focused | `press("Tab")` | zone stays active (trapped) | "Tab does not escape the menu." | `Tab does not escape the menu` |

### ARIA Attributes

| # | Signal | Element | Role | Attribute | W3C Wording | Test |
|---|--------|---------|------|-----------|-------------|------|
| AR1 | ➖ | trigger | — | `aria-haspopup="true"` | "Trigger has aria-haspopup." | N/A — React rendering |
| AR2 | ➖ | trigger | — | `aria-expanded` | "aria-expanded when menu open." | N/A — React rendering |
| AR3 | ➖ | menu container | `menu` | — | "Container has role menu." | N/A — React rendering |
| AR4 | ➖ | menu item | `menuitem` | — | "Each item has role menuitem." | N/A — React rendering |
| AR5 | ➖ | menu | — | `aria-label` | "Menu has an accessible name." | N/A — React rendering |

## Coverage

```
🟢 8  ➖ 5  🔴 0  total 13
```

| Signal | Count | Rows |
|--------|-------|------|
| 🟢 | 8 | N1-N3, A1, D1-D2, AF1, TT1 |
| ➖ | 5 | AR1-AR5 |
