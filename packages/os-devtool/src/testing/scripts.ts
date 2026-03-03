/**
 * ARIA Test Scripts — Shared between ALL 3 engines.
 *
 * Each script takes (page, expect) and runs Playwright-compatible assertions.
 * "Write once, run anywhere":
 *   1. vitest headless — run(headlessPage, ourExpect)
 *   2. browser visual  — run(browserPage, ourExpect)
 *   3. Playwright E2E  — run(nativePage, playwrightExpect)
 *
 * The expect parameter is injected, so each engine passes its own:
 *   - Headless/Browser: import { expect } from "@os-devtool/testing"
 *   - Playwright E2E:   import { expect } from "@playwright/test"
 */

import { expect as defaultExpect } from "./expect";
import type { Page } from "./types";

// ═══════════════════════════════════════════════════════════════════
// Script type — each test suite is a named script
// ═══════════════════════════════════════════════════════════════════

/** Minimal expect interface — compatible with both our wrapper and Playwright's */
export type ExpectLocator = (locator: any) => {
  toHaveAttribute(name: string, value: string | RegExp): Promise<void>;
  toBeFocused(): Promise<void>;
  not: {
    toHaveAttribute(name: string, value: string | RegExp): Promise<void>;
    toBeFocused(): Promise<void>;
  };
};

export interface TestScript {
  name: string;
  run: (page: Page, expect: ExpectLocator) => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════
// ARIA Listbox
// ═══════════════════════════════════════════════════════════════════

export const listboxScript: TestScript = {
  name: "Listbox — Vertical Nav + Selection",
  async run(page, expect = defaultExpect) {
    // Click focuses and selects
    await page.locator("#lb-apple").click();
    await expect(page.locator("#lb-apple")).toBeFocused();
    await expect(page.locator("#lb-apple")).toHaveAttribute(
      "aria-current",
      "true",
    );

    // ArrowDown navigates + followFocus selects
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#lb-banana")).toBeFocused();
    await expect(page.locator("#lb-banana")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#lb-cherry")).toBeFocused();

    // ArrowUp reverses
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#lb-banana")).toBeFocused();

    // Boundary clamp — go to top, can't go higher
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#lb-apple")).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#lb-apple")).toBeFocused();

    // End → last item
    await page.keyboard.press("End");
    await expect(page.locator("#lb-elderberry")).toBeFocused();

    // Home → first item
    await page.keyboard.press("Home");
    await expect(page.locator("#lb-apple")).toBeFocused();
  },
};

// ═══════════════════════════════════════════════════════════════════
// ARIA Toolbar
// ═══════════════════════════════════════════════════════════════════

export const toolbarScript: TestScript = {
  name: "Toolbar — Horizontal Nav + Loop",
  async run(page, expect = defaultExpect) {
    // Click focuses
    await page.locator("#tb-bold").click();
    await expect(page.locator("#tb-bold")).toBeFocused();

    // ArrowRight navigates horizontally
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tb-italic")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tb-underline")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tb-link")).toBeFocused();

    // Loop: ArrowRight at last wraps to first
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tb-bold")).toBeFocused();

    // Loop: ArrowLeft at first wraps to last
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#tb-link")).toBeFocused();

    // Orthogonal arrow ignored
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#tb-link")).toBeFocused();
  },
};

// ═══════════════════════════════════════════════════════════════════
// ARIA Grid (Multi-Select)
// ═══════════════════════════════════════════════════════════════════

export const gridScript: TestScript = {
  name: "Grid — Cmd+Click Multi-Select",
  async run(page, expect = defaultExpect) {
    // Click selects
    await page.locator("#gr-cell-0").click();
    await expect(page.locator("#gr-cell-0")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Cmd+Click adds selection
    await page.locator("#gr-cell-2").click({ modifiers: ["Meta"] });
    await expect(page.locator("#gr-cell-2")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#gr-cell-0")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Cmd+Click toggles off
    await page.locator("#gr-cell-0").click({ modifiers: ["Meta"] });
    await expect(page.locator("#gr-cell-0")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    await expect(page.locator("#gr-cell-2")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  },
};

// ═══════════════════════════════════════════════════════════════════
// ARIA Radiogroup
// ═══════════════════════════════════════════════════════════════════

export const radiogroupScript: TestScript = {
  name: "Radiogroup — Loop + Auto-Select",
  async run(page, expect = defaultExpect) {
    // Click selects first radio
    await page.locator("#rg-sm").click();
    await expect(page.locator("#rg-sm")).toBeFocused();
    await expect(page.locator("#rg-sm")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // ArrowDown auto-selects next
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#rg-md")).toBeFocused();
    await expect(page.locator("#rg-md")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#rg-sm")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    // ArrowDown to last
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#rg-lg")).toBeFocused();
    await expect(page.locator("#rg-lg")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Loop: ArrowDown at last wraps to first
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#rg-sm")).toBeFocused();
    await expect(page.locator("#rg-sm")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  },
};

// ═══════════════════════════════════════════════════════════════════
// ARIA Accordion
// ═══════════════════════════════════════════════════════════════════

export const accordionScript: TestScript = {
  name: "Accordion — Click Expand + Enter/Space + Arrow Nav",
  async run(page, expect = defaultExpect) {
    // ═══════════════════════════════════════════════════
    // 1. Click → Expand (THE RED TEST)
    // ═══════════════════════════════════════════════════

    // Click first header → should focus AND expand
    await page.locator("#acc-personal").click();
    await expect(page.locator("#acc-personal")).toBeFocused();
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // Click again → collapse
    await page.locator("#acc-personal").click();
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    // Click a DIFFERENT header → should focus AND expand it
    await page.locator("#acc-billing").click();
    await expect(page.locator("#acc-billing")).toBeFocused();
    await expect(page.locator("#acc-billing")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // Click billing again → collapse
    await page.locator("#acc-billing").click();
    await expect(page.locator("#acc-billing")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    // ═══════════════════════════════════════════════════
    // 2. Keyboard: Enter/Space expand
    // ═══════════════════════════════════════════════════

    // Click to focus first header
    await page.locator("#acc-personal").click();
    await expect(page.locator("#acc-personal")).toBeFocused();

    // Collapse first (click toggled it)
    const expanded = await page
      .locator("#acc-personal")
      .getAttribute("aria-expanded");
    if (expanded === "true") {
      await page.keyboard.press("Enter");
    }
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    // Enter expands the panel
    await page.keyboard.press("Enter");
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // Enter again collapses
    await page.keyboard.press("Enter");
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    // Space also expands
    await page.keyboard.press(" ");
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // ═══════════════════════════════════════════════════
    // 3. Arrow navigation
    // ═══════════════════════════════════════════════════

    // ArrowDown moves to next header
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#acc-billing")).toBeFocused();

    // ArrowDown to last
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#acc-shipping")).toBeFocused();

    // Boundary clamp — can't go past last
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#acc-shipping")).toBeFocused();

    // ArrowUp back
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#acc-billing")).toBeFocused();

    // Home → first
    await page.keyboard.press("Home");
    await expect(page.locator("#acc-personal")).toBeFocused();

    // End → last
    await page.keyboard.press("End");
    await expect(page.locator("#acc-shipping")).toBeFocused();

    // ═══════════════════════════════════════════════════
    // 4. Panel content click must NOT toggle (W3C APG)
    // ═══════════════════════════════════════════════════

    // Ensure personal is expanded first
    await page.locator("#acc-personal").click();
    const state4 = await page
      .locator("#acc-personal")
      .getAttribute("aria-expanded");
    if (state4 !== "true") {
      // Was collapsed by click; click again to expand
      await page.locator("#acc-personal").click();
    }
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // Click on the panel content area — must NOT collapse
    await page.locator("#panel-acc-personal").click();
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // ═══════════════════════════════════════════════════
    // 5. Tab follows page flow (W3C APG)
    //    "all focusable elements in the accordion
    //     are included in the page Tab sequence"
    // ═══════════════════════════════════════════════════

    // Focus personal header (already expanded from section 4)
    await page.locator("#acc-personal").click();
    await expect(page.locator("#acc-personal")).toBeFocused();

    // Tab should NOT escape — it should move to next focusable
    // (could be panel inputs or next header)
    await page.keyboard.press("Tab");
    // acc-personal should no longer be focused (Tab moved away)
    await expect(page.locator("#acc-personal")).not.toBeFocused();
  },
};

// ═══════════════════════════════════════════════════════════════════
// All scripts — convenient bundle
// ═══════════════════════════════════════════════════════════════════

export const allAriaScripts: TestScript[] = [
  listboxScript,
  toolbarScript,
  gridScript,
  radiogroupScript,
  accordionScript,
];

// ═══════════════════════════════════════════════════════════════════
// APG Showcase-specific scripts
// These target the components in /playground/apg/* pages.
// Each pattern is rendered ONE AT A TIME — scripts click the sidebar
// tab first to ensure the correct pattern is visible.
// ═══════════════════════════════════════════════════════════════════

// ─── APG Listbox (Single-Select) ───

export const apgListboxSingleScript: TestScript = {
  name: "APG Listbox Single — followFocus + Negative",
  async run(page, expect = defaultExpect) {
    // Navigate to Listbox pattern via sidebar
    await page.locator("#tab-listbox").click();

    // Click focuses + selects (followFocus)
    await page.locator("#s-opt-Apple").click();
    await expect(page.locator("#s-opt-Apple")).toBeFocused();
    await expect(page.locator("#s-opt-Apple")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // ArrowDown → selection follows focus
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#s-opt-Banana")).toBeFocused();
    await expect(page.locator("#s-opt-Banana")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#s-opt-Apple")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    // Boundary clamp at bottom
    await page.keyboard.press("End");
    await expect(page.locator("#s-opt-Honeydew")).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#s-opt-Honeydew")).toBeFocused();

    // Home
    await page.keyboard.press("Home");
    await expect(page.locator("#s-opt-Apple")).toBeFocused();

    // NEGATIVE: Shift+ArrowDown MUST NOT create range (single-select)
    await page.keyboard.press("Shift+ArrowDown");
    await expect(page.locator("#s-opt-Banana")).toBeFocused();
    await expect(page.locator("#s-opt-Banana")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#s-opt-Apple")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    // NEGATIVE: Shift+Click MUST NOT create range (single-select)
    await page.locator("#s-opt-Apple").click(); // reset to Apple
    await page.locator("#s-opt-Date").click({ modifiers: ["Shift"] });
    // Should replace, not range → only Date selected
    await expect(page.locator("#s-opt-Date")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#s-opt-Apple")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    await expect(page.locator("#s-opt-Banana")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    // NEGATIVE: Cmd+Click MUST NOT toggle (single-select)
    await page.locator("#s-opt-Cherry").click({ modifiers: ["Meta"] });
    // Should replace to Cherry, not toggle/add
    await expect(page.locator("#s-opt-Cherry")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#s-opt-Date")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  },
};

// ─── APG Listbox (Multi-Select) ───

export const apgListboxMultiScript: TestScript = {
  name: "APG Listbox Multi — Toggle + Range",
  async run(page, expect = defaultExpect) {
    // Navigate to Listbox pattern via sidebar
    await page.locator("#tab-listbox").click();

    // Click focuses AND selects (OS_SELECT mode:replace)
    await page.locator("#m-opt-Apple").click();
    await expect(page.locator("#m-opt-Apple")).toBeFocused();
    await expect(page.locator("#m-opt-Apple")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Space toggles selection OFF (already selected by click)
    await page.keyboard.press(" ");
    await expect(page.locator("#m-opt-Apple")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    // Space again toggles it back ON
    await page.keyboard.press(" ");
    await expect(page.locator("#m-opt-Apple")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // ArrowDown moves focus, does NOT auto-select (multi: followFocus=false)
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#m-opt-Banana")).toBeFocused();
    await expect(page.locator("#m-opt-Banana")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    // Space toggles banana ON
    await page.keyboard.press(" ");
    await expect(page.locator("#m-opt-Banana")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    // Apple still selected
    await expect(page.locator("#m-opt-Apple")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  },
};

// ─── APG Tabs (Automatic Activation) ───

export const apgTabsAutoScript: TestScript = {
  name: "APG Tabs (Auto) — ArrowRight + followFocus",
  async run(page, expect = defaultExpect) {
    // Navigate to Tabs pattern via sidebar
    await page.locator("#tab-tabs").click();

    // Click first tab
    await page.locator("#tab-ahlefeldt").click();
    await expect(page.locator("#tab-ahlefeldt")).toBeFocused();
    await expect(page.locator("#tab-ahlefeldt")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // ArrowRight → next tab, auto-select
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-andersen")).toBeFocused();
    await expect(page.locator("#tab-andersen")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#tab-ahlefeldt")).toHaveAttribute(
      "aria-selected",
      "false",
    );

    // ArrowRight to third tab
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-fonseca")).toBeFocused();

    // Loop: ArrowRight at last wraps to first
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tab-ahlefeldt")).toBeFocused();
  },
};

// ─── APG Tree ───

export const apgTreeScript: TestScript = {
  name: "APG Tree — Expand/Collapse + Nav",
  async run(page, expect = defaultExpect) {
    // Navigate to Tree pattern via sidebar
    await page.locator("#tab-tree").click();

    // Click src folder (data-item-id="folder:src")
    await page.locator("#folder:src").click();
    await expect(page.locator("#folder:src")).toBeFocused();

    // src is expanded by default, ArrowDown enters children
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#folder:src/components")).toBeFocused();

    // ArrowLeft collapses expanded folder
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#folder:src/components")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    // ArrowRight expands it again
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#folder:src/components")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // ArrowUp back to src
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#folder:src")).toBeFocused();
  },
};

// ─── APG Toolbar ───

export const apgToolbarScript: TestScript = {
  name: "APG Toolbar — Horizontal Loop",
  async run(page, expect = defaultExpect) {
    // Navigate to Toolbar pattern via sidebar
    await page.locator("#tab-toolbar").click();

    // Click first tool
    await page.locator("#tool-bold").click();
    await expect(page.locator("#tool-bold")).toBeFocused();

    // ArrowRight navigates
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tool-italic")).toBeFocused();

    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#tool-underline")).toBeFocused();

    // ArrowDown: no effect (horizontal toolbar)
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#tool-underline")).toBeFocused();
  },
};

// ─── APG Accordion (with sidebar nav) ───

export const apgAccordionScript: TestScript = {
  name: "APG Accordion — Click Expand + Arrow Nav",
  async run(page, expect = defaultExpect) {
    // Navigate to Accordion pattern via sidebar
    await page.locator("#tab-accordion").click();

    // Click first header → focus + expand
    await page.locator("#acc-personal").click();
    await expect(page.locator("#acc-personal")).toBeFocused();
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "true",
    );

    // Click again → collapse
    await page.locator("#acc-personal").click();
    await expect(page.locator("#acc-personal")).toHaveAttribute(
      "aria-expanded",
      "false",
    );

    // ArrowDown moves to next header
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#acc-billing")).toBeFocused();

    // Home → first
    await page.keyboard.press("Home");
    await expect(page.locator("#acc-personal")).toBeFocused();

    // End → last
    await page.keyboard.press("End");
    await expect(page.locator("#acc-shipping")).toBeFocused();
  },
};

// ─── APG Menu & Menubar ───

export const apgMenuScript: TestScript = {
  name: "APG Menu — Menubar + Dropdown + Checkbox",
  async run(page, expect = defaultExpect) {
    // Navigate to Menu pattern via sidebar
    await page.locator("#tab-menu").click();

    // ═══ Menubar: horizontal navigation ═══

    // Click first menubar item
    await page.locator("#mb-file").click();
    await expect(page.locator("#mb-file")).toBeFocused();

    // ArrowRight → next
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#mb-edit")).toBeFocused();

    // ArrowRight → last
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#mb-view")).toBeFocused();

    // Loop: ArrowRight at last → wraps to first
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#mb-file")).toBeFocused();

    // Loop: ArrowLeft at first → wraps to last
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#mb-view")).toBeFocused();

    // ═══ Dropdown menu: vertical navigation ═══

    // Click first menu item in the dropdown
    await page.locator("#cmd-new").click();
    await expect(page.locator("#cmd-new")).toBeFocused();

    // ArrowDown → next
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#cmd-open")).toBeFocused();

    // Continue down through checkboxes
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#check-ruler")).toBeFocused();

    // Home → first
    await page.keyboard.press("Home");
    await expect(page.locator("#cmd-new")).toBeFocused();

    // End → last
    await page.keyboard.press("End");
    await expect(page.locator("#radio-right")).toBeFocused();

    // ═══ Checkbox: aria-checked toggle ═══

    // Navigate to check-ruler
    await page.locator("#check-ruler").click();
    await expect(page.locator("#check-ruler")).toBeFocused();

    // Verify initial state from JSX (ruler starts checked via useState)
    // After click, the onAction callback toggles the checked state
    const rulerChecked = await page
      .locator("#check-ruler")
      .getAttribute("aria-checked");

    // Toggle: if currently checked, Space unchecks; if not, Space checks
    await page.keyboard.press(" ");
    // aria-checked should have flipped
    if (rulerChecked === "true") {
      await expect(page.locator("#check-ruler")).toHaveAttribute(
        "aria-checked",
        "false",
      );
    } else {
      await expect(page.locator("#check-ruler")).toHaveAttribute(
        "aria-checked",
        "true",
      );
    }
  },
};

// ─── APG Grid ───

export const apgGridScript: TestScript = {
  name: "APG Grid — 2D Nav + Multi-Select",
  async run(page, expect = defaultExpect) {
    // Navigate to Grid pattern via sidebar
    await page.locator("#tab-grid").click();

    // ═══ 4-directional navigation ═══

    // Click cell-0 (row 1, col 1)
    await page.locator("#cell-0").click();
    await expect(page.locator("#cell-0")).toBeFocused();

    // ArrowRight → cell-1
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#cell-1")).toBeFocused();

    // ArrowDown → cell-6 (row 2, col 2 in 5-col grid)
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#cell-6")).toBeFocused();

    // ArrowLeft → cell-5
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#cell-5")).toBeFocused();

    // ArrowUp → cell-0
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#cell-0")).toBeFocused();

    // ═══ Click selection ═══

    await page.locator("#cell-12").click();
    await expect(page.locator("#cell-12")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Cmd+Click adds to selection
    await page.locator("#cell-14").click({ modifiers: ["Meta"] });
    await expect(page.locator("#cell-14")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#cell-12")).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Cmd+Click toggles off
    await page.locator("#cell-12").click({ modifiers: ["Meta"] });
    await expect(page.locator("#cell-12")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  },
};

// ─── APG Switch ───

export const apgSwitchScript: TestScript = {
  name: "APG Switch — Toggle On/Off",
  async run(page, expect = defaultExpect) {
    // Navigate to Switch pattern via sidebar
    await page.locator("#tab-switch").click();

    // ═══ Click toggle ═══

    // Click notifications switch (initially off)
    await page.locator("#switch-notifications").click();
    await expect(page.locator("#switch-notifications")).toBeFocused();
    await expect(page.locator("#switch-notifications")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    // Click again → toggle off
    await page.locator("#switch-notifications").click();
    await expect(page.locator("#switch-notifications")).toHaveAttribute(
      "aria-checked",
      "false",
    );

    // ═══ Space toggle ═══

    // Space to toggle on
    await page.keyboard.press(" ");
    await expect(page.locator("#switch-notifications")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    // ═══ Enter toggle ═══

    // Enter to toggle off
    await page.keyboard.press("Enter");
    await expect(page.locator("#switch-notifications")).toHaveAttribute(
      "aria-checked",
      "false",
    );

    // ═══ Multiple switches independence ═══

    // Dark mode switch — click toggles independently
    await page.locator("#switch-dark-mode").click();
    await expect(page.locator("#switch-dark-mode")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    // Notifications still off
    await expect(page.locator("#switch-notifications")).toHaveAttribute(
      "aria-checked",
      "false",
    );
  },
};

// ─── APG Slider ───

export const apgSliderScript: TestScript = {
  name: "APG Slider — Arrow + Home/End",
  async run(page, expect = defaultExpect) {
    // Navigate to Slider pattern via sidebar
    await page.locator("#tab-slider").click();

    // Click Red slider to focus
    await page.locator("#slider-red").click();
    await expect(page.locator("#slider-red")).toBeFocused();

    // Home → min value (0) — known start point
    await page.keyboard.press("Home");
    await expect(page.locator("#slider-red")).toHaveAttribute(
      "aria-valuenow",
      "0",
    );

    // ArrowRight → value increases to 1
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#slider-red")).toHaveAttribute(
      "aria-valuenow",
      "1",
    );

    // End → max value (100 — slider role preset default)
    await page.keyboard.press("End");
    await expect(page.locator("#slider-red")).toHaveAttribute(
      "aria-valuenow",
      "100",
    );

    // ArrowLeft from max → 99
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#slider-red")).toHaveAttribute(
      "aria-valuenow",
      "99",
    );
  },
};

// ═══════════════════════════════════════════════════════════════════
// APG RadioGroup — E2E TestBot Script
// ═══════════════════════════════════════════════════════════════════

export const apgRadiogroupScript: TestScript = {
  name: "APG RadioGroup — Arrow Nav + Check",
  async run(page, expect = defaultExpect) {
    // Navigate to RadioGroup pattern via sidebar
    await page.locator("#tab-radiogroup").click();

    // ═══ Click to check ═══
    await page.locator("#radio-regular").click();
    await expect(page.locator("#radio-regular")).toBeFocused();
    await expect(page.locator("#radio-regular")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    // ═══ ArrowDown: moves focus + checks next ═══
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#radio-deep")).toBeFocused();
    await expect(page.locator("#radio-deep")).toHaveAttribute(
      "aria-checked",
      "true",
    );
    // Previous unchecked
    await expect(page.locator("#radio-regular")).toHaveAttribute(
      "aria-checked",
      "false",
    );

    // ═══ ArrowRight: also moves focus + checks (linear-both) ═══
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#radio-thin")).toBeFocused();
    await expect(page.locator("#radio-thin")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    // ═══ ArrowDown at last: loop to first ═══
    await page.keyboard.press("ArrowDown");
    await expect(page.locator("#radio-regular")).toBeFocused();
    await expect(page.locator("#radio-regular")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    // ═══ ArrowUp at first: loop to last ═══
    await page.keyboard.press("ArrowUp");
    await expect(page.locator("#radio-thin")).toBeFocused();
    await expect(page.locator("#radio-thin")).toHaveAttribute(
      "aria-checked",
      "true",
    );

    // ═══ ArrowLeft: also moves focus + checks ═══
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#radio-deep")).toBeFocused();
    await expect(page.locator("#radio-deep")).toHaveAttribute(
      "aria-checked",
      "true",
    );
  },
};

// ─── Bundle for APG Showcase page ───

export const apgShowcaseScripts: TestScript[] = [
  apgListboxSingleScript,
  apgListboxMultiScript,
  apgTabsAutoScript,
  apgTreeScript,
  apgToolbarScript,
  apgAccordionScript,
  apgMenuScript,
  apgGridScript,
  apgSwitchScript,
  apgSliderScript,
  apgRadiogroupScript,
];
