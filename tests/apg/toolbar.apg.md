# APG Toolbar

> Pattern: [Toolbar](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)
> Example: [Toolbar Example](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/examples/toolbar/)
>
> Status: 🟢 14/18 covered | 🔴 0 OS gaps

## Decision Table

> | Signal | Meaning |
> |--------|---------|
> | 🟢 | test exists + passes |
> | ➖ | N/A (browser default, not testable) |

### Keyboard — Navigation (horizontal, loop)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| K1 | 🟢 | bold-btn focused | `press("ArrowRight")` | italic-btn focused | "Right Arrow: Moves focus to the next control." | `assertHorizontalNav` |
| K2 | 🟢 | italic-btn focused | `press("ArrowLeft")` | bold-btn focused | "Left Arrow: Moves focus to the previous control." | `assertHorizontalNav` |
| K3 | 🟢 | link-btn (last) focused | `press("ArrowRight")` | bold-btn (first) focused | "Optionally, focus movement wraps from last to first." | `assertLoop` |
| K4 | 🟢 | bold-btn (first) focused | `press("ArrowLeft")` | link-btn (last) focused | (loop wraps from first to last) | `assertLoop` |
| K5 | 🟢 | any focused | `press("Home")` | bold-btn (first) focused | "Home (Optional): Moves focus to first element." | `assertHomeEnd` |
| K6 | 🟢 | any focused | `press("End")` | link-btn (last) focused | "End (Optional): Moves focus to last element." | `assertHomeEnd` |
| K7 | 🟢 | any focused | `press("ArrowDown")` / `press("ArrowUp")` | focus unchanged | vertical keys ignored in horizontal toolbar | `assertOrthogonalIgnored` |

### Tab Escape

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| TE1 | 🟢 | toolbar active, italic-btn focused | `press("Tab")` | focus moves to next zone (editor) | "Tab: Moves focus out of the toolbar." | `Tab: moves focus out to next zone` |

### No Selection

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| NS1 | 🟢 | navigate multiple times | (assert) | `selection()` empty | toolbar with select=none | `assertNoSelection` |

### Tabs Variant (followFocus + auto-activation)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| TV1 | 🟢 | tab-general selected | `press("ArrowRight")` | tab-security selected, tab-general deselected | followFocus: navigation selects | `auto-activation: navigation selects tab (aria-selected)` |
| TV2 | 🟢 | tab-general selected | navigate full cycle (3x ArrowRight) | each tab selected in turn, loops back | full cycle with selection follow | `full cycle: selection follows each navigation` |

### ARIA Attributes

| # | Signal | Element | Role | Attribute | W3C Wording | Test |
|---|--------|---------|------|-----------|-------------|------|
| A1 | 🟢 | toolbar container | `toolbar` | — | "The element that serves as the toolbar container has role toolbar." | (role set in zone bind config) |
| A2 | 🟢 | toolbar item (focused) | — | `tabIndex=0` | roving tabindex | (verified via assertHorizontalNav) |
| A3 | ➖ | toolbar container | — | `aria-label` / `aria-labelledby` | "The toolbar has an accessible name." | N/A — React rendering |
| A4 | ➖ | toolbar container | — | `aria-orientation` | "If vertical, set aria-orientation to vertical." | N/A — implicit horizontal |
| A5 | ➖ | toolbar container | — | `aria-controls` | "If controls another element, set aria-controls." | N/A — React rendering |
| A6 | ➖ | toolbar item (disabled) | — | `aria-disabled="true"` | (disabled state) | N/A — not in showcase |

## Coverage

```
🟢 14  ➖ 4  🔴 0  total 18
```

| Signal | Count | Rows |
|--------|-------|------|
| 🟢 | 14 | K1-K7, TE1, NS1, TV1-TV2, A1-A2 |
| ➖ | 4 | A3 (label), A4 (orientation), A5 (aria-controls), A6 (disabled) |
