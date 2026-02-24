/**
 * PoC: APG Listbox Pattern using createOsPage (T2 validation)
 *
 * Same tests as listbox.apg.test.ts but using OsPage API.
 * Validates that createOsPage produces identical results.
 */

import { createOsPage } from "@os/createOsPage";
import { describe, expect, it } from "vitest";

const ITEMS = ["apple", "banana", "cherry", "date", "elderberry"];

const SINGLE_SELECT = {
  navigate: {
    orientation: "vertical" as const,
    loop: false,
    seamless: false,
    typeahead: false,
    entry: "first" as const,
    recovery: "next" as const,
  },
  select: {
    mode: "single" as const,
    followFocus: true,
    disallowEmpty: false,
    range: false,
    toggle: false,
  },
};

describe("OsPage: Listbox PoC", () => {
  it("ArrowDown navigates focus", () => {
    const page = createOsPage();
    page.goto("listbox", {
      items: ITEMS,
      config: SINGLE_SELECT,
      role: "listbox",
      focusedItemId: "apple",
    });

    page.keyboard.press("ArrowDown");

    expect(page.focusedItemId()).toBe("banana");
    expect(page.attrs("banana").tabIndex).toBe(0);
    expect(page.attrs("apple").tabIndex).toBe(-1);
  });

  it("ArrowUp navigates focus back", () => {
    const page = createOsPage();
    page.goto("listbox", {
      items: ITEMS,
      config: SINGLE_SELECT,
      role: "listbox",
      focusedItemId: "apple",
    });

    page.keyboard.press("ArrowDown");
    page.keyboard.press("ArrowUp");

    expect(page.focusedItemId()).toBe("apple");
  });

  it("followFocus: selection follows focus", () => {
    const page = createOsPage();
    page.goto("listbox", {
      items: ITEMS,
      config: SINGLE_SELECT,
      role: "listbox",
      focusedItemId: "apple",
    });
    page.dispatch(page.OS_SELECT({ targetId: "apple", mode: "replace" }));

    page.keyboard.press("ArrowDown");

    expect(page.attrs("banana")["aria-selected"]).toBe(true);
    expect(page.attrs("apple")["aria-selected"]).toBe(false);
  });

  it("Home moves to first item", () => {
    const page = createOsPage();
    page.goto("listbox", {
      items: ITEMS,
      config: SINGLE_SELECT,
      role: "listbox",
      focusedItemId: "cherry",
    });

    page.keyboard.press("Home");

    expect(page.focusedItemId()).toBe("apple");
  });

  it("End moves to last item", () => {
    const page = createOsPage();
    page.goto("listbox", {
      items: ITEMS,
      config: SINGLE_SELECT,
      role: "listbox",
      focusedItemId: "apple",
    });

    page.keyboard.press("End");

    expect(page.focusedItemId()).toBe("elderberry");
  });

  it("click focuses and selects", () => {
    const page = createOsPage();
    page.goto("listbox", {
      items: ITEMS,
      config: SINGLE_SELECT,
      role: "listbox",
      focusedItemId: "apple",
    });

    page.click("cherry");

    expect(page.focusedItemId()).toBe("cherry");
    expect(page.attrs("cherry")["aria-selected"]).toBe(true);
  });

  it("boundary clamp: ArrowDown at last item stays", () => {
    const page = createOsPage();
    page.goto("listbox", {
      items: ITEMS,
      config: SINGLE_SELECT,
      role: "listbox",
      focusedItemId: "elderberry",
    });

    page.keyboard.press("ArrowDown");

    expect(page.focusedItemId()).toBe("elderberry");
  });
});
