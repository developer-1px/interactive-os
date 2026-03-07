# APG Feed

> Pattern: [Feed](https://www.w3.org/WAI/ARIA/apg/patterns/feed/)
> Example: [Feed Example](https://www.w3.org/WAI/ARIA/apg/patterns/feed/examples/feed/)
>
> Status: 🟢 18/24 covered | 🔴 0 OS gaps

## Decision Table

> | Signal | Meaning |
> |--------|---------|
> | 🟢 | test exists + passes |
> | ➖ | N/A (browser default, not testable) |

### Navigation (Arrow Keys, vertical, no loop, clamp)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| N1 | 🟢 | article-1 focused | `press("ArrowDown")` | article-2 focused | "Down Arrow: Move focus to next article." | `assertVerticalNav` |
| N2 | 🟢 | article-2 focused | `press("ArrowUp")` | article-1 focused | "Up Arrow: Move focus to previous article." | `assertVerticalNav` |
| N3 | 🟢 | article-1 (first) focused | `press("ArrowUp")` | focus stays (clamp) | "No wrap." | `assertBoundaryClamp` |
| N4 | 🟢 | article-5 (last) focused | `press("ArrowDown")` | focus stays (clamp) | (clamp at last) | `assertBoundaryClamp` |
| N5 | 🟢 | any focused | `press("Home")` | article-1 (first) focused | "Home: First article." | `assertHomeEnd` |
| N6 | 🟢 | any focused | `press("End")` | article-5 (last) focused | "End: Last article." | `assertHomeEnd` |

### Page Down / Page Up

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| P1 | 🟢 | article-1 focused | `press("PageDown")` | article-2 focused | "Page Down: Move focus to next article." | `Page Down: moves focus to next article` |
| P2 | 🟢 | article-3 focused | `press("PageUp")` | article-2 focused | "Page Up: Move focus to previous article." | `Page Up: moves focus to previous article` |
| P3 | 🟢 | article-5 (last) focused | `press("PageDown")` | focus stays (no wrap) | "No wrap." | `Page Down at last article: focus stays` |
| P4 | 🟢 | article-1 (first) focused | `press("PageUp")` | focus stays (no wrap) | (clamp at first) | `Page Up at first article: focus stays` |
| P5 | 🟢 | article-1 focused | `press("PageDown")` x3 | article-4 focused | progressive navigation | `Page Down x3: progressive navigation` |
| P6 | 🟢 | article-4 focused | `press("PageUp")` x2 | article-2 focused | back navigation | `Page Up x2: back navigation` |

### Control+End / Control+Home (exit feed)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| EX1 | 🟢 | feed active, article-2 focused | `press("Control+End")` | after-feed zone active | "Control+End: Move focus past the feed." | `Control+End: exits the feed zone forward` |
| EX2 | 🟢 | feed active, article-3 focused | `press("Control+Home")` | before-feed zone active | "Control+Home: Move focus before the feed." | `Control+Home: exits the feed zone backward` |

### Tab Behavior

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| TB1 | 🟢 | feed active | `press("Tab")` | next zone active | "Tab exits the feed." | `Tab: exits the feed zone` |

### No Selection

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| NS1 | 🟢 | navigate multiple times | (assert) | `selection()` empty | feed is read-only, not selectable | `assertNoSelection` |

### ARIA Attributes

| # | Signal | Element | Role | Attribute | W3C Wording | Test |
|---|--------|---------|------|-----------|-------------|------|
| A1 | 🟢 | feed item | `article` | — | "Each unit of content in the feed is contained in an element with role article." | `items have role=article` |
| A2 | 🟢 | focused article | — | `tabIndex=0`, others `-1` | roving tabindex | `focused article: tabIndex=0, others: tabIndex=-1` |
| A3 | 🟢 | focused article | — | `data-focused="true"` | OS focus indicator | `focused article: data-focused=true` |
| A4 | ➖ | feed container | `feed` | — | "Container has role feed." | N/A — React rendering |
| A5 | ➖ | feed | — | `aria-label` / `aria-labelledby` | "Feed has an accessible name." | N/A — React rendering |
| A6 | ➖ | article | — | `aria-posinset` | "Each article has aria-posinset." | N/A — React rendering |
| A7 | ➖ | article | — | `aria-setsize` | "Each article has aria-setsize (or -1 if unknown)." | N/A — React rendering |
| A8 | ➖ | article | — | `aria-labelledby` | "Each article has accessible name." | N/A — React rendering |
| A9 | ➖ | feed | — | `aria-busy` | "aria-busy=true while loading new articles." | N/A — app-level loading |

## Coverage

```
🟢 18  ➖ 6  🔴 0  total 24
```

| Signal | Count | Rows |
|--------|-------|------|
| 🟢 | 18 | N1-N6, P1-P6, EX1-EX2, TB1, NS1, A1-A3 |
| ➖ | 6 | A4-A9 |
