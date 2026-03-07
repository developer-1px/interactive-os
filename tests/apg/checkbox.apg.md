# APG Checkbox

> Pattern: [Checkbox](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/)
> Example: [Checkbox Example (Two State)](https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/examples/checkbox/)
>
> Status: 🟢 7/12 covered | 🔴 0 OS gaps

## Decision Table

> | Signal | Meaning |
> |--------|---------|
> | 🟢 | test exists + passes |
> | ⬜ | not covered (no test) |
> | ➖ | N/A (browser default, not testable) |

### Keyboard

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| K1 | 🟢 | checkbox unchecked, focused | `press("Space")` | `aria-checked="true"` | "When the checkbox has focus, pressing the Space key changes the state of the checkbox." | `Space on unchecked checkbox: toggles to checked` |
| K2 | 🟢 | checkbox checked | `press("Space")` | `aria-checked="false"` | (Space toggles off) | `Space on checked checkbox: toggles to unchecked` |
| K3 | 🟢 | checkbox unchecked | `press("Enter")` | `aria-checked="false"` (no change) | (Enter does NOT toggle — only Space per W3C) | `Enter on unchecked checkbox: remains unchecked` |

### ARIA Attributes

| # | Signal | Element | Role | Attribute | W3C Wording | Test |
|---|--------|---------|------|-----------|-------------|------|
| A1 | 🟢 | checkbox element | `checkbox` | — | "The checkbox has role checkbox." | `item has role=checkbox` |
| A2 | 🟢 | checkbox (checked) | — | `aria-checked="true"` | "aria-checked set to true: Indicates the checkbox is checked." | `checked checkbox: aria-checked=true` |
| A3 | 🟢 | checkbox (unchecked) | — | `aria-checked="false"` | "aria-checked set to false: Indicates the checkbox is not checked." | `unchecked checkbox: aria-checked=false` |
| A4 | ⬜ | checkbox (mixed) | — | `aria-checked="mixed"` | "aria-checked set to mixed: Indicates the checkbox is partially checked." | — (OS tri-state not yet supported) |
| A5 | 🟢 | checkbox (focused) | — | `tabIndex=0` | roving tabindex | `focused checkbox: tabIndex=0` |
| A6 | ➖ | checkbox | — | `aria-label` / `aria-labelledby` | "Accessible label from visible text content, aria-labelledby, or aria-label." | N/A — React rendering |
| A7 | ➖ | checkbox group | `group` | `aria-labelledby` | "Related checkboxes use role group with aria-labelledby." | N/A — React rendering |
| A8 | ➖ | checkbox | — | `aria-describedby` | "aria-describedby set to the ID of the element containing the description." | N/A — React rendering |
| A9 | ➖ | checkbox (disabled) | — | `aria-disabled="true"` | (disabled state) | N/A — not in showcase |

## Coverage

```
🟢 7  ⬜ 1  ➖ 4  🔴 0  total 12
```

| Signal | Count | Rows |
|--------|-------|------|
| 🟢 | 7 | K1-K3, A1-A3, A5 |
| ⬜ | 1 | A4 (mixed/tri-state) |
| ➖ | 4 | A6, A7, A8, A9 |
