# APG Treegrid

> Pattern: [Treegrid](https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/)
> Example: [Treegrid Email Inbox Example](https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/examples/treegrid-1/)
>
> Status: 🟢 26/32 covered | 🔴 0 OS gaps

## Decision Table

> | Signal | Meaning |
> |--------|---------|
> | 🟢 | test exists + passes |
> | ➖ | N/A (browser default, not testable) |

### Vertical Navigation (Down/Up, no loop, clamp)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| N1 | 🟢 | msg-1 focused | `press("ArrowDown")` | msg-1a focused | "Down Arrow: Moves focus one row down." | `assertVerticalNav` |
| N2 | 🟢 | msg-1a focused | `press("ArrowUp")` | msg-1 focused | "Up Arrow: Moves focus one row up." | `assertVerticalNav` |
| N3 | 🟢 | msg-1 (first) focused | `press("ArrowUp")` | focus stays (clamp) | "Does not wrap." | `assertBoundaryClamp` |
| N4 | 🟢 | msg-3 (last) focused | `press("ArrowDown")` | focus stays (clamp) | (clamp at last) | `assertBoundaryClamp` |
| N5 | 🟢 | any focused | `press("Home")` | msg-1 (first) focused | "Home: Moves focus to first row." | `assertHomeEnd` |
| N6 | 🟢 | any focused | `press("End")` | msg-3 (last) focused | "End: Moves focus to last row." | `assertHomeEnd` |

### Right Arrow — Expand / Navigate to child

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| E1 | 🟢 | msg-1 collapsed | `press("ArrowRight")` | aria-expanded=true, focus stays | "Right Arrow on collapsed row: opens child rows." | `N3: Right Arrow on collapsed parent row -- expands` |
| E2 | 🟢 | msg-1 expanded | `press("ArrowRight")` | focus moves to msg-1a | "Right Arrow on expanded row: moves focus to first child." | `N4: Right Arrow on expanded parent row -- moves to first child` |
| E3 | 🟢 | msg-3 (leaf) focused | `press("ArrowRight")` | nothing happens | "Right Arrow on leaf: does nothing." | `Right Arrow on leaf row -- does nothing` |

### Left Arrow — Collapse / Navigate to parent

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| E4 | 🟢 | msg-1 expanded | `press("ArrowLeft")` | aria-expanded=false | "Left Arrow on expanded row: collapses." | `N5: Left Arrow on expanded parent row -- collapses` |
| E5 | 🟢 | msg-1a (child) focused | `press("ArrowLeft")` | focus moves to msg-1 (parent) | "Left Arrow on child row: moves focus to parent." | `N6: Left Arrow on child row -- moves to parent` |
| E6 | 🟢 | msg-3 (top-level leaf) focused | `press("ArrowLeft")` | focus stays | "No parent to navigate to." | `Left Arrow on top-level leaf -- stays` |

### Enter — Toggle expand

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| EN1 | 🟢 | msg-1 collapsed | `press("Enter")` | aria-expanded=true | "Enter: opens child rows." | `Enter on collapsed parent -- expands` |
| EN2 | 🟢 | msg-1 expanded | `press("Enter")` | aria-expanded=false | "Enter: closes child rows." | `Enter on expanded parent -- collapses` |
| EN3 | 🟢 | msg-3 (leaf) focused | `press("Enter")` | no expand | "Enter on leaf: no children." | `Enter on leaf -- does NOT expand` |

### Selection (Space)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| S1 | 🟢 | msg-1 unselected | `press("Space")` | msg-1 selected | "Space: selects row." | `Space toggles selection on focused row` |
| S2 | 🟢 | msg-1 selected | `press("Space")` | msg-1 deselected | (toggle off) | `Space toggles selection on focused row` |

### Multi-Select (Shift+Arrow)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| MS1 | 🟢 | msg-1 selected | `press("Shift+ArrowDown")` | msg-1+msg-1a selected | "Shift+Arrow: extends selection." | `Shift+ArrowDown extends selection to next row` |
| MS2 | 🟢 | msg-1a selected | `press("Shift+ArrowUp")` | msg-1+msg-1a selected | "Shift+Up extends selection." | `Shift+ArrowUp extends selection to previous row` |

### Click

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| CL1 | 🟢 | msg-1 focused | `click("msg-1a")` | msg-1a focused | click = focus | `click on unfocused row -- focuses it` |
| CL2 | 🟢 | msg-1 focused | `click("msg-2")` | msg-2 focused+expanded | click on expandable = toggle | `click on expandable row -- focuses and toggles expand` |

### No Selection (navigation only)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| NS1 | 🟢 | navigate without Space | (assert) | `selection()` empty | navigation alone doesn't select | `assertNoSelection` |

### ARIA Attributes

| # | Signal | Element | Role | Attribute | W3C Wording | Test |
|---|--------|---------|------|-----------|-------------|------|
| A1 | 🟢 | row item | `row` | — | "Each row has role row." | `A1: items have role=row` |
| A2 | 🟢 | focused row | — | `tabIndex=0`, others `-1` | roving tabindex | `A2: focused item has tabIndex=0, others -1` |
| A3 | 🟢 | focused row | — | `data-focused="true"` | OS focus indicator | `A3: focused item has data-focused=true` |
| A4 | 🟢 | collapsed parent | — | `aria-expanded="false"` | "Collapsed parent: aria-expanded=false." | `A4: collapsed parent -- aria-expanded=false` |
| A5 | 🟢 | expanded parent | — | `aria-expanded="true"` | "Expanded parent: aria-expanded=true." | `A5: expanded parent -- aria-expanded=true` |
| A6 | 🟢 | leaf row | — | no `aria-expanded` | "Leaf row has NO aria-expanded." | `A6: leaf row has NO aria-expanded` |
| A7 | ➖ | treegrid container | `treegrid` | — | "Container has role treegrid." | N/A — React rendering |
| A8 | ➖ | treegrid | — | `aria-label` / `aria-labelledby` | "Treegrid has an accessible name." | N/A — React rendering |
| A9 | ➖ | row | — | `aria-level` | "Each row has aria-level set." | N/A — React rendering |
| A10 | ➖ | row | — | `aria-setsize` / `aria-posinset` | "Set size and position." | N/A — React rendering |
| A11 | ➖ | gridcell | `gridcell` | — | "Cell content in role gridcell." | N/A — cell-level navigation not implemented |
| A12 | ➖ | row (disabled) | — | `aria-disabled="true"` | (disabled state) | N/A — not in showcase |

## Coverage

```
🟢 26  ➖ 6  🔴 0  total 32
```

| Signal | Count | Rows |
|--------|-------|------|
| 🟢 | 26 | N1-N6, E1-E6, EN1-EN3, S1-S2, MS1-MS2, CL1-CL2, NS1, A1-A6 |
| ➖ | 6 | A7-A12 |
