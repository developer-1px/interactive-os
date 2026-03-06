/**
 * APG Feed Pattern — Contract Test (Tier 1: pressKey → attrs)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/feed/
 *
 * W3C Feed Pattern:
 *   - Scrollable list of articles (role=article within role=feed)
 *   - Page Down: focus next article
 *   - Page Up: focus previous article
 *   - Control+End: move focus past the feed (exit forward)
 *   - Control+Home: move focus before the feed (exit backward)
 *   - No wrap (no loop)
 *   - No selection (articles are read, not selected)
 *   - Tab exits the feed zone
 *   - Each article: aria-posinset, aria-setsize, aria-labelledby, aria-describedby
 *
 * Config: vertical, no-loop, no-selection, tab=escape
 *
 * Feed-specific keys (PageDown/PageUp, Ctrl+End/Home) are Zone-level
 * keybindings that map to OS_NAVIGATE and OS_TAB respectively.
 */

import { createPage } from "@os-devtool/testing/page";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { describe, expect, it } from "vitest";
import { FeedApp } from "@/pages/apg-showcase/patterns/FeedPattern";
import {
  assertBoundaryClamp,
  assertHomeEnd,
  assertNoSelection,
  assertVerticalNav,
} from "./helpers/contracts";

// ─── Test Setup (actual showcase config) ───

const ARTICLES = [
  "article-1",
  "article-2",
  "article-3",
  "article-4",
  "article-5",
];

function feedFactory(focusedItem = "article-1") {
  const page = createPage(FeedApp);
  page.goto("apg-feed", {
    items: ARTICLES,
    focusedItemId: focusedItem,
  });
  return page;
}

// ═══════════════════════════════════════════════════
// Shared contracts — arrow key navigation between articles
// ═══════════════════════════════════════════════════

describe("APG Feed: Navigation (Arrow Keys)", () => {
  assertVerticalNav(feedFactory as any);
  assertBoundaryClamp(feedFactory as any, {
    firstId: "article-1",
    lastId: "article-5",
    axis: "vertical",
  });
  assertHomeEnd(feedFactory as any, {
    firstId: "article-1",
    lastId: "article-5",
  });
  assertNoSelection(feedFactory as any);
});

// ═══════════════════════════════════════════════════
// Feed-Specific: Page Down / Page Up (article-level navigation)
// W3C APG: "Page Down: Move focus to next article."
//          "Page Up: Move focus to previous article."
// ═══════════════════════════════════════════════════

describe("APG Feed: Page Down / Page Up", () => {
  it("Page Down: moves focus to next article", () => {
    const t = feedFactory("article-1");
    t.keyboard.press("PageDown");
    expect(t.focusedItemId()).toBe("article-2");
    expect(t.attrs("article-2").tabIndex).toBe(0);
    expect(t.attrs("article-1").tabIndex).toBe(-1);
  });

  it("Page Up: moves focus to previous article", () => {
    const t = feedFactory("article-3");
    t.keyboard.press("PageUp");
    expect(t.focusedItemId()).toBe("article-2");
    expect(t.attrs("article-2").tabIndex).toBe(0);
    expect(t.attrs("article-3").tabIndex).toBe(-1);
  });

  it("Page Down at last article: focus stays (no wrap)", () => {
    const t = feedFactory("article-5");
    t.keyboard.press("PageDown");
    expect(t.focusedItemId()).toBe("article-5");
    expect(t.attrs("article-5").tabIndex).toBe(0);
  });

  it("Page Up at first article: focus stays (no wrap)", () => {
    const t = feedFactory("article-1");
    t.keyboard.press("PageUp");
    expect(t.focusedItemId()).toBe("article-1");
    expect(t.attrs("article-1").tabIndex).toBe(0);
  });

  it("Page Down × 3: progressive navigation", () => {
    const t = feedFactory("article-1");
    t.keyboard.press("PageDown");
    t.keyboard.press("PageDown");
    t.keyboard.press("PageDown");
    expect(t.focusedItemId()).toBe("article-4");
  });

  it("Page Up × 2: back navigation", () => {
    const t = feedFactory("article-4");
    t.keyboard.press("PageUp");
    t.keyboard.press("PageUp");
    expect(t.focusedItemId()).toBe("article-2");
  });
});

// ═══════════════════════════════════════════════════
// Feed-Specific: Control+End / Control+Home (exit feed)
// W3C APG: "Control+End: Move focus to the first focusable element after the feed."
//          "Control+Home: Move focus to the first focusable element before the feed."
// In OS terms: exit the feed zone (Tab forward / Tab backward).
// ═══════════════════════════════════════════════════

describe("APG Feed: Control+End / Control+Home (exit feed)", () => {
  function feedWithZoneOrder(focusedItem = "article-2") {
    const app = defineApp("test-feed-zones", {});
    const before = app.createZone("before-feed");
    before.bind({ getItems: () => ["before-1"] });
    const feed = app.createZone("apg-feed");
    feed.bind({
      role: "feed",
      getItems: () => ARTICLES,
      options: {
        navigate: {
          orientation: "vertical",
          loop: false,
          seamless: false,
          typeahead: false,
          entry: "first",
          recovery: "next",
        },
        select: { mode: "none" },
      },
    });
    const after = app.createZone("after-feed");
    after.bind({ getItems: () => ["after-1"] });
    const page = createPage(app);
    // Register all zones in order
    page.goto("before-feed", { focusedItemId: "before-1" });
    page.goto("apg-feed", { focusedItemId: focusedItem });
    page.goto("after-feed", { focusedItemId: "after-1" });
    // Activate feed zone
    page.goto("apg-feed", { focusedItemId: focusedItem });
    return page;
  }

  it("Control+End: exits the feed zone forward", () => {
    const t = feedWithZoneOrder("article-2");
    t.keyboard.press("Control+End");
    expect(t.activeZoneId()).toBe("after-feed");
  });

  it("Control+Home: exits the feed zone backward", () => {
    const t = feedWithZoneOrder("article-3");
    t.keyboard.press("Control+Home");
    expect(t.activeZoneId()).toBe("before-feed");
  });
});

// ═══════════════════════════════════════════════════
// DOM Projection: ARIA attributes
// ═══════════════════════════════════════════════════

describe("APG Feed: DOM Projection (attrs)", () => {
  it("items have role=article (W3C: feed children are articles)", () => {
    const t = feedFactory("article-1");
    for (const id of ARTICLES) {
      expect(t.attrs(id).role).toBe("article");
    }
  });

  it("focused article: tabIndex=0, others: tabIndex=-1 (roving tabindex)", () => {
    const t = feedFactory("article-3");
    expect(t.attrs("article-3").tabIndex).toBe(0);
    for (const id of ARTICLES.filter((i) => i !== "article-3")) {
      expect(t.attrs(id).tabIndex).toBe(-1);
    }
  });

  it("focused article: data-focused=true", () => {
    const t = feedFactory("article-2");
    expect(t.attrs("article-2")["data-focused"]).toBe(true);
    for (const id of ARTICLES.filter((i) => i !== "article-2")) {
      expect(t.attrs(id)["data-focused"]).toBeUndefined();
    }
  });
});

// ═══════════════════════════════════════════════════
// Tab behavior: Tab exits the feed zone
// ═══════════════════════════════════════════════════

describe("APG Feed: Tab exits zone", () => {
  it("Tab: exits the feed zone (tab=escape)", () => {
    const app = defineApp("test-feed-tab", {});
    const feed = app.createZone("apg-feed");
    feed.bind({
      role: "feed",
      getItems: () => ARTICLES,
      options: {
        navigate: {
          orientation: "vertical",
          loop: false,
          seamless: false,
          typeahead: false,
          entry: "first",
          recovery: "next",
        },
        select: { mode: "none" },
      },
    });
    const next = app.createZone("next-zone");
    next.bind({ getItems: () => ["next-1"] });
    const page = createPage(app);
    page.goto("apg-feed", { focusedItemId: "article-2" });
    page.goto("next-zone", { focusedItemId: "next-1" });
    // Activate feed zone
    page.goto("apg-feed", { focusedItemId: "article-2" });

    page.keyboard.press("Tab");
    // Tab with behavior=escape exits the zone to next zone
    expect(page.activeZoneId()).toBe("next-zone");
  });
});
