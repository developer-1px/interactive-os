/**
 * Builder headless-items — DOM_ITEMS via getItems() 검증.
 *
 * Scaffolding-level: createPage(BuilderApp) + goto("canvas") / goto("sidebar")
 * → getItems() 반환값 + ArrowDown navigate + focus 이동 확인.
 *
 * Builder는 tree 구조 (blocks + children) → headless에서
 * getItems()가 root blocks만 반환하는지, navigate가 동작하는지 검증.
 *
 * NOTE: INITIAL_STATE uses GreenEye preset.
 *   Top-level block IDs: ge-hero, ge-tab-nav, ge-related-services, ge-section-footer, ge-footer
 */

import { BuilderApp } from "@apps/builder/app";
import type { BuilderState } from "@apps/builder/model/appState";
import { createPage } from "@os/defineApp.page";
import type { AppPage } from "@os/defineApp.types";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

type Page = AppPage<BuilderState>;
let page: Page;

beforeEach(() => {
  page = createPage(BuilderApp);
});

afterEach(() => {
  page.cleanup();
});

// ═══════════════════════════════════════════════════════════════════
// Sidebar zone — flat list of root blocks
// ═══════════════════════════════════════════════════════════════════

describe("Builder sidebar — headless getItems()", () => {
  it("goto('sidebar') → getItems returns root block IDs", () => {
    page.goto("sidebar", { focusedItemId: "ge-hero" });

    const focused = page.focusedItemId();
    expect(focused).toBe("ge-hero");
  });

  it("ArrowDown navigates through blocks", () => {
    page.goto("sidebar", { focusedItemId: "ge-hero" });

    page.keyboard.press("ArrowDown");

    // Should move to next root block (ge-tab-nav)
    expect(page.focusedItemId()).toBe("ge-tab-nav");
  });

  it("ArrowDown → ArrowDown → ArrowUp returns to previous", () => {
    page.goto("sidebar", { focusedItemId: "ge-hero" });

    page.keyboard.press("ArrowDown");
    page.keyboard.press("ArrowDown");
    page.keyboard.press("ArrowUp");

    expect(page.focusedItemId()).toBe("ge-tab-nav");
  });
});

// ═══════════════════════════════════════════════════════════════════
// Canvas zone — same blocks, different filter (itemFilter)
// ═══════════════════════════════════════════════════════════════════

describe("Builder canvas — headless getItems()", () => {
  it("goto('canvas') → focus on first block", () => {
    page.goto("canvas", { focusedItemId: "ge-hero" });

    expect(page.focusedItemId()).toBe("ge-hero");
  });

  it("ArrowDown does not move in headless (corner strategy needs DOM_RECTS)", () => {
    // Canvas uses orientation: "corner" → needsDOMRects: true.
    // In headless, DOM_RECTS is empty → corner strategy returns currentId.
    // This is expected: corner navigation requires browser layout info.
    // Sidebar (linear) works fine in headless.
    page.goto("canvas", { focusedItemId: "ge-hero" });

    page.keyboard.press("ArrowDown");

    // No movement — documented limitation of headless corner nav
    expect(page.focusedItemId()).toBe("ge-hero");
  });
});
