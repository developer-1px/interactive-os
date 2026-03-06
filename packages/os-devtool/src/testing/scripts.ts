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

import type { ZoneRole } from "@os-core/engine/registries/roleRegistry";
import type { FocusGroupConfig } from "@os-core/schema/types/focus/config/FocusGroupConfig";

import { expect as defaultExpect } from "./expect";
import type { Locator, LocatorAssertions, Page } from "./types";

// ═══════════════════════════════════════════════════════════════════
// Script type — each test suite is a named script
// ═══════════════════════════════════════════════════════════════════

/** Minimal expect interface — compatible with both our wrapper and Playwright's */
export type ExpectLocator = (locator: Locator) => LocatorAssertions;

export interface TestScript {
  name: string;
  group?: string;
  /** Zone this script targets — used by browser runner to resolve items from ZoneRegistry */
  zone?: string;
  run: (page: Page, expect: ExpectLocator, items?: string[]) => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════
// Scenario type — zone fixture + scripts bundle for auto-runner
// ═══════════════════════════════════════════════════════════════════

/**
 * A TestScenario bundles zone setup with scripts.
 *
 * testbot-*.ts files export `scenarios: TestScenario[]` to enable
 * auto-running in vitest without hand-written boilerplate test files.
 *
 * Infra-layer (K3): uses OS concepts (zone, role) — NOT Playwright subset.
 * run() inside each TestScript remains pure Playwright subset (K2).
 */
export interface TestScenario {
  /** Zone ID to pass to page.goto() */
  zone: string;
  /** Item IDs for the zone (static — prefer getItems for real apps) */
  items?: string[];
  /** Dynamic item discovery — pure function returning real item IDs from zone bindings */
  getItems?: () => string[];
  /** ARIA role for the zone */
  role: ZoneRole;
  /** Optional FocusGroupConfig overrides */
  config?: Partial<FocusGroupConfig>;
  /** Optional initial state (selection, expanded, values) */
  initial?: {
    selection?: string[];
    expanded?: string[];
    values?: Record<string, number>;
  };
  /** Scripts to run against this zone */
  scripts: TestScript[];
}

/**
 * Extract TestScenario[] from a loaded testbot module.
 *
 * Convention: testbot-*.ts files export `scenarios: TestScenario[]`.
 * The name MUST be "scenarios" — no auto-detection, explicit contract.
 */
export function extractScenarios(mod: Record<string, unknown>): TestScenario[] {
  const scenarios = mod["scenarios"];
  if (Array.isArray(scenarios) && scenarios.length > 0) {
    const first = scenarios[0] as Record<string, unknown>;
    if (typeof first["zone"] === "string" && Array.isArray(first["scripts"])) {
      return scenarios as TestScenario[];
    }
  }
  return [];
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
// APG Showcase scripts — split into per-pattern files
// ═══════════════════════════════════════════════════════════════════

export {
  apgAccordionScript,
  apgButtonScript,
  apgCarouselScript,
  apgCheckboxScript,
  apgDisclosureScript,
  apgFeedScript,
  apgGridScript,
  apgListboxMultiScript,
  apgListboxSingleScript,
  apgMenuButtonScript,
  apgMenuScript,
  apgMeterScript,
  apgRadiogroupScript,
  apgShowcaseScripts,
  apgSliderMultiThumbScript,
  apgSliderScript,
  apgSpinbuttonScript,
  apgSwitchScript,
  apgTabsAutoScript,
  apgToolbarScript,
  apgTooltipScript,
  apgTreegridScript,
  apgTreeScript,
  apgWindowSplitterScript,
} from "./scripts/apg";
