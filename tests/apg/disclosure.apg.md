# APG Disclosure (Show/Hide)

> Pattern: [Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)
> Example: [Disclosure (Show/Hide)](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/examples/disclosure-faq/)
>
> Status: 🟢 18/20 covered | 🔴 0 OS gaps

## Decision Table

> | Signal | Meaning |
> |--------|---------|
> | 🟢 | test exists + passes |
> | ➖ | N/A (browser default, not testable) |

### Keyboard

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| K1 | 🟢 | disclosure collapsed, focused | `press("Enter")` | `aria-expanded="true"` | "Enter: activates the disclosure control and toggles the visibility of the disclosure content." | `Enter on collapsed button: expands` |
| K2 | 🟢 | disclosure expanded | `press("Enter")` | `aria-expanded="false"` | (Enter toggles to collapse) | `Enter on expanded button: collapses` |
| K3 | 🟢 | disclosure collapsed, focused | `press("Space")` | `aria-expanded="true"` | "Space: activates the disclosure control and toggles the visibility of the disclosure content." | `Space on collapsed button: expands` |
| K4 | 🟢 | disclosure expanded | `press("Space")` | `aria-expanded="false"` | (Space toggles to collapse) | `Space on expanded button: collapses` |

### Tab Navigation (flow mode)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| T1 | 🟢 | faq-1 focused | `press("Tab")` | `"disc-faq-2" toBeFocused` | disclosure buttons are standard buttons, Tab navigates | `Tab moves focus to next` |
| T2 | 🟢 | faq-2 focused | `press("Shift+Tab")` | `"disc-faq-1" toBeFocused` | Shift+Tab reverses | `Shift+Tab moves to previous` |
| T3 | 🟢 | faq-1 focused, collapsed | `press("Tab")` | faq-1 stays collapsed | Tab only navigates, no toggle | `Tab does NOT toggle expand` |

### Click

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| C1 | 🟢 | faq-2 collapsed | `click("disc-faq-2")` | focused + `aria-expanded="true"` | click = activate | `click on disclosure button: focuses and toggles` |
| C2 | 🟢 | faq-1 expanded | `click("disc-faq-1")` | `aria-expanded="false"` | click toggles off | `click on expanded button: collapses` |
| C3 | 🟢 | faq-1 + faq-2 expanded | `click("disc-faq-1")` | faq-1 collapses, faq-2 stays | independent disclosures | `click does not affect other disclosures` |

### Multiple Independent Sections

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| M1 | 🟢 | faq-1 expanded | expand faq-2 via Enter | both expanded | disclosures are independent | `multiple disclosures expanded independently` |
| M2 | 🟢 | faq-1 + faq-2 expanded | collapse faq-1 via Enter | faq-2 stays expanded | independent state | `collapsing one does not affect others` |

### No Selection

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| NS1 | 🟢 | navigate multiple times | (assert) | `selection()` empty | disclosure is not a selectable pattern | `navigation does not create selection` |

### ARIA Attributes

| # | Signal | Element | Role | Attribute | W3C Wording | Test |
|---|--------|---------|------|-----------|-------------|------|
| A1 | 🟢 | disclosure button | `button` | — | "The element that shows and hides the content has role button." | `items have role=button` |
| A2 | 🟢 | button (collapsed) | — | `aria-expanded="false"` | "When the content area is hidden, it is set to false." | `collapsed button: aria-expanded=false` |
| A3 | 🟢 | button (expanded) | — | `aria-expanded="true"` | "When the content is visible, aria-expanded set to true." | `expanded button: aria-expanded=true` |
| A4 | 🟢 | button (focused) | — | `tabIndex=0` | (focusable) | `focused button: tabIndex=0` |
| A5 | 🟢 | button (focused) | — | `data-focused="true"` | OS focus indicator | `focused button: data-focused=true` |
| A6 | ➖ | button | — | `aria-controls` | "aria-controls refers to the element that contains all the content shown or hidden." | N/A — React rendering |
| A7 | ➖ | button | — | `aria-label` / `aria-labelledby` | (accessible name) | N/A — React rendering |

## Coverage

```
🟢 18  ➖ 2  🔴 0  total 20
```

| Signal | Count | Rows |
|--------|-------|------|
| 🟢 | 18 | K1-K4, T1-T3, C1-C3, M1-M2, NS1, A1-A5 |
| ➖ | 2 | A6 (aria-controls), A7 (aria-label) |
