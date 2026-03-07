# APG Carousel

> Pattern: [Carousel](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/)
> Example: [Auto-Rotating Image Carousel (Tabbed)](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/examples/carousel-2-tablist/)
>
> Status: 🟢 21/28 covered | 🔴 0 OS gaps

## Decision Table

> | Signal | Meaning |
> |--------|---------|
> | 🟢 | test exists + passes |
> | ➖ | N/A (browser default, not testable) |

### Navigation (tablist: horizontal, loop)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| N1 | 🟢 | slide-1 focused | `press("ArrowRight")` | slide-2 focused | "Right Arrow: Moves focus to the next tab." | `assertHorizontalNav` |
| N2 | 🟢 | slide-2 focused | `press("ArrowLeft")` | slide-1 focused | "Left Arrow: Moves focus to the previous tab." | `assertHorizontalNav` |
| N3 | 🟢 | slide-6 (last) focused | `press("ArrowRight")` | slide-1 (first) focused | "Wraps from last to first." | `assertLoop` |
| N4 | 🟢 | slide-1 (first) focused | `press("ArrowLeft")` | slide-6 (last) focused | "Wraps from first to last." | `assertLoop` |
| N5 | 🟢 | any focused | `press("Home")` | slide-1 (first) focused | "Home: Moves focus to first tab." | `assertHomeEnd` |
| N6 | 🟢 | any focused | `press("End")` | slide-6 (last) focused | "End: Moves focus to last tab." | `assertHomeEnd` |
| N7 | 🟢 | any focused | `press("ArrowDown")` / `press("ArrowUp")` | focus unchanged | vertical keys ignored in horizontal tablist | `assertOrthogonalIgnored` |

### Auto-Activation (selection follows focus)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| AA1 | 🟢 | slide-1 selected | `press("ArrowRight")` | slide-2 selected, slide-1 deselected | "Automatic activation: slide changes when tab receives focus." | `Right Arrow: newly focused tab becomes selected` |
| AA2 | 🟢 | slide-2 selected | `press("ArrowLeft")` | slide-1 selected | (Left selection follows) | `Left Arrow: previous tab regains selection` |
| AA3 | 🟢 | slide-4 selected | `press("Home")` | slide-1 selected | (Home selection follows) | `Home: first tab becomes selected` |
| AA4 | 🟢 | slide-1 selected | `press("End")` | slide-6 selected | (End selection follows) | `End: last tab becomes selected` |
| AA5 | 🟢 | slide-6 (last) selected | `press("ArrowRight")` | slide-1 selected (wrap) | (wrap + selection follows) | `wrap Right at last tab: first tab becomes selected` |
| AA6 | 🟢 | slide-1 (first) selected | `press("ArrowLeft")` | slide-6 selected (wrap) | (wrap + selection follows) | `wrap Left at first tab: last tab becomes selected` |

### Always-Selected (disallowEmpty)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| AE1 | 🟢 | slide-1 selected | navigate 2 times | exactly 1 selected after each | disallowEmpty invariant | `exactly one tab is always selected` |
| AE2 | 🟢 | slide-1 selected | navigate through all slides | exactly 1 selected at every step | full cycle invariant | `navigating through all slides: always exactly one selected` |

### Click

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| CL1 | 🟢 | slide-1 focused | `click("slide-3")` | slide-3 focused | click = focus | `click on unfocused tab: focuses it` |
| CL2 | 🟢 | slide-1 selected | `click("slide-4")` | slide-4 selected, slide-1 deselected | click = select | `click on tab: selects it` |
| CL3 | 🟢 | slide-1 selected | `click("slide-1")` | slide-1 stays selected | disallowEmpty: can't deselect | `click on already-selected tab: stays selected` |

### ARIA Attributes

| # | Signal | Element | Role | Attribute | W3C Wording | Test |
|---|--------|---------|------|-----------|-------------|------|
| A1 | 🟢 | slide tab | `tab` | — | "Each slide picker element has role tab." | `items have role=tab` |
| A2 | 🟢 | active tab | — | `aria-selected="true"` | "Active tab: aria-selected=true." | `active tab: aria-selected=true` |
| A3 | 🟢 | inactive tab | — | `aria-selected="false"` | "Inactive tab: aria-selected=false." | `inactive tabs: aria-selected=false` |
| A4 | 🟢 | focused tab | — | `tabIndex=0` | roving tabindex | `focused tab: tabIndex=0` |
| A5 | 🟢 | unfocused tab | — | `tabIndex=-1` | roving tabindex | `unfocused tabs: tabIndex=-1` |
| A6 | 🟢 | focused tab | — | `data-focused="true"` | OS focus indicator | `focused tab: data-focused=true` |
| A7 | ➖ | carousel container | `region` | `aria-roledescription="carousel"` | "Container has role region with aria-roledescription." | N/A — React rendering |
| A8 | ➖ | carousel | — | `aria-label` | "Carousel has an accessible name." | N/A — React rendering |
| A9 | ➖ | tablist | `tablist` | — | "Slide picker has role tablist." | N/A — React rendering |
| A10 | ➖ | slide panel | `tabpanel` | `aria-roledescription="slide"` | "Each slide has role tabpanel with aria-roledescription." | N/A — React rendering |
| A11 | ➖ | rotation control | `button` | `aria-label` | "Rotation button with appropriate label." | N/A — app-level button |
| A12 | ➖ | carousel | — | `aria-live` | "aria-live=off when rotating, polite when stopped." | N/A — app-level rotation |
| A13 | ➖ | tab | — | `aria-controls` | "Each tab references its slide panel." | N/A — React rendering |

## Coverage

```
🟢 21  ➖ 7  🔴 0  total 28
```

| Signal | Count | Rows |
|--------|-------|------|
| 🟢 | 21 | N1-N7, AA1-AA6, AE1-AE2, CL1-CL3, A1-A6 |
| ➖ | 7 | A7-A13 |
