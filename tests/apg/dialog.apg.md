# APG Dialog (Modal)

> Pattern: [Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
> Example: [Modal Dialog Example](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/examples/dialog/)
>
> Status: 🟢 9/15 covered | 🔴 0 OS gaps

## Decision Table

> | Signal | Meaning |
> |--------|---------|
> | 🟢 | test exists + passes |
> | ➖ | N/A (browser default, not testable) |

### Focus Trap (Tab cycling)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| FT1 | 🟢 | save-btn (last) focused | `press("Tab")` | close-btn (first) focused | "Tab: wraps to first focusable element." | `assertTabTrap` |
| FT2 | 🟢 | close-btn (first) focused | `press("Shift+Tab")` | save-btn (last) focused | "Shift+Tab: wraps to last focusable element." | `assertTabTrap` |
| FT3 | 🟢 | close-btn focused | Tab x4 full cycle | returns to close-btn, zone stays active | "Tab cycles through all elements without escaping." | `Tab cycles through all elements without escaping` |

### Dismiss (Escape)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| D1 | 🟢 | dialog open | `press("Escape")` | dialog zone deactivated | "Escape: Closes the dialog." | `assertEscapeClose` |

### Focus Restore (STACK)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| FR1 | 🟢 | dialog open, toolbar invoker | stack pop | focus returns to edit-btn in toolbar | "When dialog closes, focus returns to the element that invoked it." | `on close, focus restores to invoker` |
| FR2 | 🟢 | nested dialogs (toolbar → d1 → d2) | pop d2 then pop d1 | LIFO: d1 active, then toolbar active | "Nested dialogs: LIFO focus restore." | `nested dialogs: LIFO focus restore` |

### ARIA Attributes

| # | Signal | Element | Role | Attribute | W3C Wording | Test |
|---|--------|---------|------|-----------|-------------|------|
| A1 | 🟢 | focused item | — | `tabIndex=0` | roving tabindex within dialog | (verified via Tab cycle) |
| A2 | 🟢 | focused item | — | zone stays active | focus trap integrity | (verified via Tab cycle) |
| A3 | 🟢 | dialog active | — | `activeZoneId()` | zone lifecycle | (verified via Escape/restore tests) |
| A4 | ➖ | dialog container | `dialog` | — | "Container has role dialog." | N/A — React rendering |
| A5 | ➖ | dialog | — | `aria-modal="true"` | "aria-modal=true for modal dialogs." | N/A — React rendering |
| A6 | ➖ | dialog | — | `aria-label` / `aria-labelledby` | "Dialog has an accessible name." | N/A — React rendering |
| A7 | ➖ | dialog | — | `aria-describedby` | "Optional description." | N/A — React rendering |
| A8 | ➖ | initial focus | — | auto-focus on open | "Focus moves to an element inside the dialog." | N/A — app-level initial focus |
| A9 | ➖ | background | — | inert/aria-hidden | "Elements outside the dialog are inert." | N/A — React rendering |

## Coverage

```
🟢 9  ➖ 6  🔴 0  total 15
```

| Signal | Count | Rows |
|--------|-------|------|
| 🟢 | 9 | FT1-FT3, D1, FR1-FR2, A1-A3 |
| ➖ | 6 | A4-A9 |
