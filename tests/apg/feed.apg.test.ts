/**
 * APG Feed Pattern — Headless Test (Playwright-subset API)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/feed/
 *
 * W3C Feed Pattern:
 *   - Scrollable list of articles (role=article within role=feed)
 *   - Page Down: focus next article
 *   - Page Up: focus previous article
 *   - No wrap (no loop)
 *   - No selection (articles are read, not selected)
 *   - Each article: aria-posinset, aria-setsize, aria-labelledby, aria-describedby
 *
 * Config: vertical, no-loop, no-selection
 *
 * API: page.locator / page.keyboard.press / expect(loc).toBeFocused / toHaveAttribute
 * Same code runs in vitest headless, browser TestBot, and Playwright E2E.
 */

import { expect as osExpect } from "@os-devtool/testing/expect";
import { createHeadlessPage } from "@os-devtool/testing/page";
import { afterEach, beforeEach, describe, it } from "vitest";
import {
  FeedApp,
  FeedPattern,
} from "@/pages/apg-showcase/patterns/FeedPattern";

// ─── Test Setup (goto + click — Playwright isomorphic) ───

const ARTICLES = [
  "article-1",
  "article-2",
  "article-3",
  "article-4",
  "article-5",
];

let page: ReturnType<typeof createHeadlessPage>;

beforeEach(() => {
  page = createHeadlessPage(FeedApp, FeedPattern);
  page.goto("/");
  page.click("article-1"); // focus the first article
});

afterEach(() => {
  page.cleanup();
});

const expect = osExpect;

// ═══════════════════════════════════════════════════
// Navigation (Arrow Keys)
// ═══════════════════════════════════════════════════

describe("APG Feed: Navigation (Arrow Keys)", () => {
  it("Down Arrow: moves focus to next item", async () => {
    await expect(page.locator("#article-1")).toBeFocused();

    page.keyboard.press("ArrowDown");

    await expect(page.locator("#article-2")).toBeFocused();
    await expect(page.locator("#article-2")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#article-1")).toHaveAttribute("tabindex", "-1");
  });

  it("Up Arrow: moves focus to previous item", async () => {
    page.keyboard.press("ArrowDown");
    await expect(page.locator("#article-2")).toBeFocused();

    page.keyboard.press("ArrowUp");

    await expect(page.locator("#article-1")).toBeFocused();
    await expect(page.locator("#article-1")).toHaveAttribute("tabindex", "0");
  });

  it("ArrowDown at last item: focus stays (clamp)", async () => {
    // Navigate to last
    for (let i = 0; i < 20; i++) page.keyboard.press("ArrowDown");
    await expect(page.locator("#article-5")).toBeFocused();
    await expect(page.locator("#article-5")).toHaveAttribute("tabindex", "0");

    page.keyboard.press("ArrowDown");

    await expect(page.locator("#article-5")).toBeFocused();
  });

  it("ArrowUp at first item: focus stays (clamp)", async () => {
    await expect(page.locator("#article-1")).toBeFocused();
    await expect(page.locator("#article-1")).toHaveAttribute("tabindex", "0");

    page.keyboard.press("ArrowUp");

    await expect(page.locator("#article-1")).toBeFocused();
  });

  it("Home: moves to first item", async () => {
    page.keyboard.press("ArrowDown");
    page.keyboard.press("ArrowDown");

    page.keyboard.press("Home");

    await expect(page.locator("#article-1")).toBeFocused();
    await expect(page.locator("#article-1")).toHaveAttribute("tabindex", "0");
  });

  it("End: moves to last item", async () => {
    page.keyboard.press("End");

    await expect(page.locator("#article-5")).toBeFocused();
    await expect(page.locator("#article-5")).toHaveAttribute("tabindex", "0");
  });

  it("navigation does not create selection (aria-selected absent)", async () => {
    page.keyboard.press("ArrowDown");
    page.keyboard.press("ArrowDown");

    // No article should have aria-selected
    for (const id of ARTICLES) {
      await expect(page.locator(`#${id}`)).not.toHaveAttribute(
        "aria-selected",
        "true",
      );
    }
  });
});

// ═══════════════════════════════════════════════════
// Feed-Specific: Page Down / Page Up (article-level navigation)
// W3C APG: "Page Down: Move focus to next article."
//          "Page Up: Move focus to previous article."
// ═══════════════════════════════════════════════════

describe("APG Feed: Page Down / Page Up", () => {
  it("Page Down: moves focus to next article", async () => {
    page.keyboard.press("PageDown");

    await expect(page.locator("#article-2")).toBeFocused();
    await expect(page.locator("#article-2")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#article-1")).toHaveAttribute("tabindex", "-1");
  });

  it("Page Up: moves focus to previous article", async () => {
    page.click("article-3");

    page.keyboard.press("PageUp");

    await expect(page.locator("#article-2")).toBeFocused();
    await expect(page.locator("#article-2")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#article-3")).toHaveAttribute("tabindex", "-1");
  });

  it("Page Down at last article: focus stays (no wrap)", async () => {
    page.click("article-5");

    page.keyboard.press("PageDown");

    await expect(page.locator("#article-5")).toBeFocused();
    await expect(page.locator("#article-5")).toHaveAttribute("tabindex", "0");
  });

  it("Page Up at first article: focus stays (no wrap)", async () => {
    page.keyboard.press("PageUp");

    await expect(page.locator("#article-1")).toBeFocused();
    await expect(page.locator("#article-1")).toHaveAttribute("tabindex", "0");
  });

  it("Page Down x 3: progressive navigation", async () => {
    page.keyboard.press("PageDown");
    page.keyboard.press("PageDown");
    page.keyboard.press("PageDown");

    await expect(page.locator("#article-4")).toBeFocused();
  });

  it("Page Up x 2: back navigation", async () => {
    page.click("article-4");

    page.keyboard.press("PageUp");
    page.keyboard.press("PageUp");

    await expect(page.locator("#article-2")).toBeFocused();
  });
});

// ═══════════════════════════════════════════════════
// DOM Projection: ARIA attributes
// ═══════════════════════════════════════════════════

describe("APG Feed: DOM Projection (attrs)", () => {
  it("items have role=article (W3C: feed children are articles)", async () => {
    for (const id of ARTICLES) {
      await expect(page.locator(`#${id}`)).toHaveAttribute("role", "article");
    }
  });

  it("focused article: tabindex=0, others: tabindex=-1 (roving tabindex)", async () => {
    page.click("article-3");

    await expect(page.locator("#article-3")).toHaveAttribute("tabindex", "0");
    for (const id of ARTICLES.filter((i) => i !== "article-3")) {
      await expect(page.locator(`#${id}`)).toHaveAttribute("tabindex", "-1");
    }
  });

  it("focused article: data-focused=true", async () => {
    page.click("article-2");

    await expect(page.locator("#article-2")).toHaveAttribute(
      "data-focused",
      "true",
    );
  });
});
