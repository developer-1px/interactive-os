# APG Navigation Tree (Finder-like)

> Pattern: [Tree View](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/) (navigation variant)
> Example: Finder-like file navigation with followFocus
>
> Status: 🟢 12/16 covered | 🔴 0 OS gaps

## Decision Table

> | Signal | Meaning |
> |--------|---------|
> | 🟢 | test exists + passes |
> | ➖ | N/A (browser default, not testable) |

### followFocus (navigation selects)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| FF1 | 🟢 | folder:docs focused | `press("ArrowDown")` | file:readme focused + selected | followFocus: navigation selects | `ArrowDown moves focus AND selects the next item` |
| FF2 | 🟢 | file:guide focused | `press("ArrowUp")` | file:readme focused + selected | followFocus: navigation selects | `ArrowUp moves focus AND selects the previous item` |
| FF3 | 🟢 | folder:docs focused | ArrowDown x2 | file:guide focused + selected (only 1 selected) | single-select + followFocus | `multiple ArrowDown: selection follows focus` |

### Expand/Collapse

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| E1 | 🟢 | folder:docs collapsed | `press("ArrowRight")` | aria-expanded=true | "Right Arrow: opens the node." | `ArrowRight on collapsed folder: expands` |
| E2 | 🟢 | folder:docs expanded | `press("ArrowLeft")` | aria-expanded=false | "Left Arrow: closes the node." | `ArrowLeft on expanded folder: collapses` |
| E3 | 🟢 | folder:docs focused | Enter x2 | toggles expand twice | "Enter: toggle expansion." | `Enter on folder: toggles expansion` |
| E4 | 🟢 | file:readme focused | `press("ArrowRight")` | no expand | "ArrowRight on leaf: nothing." | `ArrowRight on file: does NOT expand` |

### Activation

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| AC1 | 🟢 | file:readme focused | `press("Enter")` | no expand (activate only) | Enter on file = onAction | `Enter on file: does NOT expand` |

### ARIA Attributes

| # | Signal | Element | Role | Attribute | W3C Wording | Test |
|---|--------|---------|------|-----------|-------------|------|
| A1 | 🟢 | folder (collapsed) | — | `aria-expanded="false"` | "Closed node: aria-expanded=false." | `folder has aria-expanded=false when collapsed` |
| A2 | 🟢 | folder (expanded) | — | `aria-expanded="true"` | "Open node: aria-expanded=true." | `folder has aria-expanded=true when expanded` |
| A3 | 🟢 | file | — | no `aria-expanded` | "Leaf: no aria-expanded." | `file does NOT have aria-expanded` |
| A4 | 🟢 | focused item | — | `tabIndex=0`, others `-1` | roving tabindex | `focused item has tabIndex=0, others -1` |
| A5 | ➖ | tree container | `tree` | — | "Container has role tree." | N/A — React rendering |
| A6 | ➖ | tree | — | `aria-label` | "Tree has an accessible name." | N/A — React rendering |
| A7 | ➖ | treeitem | — | `aria-level` | "Each treeitem has aria-level." | N/A — React rendering |
| A8 | ➖ | group | `group` | — | "Subtrees in role group." | N/A — React rendering |

## Coverage

```
🟢 12  ➖ 4  🔴 0  total 16
```

| Signal | Count | Rows |
|--------|-------|------|
| 🟢 | 12 | FF1-FF3, E1-E4, AC1, A1-A4 |
| ➖ | 4 | A5-A8 |
