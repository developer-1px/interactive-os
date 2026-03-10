/**
 * APG Tree View Pattern — Contract Test (Playwright 동형)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
 *
 * 1경계: page = 유일한 테스트 API.
 * Action: page.keyboard.press / page.click
 * Assert: page.locator → toBeFocused, toHaveAttribute
 *
 * Note: tree role inputmap includes `click: [OS_EXPAND()]`.
 * Clicking an expandable item toggles aria-expanded.
 */

import { createPage } from "@os-devtool/testing/page";
import { expect as osExpect } from "@os-devtool/testing/expect";
import type { Page } from "@os-devtool/testing/types";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { describe, it } from "vitest";
import {
  assertBoundaryClamp,
  assertHomeEnd,
  assertVerticalNav,
} from "./helpers/contracts";

const expect = osExpect;

// ─── Test Data ───

const ALL_ITEMS = ["section-1", "child-1a", "child-1b", "section-2", "leaf-2a"];
const EXPANDABLE = new Set(["section-1", "section-2"]);
const TREE_LEVELS = new Map([
  ["section-1", 1],
  ["child-1a", 2],
  ["child-1b", 2],
  ["section-2", 1],
  ["leaf-2a", 2],
]);

// ─── Factories ───

function createTreeApp() {
  const app = defineApp("test-tree", {});
  const zone = app.createZone("tree");
  zone.bind({
    role: "tree",
    getItems: () => ALL_ITEMS,
    getExpandableItems: () => EXPANDABLE,
    getTreeLevels: () => TREE_LEVELS,
    options: {
      select: {
        mode: "single" as const,
        followFocus: false,
        toggle: true,
      },
    },
  });
  return app;
}

/**
 * Factory: creates tree, focuses on a leaf item (no side effects).
 * For expandable items, click triggers OS_EXPAND — use focusExpandable().
 */
function createTree(focusedItem = "child-1a"): { page: Page; cleanup: () => void } {
  const app = createTreeApp();
  const { page, cleanup } = createPage(app);
  page.goto("/");
  page.click(focusedItem);
  return { page, cleanup };
}

/**
 * Factory: focuses expandable item (which also expands it via click).
 */
function createTreeExpanded(itemId = "section-1"): { page: Page; cleanup: () => void } {
  const app = createTreeApp();
  const { page, cleanup } = createPage(app);
  page.goto("/");
  page.click(itemId); // click on expandable → focuses AND expands
  return { page, cleanup };
}

function createMultiSelectTree(focusedItem = "child-1a"): {
  page: Page;
  cleanup: () => void;
} {
  const app = defineApp("test-tree-multi", {});
  const zone = app.createZone("tree");
  zone.bind({
    role: "tree",
    getItems: () => ALL_ITEMS,
    getExpandableItems: () => EXPANDABLE,
    getTreeLevels: () => TREE_LEVELS,
    options: {
      select: {
        mode: "multiple" as const,
        followFocus: false,
        toggle: true,
        range: true,
      },
    },
  });
  const { page, cleanup } = createPage(app);
  page.goto("/");
  page.click(focusedItem);
  return { page, cleanup };
}

// ═══════════════════════════════════════════════════
// Navigation
// ═══════════════════════════════════════════════════

describe("APG Tree: Navigation", () => {
  assertVerticalNav(createTree);
  assertBoundaryClamp(createTree, {
    firstId: "section-1",
    lastId: "leaf-2a",
    axis: "vertical",
  });
  assertHomeEnd(createTree, {
    firstId: "section-1",
    lastId: "leaf-2a",
  });
});

// ═══════════════════════════════════════════════════
// Tree-Specific: Expansion via ArrowRight/Left
// ═══════════════════════════════════════════════════

describe("APG Tree: Expansion (pressKey pipeline)", () => {
  it("ArrowRight on collapsed node: expands", async () => {
    // Start expanded (click triggers OS_EXPAND), then collapse first
    const { page, cleanup } = createTreeExpanded("section-1");
    await expect(page.locator("#section-1")).toHaveAttribute("aria-expanded", "true");

    // Collapse
    page.keyboard.press("ArrowLeft");
    await expect(page.locator("#section-1")).toHaveAttribute("aria-expanded", "false");

    // Now expand via ArrowRight
    page.keyboard.press("ArrowRight");
    await expect(page.locator("#section-1")).toHaveAttribute("aria-expanded", "true");
    cleanup();
  });

  it("ArrowLeft on expanded node: collapses", async () => {
    const { page, cleanup } = createTreeExpanded("section-1");
    await expect(page.locator("#section-1")).toHaveAttribute("aria-expanded", "true");

    page.keyboard.press("ArrowLeft");
    await expect(page.locator("#section-1")).toHaveAttribute("aria-expanded", "false");
    cleanup();
  });

  it("ArrowRight on leaf: does NOT expand", async () => {
    const { page, cleanup } = createTree("child-1a");
    page.keyboard.press("ArrowRight");
    await expect(page.locator("#child-1a")).not.toHaveAttribute("aria-expanded");
    await expect(page.locator("#child-1a")).toBeFocused();
    cleanup();
  });

  it("ArrowRight on an open node: moves focus to the first child node", async () => {
    const { page, cleanup } = createTreeExpanded("section-1");
    await expect(page.locator("#section-1")).toHaveAttribute("aria-expanded", "true");

    page.keyboard.press("ArrowRight"); // On open node -> move to child
    await expect(page.locator("#child-1a")).toBeFocused();
    cleanup();
  });

  it("ArrowLeft on a closed or leaf node: moves focus to its parent node", async () => {
    const { page, cleanup } = createTree("child-1a");
    page.keyboard.press("ArrowLeft"); // Move to parent
    await expect(page.locator("#section-1")).toBeFocused();
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Tree-Specific: Selection (Space key)
// ═══════════════════════════════════════════════════

describe("APG Tree: Selection (Space key)", () => {
  it("Space on item: toggles selection state", async () => {
    const { page, cleanup } = createTree("child-1a");
    // click selects the item (resolveMouse)
    await expect(page.locator("#child-1a")).toHaveAttribute("aria-selected", "true");

    // Space toggles OFF
    page.keyboard.press("Space");
    await expect(page.locator("#child-1a")).toHaveAttribute("aria-selected", "false");

    // Space toggles ON
    page.keyboard.press("Space");
    await expect(page.locator("#child-1a")).toHaveAttribute("aria-selected", "true");
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Tree-Specific: Activation (Enter key)
// ═══════════════════════════════════════════════════

describe("APG Tree: Activation (Enter key)", () => {
  it("Enter on leaf: does NOT expand (activate only)", async () => {
    const { page, cleanup } = createTree("child-1a");
    page.keyboard.press("Enter");
    await expect(page.locator("#child-1a")).not.toHaveAttribute("aria-expanded");
    cleanup();
  });

  it("Enter on section: toggles expand", async () => {
    // Start expanded, Enter should collapse
    const { page, cleanup } = createTreeExpanded("section-1");
    await expect(page.locator("#section-1")).toHaveAttribute("aria-expanded", "true");

    page.keyboard.press("Enter");
    await expect(page.locator("#section-1")).toHaveAttribute("aria-expanded", "false");

    // Enter again to expand
    page.keyboard.press("Enter");
    await expect(page.locator("#section-1")).toHaveAttribute("aria-expanded", "true");
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// DOM Projection
// ═══════════════════════════════════════════════════

describe("APG Tree: DOM Projection", () => {
  it("treeitem role is assigned to items", async () => {
    const { page, cleanup } = createTree("child-1a");
    await expect(page.locator("#child-1a")).toHaveAttribute("role", "treeitem");
    cleanup();
  });

  it("focused item has tabindex=0, others have -1", async () => {
    const { page, cleanup } = createTree("child-1a");
    await expect(page.locator("#child-1a")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#section-1")).toHaveAttribute("tabindex", "-1");
    cleanup();
  });

  it("focused item has data-focused=true", async () => {
    const { page, cleanup } = createTree("child-1a");
    await expect(page.locator("#child-1a")).toHaveAttribute("data-focused", "true");
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Multi-Selection (Shift+Arrow)
// ═══════════════════════════════════════════════════

describe("APG Tree: Multi-Selection (Shift+Arrow)", () => {
  it("Shift+ArrowDown: expands selection to the next visible node", async () => {
    const { page, cleanup } = createMultiSelectTree("child-1a");
    // click already selects child-1a
    await expect(page.locator("#child-1a")).toHaveAttribute("aria-selected", "true");

    page.keyboard.press("Shift+ArrowDown");
    await expect(page.locator("#child-1a")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#child-1b")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#child-1b")).toBeFocused();
    cleanup();
  });

  it("Shift+ArrowUp: expands selection to the previous visible node", async () => {
    const { page, cleanup } = createMultiSelectTree("child-1b");
    // click already selects child-1b
    await expect(page.locator("#child-1b")).toHaveAttribute("aria-selected", "true");

    page.keyboard.press("Shift+ArrowUp");
    await expect(page.locator("#child-1a")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#child-1b")).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#child-1a")).toBeFocused();
    cleanup();
  });
});
