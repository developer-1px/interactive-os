# APG Tabs (Manual Activation)

> Pattern: [Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
> Example: [Tabs with Manual Activation](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-manual/)
>
> Status: 🟢 15/22 covered | 🔴 2 OS gaps

## Decision Table

> W3C Example page tables + Example code implicit behavior.
> Each row = `it()` 1. Setup is Playwright API.
>
> | Signal | Meaning |
> |--------|---------|
> | 🟢 | test exists + passes |
> | 🔴 | test exists + fails |
> | ⬜ | not covered (no test) |
> | ➖ | N/A (browser default, React rendering layer) |

### Keyboard

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| K1 | 🟢 | `click("#tab-ahlefeldt")` | `press("ArrowRight")` | `"#tab-andersen" toBeFocused`, `aria-selected="false"` (focus only) | "Moves focus to the next tab. Does not activate the newly focused tab." | `ArrowRight: next tab focus only` |
| K2 | 🟢 | `click("#tab-lange-muller")` — last tab | `press("ArrowRight")` | `"#tab-ahlefeldt" toBeFocused` | "If focus is on the last tab, moves focus to the first tab." | `ArrowRight at last: wrap to first` |
| K3 | 🟢 | `click("#tab-andersen")` | `press("ArrowLeft")` | `"#tab-ahlefeldt" toBeFocused`, `aria-selected="false"` (focus only) | "Moves focus to the previous tab. Does not activate the newly focused tab." | `ArrowLeft: prev tab focus only` |
| K4 | 🟢 | `click("#tab-ahlefeldt")` — first tab | `press("ArrowLeft")` | `"#tab-lange-muller" toBeFocused` | "If focus is on the first tab, moves focus to the last tab." | `ArrowLeft at first: wrap to last` |
| K5 | 🟢 | `click("#tab-lange-muller")` | `press("Home")` | `"#tab-ahlefeldt" toBeFocused` | "Moves focus to the first tab." | `Home: first tab focus only` |
| K6 | 🟢 | `click("#tab-ahlefeldt")` | `press("End")` | `"#tab-lange-muller" toBeFocused` | "Moves focus to the last tab." | `End: last tab focus only` |
| K7 | 🟢 | `click("#tab-andersen")`, `press("ArrowRight")` | `press("Enter")` | `"#tab-fonseca" aria-selected="true"` | "Activates the tab that has focus." | `Enter: activates focused tab` |
| K8 | 🟢 | `click("#tab-andersen")`, `press("ArrowRight")` | `press(" ")` | `"#tab-fonseca" aria-selected="true"` | "Activates the tab that has focus." | `Space: activates focused tab` |
| K9 | ➖ | — | `press("Tab")` | browser default — focus into tablist on active tab, then to tabpanel | "When focus moves into the tab list, places focus on the active tab element. When the tab list contains the focus, moves focus to the next element in the tab sequence, which is the tabpanel element." | N/A — browser Tab sequence |

### Click

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| C1 | 🟢 | (no focus) | `click("#tab-andersen")` | `"#tab-andersen" toBeFocused`, `aria-selected="true"` | W3C Example JS: `tab.addEventListener('click', this.onClick.bind(this))` | `click on tab: focuses and selects` |
| C2 | 🟢 | `click("#tab-ahlefeldt")` — selected | `click("#tab-ahlefeldt")` | `aria-selected="true"` (stays selected) | W3C Example JS: `setSelectedTab` — no deselection | `click on already-selected tab: stays selected (disallowEmpty)` |

### Initial State (from Example HTML/JS)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| I1 | 🔴 | page loaded (no interaction) | (assert) | `"#tab-ahlefeldt" aria-selected="true"` | Example JS: `this.setSelectedTab(this.firstTab, false)` — first tab selected on init | `initial state: first tab selected` — OS gap: SelectConfig has no `initial` field |
| I2 | 🟢 | page loaded (no interaction) | (assert) | `"#tab-andersen" aria-selected="false"`, others false | Example JS: all tabs initialized to `aria-selected="false"` except first | `initial state: other tabs not selected` |

### Manual-Activation Behavior (from Example JS)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| M1 | 🟢 | `click("#tab-ahlefeldt")`, `press("ArrowRight")` | (assert) | `"#tab-ahlefeldt" aria-selected="true"` (still selected) | Example JS: `moveFocusTo*` does NOT call `setSelectedTab` | `ArrowRight: previous tab stays selected` |
| M2 | 🟢 | `click("#tab-ahlefeldt")`, `press("ArrowRight")`, `press("Enter")` | (assert) | `"#tab-ahlefeldt" aria-selected="false"` | Example JS: Enter calls `setSelectedTab` which deselects others | `Enter: previous tab deselected` |

### ARIA Attributes

> Example's "Role, Property, State, and Tabindex Attributes" table.

| # | Signal | Element | Role | Attribute | W3C Wording | Test |
|---|--------|---------|------|-----------|-------------|------|
| A1 | ⬜ | div (tablist) | `tablist` | — | "Indicates that the element serves as a container for a set of tabs." | `tablist role on container` — OS auto |
| A2 | 🟢 | button (tab) | `tab` | — | "Indicates the element serves as a tab control." | `tab role on items` |
| A3 | ⬜ | button (selected tab) | — | `aria-selected="true"` | "Indicates the tab is selected and its associated tabpanel is displayed." | (covered by K7-K8, C1) |
| A4 | 🟢 | button (unselected tab) | — | `aria-selected="false"`, `tabindex="-1"` | "Indicates the tab is not selected. Removes the element from the page Tab sequence." | `unselected tabs: tabindex=-1` |
| A5 | 🔴 | button (tab) | — | `aria-controls="ID"` | "Refers to the element with role=tabpanel associated with the tab." | `aria-controls points to tabpanel` — OS gap: aria-controls only computed for expand mode |
| A6 | ➖ | div (tabpanel) | `tabpanel` | — | "Indicates the element serves as a container for tab panel content." | N/A — React Item.Content rendering |
| A7 | ➖ | div (tabpanel) | — | `aria-labelledby="IDREF"` | "Refers to the tab element that controls the panel." | N/A — React Item.Content rendering |
| A8 | ⬜ | div (tabpanel) | — | `tabindex="0"` | "Puts the tabpanel in the page Tab sequence." | N/A — verify if OS sets this |

## Coverage

```
🟢 15  ⬜ 2  ➖ 3  🔴 2  total 22
```

| Signal | Count | Rows |
|--------|-------|------|
| 🟢 | 15 | K1-K8, C1-C2, I2, M1-M2, A2, A4 |
| ⬜ | 2 | A1 (OS auto), A3 (covered by K/C), A8 |
| ➖ | 3 | K9 (Tab), A6 (tabpanel role), A7 (aria-labelledby) |
| 🔴 | 2 | I1 (initial selection — OS gap), A5 (aria-controls for tablist — OS gap) |

## Example Source

### JavaScript

```js
'use strict';

class TabsManual {
  constructor(groupNode) {
    this.tablistNode = groupNode;

    this.tabs = [];

    this.firstTab = null;
    this.lastTab = null;

    this.tabs = Array.from(this.tablistNode.querySelectorAll('[role=tab]'));
    this.tabpanels = [];

    for (var i = 0; i < this.tabs.length; i += 1) {
      var tab = this.tabs[i];
      var tabpanel = document.getElementById(tab.getAttribute('aria-controls'));

      tab.tabIndex = -1;
      tab.setAttribute('aria-selected', 'false');
      this.tabpanels.push(tabpanel);

      tab.addEventListener('keydown', this.onKeydown.bind(this));
      tab.addEventListener('click', this.onClick.bind(this));

      if (!this.firstTab) {
        this.firstTab = tab;
      }
      this.lastTab = tab;
    }

    this.setSelectedTab(this.firstTab, false);
  }

  setSelectedTab(currentTab, setFocus) {
    if (typeof setFocus !== 'boolean') {
      setFocus = true;
    }
    for (var i = 0; i < this.tabs.length; i += 1) {
      var tab = this.tabs[i];
      if (currentTab === tab) {
        tab.setAttribute('aria-selected', 'true');
        tab.removeAttribute('tabindex');
        this.tabpanels[i].classList.remove('is-hidden');
        if (setFocus) {
          tab.focus();
        }
      } else {
        tab.setAttribute('aria-selected', 'false');
        tab.tabIndex = -1;
        this.tabpanels[i].classList.add('is-hidden');
      }
    }
  }

  moveFocusToPreviousTab(currentTab) {
    var index;

    if (currentTab === this.firstTab) {
      this.lastTab.focus();
    } else {
      index = this.tabs.indexOf(currentTab);
      this.tabs[index - 1].focus();
    }
  }

  moveFocusToNextTab(currentTab) {
    var index;

    if (currentTab === this.lastTab) {
      this.firstTab.focus();
    } else {
      index = this.tabs.indexOf(currentTab);
      this.tabs[index + 1].focus();
    }
  }

  onKeydown(event) {
    var tgt = event.currentTarget,
      flag = false;

    switch (event.key) {
      case 'ArrowLeft':
        this.moveFocusToPreviousTab(tgt);
        flag = true;
        break;

      case 'ArrowRight':
        this.moveFocusToNextTab(tgt);
        flag = true;
        break;

      case 'Home':
        this.firstTab.focus();
        flag = true;
        break;

      case 'End':
        this.lastTab.focus();
        flag = true;
        break;

      case 'Enter':
      case ' ':
        this.setSelectedTab(tgt);
        flag = true;
        break;

      default:
        break;
    }

    if (flag) {
      event.stopPropagation();
      event.preventDefault();
    }
  }

  onClick(event) {
    this.setSelectedTab(event.currentTarget);
  }
}

window.addEventListener('load', function () {
  var tablists = document.querySelectorAll('[role=tablist].manual');
  for (var i = 0; i < tablists.length; i++) {
    new TabsManual(tablists[i]);
  }
});
```

### CSS

> Same as Tabs Automatic — see `tabs-auto.apg.md` Example Source § CSS.
