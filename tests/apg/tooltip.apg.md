# APG Tooltip

> Pattern: [Tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/)
> Example: [Tooltip Example](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/examples/tooltip/)
>
> Status: 🟢 14/18 covered | 🔴 0 OS gaps

## Decision Table

> | Signal | Meaning |
> |--------|---------|
> | 🟢 | test exists + passes |
> | ➖ | N/A (browser default, not testable) |

### Navigation (toolbar context)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| N1 | 🟢 | btn-cut focused | `press("ArrowRight")` | btn-copy focused | horizontal toolbar navigation | `assertHorizontalNav` |
| N2 | 🟢 | btn-copy focused | `press("ArrowLeft")` | btn-cut focused | horizontal toolbar navigation | `assertHorizontalNav` |
| N3 | 🟢 | btn-cut focused | `press("Home")` | btn-cut focused (first) | Home jumps to first | `assertHomeEnd` |
| N4 | 🟢 | any focused | `press("End")` | btn-italic focused (last) | End jumps to last | `assertHomeEnd` |
| N5 | 🟢 | btn-italic (last) focused | `press("ArrowRight")` | btn-cut (first) focused, tooltip moves | loop wrap right | `ArrowRight at last item: wraps to first (tooltip moves)` |
| N6 | 🟢 | btn-cut (first) focused | `press("ArrowLeft")` | btn-italic (last) focused, tooltip moves | loop wrap left | `ArrowLeft at first item: wraps to last (tooltip moves)` |

### Tooltip Visibility (data-focused driven)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| V1 | 🟢 | btn-cut focused | (assert) | `data-focused="true"` | "The tooltip element is displayed when the element that triggers it receives focus." | `focused item has data-focused=true (tooltip should be visible)` |
| V2 | 🟢 | btn-cut focused | (assert others) | other items have no data-focused | "Tooltip is not visible when trigger does not have focus." | `unfocused items have no data-focused (tooltip should be hidden)` |
| V3 | 🟢 | btn-cut focused | `press("ArrowRight")` | btn-cut loses data-focused, btn-copy gains it | focus transfer = tooltip transfer | `moving focus: old item loses data-focused, new item gains it` |
| V4 | 🟢 | btn-cut focused | navigate through all | exactly 1 data-focused at any time | single tooltip visible | `each button only has data-focused when it is the focused item` |

### Escape Dismisses

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| E1 | 🟢 | btn-cut focused, tooltip visible | `press("Escape")` | activeZone=null, data-focused removed | "Escape: Dismisses the Tooltip." | `Escape: exits zone (no active zone, no data-focused, tooltip hidden)` |

### No Selection

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| NS1 | 🟢 | navigate multiple times | (assert) | `selection()` empty | tooltip toolbar is not selectable | `assertNoSelection` |

### ARIA Attributes

| # | Signal | Element | Role | Attribute | W3C Wording | Test |
|---|--------|---------|------|-----------|-------------|------|
| A1 | 🟢 | trigger button | `button` | — | toolbar child role | `items have role=button (toolbar child role)` |
| A2 | 🟢 | trigger (focused) | — | `tabIndex=0` | roving tabindex | `focused item: tabIndex=0, others: tabIndex=-1` |
| A3 | ➖ | tooltip element | `tooltip` | — | "The element that serves as the tooltip has role tooltip." | N/A — CSS-driven display |
| A4 | ➖ | trigger | — | `aria-describedby` | "The element that triggers the tooltip references the tooltip with aria-describedby." | N/A — React rendering |
| A5 | ➖ | tooltip | — | hover display | "The tooltip is displayed when the trigger receives hover." | N/A — not testable headless |
| A6 | ➖ | tooltip | — | delay/persistence | "1-5 second delay, persistent on hover." | N/A — CSS timing |

## Coverage

```
🟢 14  ➖ 4  🔴 0  total 18
```

| Signal | Count | Rows |
|--------|-------|------|
| 🟢 | 14 | N1-N6, V1-V4, E1, NS1, A1-A2 |
| ➖ | 4 | A3 (tooltip role), A4 (aria-describedby), A5 (hover), A6 (delay) |
