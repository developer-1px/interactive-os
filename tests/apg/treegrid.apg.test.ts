/**
 * APG Treegrid Pattern — Contract Test (Playwright 동형)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/
 *
 * 1경계: page = 유일한 테스트 API.
 * Action: page.keyboard.press / page.click
 * Assert: page.locator → toBeFocused, toHaveAttribute
 *
 * Note: treegrid inputmap includes `click: [OS_EXPAND()]`.
 * Clicking an expandable row toggles aria-expanded.
 */

import { createPage } from "@os-testing/page";
import { expect as osExpect } from "@os-testing/expect";
import type { Page } from "@os-testing/types";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { describe, it } from "vitest";
import {
  assertBoundaryClamp,
  assertHomeEnd,
  assertVerticalNav,
} from "./helpers/contracts";

const expect = osExpect;

// ─── Test Data ───

const ALL_ROWS = ["msg-1", "msg-1a", "msg-1b", "msg-2", "msg-2a", "msg-3"];
const EXPANDABLE = new Set(["msg-1", "msg-2"]);
const TREE_LEVELS = new Map([
  ["msg-1", 1],
  ["msg-1a", 2],
  ["msg-1b", 2],
  ["msg-2", 1],
  ["msg-2a", 2],
  ["msg-3", 1],
]);

// ─── Factories ───

function createTreegridApp() {
  const app = defineApp("test-treegrid", {});
  const zone = app.createZone("treegrid");
  zone.bind("treegrid", {
    getItems: () => ALL_ROWS,
    getExpandableItems: () => EXPANDABLE,
    getTreeLevels: () => TREE_LEVELS,
  });
  return app;
}

/** Focus a non-expandable item (no click side effects) */
function createTreegrid(focusedItem = "msg-1a"): { page: Page; cleanup: () => void } {
  const app = createTreegridApp();
  const { page, cleanup } = createPage(app);
  page.goto("/");
  page.click(focusedItem);
  return { page, cleanup };
}

/** Focus an expandable item (click also expands it) */
function createTreegridExpanded(itemId = "msg-1"): { page: Page; cleanup: () => void } {
  const app = createTreegridApp();
  const { page, cleanup } = createPage(app);
  page.goto("/");
  page.click(itemId); // click on expandable → focuses AND expands
  return { page, cleanup };
}

// ═══════════════════════════════════════════════════
// Vertical Navigation (N1-N2)
// ═══════════════════════════════════════════════════

describe("APG Treegrid: Vertical Navigation (N1-N2)", () => {
  assertVerticalNav(createTreegrid);
  assertBoundaryClamp(createTreegrid, {
    firstId: "msg-1",
    lastId: "msg-3",
    axis: "vertical",
  });
  assertHomeEnd(createTreegrid, {
    firstId: "msg-1",
    lastId: "msg-3",
  });
});

// ═══════════════════════════════════════════════════
// Right Arrow: Expand / Navigate to child (N3-N4)
// ═══════════════════════════════════════════════════

describe("APG Treegrid: Right Arrow Expand/Navigate (N3-N4)", () => {
  it("N3: Right Arrow on collapsed parent row -- expands", async () => {
    // Start expanded (click triggers expand), then collapse first
    const { page, cleanup } = createTreegridExpanded("msg-1");
    await expect(page.locator("#msg-1")).toHaveAttribute("aria-expanded", "true");

    page.keyboard.press("ArrowLeft"); // collapse
    await expect(page.locator("#msg-1")).toHaveAttribute("aria-expanded", "false");

    page.keyboard.press("ArrowRight"); // expand
    await expect(page.locator("#msg-1")).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#msg-1")).toBeFocused();
    cleanup();
  });

  it("N4: Right Arrow on expanded parent row -- moves to first child", async () => {
    const { page, cleanup } = createTreegridExpanded("msg-1");
    await expect(page.locator("#msg-1")).toHaveAttribute("aria-expanded", "true");

    page.keyboard.press("ArrowRight"); // navigate to first child
    await expect(page.locator("#msg-1a")).toBeFocused();
    cleanup();
  });

  it("Right Arrow on leaf row (no children) -- does nothing", async () => {
    const { page, cleanup } = createTreegrid("msg-3");
    page.keyboard.press("ArrowRight");
    await expect(page.locator("#msg-3")).toBeFocused();
    await expect(page.locator("#msg-3")).not.toHaveAttribute("aria-expanded");
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Left Arrow: Collapse / Navigate to parent (N5-N6)
// ═══════════════════════════════════════════════════

describe("APG Treegrid: Left Arrow Collapse/Navigate (N5-N6)", () => {
  it("N5: Left Arrow on expanded parent row -- collapses", async () => {
    const { page, cleanup } = createTreegridExpanded("msg-1");
    await expect(page.locator("#msg-1")).toHaveAttribute("aria-expanded", "true");

    page.keyboard.press("ArrowLeft");
    await expect(page.locator("#msg-1")).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#msg-1")).toBeFocused();
    cleanup();
  });

  it("N6: Left Arrow on child row -- moves to parent", async () => {
    const { page, cleanup } = createTreegrid("msg-1a");
    page.keyboard.press("ArrowLeft");
    await expect(page.locator("#msg-1")).toBeFocused();
    cleanup();
  });

  it("Left Arrow on top-level leaf -- stays", async () => {
    const { page, cleanup } = createTreegrid("msg-3");
    page.keyboard.press("ArrowLeft");
    await expect(page.locator("#msg-3")).toBeFocused();
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Enter: Toggle expand (E1)
// ═══════════════════════════════════════════════════

describe("APG Treegrid: Enter toggles expansion (E1)", () => {
  it("Enter on expanded parent -- collapses", async () => {
    const { page, cleanup } = createTreegridExpanded("msg-1");
    await expect(page.locator("#msg-1")).toHaveAttribute("aria-expanded", "true");

    page.keyboard.press("Enter");
    await expect(page.locator("#msg-1")).toHaveAttribute("aria-expanded", "false");
    cleanup();
  });

  it("Enter toggles expand round-trip", async () => {
    const { page, cleanup } = createTreegridExpanded("msg-1");
    // Already expanded after click
    page.keyboard.press("Enter"); // collapse
    await expect(page.locator("#msg-1")).toHaveAttribute("aria-expanded", "false");

    page.keyboard.press("Enter"); // expand
    await expect(page.locator("#msg-1")).toHaveAttribute("aria-expanded", "true");
    cleanup();
  });

  it("Enter on leaf -- does NOT expand (no children)", async () => {
    const { page, cleanup } = createTreegrid("msg-3");
    page.keyboard.press("Enter");
    await expect(page.locator("#msg-3")).not.toHaveAttribute("aria-expanded");
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Selection (Space)
// ═══════════════════════════════════════════════════

describe("APG Treegrid: Selection (Space)", () => {
  it("Space toggles selection on focused row", async () => {
    const { page, cleanup } = createTreegrid("msg-1a");
    // click selects in treegrid (multiple mode)
    await expect(page.locator("#msg-1a")).toHaveAttribute("aria-selected", "true");

    page.keyboard.press("Space"); // toggle off
    await expect(page.locator("#msg-1a")).toHaveAttribute("aria-selected", "false");

    page.keyboard.press("Space"); // toggle on
    await expect(page.locator("#msg-1a")).toHaveAttribute("aria-selected", "true");
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Shift+Arrow: Selection range (S2)
// ═══════════════════════════════════════════════════

describe("APG Treegrid: Shift+Arrow selection range (S2)", () => {
  it("Shift+ArrowDown extends selection to next row", async () => {
    const { page, cleanup } = createTreegrid("msg-1a");
    // click already selects msg-1a
    await expect(page.locator("#msg-1a")).toHaveAttribute("aria-selected", "true");

    page.keyboard.press("Shift+ArrowDown");
    await expect(page.locator("#msg-1a")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#msg-1b")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#msg-1b")).toBeFocused();
    cleanup();
  });

  it("Shift+ArrowUp extends selection to previous row", async () => {
    const { page, cleanup } = createTreegrid("msg-1b");
    await expect(page.locator("#msg-1b")).toHaveAttribute("aria-selected", "true");

    page.keyboard.press("Shift+ArrowUp");
    await expect(page.locator("#msg-1a")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#msg-1b")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#msg-1a")).toBeFocused();
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// ARIA Projection (A1-A2)
// ═══════════════════════════════════════════════════

describe("APG Treegrid: ARIA Projection (A1-A2)", () => {
  it("A1: items have role=row", async () => {
    const { page, cleanup } = createTreegrid("msg-1a");
    await expect(page.locator("#msg-1")).toHaveAttribute("role", "row");
    await expect(page.locator("#msg-3")).toHaveAttribute("role", "row");
    cleanup();
  });

  it("A2: focused item has tabIndex=0, others -1", async () => {
    const { page, cleanup } = createTreegrid("msg-1a");
    await expect(page.locator("#msg-1a")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#msg-1")).toHaveAttribute("tabindex", "-1");
    await expect(page.locator("#msg-3")).toHaveAttribute("tabindex", "-1");
    cleanup();
  });

  it("A3: focused item has data-focused=true", async () => {
    const { page, cleanup } = createTreegrid("msg-1a");
    await expect(page.locator("#msg-1a")).toHaveAttribute("data-focused", "true");
    cleanup();
  });

  it("A4: collapsed parent -- aria-expanded=false (after click→expand→collapse)", async () => {
    const { page, cleanup } = createTreegridExpanded("msg-1");
    page.keyboard.press("ArrowLeft"); // collapse
    await expect(page.locator("#msg-1")).toHaveAttribute("aria-expanded", "false");
    cleanup();
  });

  it("A5: expanded parent -- aria-expanded=true", async () => {
    const { page, cleanup } = createTreegridExpanded("msg-1");
    await expect(page.locator("#msg-1")).toHaveAttribute("aria-expanded", "true");
    cleanup();
  });

  it("A6: leaf row has NO aria-expanded (not expandable)", async () => {
    const { page, cleanup } = createTreegrid("msg-3");
    await expect(page.locator("#msg-3")).not.toHaveAttribute("aria-expanded");
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Click interaction (C1)
// ═══════════════════════════════════════════════════

describe("APG Treegrid: Click interaction (C1)", () => {
  it("click on unfocused row -- focuses it", async () => {
    const { page, cleanup } = createTreegrid("msg-1a");
    page.click("msg-1b");
    await expect(page.locator("#msg-1b")).toBeFocused();
    cleanup();
  });

  it("click on expandable row -- focuses and toggles expand", async () => {
    const { page, cleanup } = createTreegrid("msg-1a");
    // msg-2 starts without expand state; click expands it
    page.click("msg-2");
    await expect(page.locator("#msg-2")).toBeFocused();
    await expect(page.locator("#msg-2")).toHaveAttribute("aria-expanded", "true");
    cleanup();
  });
});
