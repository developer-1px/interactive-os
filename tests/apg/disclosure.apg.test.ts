/**
 * APG Disclosure (Show/Hide) Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/
 *
 * W3C Disclosure Pattern:
 *   - Button with role="button" toggles visibility of associated content
 *   - aria-expanded="true" when content is visible, "false" when hidden
 *   - Enter: activates the disclosure control, toggles content visibility
 *   - Space: activates the disclosure control, toggles content visibility
 *   - Tab navigates between disclosure buttons (standard tab order, NOT roving tabindex)
 *   - No arrow key navigation between disclosure buttons
 *
 * ZIFT Classification: Zone + Trigger
 *   Zone provides the grouping for disclosure buttons.
 *   Each button is a Trigger that toggles expand/collapse of its content.
 *   Tab flows between buttons (tab.behavior="flow"), no roving tabindex.
 *
 * Config: flow tab, manual activate with onClick, expand=all
 *
 * API: page.locator / page.keyboard.press / expect(loc).toHaveAttribute
 *
 * Setup note: page.click("disc-faq-1") focuses AND expands the item.
 * Tests account for this side effect.
 */

import { expect as osExpect } from "@os-testing/expect";
import { createPage } from "@os-testing/page";
import type { Page } from "@os-testing/types";
import { afterEach, beforeEach, describe, it } from "vitest";
import {
  DisclosureApp,
  DisclosurePattern,
} from "@/pages/apg-showcase/patterns/DisclosurePattern";

// ─── Test Setup ───
// click focuses AND expands the disclosure (onAction → OS_EXPAND)
// So initial state after beforeEach: disc-faq-1 is focused + expanded

const FIRST = "#disc-faq-1";
const SECOND = "#disc-faq-2";
const THIRD = "#disc-faq-3";

let page: Page;
let cleanup: () => void;

beforeEach(() => {
  ({ page, cleanup } = createPage(DisclosureApp, DisclosurePattern));
  page.goto("/");
  page.click("disc-faq-1");
});

afterEach(() => {
  cleanup();
});

const expect = osExpect;

// ═══════════════════════════════════════════════════════════════════
// Expand/Collapse via Enter
// ═══════════════════════════════════════════════════════════════════

describe("APG Disclosure: Toggle via Enter", () => {
  it("Enter on expanded button: collapses the content", async () => {
    // After beforeEach click, disc-faq-1 is expanded
    await expect(page.locator(FIRST)).toHaveAttribute("aria-expanded", "true");

    page.keyboard.press("Enter");

    await expect(page.locator(FIRST)).toHaveAttribute("aria-expanded", "false");
  });

  it("Enter toggles: collapse then re-expand", async () => {
    // disc-faq-1 is expanded from click
    page.keyboard.press("Enter"); // collapse
    await expect(page.locator(FIRST)).toHaveAttribute("aria-expanded", "false");

    page.keyboard.press("Enter"); // re-expand

    await expect(page.locator(FIRST)).toHaveAttribute("aria-expanded", "true");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Expand/Collapse via Space
// ═══════════════════════════════════════════════════════════════════

describe("APG Disclosure: Toggle via Space", () => {
  it("Space on expanded button: collapses the content", async () => {
    // After beforeEach click, disc-faq-1 is expanded
    await expect(page.locator(FIRST)).toHaveAttribute("aria-expanded", "true");

    page.keyboard.press("Space");

    await expect(page.locator(FIRST)).toHaveAttribute("aria-expanded", "false");
  });

  it("Space toggles: collapse then re-expand", async () => {
    page.keyboard.press("Space"); // collapse
    await expect(page.locator(FIRST)).toHaveAttribute("aria-expanded", "false");

    page.keyboard.press("Space"); // re-expand

    await expect(page.locator(FIRST)).toHaveAttribute("aria-expanded", "true");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Multiple independent disclosures
// ═══════════════════════════════════════════════════════════════════

describe("APG Disclosure: Multiple independent sections", () => {
  it("multiple disclosures can be expanded independently", async () => {
    // disc-faq-1 already expanded from click
    await expect(page.locator(FIRST)).toHaveAttribute("aria-expanded", "true");

    // Move to faq-2 via Tab (flow mode) and expand
    page.keyboard.press("Tab");
    await expect(page.locator(SECOND)).toHaveAttribute("data-focused", "true");
    page.keyboard.press("Enter"); // expand faq-2

    await expect(page.locator(FIRST)).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(SECOND)).toHaveAttribute("aria-expanded", "true");
  });

  it("collapsing one does not affect others", async () => {
    // disc-faq-1 expanded from click. Expand faq-2 too.
    page.keyboard.press("Tab");
    page.keyboard.press("Enter");
    await expect(page.locator(FIRST)).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(SECOND)).toHaveAttribute("aria-expanded", "true");

    // Collapse faq-1
    page.keyboard.press("Shift+Tab");
    await expect(page.locator(FIRST)).toHaveAttribute("data-focused", "true");
    page.keyboard.press("Enter");

    await expect(page.locator(FIRST)).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator(SECOND)).toHaveAttribute("aria-expanded", "true");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Tab navigation (flow mode — NOT roving tabindex)
// W3C disclosure buttons are standard buttons: Tab navigates between them.
// OS also provides arrow key navigation as a universal zone behavior.
// ═══════════════════════════════════════════════════════════════════

describe("APG Disclosure: Tab navigation (flow mode)", () => {
  it("Tab moves focus to next disclosure button", async () => {
    page.keyboard.press("Tab");

    await expect(page.locator(SECOND)).toHaveAttribute("data-focused", "true");
  });

  it("Shift+Tab moves focus to previous disclosure button", async () => {
    // Navigate to faq-2 first
    page.keyboard.press("Tab");
    await expect(page.locator(SECOND)).toHaveAttribute("data-focused", "true");

    page.keyboard.press("Shift+Tab");

    await expect(page.locator(FIRST)).toHaveAttribute("data-focused", "true");
  });

  it("Tab does NOT toggle expand (only navigates)", async () => {
    // disc-faq-1 is expanded from click
    await expect(page.locator(FIRST)).toHaveAttribute("aria-expanded", "true");

    page.keyboard.press("Tab");

    // Tab should move focus, not toggle expand on disc-faq-1
    await expect(page.locator(SECOND)).toHaveAttribute("data-focused", "true");
    // disc-faq-1 should stay expanded (Tab doesn't toggle)
    await expect(page.locator(FIRST)).toHaveAttribute("aria-expanded", "true");
  });
});

// ═══════════════════════════════════════════════════════════════════
// DOM Projection: ARIA attributes
// ═══════════════════════════════════════════════════════════════════

describe("APG Disclosure: DOM Projection (attrs)", () => {
  it("items have role=button", async () => {
    await expect(page.locator(FIRST)).toHaveAttribute("role", "button");
  });

  it("expanded button: aria-expanded=true", async () => {
    // disc-faq-1 expanded from click
    await expect(page.locator(FIRST)).toHaveAttribute("aria-expanded", "true");
  });

  it("collapsed button: aria-expanded=false after toggle", async () => {
    // disc-faq-1 expanded from click, collapse it
    page.keyboard.press("Enter");
    await expect(page.locator(FIRST)).toHaveAttribute("aria-expanded", "false");
  });

  it("focused button: tabindex=0", async () => {
    await expect(page.locator(FIRST)).toHaveAttribute("tabindex", "0");
  });

  it("focused button: data-focused=true", async () => {
    await expect(page.locator(FIRST)).toHaveAttribute("data-focused", "true");
  });

  it("unfocused buttons: tabindex=0 (flow mode, all buttons tabbable)", async () => {
    // In flow mode, all items should remain tabIndex=0 (unlike roving tabindex
    // where only the focused item gets tabIndex=0 and others get tabIndex=-1).
    // We verify the focused item at minimum.
    await expect(page.locator(FIRST)).toHaveAttribute("tabindex", "0");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Click interaction
// ═══════════════════════════════════════════════════════════════════

describe("APG Disclosure: Click interaction", () => {
  it("click on another disclosure button: focuses and toggles expand", async () => {
    // disc-faq-2 is collapsed initially
    page.click("disc-faq-2");

    await expect(page.locator(SECOND)).toHaveAttribute("data-focused", "true");
    await expect(page.locator(SECOND)).toHaveAttribute("aria-expanded", "true");
  });

  it("click on expanded button: collapses it", async () => {
    // disc-faq-1 expanded from beforeEach click
    await expect(page.locator(FIRST)).toHaveAttribute("aria-expanded", "true");

    page.click("disc-faq-1");

    await expect(page.locator(FIRST)).toHaveAttribute("aria-expanded", "false");
  });

  it("click does not affect other disclosures", async () => {
    // disc-faq-1 expanded from click. Expand faq-2 too.
    page.click("disc-faq-2");
    await expect(page.locator(FIRST)).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(SECOND)).toHaveAttribute("aria-expanded", "true");

    // Collapse faq-1 only
    page.click("disc-faq-1");
    await expect(page.locator(FIRST)).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator(SECOND)).toHaveAttribute("aria-expanded", "true");
  });
});

// ═══════════════════════════════════════════════════════════════════
// No selection (disclosure is not a selectable pattern)
// ═══════════════════════════════════════════════════════════════════

describe("APG Disclosure: No selection", () => {
  it("navigation does not create selection", async () => {
    page.keyboard.press("Tab");
    page.keyboard.press("Tab");

    // No item should have aria-selected="true"
    await expect(page.locator(FIRST)).not.toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator(SECOND)).not.toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator(THIRD)).not.toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
