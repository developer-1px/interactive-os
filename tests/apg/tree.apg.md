# APG Tree View

> Pattern: [Tree View](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)
> Example: [File Directory Treeview Example](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/examples/treeview-1a/)
>
> Status: 🟢 28/33 covered | 🔴 0 OS gaps

## Decision Table

> | Signal | Meaning |
> |--------|---------|
> | 🟢 | test exists + passes |
> | ➖ | N/A (browser default, not testable) |

### Navigation (vertical, no loop, clamp)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| N1 | 🟢 | section-1 focused | `press("ArrowDown")` | child-1a focused | "Down Arrow: Moves focus to the next node." | `assertVerticalNav` |
| N2 | 🟢 | child-1a focused | `press("ArrowUp")` | section-1 focused | "Up Arrow: Moves focus to the previous node." | `assertVerticalNav` |
| N3 | 🟢 | section-1 (first) focused | `press("ArrowUp")` | focus stays (clamp) | "Does not wrap — no loop." | `assertBoundaryClamp` |
| N4 | 🟢 | leaf-1 (last) focused | `press("ArrowDown")` | focus stays (clamp) | (clamp at last) | `assertBoundaryClamp` |
| N5 | 🟢 | any focused | `press("Home")` | section-1 (first) focused | "Home: Moves focus to first node without opening or closing." | `assertHomeEnd` |
| N6 | 🟢 | any focused | `press("End")` | leaf-1 (last) focused | "End: Moves focus to last visible node." | `assertHomeEnd` |

### Expand/Collapse (ArrowRight/Left)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| E1 | 🟢 | section-1 collapsed | `press("ArrowRight")` | aria-expanded=true | "Right Arrow: When focus is on a closed node, opens the node." | `ArrowRight on collapsed node: expands` |
| E2 | 🟢 | section-1 expanded | `press("ArrowLeft")` | aria-expanded=false | "Left Arrow: When focus is on an open node, closes the node." | `ArrowLeft on expanded node: collapses` |
| E3 | 🟢 | leaf-1 focused | `press("ArrowRight")` | no expand, focus stays | "ArrowRight on leaf: no children, nothing happens." | `ArrowRight on leaf: does NOT expand` |
| E4 | 🟢 | section-1 expanded | `press("ArrowRight")` | focus moves to child-1a | "Right Arrow: When focus is on an open node, moves focus to first child." | `ArrowRight on an open node: moves focus to first child` |
| E5 | 🟢 | child-1a focused (closed/leaf) | `press("ArrowLeft")` | focus moves to section-1 (parent) | "Left Arrow: When focus is on a child, moves focus to its parent." | `ArrowLeft on a closed or leaf node: moves focus to parent` |

### Selection (Space key)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| S1 | 🟢 | section-1 unselected | `press("Space")` | section-1 selected | "Performs the default action on the focused node." | `Space on item: toggles selection state` |
| S2 | 🟢 | section-1 selected | `press("Space")` | section-1 deselected | (toggle off) | `Space on item: toggles selection state` |

### Activation (Enter key)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| AC1 | 🟢 | leaf-1 focused | `press("Enter")` | no expand (activate only) | "Enter: leaf activation." | `Enter on leaf: does NOT expand` |
| AC2 | 🟢 | section-1 focused | `press("Enter")` | aria-expanded toggles | "Enter on expandable: toggle expand." | `Enter on section: should toggle expand` |

### Click

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| CL1 | 🟢 | section-1 focused | `click("child-1a")` | child-1a focused | click = focus | `click on item: focuses and selects` |
| CL2 | 🟢 | section-1 collapsed, focused | `click("section-1")` | toggles expand | click on expandable = toggle | `click on expandable item: toggles expand` |
| CL3 | 🟢 | section-1 focused | `click("section-2")` | section-2 focused+expanded | click on other expandable | `click on non-focused expandable item: focuses + expands` |
| CL4 | 🟢 | any focused | `click("leaf-1")` | leaf-1 focused, no expand | click on leaf | `click on leaf: focuses, does NOT expand` |

### Multi-Select (Shift+Arrow)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| MS1 | 🟢 | section-1 selected+expanded | `press("Shift+ArrowDown")` | section-1+child-1a selected | "Shift+Down extends selection." | `Shift+ArrowDown: expands selection to next` |
| MS2 | 🟢 | child-1a selected | `press("Shift+ArrowUp")` | child-1a+section-1 selected | "Shift+Up extends selection." | `Shift+ArrowUp: expands selection to previous` |

### Single-Select Negative Tests

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| NEG1 | 🟢 | single-select, section-1 selected | `press("Shift+ArrowDown")` | only 1 selected | single-select: no range | `Shift+ArrowDown: MUST NOT create range selection` |
| NEG2 | 🟢 | single-select | `press("Meta+A")` | <=1 selected | single-select: no select-all | `Ctrl+A: MUST NOT select all in single-select` |
| NEG3 | 🟢 | single-select, section-1 selected | `click("leaf-1", {shift})` | only leaf-1 selected (replace) | single-select enforces replace | `Shift+Click: MUST NOT create range selection` |
| NEG4 | 🟢 | toggle:true, section-1 selected | `click("section-1", {meta})` | section-1 deselected | toggle allows deselect | `Cmd+Click: toggle selection` |
| NEG5 | 🟢 | section-1 selected | navigate multiple times | always <=1 selected | single-select invariant | `navigate always keeps <=1 selected` |

### No Selection (navigation only)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| NS1 | 🟢 | navigate without Space | (assert) | `selection()` empty | navigation alone doesn't select | `assertNoSelection` |

### ARIA Attributes

| # | Signal | Element | Role | Attribute | W3C Wording | Test |
|---|--------|---------|------|-----------|-------------|------|
| A1 | 🟢 | tree item | `treeitem` | — | "Each node in the tree has role treeitem." | `treeitem role is assigned to items` |
| A2 | 🟢 | collapsed node | — | `aria-expanded="false"` | "When node is closed, aria-expanded is false." | `collapsed node: aria-expanded=false` |
| A3 | 🟢 | expanded node | — | `aria-expanded="true"` | "When node is open, aria-expanded is true." | `expanded node: aria-expanded=true` |
| A4 | 🟢 | focused item | — | `tabIndex=0`, others `-1` | roving tabindex | `focused item has tabIndex=0, others have -1` |
| A5 | 🟢 | focused item | — | `data-focused="true"` | OS focus indicator | `focused item has data-focused=true` |
| A6 | ➖ | tree container | `tree` | — | "Container has role tree." | N/A — React rendering |
| A7 | ➖ | tree | — | `aria-label` / `aria-labelledby` | "Tree has an accessible name." | N/A — React rendering |
| A8 | ➖ | treeitem | — | `aria-level` | "Each treeitem has aria-level set." | N/A — React rendering |
| A9 | ➖ | treeitem | — | `aria-setsize` / `aria-posinset` | "Set size and position." | N/A — React rendering |
| A10 | ➖ | group container | `group` | — | "Subtrees in role group." | N/A — React rendering |

## Coverage

```
🟢 28  ➖ 5  🔴 0  total 33
```

| Signal | Count | Rows |
|--------|-------|------|
| 🟢 | 28 | N1-N6, E1-E5, S1-S2, AC1-AC2, CL1-CL4, MS1-MS2, NEG1-NEG5, NS1, A1-A5 |
| ➖ | 5 | A6-A10 |
