/**
 * APG Carousel Pattern -- Isomorphic Test (Playwright-subset API)
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/carousel/
 *
 * W3C Carousel Pattern (Tabbed variant):
 *   - Carousel container: role=region, aria-roledescription="carousel"
 *   - Slide picker: tablist with tab elements (horizontal, loop)
 *   - Slides: tabpanel with aria-roledescription="slide"
 *   - Rotation control: button (Start/Stop automatic slide show)
 *   - Previous/Next buttons: button
 *
 * Keyboard interactions (tablist portion):
 *   - Left/Right Arrow: navigate between tabs (wrap)
 *   - Home: first tab
 *   - End: last tab
 *   - Tab: enters/exits tablist
 *
 * Activation modes:
 *   - Automatic (recommended): slide changes when tab receives focus
 *
 * The tablist keyboard behavior is identical to the Tabs pattern.
 * Carousel-specific behavior (rotation, prev/next, aria-live) is app-level.
 *
 * Config:
 *   - navigate: horizontal, loop=true
 *   - select: single, followFocus=true, disallowEmpty=true
 *   - tab: escape (Tab exits tablist)
 */

import { expect as osExpect } from "@os-testing/expect";
import { createPage } from "@os-testing/page";
import { afterEach, beforeEach, describe, it } from "vitest";
import {
  CarouselApp,
  CarouselPattern,
} from "@/pages/apg-showcase/patterns/CarouselPattern";

// --- Test Setup ---

let page: ReturnType<typeof createPage>["page"];
let cleanup: () => void;

beforeEach(() => {
  ({ page, cleanup } = createPage(CarouselApp, CarouselPattern));
  page.goto("/");
  page.click("slide-1");
});

afterEach(() => {
  cleanup();
});

const expect = osExpect;

// ===================================================
// Navigation (tablist) — inlined from contracts
// ===================================================

describe("APG Carousel: Navigation (tablist)", () => {
  // --- assertHorizontalNav ---
  it("Right Arrow: moves focus to next item", async () => {
    page.keyboard.press("ArrowRight");
    await expect(page.locator("#slide-2")).toHaveAttribute(
      "data-focused",
      "true",
    );
    await expect(page.locator("#slide-2")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#slide-1")).toHaveAttribute("tabindex", "-1");
  });

  it("Left Arrow: moves focus to previous item", async () => {
    page.keyboard.press("ArrowRight");
    page.keyboard.press("ArrowLeft");
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "data-focused",
      "true",
    );
    await expect(page.locator("#slide-1")).toHaveAttribute("tabindex", "0");
  });

  // --- assertLoop ---
  it("ArrowRight at last: wraps to first", async () => {
    page.click("slide-6");
    await expect(page.locator("#slide-6")).toHaveAttribute(
      "data-focused",
      "true",
    );
    page.keyboard.press("ArrowRight");
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "data-focused",
      "true",
    );
    await expect(page.locator("#slide-1")).toHaveAttribute("tabindex", "0");
  });

  it("ArrowLeft at first: wraps to last", async () => {
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "data-focused",
      "true",
    );
    page.keyboard.press("ArrowLeft");
    await expect(page.locator("#slide-6")).toHaveAttribute(
      "data-focused",
      "true",
    );
    await expect(page.locator("#slide-6")).toHaveAttribute("tabindex", "0");
  });

  // --- assertHomeEnd ---
  it("Home: moves to first item", async () => {
    page.keyboard.press("Home");
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "data-focused",
      "true",
    );
    await expect(page.locator("#slide-1")).toHaveAttribute("tabindex", "0");
  });

  it("End: moves to last item", async () => {
    page.keyboard.press("End");
    await expect(page.locator("#slide-6")).toHaveAttribute(
      "data-focused",
      "true",
    );
    await expect(page.locator("#slide-6")).toHaveAttribute("tabindex", "0");
  });

  // --- assertOrthogonalIgnored (horizontal → Down/Up ignored) ---
  it("ArrowDown: no effect", async () => {
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "data-focused",
      "true",
    );
    page.keyboard.press("ArrowDown");
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "data-focused",
      "true",
    );
    await expect(page.locator("#slide-1")).toHaveAttribute("tabindex", "0");
  });

  it("ArrowUp: no effect", async () => {
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "data-focused",
      "true",
    );
    page.keyboard.press("ArrowUp");
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "data-focused",
      "true",
    );
    await expect(page.locator("#slide-1")).toHaveAttribute("tabindex", "0");
  });
});

// ===================================================
// Auto-Activation: selection follows focus
// ===================================================

describe("APG Carousel: Auto-Activation (selection follows focus)", () => {
  it("Right Arrow: newly focused tab becomes selected (aria-selected=true)", async () => {
    page.keyboard.press("ArrowRight");
    await expect(page.locator("#slide-2")).toHaveAttribute(
      "data-focused",
      "true",
    );
    await expect(page.locator("#slide-2")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("Left Arrow: previous tab regains selection", async () => {
    page.click("slide-2");
    page.keyboard.press("ArrowLeft");
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "data-focused",
      "true",
    );
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#slide-2")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("Home: first tab becomes selected", async () => {
    page.click("slide-4");
    page.keyboard.press("Home");
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "data-focused",
      "true",
    );
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#slide-4")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("End: last tab becomes selected", async () => {
    page.keyboard.press("End");
    await expect(page.locator("#slide-6")).toHaveAttribute(
      "data-focused",
      "true",
    );
    await expect(page.locator("#slide-6")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("wrap Right at last tab: first tab becomes selected", async () => {
    page.click("slide-6");
    page.keyboard.press("ArrowRight");
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "data-focused",
      "true",
    );
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#slide-6")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("wrap Left at first tab: last tab becomes selected", async () => {
    page.keyboard.press("ArrowLeft");
    await expect(page.locator("#slide-6")).toHaveAttribute(
      "data-focused",
      "true",
    );
    await expect(page.locator("#slide-6")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });
});

// ===================================================
// Always-Selected: disallowEmpty
// ===================================================

describe("APG Carousel: Always-selected (disallowEmpty)", () => {
  it("exactly one tab is always selected", async () => {
    // slide-1 selected initially
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    page.keyboard.press("ArrowRight");
    // Now slide-2 selected, slide-1 not
    await expect(page.locator("#slide-2")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    page.keyboard.press("ArrowRight");
    // Now slide-3 selected, slide-2 not
    await expect(page.locator("#slide-3")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#slide-2")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("navigating through all slides: always exactly one selected", async () => {
    const SLIDES = [
      "slide-1",
      "slide-2",
      "slide-3",
      "slide-4",
      "slide-5",
      "slide-6",
    ];
    for (let i = 0; i < SLIDES.length; i++) {
      // Current slide should be selected
      const currentId = SLIDES[i];
      await expect(page.locator(`#${currentId}`)).toHaveAttribute(
        "aria-selected",
        "true",
      );
      // All other slides should not be selected
      for (const otherId of SLIDES) {
        if (otherId !== currentId) {
          await expect(page.locator(`#${otherId}`)).toHaveAttribute(
            "aria-selected",
            "false",
          );
        }
      }
      page.keyboard.press("ArrowRight");
    }
    // After wrapping, back to slide-1
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

// ===================================================
// DOM Projection: ARIA attributes
// ===================================================

describe("APG Carousel: DOM Projection (attrs)", () => {
  it("items have role=tab (tablist child role)", async () => {
    await expect(page.locator("#slide-1")).toHaveAttribute("role", "tab");
    await expect(page.locator("#slide-2")).toHaveAttribute("role", "tab");
    await expect(page.locator("#slide-6")).toHaveAttribute("role", "tab");
  });

  it("active tab: aria-selected=true", async () => {
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("inactive tabs: aria-selected=false", async () => {
    await expect(page.locator("#slide-2")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    await expect(page.locator("#slide-3")).toHaveAttribute(
      "aria-selected",
      "false",
    );
    await expect(page.locator("#slide-6")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("focused tab: tabIndex=0", async () => {
    await expect(page.locator("#slide-1")).toHaveAttribute("tabindex", "0");
  });

  it("unfocused tabs: tabIndex=-1", async () => {
    await expect(page.locator("#slide-2")).toHaveAttribute("tabindex", "-1");
    await expect(page.locator("#slide-3")).toHaveAttribute("tabindex", "-1");
  });

  it("focused tab: data-focused=true", async () => {
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "data-focused",
      "true",
    );
  });

  it("after navigation: tabIndex follows focus", async () => {
    page.keyboard.press("ArrowRight");
    await expect(page.locator("#slide-2")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#slide-1")).toHaveAttribute("tabindex", "-1");
  });
});

// ===================================================
// Click interaction
// ===================================================

describe("APG Carousel: Click interaction", () => {
  it("click on unfocused tab: focuses it", async () => {
    page.click("slide-3");
    await expect(page.locator("#slide-3")).toHaveAttribute(
      "data-focused",
      "true",
    );
  });

  it("click on tab: selects it (aria-selected=true)", async () => {
    page.click("slide-4");
    await expect(page.locator("#slide-4")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("click on already-selected tab: stays selected (disallowEmpty)", async () => {
    page.click("slide-1");
    await expect(page.locator("#slide-1")).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});
