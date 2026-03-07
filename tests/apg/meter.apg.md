# APG Meter

> Pattern: [Meter](https://www.w3.org/WAI/ARIA/apg/patterns/meter/)
> Example: [Meter Example](https://www.w3.org/WAI/ARIA/apg/patterns/meter/examples/meter/)
>
> Status: 🟢 9/14 covered | 🔴 0 OS gaps

## Decision Table

> | Signal | Meaning |
> |--------|---------|
> | 🟢 | test exists + passes |
> | ➖ | N/A (browser default, not testable) |

### Navigation

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| N1 | 🟢 | meter-cpu focused | `press("ArrowDown")` | meter-memory focused | vertical list navigation | `ArrowDown moves focus to next meter` |
| N2 | 🟢 | meter-memory focused | `press("ArrowUp")` | meter-cpu focused | vertical list navigation | `ArrowUp moves focus to previous meter` |

### Read-only (no value change)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| RO1 | 🟢 | meter-cpu focused | `press("ArrowUp")` | aria-valuenow unchanged | "meter is not an interactive widget — it is read-only" | `ArrowUp does not change meter value` |
| RO2 | 🟢 | meter-cpu focused | `press("ArrowDown")` | aria-valuenow unchanged | (read-only: navigation keys don't alter value) | `ArrowDown does not change meter value` |

### ARIA Attributes

| # | Signal | Element | Role | Attribute | W3C Wording | Test |
|---|--------|---------|------|-----------|-------------|------|
| A1 | 🟢 | meter element | `meter` | — | "The widget has a role of meter." | `items have role=meter` |
| A2 | 🟢 | meter | — | `aria-valuenow` | "Set to a decimal value representing the current value of the meter." | `initial value is projected as aria-valuenow` |
| A3 | 🟢 | meter | — | `aria-valuemin`, `aria-valuemax` | "Set to a decimal value representing the minimum/maximum value of the meter." | `aria-valuemin and aria-valuemax are projected from config` |
| A4 | 🟢 | meter (focused) | — | `tabIndex=0` | roving tabindex | `focused item has tabIndex=0, others have tabIndex=-1` |
| A5 | 🟢 | meter (focused) | — | `data-focused="true"` | OS focus indicator | `focused item has data-focused=true` |
| A6 | ➖ | meter | — | `aria-label` / `aria-labelledby` | "The meter has an accessible name." | N/A — React rendering |
| A7 | ➖ | meter | — | `aria-valuetext` | "Set when the value is not accurately represented by a number." | N/A — not in showcase |
| A8 | ➖ | meter | — | `aria-describedby` | (additional description) | N/A — React rendering |
| A9 | ➖ | high/low/optimum | — | visual thresholds | "Visual indicator of high/low/optimum." | N/A — CSS rendering |
| A10 | ➖ | meter | — | inner `<title>` or `<text>` | (SVG label for screen readers) | N/A — React rendering |

## Coverage

```
🟢 9  ➖ 5  🔴 0  total 14
```

| Signal | Count | Rows |
|--------|-------|------|
| 🟢 | 9 | N1-N2, RO1-RO2, A1-A5 |
| ➖ | 5 | A6 (label), A7 (valuetext), A8 (describedby), A9 (thresholds), A10 (SVG) |
