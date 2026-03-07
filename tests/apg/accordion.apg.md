# APG Accordion

> Pattern: [Accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)
> Example: [Accordion Example](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/)
>
> Status: 🟢 22/24 covered · 0 fail · 3 N/A (K12, K13, A5)

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

### Keyboard

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | W3C Wording | Test |
|---|--------|---------------|--------------|---------------|-------------|------|
| K1 | 🟢 | `click("#acc-personal")` — focused, expanded | `press("Enter")` | `"#acc-personal" aria-expanded="false"` | "When focus is on the accordion header of an expanded section, collapses the panel if the implementation supports collapsing." | `Enter toggles expand on focused header` |
| K2 | 🟢 | K1 이후 collapsed 상태 | `press("Enter")` | `"#acc-personal" aria-expanded="true"` | "When focus is on the accordion header of a collapsed section, expands the section." | `Enter toggles expand on focused header` |
| K3 | 🟢 | `click("#acc-personal")` — focused, expanded | `press("Space")` | `"#acc-personal" aria-expanded="false"` | (same as K1, Space variant) | `Space toggles expand on focused header` |
| K4 | 🟢 | K3 이후 collapsed 상태 | `press("Space")` | `"#acc-personal" aria-expanded="true"` | (same as K2, Space variant) | `Space toggles expand on focused header` |
| K5 | 🟢 | `click("#acc-personal")` | `press("ArrowDown")` | `"#acc-billing" toBeFocused` | "If focus is on an accordion header, moves focus to the next accordion header." | `ArrowDown: moves to next header` |
| K6 | 🟢 | `click("#acc-shipping")` — last header | `press("ArrowDown")` | `"#acc-shipping" toBeFocused` | "If focus is on the last accordion header, either does nothing or moves focus to the first accordion header." | `ArrowDown at last: clamp (no loop)` |
| K7 | 🟢 | `click("#acc-billing")` | `press("ArrowUp")` | `"#acc-personal" toBeFocused` | "If focus is on an accordion header, moves focus to the previous accordion header." | `ArrowUp: moves to previous header` |
| K8 | 🟢 | `click("#acc-personal")` — first header | `press("ArrowUp")` | `"#acc-personal" toBeFocused` | "If focus is on the first accordion header, either does nothing or moves focus to the last accordion header." | `ArrowUp at first: clamp (no loop)` |
| K9 | 🟢 | `click("#acc-shipping")` | `press("Home")` | `"#acc-personal" toBeFocused` | "When focus is on an accordion header, moves focus to the first accordion header." | `Home: first header` |
| K10 | 🟢 | `click("#acc-personal")` | `press("End")` | `"#acc-shipping" toBeFocused` | "When focus is on an accordion header, moves focus to the last accordion header." | `End: last header` |
| K11 | 🟢 | `click("#acc-personal")` — expanded | `press("ArrowDown")` | `"#acc-personal" aria-expanded="true"`, `"#acc-billing" aria-expanded="false"` | (implicit: arrow keys only navigate, not expand) | `ArrowDown does NOT change expand state` |
| K12 | ➖ | — | `press("Tab")` | browser default (no interception) | "Moves focus to the next focusable element; all focusable elements in the accordion are included in the page Tab sequence." | N/A — browser default |
| K13 | ➖ | — | `press("Shift+Tab")` | browser default (no interception) | "Moves focus to the previous focusable element; all focusable elements in the accordion are included in the page Tab sequence." | N/A — browser default |

### Initial State (from Example HTML)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| I1 | 🟢 | page loaded (no interaction) | (assert) | `"#acc-personal" aria-expanded="true"` | Example HTML: first button has `aria-expanded="true"` | `initial state: first section expanded` |
| I2 | 🟢 | page loaded (no interaction) | (assert) | `"#acc-billing" aria-expanded="false"`, `"#acc-shipping" aria-expanded="false"` | Example HTML: other buttons have `aria-expanded="false"`, panels have `hidden` | `initial state: other sections collapsed` |

### Panel Visibility Sync (from Example JS)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| P1 | 🟢 | `click("#acc-billing")` — expand | (assert) | `"#acc-billing" aria-expanded="true"`, `aria-controls="panel-acc-billing"` | Example JS: `this.contentEl.removeAttribute('hidden')` | `expand: panel becomes visible (aria-controls)` |
| P2 | 🟢 | `click("#acc-personal")`, `click("#acc-personal")` — collapse | (assert) | `"#acc-personal" aria-expanded="false"` | Example JS: `this.contentEl.setAttribute('hidden', '')` | `collapse: panel becomes hidden` |

### Click

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| C1 | 🟢 | (no focus) | `click("#acc-billing")` | `"#acc-billing" toBeFocused`, `aria-expanded="true"` | W3C example JS: `buttonEl.addEventListener('click', onButtonClick)` | `click on header: focuses and expands it` |
| C2 | 🟢 | `click("#acc-personal")` — focused, expanded | `click("#acc-personal")` | `aria-expanded="false"` | W3C example JS: `toggle(!this.open)` | `click on focused header: toggles expand` |
| C3 | 🟢 | `click("#acc-personal")`, `click("#acc-billing")` | (assert) | both `aria-expanded="true"` | W3C example: no "only one panel" constraint | `click headers independently: multiple panels open` |

### Multi-expand (keyboard)

| # | Signal | Setup (Given) | Input (When) | Assert (Then) | Basis | Test |
|---|--------|---------------|--------------|---------------|-------|------|
| M1 | 🟢 | `click("#acc-personal")`, `press("ArrowDown")` | `press("Enter")` | both `"#acc-personal"` and `"#acc-billing"` `aria-expanded="true"` | "Some implementations require one panel to be expanded at all times and allow only one panel to be expanded" — this example does NOT have that constraint | `multiple headers expanded independently via keyboard` |

## Coverage

```
🟢 21  🔴 0  ➖ 3  total 24
```

| Signal | Count | Rows |
|--------|-------|------|
| 🟢 | 20 | K1-K11, I2, P1, P2, C1-C3, M1, A1, A2, A3, A4 |
| ➖ | 3 | K12 (Tab), K13 (Shift+Tab) — browser default; A5 — React rendering layer |

## ARIA Attributes

> Example의 "Role, Property, State, and Tabindex Attributes" 표.

| # | Signal | Element | Role | Attribute | W3C Wording | Test |
|---|--------|---------|------|-----------|-------------|------|
| A1 | 🟢 | h3 | — | — | "Element that serves as an accordion header. Each accordion header element contains a button that controls the visibility of its content panel." | (structural — covered by heading existence in HTML) |
| A2 | 🟢 | button (in h3) | — | `aria-expanded="true/false"` | "Set to true when the Accordion panel is expanded, otherwise set to false." | (covered by K1-K4, C1-C2) |
| A3 | 🟢 | button (in h3) | — | `aria-controls="ID"` | "Points to the ID of the panel which the header controls." | `aria-controls points to panel ID` |
| A4 | 🟢 | div (panel) | `region` | — | "Creates a landmark region that contains the currently expanded accordion panel." | (covered by OS role="accordion" panel rendering) |
| A5 | ➖ | div (panel) | — | `aria-labelledby="IDREF"` | "Defines the accessible name for the region element. References the accordion header button that expands and collapses the region." | N/A — rendered by React Item.Content, not in OS state |

## Example Source

### HTML

```html
<div id="accordionGroup" class="accordion">
  <h3>
    <button type="button" aria-expanded="true" class="accordion-trigger" aria-controls="sect1" id="accordion1id">
      <span class="accordion-title">
        Personal Information
        <span class="accordion-icon"></span>
      </span>
    </button>
  </h3>
  <div id="sect1" role="region" aria-labelledby="accordion1id" class="accordion-panel">
    <div>
      <fieldset>
        <p>
          <label for="cufc1">Name<span aria-hidden="true">*</span>:</label>
          <input type="text" value="" name="Name" id="cufc1" class="required" aria-required="true">
        </p>
        <p>
          <label for="cufc2">Email<span aria-hidden="true">*</span>:</label>
          <input type="text" value="" name="Email" id="cufc2" aria-required="true">
        </p>
        <p>
          <label for="cufc3">Phone:</label>
          <input type="text" value="" name="Phone" id="cufc3">
        </p>
        <p>
          <label for="cufc4">Extension:</label>
          <input type="text" value="" name="Ext" id="cufc4">
        </p>
        <p>
          <label for="cufc5">Country:</label>
          <input type="text" value="" name="Country" id="cufc5">
        </p>
        <p>
          <label for="cufc6">City/Province:</label>
          <input type="text" value="" name="City_Province" id="cufc6">
        </p>
      </fieldset>
    </div>
  </div>
  <h3>
    <button type="button" aria-expanded="false" class="accordion-trigger" aria-controls="sect2" id="accordion2id">
      <span class="accordion-title">
        Billing Address
        <span class="accordion-icon"></span>
      </span>
    </button>
  </h3>
  <div id="sect2" role="region" aria-labelledby="accordion2id" class="accordion-panel" hidden>
    <div>
      <fieldset>
        <p>
          <label for="b-add1">Address 1:</label>
          <input type="text" name="b-add1" id="b-add1">
        </p>
        <p>
          <label for="b-add2">Address 2:</label>
          <input type="text" name="b-add2" id="b-add2">
        </p>
        <p>
          <label for="b-city">City:</label>
          <input type="text" name="b-city" id="b-city">
        </p>
        <p>
          <label for="b-state">State:</label>
          <input type="text" name="b-state" id="b-state">
        </p>
        <p>
          <label for="b-zip">Zip Code:</label>
          <input type="text" name="b-zip" id="b-zip">
        </p>
      </fieldset>
    </div>
  </div>
  <h3>
    <button type="button" aria-expanded="false" class="accordion-trigger" aria-controls="sect3" id="accordion3id">
      <span class="accordion-title">
        Shipping Address
        <span class="accordion-icon"></span>
      </span>
    </button>
  </h3>
  <div id="sect3" role="region" aria-labelledby="accordion3id" class="accordion-panel" hidden>
    <div>
      <fieldset>
        <p>
          <label for="m-add1">Address 1:</label>
          <input type="text" name="m-add1" id="m-add1">
        </p>
        <p>
          <label for="m-add2">Address 2:</label>
          <input type="text" name="m-add2" id="m-add2">
        </p>
        <p>
          <label for="m-city">City:</label>
          <input type="text" name="m-city" id="m-city">
        </p>
        <p>
          <label for="m-state">State:</label>
          <input type="text" name="m-state" id="m-state">
        </p>
        <p>
          <label for="m-zip">Zip Code:</label>
          <input type="text" name="m-zip" id="m-zip">
        </p>
      </fieldset>
    </div>
  </div>
</div>
```

### JavaScript

```js
'use strict';

class Accordion {
  constructor(domNode) {
    this.rootEl = domNode;
    this.buttonEl = this.rootEl.querySelector('button[aria-expanded]');

    const controlsId = this.buttonEl.getAttribute('aria-controls');
    this.contentEl = document.getElementById(controlsId);

    this.open = this.buttonEl.getAttribute('aria-expanded') === 'true';

    this.buttonEl.addEventListener('click', this.onButtonClick.bind(this));
  }

  onButtonClick() {
    this.toggle(!this.open);
  }

  toggle(open) {
    if (open === this.open) {
      return;
    }

    this.open = open;

    this.buttonEl.setAttribute('aria-expanded', `${open}`);
    if (open) {
      this.contentEl.removeAttribute('hidden');
    } else {
      this.contentEl.setAttribute('hidden', '');
    }
  }

  open() {
    this.toggle(true);
  }

  close() {
    this.toggle(false);
  }
}

const accordions = document.querySelectorAll('.accordion h3');
accordions.forEach((accordionEl) => {
  new Accordion(accordionEl);
});
```

### CSS

```css
.accordion {
  margin: 0;
  padding: 0;
  border: 2px solid hsl(0deg 0% 52%);
  border-radius: 7px;
  width: 20em;
}

.accordion h3 {
  margin: 0;
  padding: 0;
}

.accordion:focus-within {
  border-color: hsl(216deg 94% 43%);
}

.accordion:focus-within h3 {
  background-color: hsl(0deg 0% 97%);
}

.accordion > * + * {
  border-top: 1px solid hsl(0deg 0% 52%);
}

.accordion-trigger {
  background: none;
  color: hsl(0deg 0% 13%);
  display: block;
  font-size: 1rem;
  font-weight: normal;
  margin: 0;
  padding: 1em 1.5em;
  position: relative;
  text-align: left;
  width: 100%;
  outline: none;
}

.accordion-trigger:focus,
.accordion-trigger:hover {
  background: hsl(216deg 94% 94%);
}

.accordion-trigger:focus {
  outline: 4px solid transparent;
}

.accordion > *:first-child .accordion-trigger,
.accordion > *:first-child {
  border-radius: 5px 5px 0 0;
}

.accordion > *:last-child .accordion-trigger,
.accordion > *:last-child {
  border-radius: 0 0 5px 5px;
}

button {
  border-style: none;
}

.accordion button::-moz-focus-inner {
  border: 0;
}

.accordion-title {
  display: block;
  pointer-events: none;
  border: transparent 2px solid;
  border-radius: 5px;
  padding: 0.25em;
  outline: none;
}

.accordion-trigger:focus .accordion-title {
  border-color: hsl(216deg 94% 43%);
}

.accordion-icon {
  border: solid currentcolor;
  border-width: 0 2px 2px 0;
  height: 0.5rem;
  pointer-events: none;
  position: absolute;
  right: 2em;
  top: 50%;
  transform: translateY(-60%) rotate(45deg);
  width: 0.5rem;
}

.accordion-trigger:focus .accordion-icon,
.accordion-trigger:hover .accordion-icon {
  border-color: hsl(216deg 94% 43%);
}

.accordion-trigger[aria-expanded="true"] .accordion-icon {
  transform: translateY(-50%) rotate(-135deg);
}

.accordion-panel {
  margin: 0;
  padding: 1em 1.5em;
}

.accordion-panel[hidden] {
  display: none;
}

fieldset {
  border: 0;
  margin: 0;
  padding: 0;
}

input {
  border: 1px solid hsl(0deg 0% 42%);
  border-radius: 0.3em;
  display: block;
  font-size: inherit;
  padding: 0.3em 0.5em;
}
```
