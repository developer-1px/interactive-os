# APG Radio Group

> Pattern: [Radio Group](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)
> Example: [Radio Group Example Using Roving tabindex](https://www.w3.org/WAI/ARIA/apg/patterns/radio/examples/radio/)
>
> Status: 🟢 18/22 covered | 🔴 0 OS gaps

## Decision Table

> | Signal | Meaning |
> |--------|---------|
> | 🟢 | test exists + passes |
> | ➖ | N/A (browser default, not testable) |

### Keyboard — Navigation (selection follows focus)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| K1 | 🟢 | radio-regular focused+checked | `press("ArrowDown")` | radio-deep focused+checked, radio-regular unchecked | "Down Arrow: Moves focus to and checks the next radio button in the group." | `ArrowDown moves focus to next radio` |
| K2 | 🟢 | radio-deep focused+checked | `press("ArrowUp")` | radio-regular focused+checked | "Up Arrow: Moves focus to and checks the previous radio button in the group." | `ArrowUp moves focus to previous radio` |
| K3 | 🟢 | radio-thin (last) focused | `press("ArrowDown")` | radio-regular (first) focused | "If focus is on the last radio button, focus moves to the first radio button." (Down wraps) | `ArrowDown at last wraps to first (loop)` |
| K4 | 🟢 | radio-regular (first) focused | `press("ArrowUp")` | radio-thin (last) focused | "If focus is on the first radio button, focus moves to the last radio button." (Up wraps) | `ArrowUp at first wraps to last (loop)` |
| K5 | 🟢 | radio-regular focused+checked | `press("ArrowRight")` | radio-deep focused+checked | "Right Arrow: Moves focus to and checks the next radio button in the group." | `ArrowRight moves focus to next and checks it` |
| K6 | 🟢 | radio-deep focused+checked | `press("ArrowLeft")` | radio-regular focused+checked | "Left Arrow: Moves focus to and checks the previous radio button in the group." | `ArrowLeft moves focus to previous and checks it` |
| K7 | 🟢 | radio-thin (last) focused | `press("ArrowRight")` | radio-regular (first) focused | (Right wraps like Down) | `ArrowRight at last wraps to first (loop)` |
| K8 | 🟢 | radio-regular (first) focused | `press("ArrowLeft")` | radio-thin (last) focused | (Left wraps like Up) | `ArrowLeft at first wraps to last (loop)` |
| K9 | 🟢 | radio-deep focused+checked | `press("Space")` | radio-deep stays checked | "Space: If the radio button with focus is not checked, check it." (already checked = no-op) | `Space checks the focused radio` |

### Selection follows focus (aria-checked)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| S1 | 🟢 | radio-regular checked | `press("ArrowDown")` | radio-deep checked, radio-regular unchecked | selection follows focus | `ArrowDown checks next radio, unchecks previous` |
| S2 | 🟢 | radio-thin checked | `press("ArrowUp")` | radio-deep checked, radio-thin unchecked | selection follows focus | `ArrowUp checks previous radio` |
| S3 | 🟢 | radio-regular checked | `press("ArrowDown")` x2 | exactly 1 checked (radio-thin) | single selection invariant | `only one radio is checked at any time` |

### Never Empty (disallowEmpty)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| NE1 | 🟢 | radio-regular checked | navigate 5 times | exactly 1 checked after each step | disallowEmpty invariant | `always exactly one radio checked after navigation` |

### Click

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| C1 | 🟢 | radio-regular checked | `click("radio-thin")` | radio-thin focused+checked, radio-regular unchecked | click = check | `clicking a radio button checks it and unchecks previous` |

### Tab Entry

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| F1 | 🟢 | radio-deep checked | Tab away + Tab back | radio-deep focused | "Tab: Moves focus to the checked radio button in the radio group." | `entering zone focuses the checked radio (entry: selected)` |

### Negative Tests (enforceMode)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| NEG1 | 🟢 | radio-regular checked | `click("radio-thin", {shift})` | exactly 1 checked | single-select mode: no range select | `Shift+Click does NOT range-select (single mode)` |
| NEG2 | 🟢 | radio-regular checked | `click("radio-regular", {meta})` | radio-regular stays checked | disallowEmpty: cannot toggle off last | `Cmd+Click does NOT deselect last checked (disallowEmpty)` |

### ARIA Attributes

| # | Signal | Element | Role | Attribute | W3C Wording | Test |
|---|--------|---------|------|-----------|-------------|------|
| A1 | 🟢 | radio item | `radio` | `aria-checked` | "Each radio button element has role radio." + "aria-checked set to true/false" | `items have role='radio' projected via check.mode='check'` |
| A2 | 🟢 | checked radio | — | `tabIndex=0` | roving tabindex: checked = 0 | `checked radio has tabIndex 0, others -1` |
| A3 | 🟢 | unchecked radio | — | `tabIndex=-1` | roving tabindex: unchecked = -1 | `checked radio has tabIndex 0, others -1` |
| A4 | ➖ | container | `radiogroup` | — | "The set of radio buttons is contained in or owned by an element with role radiogroup." | N/A — React rendering |
| A5 | ➖ | container | — | `aria-labelledby` / `aria-label` | "The radio group has an accessible name." | N/A — React rendering |
| A6 | ➖ | radio | — | `aria-label` / `aria-labelledby` | "Each radio button has an accessible name." | N/A — React rendering |
| A7 | ➖ | radio (disabled) | — | `aria-disabled="true"` | (disabled state) | N/A — not in showcase |

## Coverage

```
🟢 18  ➖ 4  🔴 0  total 22
```

| Signal | Count | Rows |
|--------|-------|------|
| 🟢 | 18 | K1-K9, S1-S3, NE1, C1, F1, NEG1-NEG2, A1-A3 |
| ➖ | 4 | A4 (radiogroup role), A5 (group label), A6 (radio label), A7 (disabled) |
