# APG Tabs (Automatic Activation)

> Pattern: [Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
> Example: [Tabs with Automatic Activation](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/examples/tabs-automatic/)
>
> Status: 🟢 13/20 covered | 🔴 2 OS gaps

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
| K1 | 🟢 | `click("#tab-ahlefeldt")` | `press("ArrowRight")` | `"#tab-andersen" toBeFocused`, `aria-selected="true"` | "Moves focus to the next tab. Activates the newly focused tab." | `ArrowRight: next tab + activate` |
| K2 | 🟢 | `click("#tab-lange-muller")` — last tab | `press("ArrowRight")` | `"#tab-ahlefeldt" toBeFocused`, `aria-selected="true"` | "If focus is on the last tab, moves focus to the first tab." | `ArrowRight at last: wrap to first` |
| K3 | 🟢 | `click("#tab-andersen")` | `press("ArrowLeft")` | `"#tab-ahlefeldt" toBeFocused`, `aria-selected="true"` | "Moves focus to the previous tab. Activates the newly focused tab." | `ArrowLeft: prev tab + activate` |
| K4 | 🟢 | `click("#tab-ahlefeldt")` — first tab | `press("ArrowLeft")` | `"#tab-lange-muller" toBeFocused`, `aria-selected="true"` | "If focus is on the first tab, moves focus to the last tab." | `ArrowLeft at first: wrap to last` |
| K5 | 🟢 | `click("#tab-lange-muller")` | `press("Home")` | `"#tab-ahlefeldt" toBeFocused`, `aria-selected="true"` | "Moves focus to the first tab and activates it." | `Home: first tab + activate` |
| K6 | 🟢 | `click("#tab-ahlefeldt")` | `press("End")` | `"#tab-lange-muller" toBeFocused`, `aria-selected="true"` | "Moves focus to the last tab and activates it." | `End: last tab + activate` |
| K7 | ➖ | — | `press("Tab")` | browser default — focus into tablist on active tab, then to tabpanel | "When focus moves into the tab list, places focus on the active tab element. When the tab list contains the focus, moves focus to the next element in the tab sequence, which is the tabpanel element." | N/A — browser Tab sequence |

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

### Auto-Activation Behavior (from Example JS)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| F1 | 🟢 | `click("#tab-ahlefeldt")`, `press("ArrowRight")` | (assert) | previous tab `"#tab-ahlefeldt" aria-selected="false"` | Example JS: `setSelectedTab` deselects all others | `ArrowRight: previous tab deselected` |
| F2 | 🟢 | navigate through all tabs | (assert) | exactly one tab selected at all times | Example JS: single-select, no empty | `always exactly one tab selected` |

### ARIA Attributes

> Example's "Role, Property, State, and Tabindex Attributes" table.

| # | Signal | Element | Role | Attribute | W3C Wording | Test |
|---|--------|---------|------|-----------|-------------|------|
| A1 | ⬜ | div (tablist) | `tablist` | — | "Indicates that the element serves as a container for a set of tabs." | `tablist role on container` — OS auto |
| A2 | 🟢 | button (tab) | `tab` | — | "Indicates the element serves as a tab control." | `tab role on items` |
| A3 | ⬜ | button (selected tab) | — | `aria-selected="true"` | "Indicates the tab is selected and its associated tabpanel is displayed." | (covered by K1-K6, C1) |
| A4 | 🟢 | button (unselected tab) | — | `aria-selected="false"`, `tabindex="-1"` | "Indicates the tab is not selected. Removes the element from the page Tab sequence." | `unselected tabs: tabindex=-1` |
| A5 | 🔴 | button (tab) | — | `aria-controls="ID"` | "Refers to the element with role=tabpanel associated with the tab." | `aria-controls points to tabpanel` — OS gap: aria-controls only computed for expand mode, not select-based tablist |
| A6 | ➖ | div (tabpanel) | `tabpanel` | — | "Indicates the element serves as a container for tab panel content." | N/A — React Item.Content rendering |
| A7 | ➖ | div (tabpanel) | — | `aria-labelledby="IDREF"` | "Refers to the tab element that controls the panel." | N/A — React Item.Content rendering |
| A8 | ⬜ | div (tabpanel) | — | `tabindex="0"` | "Puts the tabpanel in the page Tab sequence." | N/A — verify if OS sets this |

## Coverage

```
🟢 13  ⬜ 2  ➖ 3  🔴 2  total 20
```

| Signal | Count | Rows |
|--------|-------|------|
| 🟢 | 13 | K1-K6, C1-C2, I2, F1-F2, A2, A4 |
| ⬜ | 2 | A1 (OS auto), A3 (covered by K/C), A8 |
| ➖ | 3 | K7 (Tab), A6 (tabpanel role), A7 (aria-labelledby) |
| 🔴 | 2 | I1 (initial selection — OS gap), A5 (aria-controls for tablist — OS gap) |

## Example Source

### JavaScript

```js
'use strict';

class TabsAutomatic {
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

  setSelectedToPreviousTab(currentTab) {
    var index;

    if (currentTab === this.firstTab) {
      this.setSelectedTab(this.lastTab);
    } else {
      index = this.tabs.indexOf(currentTab);
      this.setSelectedTab(this.tabs[index - 1]);
    }
  }

  setSelectedToNextTab(currentTab) {
    var index;

    if (currentTab === this.lastTab) {
      this.setSelectedTab(this.firstTab);
    } else {
      index = this.tabs.indexOf(currentTab);
      this.setSelectedTab(this.tabs[index + 1]);
    }
  }

  onKeydown(event) {
    var tgt = event.currentTarget,
      flag = false;

    switch (event.key) {
      case 'ArrowLeft':
        this.setSelectedToPreviousTab(tgt);
        flag = true;
        break;

      case 'ArrowRight':
        this.setSelectedToNextTab(tgt);
        flag = true;
        break;

      case 'Home':
        this.setSelectedTab(this.firstTab);
        flag = true;
        break;

      case 'End':
        this.setSelectedTab(this.lastTab);
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
  var tablists = document.querySelectorAll('[role=tablist].automatic');
  for (var i = 0; i < tablists.length; i++) {
    new TabsAutomatic(tablists[i]);
  }
});
```

### CSS

```css
.tabs {
  font-family: "lucida grande", sans-serif;
}

[role="tablist"] {
  min-width: 100%;
}

[role="tab"],
[role="tab"]:focus,
[role="tab"]:hover {
  display: inline-block;
  position: relative;
  z-index: 2;
  top: 2px;
  margin: 0;
  margin-top: 4px;
  padding: 3px 3px 4px;
  border: 1px solid hsl(219deg 1% 72%);
  border-bottom: 2px solid hsl(219deg 1% 72%);
  border-radius: 5px 5px 0 0;
  background: hsl(220deg 20% 94%);
  outline: none;
  font-weight: bold;
  max-width: 22%;
  overflow: hidden;
  text-align: left;
  cursor: pointer;
}

[role="tab"][aria-selected="true"] {
  padding: 2px 2px 4px;
  margin-top: 0;
  border-width: 2px;
  border-top-width: 6px;
  border-top-color: rgb(36 116 214);
  border-bottom-color: hsl(220deg 43% 99%);
  background: hsl(220deg 43% 99%);
}

[role="tab"][aria-selected="false"] {
  border-bottom: 1px solid hsl(219deg 1% 72%);
}

[role="tab"] span.focus {
  display: inline-block;
  margin: 2px;
  padding: 4px 6px;
}

[role="tab"]:hover span.focus,
[role="tab"]:focus span.focus,
[role="tab"]:active span.focus {
  padding: 2px 4px;
  border: 2px solid rgb(36 116 214);
  border-radius: 3px;
}

[role="tabpanel"] {
  padding: 5px;
  border: 2px solid hsl(219deg 1% 72%);
  border-radius: 0 5px 5px;
  background: hsl(220deg 43% 99%);
  min-height: 10em;
  width: 100%;
  overflow: auto;
}

[role="tabpanel"].is-hidden {
  display: none;
}

[role="tabpanel"] p {
  margin: 0;
}
```
