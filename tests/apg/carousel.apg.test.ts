/**
 * APG Carousel Pattern -- Contract Test (Tier 1: pressKey -> attrs)
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

import { createPage } from "@os-devtool/testing/page";
import { defineApp } from "@os-sdk/app/defineApp/index";
import { describe, expect, it } from "vitest";
import {
  assertHomeEnd,
  assertHorizontalNav,
  assertLoop,
  assertOrthogonalIgnored,
} from "./helpers/contracts";

// --- Test Setup ---

const SLIDES = [
  "slide-1",
  "slide-2",
  "slide-3",
  "slide-4",
  "slide-5",
  "slide-6",
];

function carouselFactory(focusedTab = "slide-1") {
  const app = defineApp("test-carousel", {});
  const zone = app.createZone("carousel-tabs");
  zone.bind({
    role: "tablist",
    getItems: () => SLIDES,
    options: {
      navigate: {
        orientation: "horizontal",
        loop: true,
        seamless: false,
        typeahead: false,
        entry: "selected",
        recovery: "next",
      },
      activate: {
        mode: "automatic",
        onClick: true,
      },
      select: {
        mode: "single",
        followFocus: true,
        disallowEmpty: true,
      },
    },
  });
  const page = createPage(app);
  page.goto("carousel-tabs", { focusedItemId: focusedTab });
  // Auto-activation: pre-select the initially focused tab
  page.click(focusedTab);
  return page;
}

function carouselFactoryAtLast() {
  return carouselFactory("slide-6");
}

function carouselFactoryAtFirst() {
  return carouselFactory("slide-1");
}

// ===================================================
// Shared contracts -- horizontal navigation with wrap
// ===================================================

describe("APG Carousel: Navigation (tablist)", () => {
  assertHorizontalNav(carouselFactory as any);
  assertLoop({
    firstId: "slide-1",
    lastId: "slide-6",
    axis: "horizontal",
    factoryAtLast: carouselFactoryAtLast as any,
    factoryAtFirst: carouselFactoryAtFirst as any,
  });
  assertHomeEnd(carouselFactory as any, {
    firstId: "slide-1",
    lastId: "slide-6",
  });
  // W3C APG: only horizontal arrow keys apply to tablist
  assertOrthogonalIgnored(carouselFactory as any, "horizontal");
});

// ===================================================
// Auto-Activation: selection follows focus
// ===================================================

describe("APG Carousel: Auto-Activation (selection follows focus)", () => {
  it("Right Arrow: newly focused tab becomes selected (aria-selected=true)", () => {
    const t = carouselFactory("slide-1");
    t.keyboard.press("ArrowRight");
    expect(t.focusedItemId()).toBe("slide-2");
    expect(t.attrs("slide-2")["aria-selected"]).toBe(true);
    expect(t.attrs("slide-1")["aria-selected"]).toBe(false);
  });

  it("Left Arrow: previous tab regains selection", () => {
    const t = carouselFactory("slide-2");
    t.keyboard.press("ArrowLeft");
    expect(t.focusedItemId()).toBe("slide-1");
    expect(t.attrs("slide-1")["aria-selected"]).toBe(true);
    expect(t.attrs("slide-2")["aria-selected"]).toBe(false);
  });

  it("Home: first tab becomes selected", () => {
    const t = carouselFactory("slide-4");
    t.keyboard.press("Home");
    expect(t.focusedItemId()).toBe("slide-1");
    expect(t.attrs("slide-1")["aria-selected"]).toBe(true);
    expect(t.attrs("slide-4")["aria-selected"]).toBe(false);
  });

  it("End: last tab becomes selected", () => {
    const t = carouselFactory("slide-1");
    t.keyboard.press("End");
    expect(t.focusedItemId()).toBe("slide-6");
    expect(t.attrs("slide-6")["aria-selected"]).toBe(true);
    expect(t.attrs("slide-1")["aria-selected"]).toBe(false);
  });

  it("wrap Right at last tab: first tab becomes selected", () => {
    const t = carouselFactoryAtLast();
    t.keyboard.press("ArrowRight");
    expect(t.focusedItemId()).toBe("slide-1");
    expect(t.attrs("slide-1")["aria-selected"]).toBe(true);
    expect(t.attrs("slide-6")["aria-selected"]).toBe(false);
  });

  it("wrap Left at first tab: last tab becomes selected", () => {
    const t = carouselFactoryAtFirst();
    t.keyboard.press("ArrowLeft");
    expect(t.focusedItemId()).toBe("slide-6");
    expect(t.attrs("slide-6")["aria-selected"]).toBe(true);
    expect(t.attrs("slide-1")["aria-selected"]).toBe(false);
  });
});

// ===================================================
// Always-Selected: disallowEmpty
// ===================================================

describe("APG Carousel: Always-selected (disallowEmpty)", () => {
  it("exactly one tab is always selected", () => {
    const t = carouselFactory("slide-1");
    expect(t.selection()).toHaveLength(1);
    t.keyboard.press("ArrowRight");
    expect(t.selection()).toHaveLength(1);
    t.keyboard.press("ArrowRight");
    expect(t.selection()).toHaveLength(1);
  });

  it("navigating through all slides: always exactly one selected", () => {
    const t = carouselFactory("slide-1");
    for (let i = 0; i < SLIDES.length; i++) {
      expect(t.selection()).toHaveLength(1);
      t.keyboard.press("ArrowRight");
    }
    expect(t.selection()).toHaveLength(1);
  });
});

// ===================================================
// DOM Projection: ARIA attributes
// ===================================================

describe("APG Carousel: DOM Projection (attrs)", () => {
  it("items have role=tab (tablist child role)", () => {
    const t = carouselFactory("slide-1");
    expect(t.attrs("slide-1").role).toBe("tab");
    expect(t.attrs("slide-2").role).toBe("tab");
    expect(t.attrs("slide-6").role).toBe("tab");
  });

  it("active tab: aria-selected=true", () => {
    const t = carouselFactory("slide-1");
    expect(t.attrs("slide-1")["aria-selected"]).toBe(true);
  });

  it("inactive tabs: aria-selected=false", () => {
    const t = carouselFactory("slide-1");
    expect(t.attrs("slide-2")["aria-selected"]).toBe(false);
    expect(t.attrs("slide-3")["aria-selected"]).toBe(false);
    expect(t.attrs("slide-6")["aria-selected"]).toBe(false);
  });

  it("focused tab: tabIndex=0", () => {
    const t = carouselFactory("slide-1");
    expect(t.attrs("slide-1").tabIndex).toBe(0);
  });

  it("unfocused tabs: tabIndex=-1", () => {
    const t = carouselFactory("slide-1");
    expect(t.attrs("slide-2").tabIndex).toBe(-1);
    expect(t.attrs("slide-3").tabIndex).toBe(-1);
  });

  it("focused tab: data-focused=true", () => {
    const t = carouselFactory("slide-1");
    expect(t.attrs("slide-1")["data-focused"]).toBe(true);
    expect(t.attrs("slide-2")["data-focused"]).toBeUndefined();
  });

  it("after navigation: tabIndex follows focus", () => {
    const t = carouselFactory("slide-1");
    t.keyboard.press("ArrowRight");
    expect(t.attrs("slide-2").tabIndex).toBe(0);
    expect(t.attrs("slide-1").tabIndex).toBe(-1);
  });
});

// ===================================================
// Click interaction
// ===================================================

describe("APG Carousel: Click interaction", () => {
  it("click on unfocused tab: focuses it", () => {
    const t = carouselFactory("slide-1");
    t.click("slide-3");
    expect(t.focusedItemId()).toBe("slide-3");
  });

  it("click on tab: selects it (aria-selected=true)", () => {
    const t = carouselFactory("slide-1");
    t.click("slide-4");
    expect(t.attrs("slide-4")["aria-selected"]).toBe(true);
    expect(t.attrs("slide-1")["aria-selected"]).toBe(false);
  });

  it("click on already-selected tab: stays selected (disallowEmpty)", () => {
    const t = carouselFactory("slide-1");
    t.click("slide-1");
    expect(t.attrs("slide-1")["aria-selected"]).toBe(true);
    expect(t.selection()).toHaveLength(1);
  });
});
