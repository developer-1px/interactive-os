# APG Combobox

> Pattern: [Combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/)
> Example: [Editable Combobox With List Autocomplete](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/)
>
> Status: 🟢 12/19 covered | 🔴 0 OS gaps

## Decision Table

> | Signal | Meaning |
> |--------|---------|
> | 🟢 | test exists + passes |
> | ➖ | N/A (browser default, not testable) |

### Popup Navigation (vertical, no loop, clamp)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| N1 | 🟢 | apple focused | `press("ArrowDown")` | banana focused | "Down Arrow: Moves focus to next option." | `assertVerticalNav` |
| N2 | 🟢 | banana focused | `press("ArrowUp")` | apple focused | "Up Arrow: Moves focus to previous option." | `assertVerticalNav` |
| N3 | 🟢 | apple (first) focused | `press("ArrowUp")` | focus stays (clamp) | "No wrap." | `assertBoundaryClamp` |
| N4 | 🟢 | elderberry (last) focused | `press("ArrowDown")` | focus stays (clamp) | (clamp at last) | `assertBoundaryClamp` |
| N5 | 🟢 | any focused | `press("Home")` | apple (first) focused | "Home: First option." | `assertHomeEnd` |
| N6 | 🟢 | any focused | `press("End")` | elderberry (last) focused | "End: Last option." | `assertHomeEnd` |

### Selection follows focus

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| S1 | 🟢 | apple focused | `press("ArrowDown")` | banana selected, apple deselected | "Selection follows focus." | `assertFollowFocus` |
| S2 | 🟢 | navigate | (assert) | exactly 0 or 1 selected | single-select | `assertFollowFocus` |

### Dismiss (Escape)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| D1 | 🟢 | popup open | `press("Escape")` | popup zone deactivated | "Escape: Closes the listbox popup." | `assertEscapeClose` |
| D2 | 🟢 | popup open | `press("Escape")` + stack pop | focus restores to combobox input | "Focus returns to the combobox." | `Escape + stack pop: restores focus to invoker` |

### ARIA Attributes

| # | Signal | Element | Role | Attribute | W3C Wording | Test |
|---|--------|---------|------|-----------|-------------|------|
| A1 | 🟢 | focused option | — | `tabIndex=0`, others `-1` | roving tabindex | (verified via assertVerticalNav) |
| A2 | 🟢 | selected option | — | `aria-selected="true"` | "aria-selected on the focused option." | (verified via assertFollowFocus) |
| A3 | ➖ | combobox input | `combobox` | — | "Input element has role combobox." | N/A — React rendering |
| A4 | ➖ | input | — | `aria-expanded` | "aria-expanded when popup visible." | N/A — React rendering |
| A5 | ➖ | input | — | `aria-controls` | "References the listbox popup." | N/A — React rendering |
| A6 | ➖ | input | — | `aria-activedescendant` | "ID of the focused option in the popup." | N/A — React rendering |
| A7 | ➖ | popup | `listbox` | — | "Popup has role listbox." | N/A — React rendering |
| A8 | ➖ | input | — | `aria-autocomplete` | "Indicates type of autocomplete." | N/A — React rendering |
| A9 | ➖ | input | — | `aria-label` | "Combobox has an accessible name." | N/A — React rendering |

## Coverage

```
🟢 12  ➖ 7  🔴 0  total 19
```

| Signal | Count | Rows |
|--------|-------|------|
| 🟢 | 12 | N1-N6, S1-S2, D1-D2, A1-A2 |
| ➖ | 7 | A3-A9 |
