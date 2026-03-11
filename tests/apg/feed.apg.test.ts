/**
 * APG Feed Pattern — Contract Test (Playwright 동형)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/feed/
 *
 * 1경계: page = 유일한 테스트 API.
 * Action: page.keyboard.press / page.click
 * Assert: page.locator → toBeFocused, toHaveAttribute
 *
 * Feed: scrollable article list. PageDown/PageUp navigate articles.
 * Config: vertical, no-loop, no-selection
 */

import { defineApp } from "@os-sdk/app/defineApp/index";
import { expect as osExpect } from "@os-testing/expect";
import { createPage } from "@os-testing/page";
import type { Page } from "@os-testing/types";
import { describe, it } from "vitest";
import {
  assertBoundaryClamp,
  assertHomeEnd,
  assertNoSelection,
  assertVerticalNav,
} from "./helpers/contracts";

const expect = osExpect;

// ─── Test Data ───

const ARTICLES = [
  "article-1",
  "article-2",
  "article-3",
  "article-4",
  "article-5",
];

// ─── Factory ───

function createFeed(focusedItem = "article-1"): {
  page: Page;
  cleanup: () => void;
} {
  const app = defineApp("test-feed", {});
  const zone = app.createZone("feed");
  zone.bind("feed", {
    getItems: () => ARTICLES,
  });
  const { page, cleanup } = createPage(app);
  page.goto("/");
  page.click(focusedItem);
  return { page, cleanup };
}

// ═══════════════════════════════════════════════════
// Navigation (Arrow Keys)
// ═══════════════════════════════════════════════════

describe("APG Feed: Navigation (Arrow Keys)", () => {
  assertVerticalNav(createFeed);
  assertBoundaryClamp(createFeed, {
    firstId: "article-1",
    lastId: "article-5",
    axis: "vertical",
  });
  assertHomeEnd(createFeed, {
    firstId: "article-1",
    lastId: "article-5",
  });
  assertNoSelection(createFeed, ARTICLES);
});

// ═══════════════════════════════════════════════════
// Feed-Specific: Page Down / Page Up
// W3C APG: "Page Down: Move focus to next article."
//          "Page Up: Move focus to previous article."
// ═══════════════════════════════════════════════════

describe("APG Feed: Page Down / Page Up", () => {
  it("Page Down: moves focus to next article", async () => {
    const { page, cleanup } = createFeed("article-1");
    page.keyboard.press("PageDown");

    await expect(page.locator("#article-2")).toBeFocused();
    await expect(page.locator("#article-2")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#article-1")).toHaveAttribute("tabindex", "-1");
    cleanup();
  });

  it("Page Up: moves focus to previous article", async () => {
    const { page, cleanup } = createFeed("article-3");
    page.keyboard.press("PageUp");

    await expect(page.locator("#article-2")).toBeFocused();
    await expect(page.locator("#article-2")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#article-3")).toHaveAttribute("tabindex", "-1");
    cleanup();
  });

  it("Page Down at last article: focus stays (no wrap)", async () => {
    const { page, cleanup } = createFeed("article-5");
    page.keyboard.press("PageDown");

    await expect(page.locator("#article-5")).toBeFocused();
    await expect(page.locator("#article-5")).toHaveAttribute("tabindex", "0");
    cleanup();
  });

  it("Page Up at first article: focus stays (no wrap)", async () => {
    const { page, cleanup } = createFeed("article-1");
    page.keyboard.press("PageUp");

    await expect(page.locator("#article-1")).toBeFocused();
    await expect(page.locator("#article-1")).toHaveAttribute("tabindex", "0");
    cleanup();
  });

  it("Page Down x 3: progressive navigation", async () => {
    const { page, cleanup } = createFeed("article-1");
    page.keyboard.press("PageDown");
    page.keyboard.press("PageDown");
    page.keyboard.press("PageDown");

    await expect(page.locator("#article-4")).toBeFocused();
    cleanup();
  });

  it("Page Up x 2: back navigation", async () => {
    const { page, cleanup } = createFeed("article-4");
    page.keyboard.press("PageUp");
    page.keyboard.press("PageUp");

    await expect(page.locator("#article-2")).toBeFocused();
    cleanup();
  });
});

// ═══════════════════════════════════════════════════
// DOM Projection: ARIA attributes
// ═══════════════════════════════════════════════════

describe("APG Feed: DOM Projection (attrs)", () => {
  it("items have role=article", async () => {
    const { page, cleanup } = createFeed("article-1");
    for (const id of ARTICLES) {
      await expect(page.locator(`#${id}`)).toHaveAttribute("role", "article");
    }
    cleanup();
  });

  it("focused article: tabindex=0, others: tabindex=-1", async () => {
    const { page, cleanup } = createFeed("article-3");
    await expect(page.locator("#article-3")).toHaveAttribute("tabindex", "0");
    for (const id of ARTICLES.filter((i) => i !== "article-3")) {
      await expect(page.locator(`#${id}`)).toHaveAttribute("tabindex", "-1");
    }
    cleanup();
  });

  it("focused article: data-focused=true", async () => {
    const { page, cleanup } = createFeed("article-2");
    await expect(page.locator("#article-2")).toHaveAttribute(
      "data-focused",
      "true",
    );
    cleanup();
  });
});
