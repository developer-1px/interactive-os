/**
 * Navigation Tree (Finder-like) — Contract Test (Playwright 동형)
 *
 * 1경계: page = 유일한 테스트 API.
 * Action: page.keyboard.press / page.click
 * Assert: page.locator → toBeFocused, toHaveAttribute
 *
 * Config: select.followFocus: true, select.mode: "single"
 *
 * Navigation Tree differs from Application Tree:
 *   - Click on folder → focuses AND expands (via inputmap click: [OS_EXPAND()])
 *   - Arrow keys with followFocus → auto-selects
 *   - ArrowRight on collapsed → expands
 *   - ArrowLeft on expanded → collapses
 */

import { createPage } from "@os-testing/page";
import { expect as osExpect } from "@os-testing/expect";
import type { Page } from "@os-testing/types";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { describe, it } from "vitest";

const expect = osExpect;

// ─── Test Data ───

const NAV_ITEMS = [
  "folder:docs",
  "file:readme",
  "file:guide",
  "folder:src",
  "file:index",
];
const EXPANDABLE = new Set(["folder:docs", "folder:src"]);
const TREE_LEVELS = new Map([
  ["folder:docs", 1],
  ["file:readme", 2],
  ["file:guide", 2],
  ["folder:src", 1],
  ["file:index", 2],
]);

// ─── Factory ───

function createNavTreeApp() {
  const app = defineApp("test-navtree", {});
  const zone = app.createZone("nav-tree");
  zone.bind({
    role: "tree",
    getItems: () => NAV_ITEMS,
    getExpandableItems: () => EXPANDABLE,
    getTreeLevels: () => TREE_LEVELS,
    options: {
      select: {
        mode: "single" as const,
        followFocus: true,
        toggle: false,
      },
    },
  });
  return app;
}

/** Focus a non-expandable item (no click side effects) */
function createNavTree(focusedItem = "file:readme"): { page: Page; cleanup: () => void } {
  const app = createNavTreeApp();
  const { page, cleanup } = createPage(app);
  page.goto("/");
  page.click(focusedItem);
  return { page, cleanup };
}

/** Focus an expandable item (click also expands it) */
function createNavTreeExpanded(folderId = "folder:docs"): { page: Page; cleanup: () => void } {
  const app = createNavTreeApp();
  const { page, cleanup } = createPage(app);
  page.goto("/");
  page.click(folderId); // click on expandable → focuses AND expands
  return { page, cleanup };
}

// ═══════════════════════════════════════════════════
// followFocus: Arrow keys auto-select
// ═══════════════════════════════════════════════════

describe("Navigation Tree: followFocus", () => {
  it("ArrowDown moves focus AND selects the next item", async () => {
    const { page, cleanup } = createNavTree("file:readme");
    page.keyboard.press("ArrowDown");

    await expect(page.locator("#file:guide")).toBeFocused();
    await expect(page.locator("#file:guide")).toHaveAttribute("aria-selected", "true");
    cleanup();
  });

  it("ArrowUp moves focus AND selects the previous item", async () => {
    const { page, cleanup } = createNavTree("file:guide");
    page.keyboard.press("ArrowUp");

    await expect(page.locator("#file:readme")).toBeFocused();
    await expect(page.locator("#file:readme")).toHaveAttribute("aria-selected", "true");
    cleanup();
  });

  it("multiple ArrowDown: selection follows focus (single-select)", async () => {
    const { page, cleanup } = createNavTree("file:readme");
    page.keyboard.press("ArrowDown");
    await expect(page.locator("#file:guide")).toHaveAttribute("aria-selected", "true");

    page.keyboard.press("ArrowDown");
    await expect(page.locator("#folder:src")).toBeFocused();
    await expect(page.locator("#folder:src")).toHaveAttribute("aria-selected", "true");
    // Previous item deselected (single-select)
    await expect(page.locator("#file:guide")).toHaveAttribute("aria-selected", "false");
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Expansion: folders expand/collapse
// ═══════════════════════════════════════════════════

describe("Navigation Tree: Expansion", () => {
  it("ArrowRight on collapsed folder → expands", async () => {
    // Start expanded (click), collapse, then expand with ArrowRight
    const { page, cleanup } = createNavTreeExpanded("folder:docs");
    await expect(page.locator("#folder:docs")).toHaveAttribute("aria-expanded", "true");

    page.keyboard.press("ArrowLeft"); // collapse
    await expect(page.locator("#folder:docs")).toHaveAttribute("aria-expanded", "false");

    page.keyboard.press("ArrowRight"); // expand
    await expect(page.locator("#folder:docs")).toHaveAttribute("aria-expanded", "true");
    cleanup();
  });

  it("ArrowLeft on expanded folder → collapses", async () => {
    const { page, cleanup } = createNavTreeExpanded("folder:docs");
    await expect(page.locator("#folder:docs")).toHaveAttribute("aria-expanded", "true");

    page.keyboard.press("ArrowLeft");
    await expect(page.locator("#folder:docs")).toHaveAttribute("aria-expanded", "false");
    cleanup();
  });

  it("Enter on folder → toggles expansion", async () => {
    const { page, cleanup } = createNavTreeExpanded("folder:docs");
    await expect(page.locator("#folder:docs")).toHaveAttribute("aria-expanded", "true");

    page.keyboard.press("Enter"); // collapse
    await expect(page.locator("#folder:docs")).toHaveAttribute("aria-expanded", "false");

    page.keyboard.press("Enter"); // expand
    await expect(page.locator("#folder:docs")).toHaveAttribute("aria-expanded", "true");
    cleanup();
  });

  it("ArrowRight on file → does NOT expand", async () => {
    const { page, cleanup } = createNavTree("file:readme");
    page.keyboard.press("ArrowRight");
    await expect(page.locator("#file:readme")).not.toHaveAttribute("aria-expanded");
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// Activation: Enter on file
// ═══════════════════════════════════════════════════

describe("Navigation Tree: Activation", () => {
  it("Enter on file → does NOT expand", async () => {
    const { page, cleanup } = createNavTree("file:readme");
    page.keyboard.press("Enter");
    await expect(page.locator("#file:readme")).not.toHaveAttribute("aria-expanded");
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// DOM Projection
// ═══════════════════════════════════════════════════

describe("Navigation Tree: DOM Projection", () => {
  it("folder has aria-expanded after click (expanded)", async () => {
    const { page, cleanup } = createNavTreeExpanded("folder:docs");
    await expect(page.locator("#folder:docs")).toHaveAttribute("aria-expanded", "true");
    cleanup();
  });

  it("file does NOT have aria-expanded", async () => {
    const { page, cleanup } = createNavTree("file:readme");
    await expect(page.locator("#file:readme")).not.toHaveAttribute("aria-expanded");
    cleanup();
  });

  it("focused item has tabIndex=0, others -1", async () => {
    const { page, cleanup } = createNavTree("file:readme");
    await expect(page.locator("#file:readme")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#folder:docs")).toHaveAttribute("tabindex", "-1");
    cleanup();
  });
});
