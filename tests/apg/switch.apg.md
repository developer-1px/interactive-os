# APG Switch

> Pattern: [Switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/)
> Example: [Switch Example](https://www.w3.org/WAI/ARIA/apg/patterns/switch/examples/switch/)
>
> Status: 🟢 14/17 covered | 🔴 0 OS gaps

## Decision Table

> | Signal | Meaning |
> |--------|---------|
> | 🟢 | test exists + passes |
> | ➖ | N/A (browser default, not testable) |

### Keyboard

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| K1 | 🟢 | switch unchecked, focused | `press("Space")` | `aria-checked="true"` | "Space: When focus is on the switch, changes the state of the switch." | `Space on unchecked switch: toggles to checked` |
| K2 | 🟢 | switch checked | `press("Space")` | `aria-checked="false"` | (toggle off) | `Space on checked switch: toggles to unchecked` |
| K3 | 🟢 | switch unchecked | `press("Space")` ×3 | alternates true/false/true | (multiple toggles) | `Space toggles multiple times correctly` |
| K4 | 🟢 | switch unchecked, focused | `press("Enter")` | `aria-checked="true"` | "Enter (Optional): When focus is on the switch, changes the state of the switch." | `Enter on unchecked switch: toggles to checked` |
| K5 | 🟢 | switch checked | `press("Enter")` | `aria-checked="false"` | (toggle off via Enter) | `Enter on checked switch: toggles to unchecked` |

### Click

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| C1 | 🟢 | switch unchecked | `click("switch-notifications")` | `aria-checked="true"` | click = toggle | `click on unchecked switch: toggles to checked` |
| C2 | 🟢 | switch checked | `click("switch-notifications")` | `aria-checked="false"` | click = toggle off | `click on checked switch: toggles to unchecked` |

### ARIA Attributes

| # | Signal | Element | Role | Attribute | W3C Wording | Test |
|---|--------|---------|------|-----------|-------------|------|
| A1 | 🟢 | switch element | `switch` | — | "The switch has role switch." | `item has role=switch` |
| A2 | 🟢 | switch (off) | — | `aria-checked="false"` | "aria-checked set to false: Indicates the switch is off." | `unchecked switch: aria-checked=false` |
| A3 | 🟢 | switch (on) | — | `aria-checked="true"` | "aria-checked set to true: Indicates the switch is on." | `checked switch: aria-checked=true` |
| A4 | 🟢 | switch (focused) | — | `tabIndex=0` | roving tabindex | `focused switch: tabIndex=0` |
| A5 | 🟢 | switch (focused) | — | `data-focused="true"` | OS focus indicator | `focused switch: data-focused=true` |
| A6 | ➖ | switch | — | `aria-label` / `aria-labelledby` | "A visible label referenced by aria-labelledby." | N/A — React rendering |
| A7 | ➖ | switch group | `group` | `aria-labelledby` | "Either use group role with aria-labelledby or fieldset with legend." | N/A — React rendering |
| A8 | ➖ | switch | — | `aria-describedby` | "aria-describedby when additional context is needed." | N/A — React rendering |

## Coverage

```
🟢 14  ➖ 3  🔴 0  total 17
```

| Signal | Count | Rows |
|--------|-------|------|
| 🟢 | 14 | K1-K5, C1-C2, A1-A5 |
| ➖ | 3 | A6 (aria-label), A7 (group), A8 (aria-describedby) |
