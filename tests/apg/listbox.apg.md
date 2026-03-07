# APG Listbox

> Pattern: [Listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/)
> Example 1: [Scrollable Listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-scrollable/) (single-select, followFocus)
> Example 2: [Listbox with Rearrangeable Options](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-rearrangeable/) (single + multi)
>
> Status: 🟢 34/39 covered | 🔴 0 OS gaps

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

### Keyboard — Single-Select (followFocus)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| K1 | 🟢 | `click("apple")` — focused | `press("ArrowDown")` | `"banana" toBeFocused`, `aria-selected="true"` | "Moves focus to and selects the next option." | `ArrowDown: moves to next + selects` |
| K2 | 🟢 | `click("apple")` — focused | `press("ArrowUp")` | `"apple" toBeFocused` (clamped, first) | "Moves focus to and selects the previous option." | `ArrowUp at first: clamp` |
| K3 | 🟢 | `click("cherry")` | `press("ArrowUp")` | `"banana" toBeFocused`, `aria-selected="true"` | "Moves focus to and selects the previous option." | `ArrowUp: moves to prev + selects` |
| K4 | 🟢 | `click("elderberry")` — last | `press("ArrowDown")` | `"elderberry" toBeFocused` (clamped, last) | (boundary: does nothing at last) | `ArrowDown at last: clamp` |
| K5 | 🟢 | `click("cherry")` | `press("Home")` | `"apple" toBeFocused`, `aria-selected="true"` | "Moves focus to and selects the first option." | `Home: first + selects` |
| K6 | 🟢 | `click("banana")` | `press("End")` | `"elderberry" toBeFocused`, `aria-selected="true"` | "Moves focus to and selects the last option." | `End: last + selects` |
| K7 | ➖ | — | `press("Tab")` | browser default | "Moves focus into and out of the listbox." | N/A — browser Tab sequence |

### Keyboard — Multi-Select (recommended model)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| MK1 | 🟢 | `click("apple")`, multi-select setup | `press("ArrowDown")` | `"banana" toBeFocused`, `aria-selected="false"` | "Moves focus to the next option." (no selection change) | `ArrowDown: moves focus without selection` |
| MK2 | 🟢 | `click("banana")`, Space to select | `press("Space")` | `"banana" aria-selected="true"` | "Changes the selection state of the focused option." | `Space: toggles selection` |
| MK3 | 🟢 | MK2 then Space again | `press("Space")` | `"banana" aria-selected="false"` | (Space toggles — deselect) | `Space: deselects already-selected` |
| MK4 | 🟢 | `click("banana")` | `press("Shift+ArrowDown")` | `"cherry" toBeFocused`, both `"banana"` and `"cherry"` selected | "Moves focus to and selects the next option." (Shift+Down) | `Shift+Down: extends selection range` |
| MK5 | 🟢 | `click("cherry")` | `press("Shift+ArrowUp")` | `"banana" toBeFocused`, both selected | "Moves focus to and selects the previous option." (Shift+Up) | `Shift+Up: extends selection backward` |
| MK6 | 🟢 | `click("banana")`, ArrowDown×2 | `click("date", {shift})` | banana, cherry, date all selected | "Selects contiguous items from the most recently selected item to the focused item." (Shift+Space / Shift+Click) | `Shift+Space/Click: range select` |
| MK7 | 🟢 | `click("apple")`, Shift+Down×3 | (assert) | apple, banana, cherry, date selected; elderberry not | (progressive range) | `Shift+Down×3: progressive range` |
| MK8 | 🟢 | MK7 then Shift+Up | (assert) | apple, banana, cherry selected; date deselected | (shrink range) | `Shift+Down then Shift+Up: shrinks range` |
| MK9 | ⬜ | multi-select, cherry focused | `press("Ctrl+Shift+Home")` | cherry, banana, apple all selected | "Selects from the focused option to the beginning of the list." | — |
| MK10 | ⬜ | multi-select, cherry focused | `press("Ctrl+Shift+End")` | cherry, date, elderberry all selected | "Selects from the focused option to the end of the list." | — |
| MK11 | 🟢 | single-select | `press("Meta+A")` | selection stays at 1 | "Selects all options in the list." (single: no-op) | `Ctrl+A: no-op in single-select` |

### Click

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| C1 | 🟢 | single-select | `click("banana")` | `"banana" toBeFocused`, `aria-selected="true"` | W3C Example JS: click selects | (covered by setup helper) |
| C2 | 🟢 | single-select, banana selected | `click("elderberry", {shift})` | only elderberry selected (replace, not range) | single-select: Shift+Click = replace | `Shift+Click: no range in single-select` |
| C3 | 🟢 | single-select, banana selected | `click("cherry", {meta})` | only cherry selected (replace, not toggle) | single-select: Cmd+Click = replace | `Cmd+Click: no toggle in single-select` |
| C4 | 🟢 | single-select, apple selected | `click("apple", {meta})` | apple still selected | single-select: can't deselect | `Cmd+Click on selected: stays selected` |

### Initial State

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| I1 | 🟢 | single, no prior selection | `press("ArrowDown")` | `"apple" toBeFocused`, `tabIndex=0` | "If none selected, first option receives focus." | `single: focus goes to first` |
| I2 | 🟢 | multi, no prior selection | `press("ArrowDown")` | `"apple" toBeFocused`, `aria-selected="false"` | "Focus first, no auto-select in multi." | `multi: focus first, no select` |

### Single-Select Invariants (Negative Tests)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| N1 | 🟢 | single, apple selected | `press("Shift+ArrowDown")` | selection length = 1, focus moved | "No more than one option selected if aria-multiselectable is not true." | `Shift+ArrowDown: no range in single` |
| N2 | 🟢 | single, cherry selected | `press("Shift+ArrowUp")` | selection length = 1 | (same invariant) | `Shift+ArrowUp: no range in single` |
| N3 | 🟢 | single, apple selected | `press("Space")` | apple still selected | single: Space = replace(self) | `Space on selected: stays selected` |
| N4 | 🟢 | single, navigate multiple times | (assert) | selection length = 1 at all times | followFocus invariant | `navigate keeps exactly 1 selected` |

### Multi-Select Invariants (Negative Tests)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| MN1 | 🟢 | multi, apple selected | `press("ArrowDown")` | apple stays selected, banana NOT selected | "Down Arrow moves focus without changing selection state." | `ArrowDown: no selection change in multi` |
| MN2 | 🟢 | multi, no selection | (assert all) | all items `aria-selected="false"` | "All selectable but not selected have aria-selected set to false." | `non-selected: aria-selected=false` |

### Horizontal Orientation

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| H1 | 🟢 | horizontal, apple focused | `press("ArrowRight")` | `"banana" toBeFocused`, `aria-selected="true"` | "aria-orientation horizontal: Right Arrow = Down Arrow equivalent" | `Right Arrow: next + select` |
| H2 | 🟢 | horizontal, cherry focused | `press("ArrowLeft")` | `"banana" toBeFocused` | Left Arrow = Up Arrow equivalent | `Left Arrow: prev` |
| H3 | 🟢 | horizontal | `press("ArrowDown")` / `press("ArrowUp")` | no-op | orthogonal axis ignored | `orthogonal ignored` |

### ARIA Attributes

> Example's "Role, Property, State, and Tabindex Attributes" table.

| # | Signal | Element | Role | Attribute | W3C Wording | Test |
|---|--------|---------|------|-----------|-------------|------|
| A1 | 🟢 | li (option) | `option` | — | "Identifies each selectable element containing the name of an option." | `items have role=option` |
| A2 | 🟢 | li (focused) | — | `tabIndex=0`, others `-1` | roving tabindex pattern | `focused: tabIndex=0, others: -1` |
| A3 | 🟢 | li (selected) | — | `aria-selected="true"` | "Applied to elements with role option that are visually styled as selected." | `selected: aria-selected=true` |
| A4 | 🟢 | li (not selected) | — | `aria-selected="false"` | "All options that are selectable but not selected have aria-selected set to false." | `non-selected: aria-selected=false` |
| A5 | 🟢 | li (focused) | — | `data-focused="true"` | OS convention for visual focus indicator | `focused: data-focused=true` |
| A6 | ➖ | ul (listbox) | `listbox` | — | "Identifies the focusable element that has listbox behaviors." | N/A — OS auto |
| A7 | ➖ | ul (listbox) | — | `aria-labelledby` | "Refers to the element containing the listbox label." | N/A — React rendering |
| A8 | ➖ | ul (multi-select) | — | `aria-multiselectable="true"` | "Tells assistive technologies that the list supports multiple selection." | N/A — React rendering |

## Coverage

```
🟢 34  ⬜ 2  ➖ 4  🔴 0  total 40
```

| Signal | Count | Rows |
|--------|-------|------|
| 🟢 | 34 | K1-K6, MK1-MK8, MK11, C1-C4, I1-I2, N1-N4, MN1-MN2, H1-H3, A1-A5 |
| ⬜ | 2 | MK9 (Ctrl+Shift+Home), MK10 (Ctrl+Shift+End) |
| ➖ | 4 | K7 (Tab), A6 (listbox role), A7 (aria-labelledby), A8 (aria-multiselectable) |

## Example Source

### JavaScript (Scrollable Listbox)

```js
'use strict';

class ListboxScrollable {
  constructor(listboxNode) {
    this.listboxNode = listboxNode;
    this.activeDescendant = this.listboxNode.getAttribute('aria-activedescendant');
    this.multiselectable = this.listboxNode.hasAttribute('aria-multiselectable');
    this.moveUpDownEnabled = false;
    this.siblingList = null;
    this.upButton = null;
    this.downButton = null;
    this.moveButton = null;
    this.keysSoFar = '';
    this.handleFocusChange = function () {};
    this.handleItemChange = function () {};
    this.registerEvents();
  }

  registerEvents() {
    this.listboxNode.addEventListener('focus', this.setupFocus.bind(this));
    this.listboxNode.addEventListener('keydown', this.checkKeyPress.bind(this));
    this.listboxNode.addEventListener('click', this.checkClickItem.bind(this));
  }

  setupFocus() {
    if (this.activeDescendant) return;
    this.focusFirstItem();
  }

  focusFirstItem() {
    var firstItem = this.listboxNode.querySelector('[role="option"]');
    if (firstItem) {
      this.focusItem(firstItem);
    }
  }

  focusLastItem() {
    var itemList = this.listboxNode.querySelectorAll('[role="option"]');
    if (itemList.length) {
      this.focusItem(itemList[itemList.length - 1]);
    }
  }

  checkKeyPress(evt) {
    var key = evt.key;
    var lastActiveId = this.activeDescendant;
    var allOptions = this.listboxNode.querySelectorAll('[role="option"]');
    var currentItem = document.getElementById(this.activeDescendant);

    switch (key) {
      case 'ArrowUp':
      case 'ArrowDown':
        evt.preventDefault();
        if (key === 'ArrowUp') {
          this.focusPreviousItem(currentItem);
        } else {
          this.focusNextItem(currentItem);
        }
        // followFocus: auto-select in single-select
        if (!this.multiselectable && this.activeDescendant !== lastActiveId) {
          this.toggleSelectItem(document.getElementById(this.activeDescendant));
        }
        break;
      case 'Home':
        evt.preventDefault();
        this.focusFirstItem();
        if (!this.multiselectable) {
          this.toggleSelectItem(document.getElementById(this.activeDescendant));
        }
        break;
      case 'End':
        evt.preventDefault();
        this.focusLastItem();
        if (!this.multiselectable) {
          this.toggleSelectItem(document.getElementById(this.activeDescendant));
        }
        break;
      case ' ':
        evt.preventDefault();
        this.toggleSelectItem(currentItem);
        break;
      default:
        // typeahead
        break;
    }
  }

  focusItem(element) {
    this.activeDescendant = element.id;
    this.listboxNode.setAttribute('aria-activedescendant', element.id);
    this.handleFocusChange(element);
  }

  focusPreviousItem(currentItem) {
    var prev = currentItem.previousElementSibling;
    if (prev) this.focusItem(prev);
  }

  focusNextItem(currentItem) {
    var next = currentItem.nextElementSibling;
    if (next) this.focusItem(next);
  }

  toggleSelectItem(element) {
    if (this.multiselectable) {
      element.setAttribute('aria-selected',
        element.getAttribute('aria-selected') === 'true' ? 'false' : 'true');
    } else {
      // single-select: deselect all, select this one
      this.clearSelection();
      element.setAttribute('aria-selected', 'true');
    }
  }

  clearSelection() {
    var items = this.listboxNode.querySelectorAll('[role="option"]');
    items.forEach(function (item) {
      item.removeAttribute('aria-selected');
    });
  }

  checkClickItem(evt) {
    if (evt.target.getAttribute('role') === 'option') {
      this.focusItem(evt.target);
      this.toggleSelectItem(evt.target);
    }
  }
}

window.addEventListener('load', function () {
  var defined = document.querySelectorAll('[role="listbox"]');
  for (var i = 0; i < defined.length; i++) {
    new ListboxScrollable(defined[i]);
  }
});
```
