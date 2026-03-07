# APG Button

> Pattern: [Button](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
> Example: [Button Examples](https://www.w3.org/WAI/ARIA/apg/patterns/button/examples/button/)
>
> Status: 🟢 18/20 covered | 🔴 0 OS gaps

## Decision Table

> W3C 원문 워딩을 Given/When/Then으로 쪼갠다.
> 각 행 = `it()` 1개. Setup은 Playwright API로 기술한다.
>
> | Signal | Meaning |
> |--------|---------|
> | 🟢 | test exists + passes |
> | 🔴 | test exists + fails |
> | ⬜ | not covered (no test) |
> | ➖ | N/A (browser default, not testable) |

### Keyboard — Action Button

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| K1 | 🟢 | action button focused | `press("Enter")` | action fires | "Enter: Activates the button." | `Enter activates the action button` |
| K2 | 🟢 | action button focused | `press("Space")` | action fires | "Space: Activates the button." | `Space activates the action button` |

### Keyboard — Toggle Button

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| TK1 | 🟢 | toggle unpressed | `press("Space")` | `aria-pressed="true"` | "Space: Activates the button." (toggle variant) | `Space on unpressed toggle: toggles to pressed` |
| TK2 | 🟢 | toggle pressed | `press("Space")` | `aria-pressed="false"` | (toggle off) | `Space on pressed toggle: toggles to unpressed` |
| TK3 | 🟢 | toggle unpressed | `press("Space")` ×3 | alternates true/false/true | (multiple toggles) | `Space toggles multiple times correctly` |
| TK4 | 🟢 | toggle unpressed | `press("Enter")` | `aria-pressed="true"` | "Enter: Activates the button." (toggle variant) | `Enter on unpressed toggle: toggles to pressed` |
| TK5 | 🟢 | toggle pressed | `press("Enter")` | `aria-pressed="false"` | (toggle off via Enter) | `Enter on pressed toggle: toggles to unpressed` |

### Click

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| C1 | 🟢 | action button focused | `click("btn-print")` | action fires | click = activate | `click activates the action button` |
| C2 | 🟢 | toggle unpressed | `click("toggle-bold")` | `aria-pressed="true"` | click = toggle | `click on unpressed toggle: toggles to pressed` |
| C3 | 🟢 | toggle pressed | `click("toggle-bold")` | `aria-pressed="false"` | click = toggle off | `click on pressed toggle: toggles to unpressed` |

### ARIA Attributes

> Pattern's "WAI-ARIA Roles, States, and Properties" section.

| # | Signal | Element | Role | Attribute | W3C Wording | Test |
|---|--------|---------|------|-----------|-------------|------|
| A1 | 🟢 | button (toggle) | `button` | — | "The button has role of button." | `toggle button has role=button` |
| A2 | 🟢 | button (action) | `button` | — | "The button has role of button." | `action button has role=button` |
| A3 | 🟢 | button (toggle, off) | — | `aria-pressed="false"` | "aria-pressed: false when toggled off" | `unpressed toggle: aria-pressed=false` |
| A4 | 🟢 | button (toggle, on) | — | `aria-pressed="true"` | "aria-pressed: true when toggled on" | `pressed toggle: aria-pressed=true` |
| A5 | 🟢 | button (action) | — | no `aria-pressed` | action buttons don't use aria-pressed | `action button does NOT have aria-pressed` |
| A6 | 🟢 | button (toggle) | — | no `aria-checked` | toggle uses aria-pressed, not aria-checked | `toggle button does NOT have aria-checked` |
| A7 | 🟢 | button (focused) | — | `tabIndex=0` | roving tabindex | `focused button: tabIndex=0` |
| A8 | 🟢 | button (focused) | — | `data-focused="true"` | OS focus indicator | `focused button: data-focused=true` |
| A9 | ➖ | button | — | `aria-label` / `aria-labelledby` | "The accessible name is computed from any text content inside the button element." | N/A — React rendering |
| A10 | ➖ | button (disabled) | — | `aria-disabled="true"` | "aria-disabled set to true when unavailable" | N/A — disabled state not in showcase |

## Coverage

```
🟢 18  ⬜ 0  ➖ 2  🔴 0  total 20
```

| Signal | Count | Rows |
|--------|-------|------|
| 🟢 | 18 | K1-K2, TK1-TK5, C1-C3, A1-A8 |
| ➖ | 2 | A9 (aria-label), A10 (aria-disabled) |
