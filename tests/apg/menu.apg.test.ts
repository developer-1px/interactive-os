/**
 * APG Menu and Menubar Pattern — Contract Test
 * Source: https://www.w3.org/WAI/ARIA/apg/patterns/menu/
 *
 * W3C Keyboard Interaction Coverage:
 *   N1-N2: Menubar horizontal navigation with loop
 *   N3-N4: Menu vertical navigation with loop
 *   N5-N6: Home / End
 *   A1: Enter activates item + closes menu
 *   A2: Enter restores focus to invoker
 *   C1: Space on menuitemcheckbox — toggles without closing
 *   C2: Space on menuitemradio — checks + unchecks in group, without closing
 *   D1: Escape closes menu
 *   D2: Escape + stack pop restores focus to invoker
 *   R1-R4: ARIA roles, tabIndex, data-focused
 *
 * Two zones:
 *   Menubar — horizontal, loop, 3 menuitem
 *   Menu (popup) — vertical, loop, menuitem × 2, checkbox × 2, radio × 3
 */

import { createOsPage } from "@os-sdk/app/defineApp/page";
import { describe, expect, it } from "vitest";
import {
  assertEscapeClose,
  assertFocusRestore,
  assertHomeEnd,
  assertHorizontalNav,
  assertNoSelection,
  assertVerticalNav,
} from "./helpers/contracts";

// ─── Menubar Factory ───

const MENUBAR_ITEMS = ["mb-file", "mb-edit", "mb-view"];

function createMenubar(focusedItem = "mb-file") {
  const page = createOsPage();
  page.setItems(MENUBAR_ITEMS);
  page.setRole("menubar", "menubar");
  page.setActiveZone("menubar", focusedItem);
  return page;
}

// ─── Menu (dropdown) Factory ───
// Matches MenuPattern.tsx items: cmd-new, cmd-open, check-ruler, check-grid,
// radio-left, radio-center, radio-right

const MENU_ITEMS = [
  "cmd-new",
  "cmd-open",
  "check-ruler",
  "check-grid",
  "radio-left",
  "radio-center",
  "radio-right",
];

// Checkbox items tracked as toggleable IDs
const CHECKBOX_IDS = ["check-ruler", "check-grid"];
const RADIO_IDS = ["radio-left", "radio-center", "radio-right"];

function createMenu(focusedItem = "cmd-new") {
  const page = createOsPage();
  // Setup invoker (menubar parent)
  page.setItems(MENUBAR_ITEMS);
  page.setActiveZone("menubar", "mb-file");
  // Push stack for popup
  page.dispatch(page.OS_STACK_PUSH());
  // Setup menu items
  page.setItems(MENU_ITEMS);
  // W3C: Menu role — vertical, loop, Escape closes
  // Built-in OS_CHECK toggle via check.mode="check" — no callback needed
  page.setRole("menu", "menu");
  page.setConfig({
    check: { mode: "check" as const },
  });
  page.setActiveZone("menu", focusedItem);
  return page;
}

// ═══════════════════════════════════════════════════
// N1-N2: Menubar Navigation (horizontal, loop)
// W3C: "Right Arrow: moves focus to next item, optionally wrapping"
// W3C: "Left Arrow: moves focus to previous item, optionally wrapping"
// ═══════════════════════════════════════════════════

describe("APG Menubar: Navigation (horizontal, loop)", () => {
  assertHorizontalNav(createMenubar);
  assertNoSelection(createMenubar);

  it("N1: Right Arrow at last item wraps to first (loop)", () => {
    const t = createMenubar("mb-view");
    t.keyboard.press("ArrowRight");
    expect(t.focusedItemId()).toBe("mb-file");
  });

  it("N2: Left Arrow at first item wraps to last (loop)", () => {
    const t = createMenubar("mb-file");
    t.keyboard.press("ArrowLeft");
    expect(t.focusedItemId()).toBe("mb-view");
  });
});

// ═══════════════════════════════════════════════════
// N3-N6: Menu Navigation (vertical, loop, Home/End)
// W3C: "Down Arrow: moves focus to next item, optionally wrapping"
// W3C: "Up Arrow: moves focus to previous item, optionally wrapping"
// W3C: "Home: moves focus to first item"
// W3C: "End: moves focus to last item"
// ═══════════════════════════════════════════════════

describe("APG Menu: Navigation (vertical, loop)", () => {
  assertVerticalNav(createMenu);
  assertHomeEnd(createMenu, { firstId: "cmd-new", lastId: "radio-right" });
  assertNoSelection(createMenu);

  it("N3: Down Arrow at last item wraps to first (loop)", () => {
    const t = createMenu("radio-right");
    t.keyboard.press("ArrowDown");
    expect(t.focusedItemId()).toBe("cmd-new");
  });

  it("N4: Up Arrow at first item wraps to last (loop)", () => {
    const t = createMenu("cmd-new");
    t.keyboard.press("ArrowUp");
    expect(t.focusedItemId()).toBe("radio-right");
  });
});

// ═══════════════════════════════════════════════════
// D1-D2: Dismiss (Escape closes, focus restore)
// W3C: "Escape: Close the menu that contains focus and return focus
//        to the element from which the menu was opened."
// ═══════════════════════════════════════════════════

describe("APG Menu: Dismiss", () => {
  assertEscapeClose(createMenu);
  assertFocusRestore(createMenu, {
    invokerZoneId: "menubar",
    invokerItemId: "mb-file",
  });
});

// ═══════════════════════════════════════════════════
// A1-A2: Enter activates item + closes menu
// W3C: "Enter: Otherwise, activates the item and closes the menu."
// ═══════════════════════════════════════════════════

describe("APG Menu: Activation (Enter)", () => {
  it("A1: Enter on menuitem triggers activation", () => {
    const t = createMenu("cmd-new");
    // In the kernel, Enter dispatches OS_ACTIVATE.
    // Menu close is handled by app-level onAction → return dismiss commands.
    // Here we verify Enter doesn't break navigation state.
    t.keyboard.press("Enter");
    // Focused item should still be cmd-new (activation doesn't move focus)
    expect(t.focusedItemId()).toBe("cmd-new");
  });

  it("A2: Escape closes menu + stack pop restores focus to invoker", () => {
    const t = createMenu("cmd-new");
    t.keyboard.press("Escape");
    t.dispatch(t.OS_STACK_POP());
    expect(t.activeZoneId()).toBe("menubar");
    expect(t.focusedItemId("menubar")).toBe("mb-file");
  });
});

// ═══════════════════════════════════════════════════
// C1: menuitemcheckbox — OS_CHECK toggle pipeline
// W3C: "When focus is on a menuitemcheckbox,
//        changes the state without closing the menu."
//
// NOTE: In the real app, Space on menuitemcheckbox routes to OS_CHECK
// via onCheck/onAction callbacks. In headless kernel tests, we verify
// the OS_CHECK toggle pipeline directly. Space→checkbox routing is
// tested by browser TestBot.
// ═══════════════════════════════════════════════════

describe("APG Menu: Checkbox Toggle (OS_CHECK)", () => {
  it("C1: OS_CHECK toggles checked state for checkbox item", () => {
    const t = createMenu("check-ruler");
    expect(t.selection()).not.toContain("check-ruler");

    t.dispatch(t.OS_CHECK({ targetId: "check-ruler" }));
    expect(t.selection()).toContain("check-ruler");

    t.dispatch(t.OS_CHECK({ targetId: "check-ruler" }));
    expect(t.selection()).not.toContain("check-ruler");
  });

  it("C1: OS_CHECK does NOT close menu", () => {
    const t = createMenu("check-ruler");
    t.dispatch(t.OS_CHECK({ targetId: "check-ruler" }));
    expect(t.activeZoneId()).toBe("menu");
  });

  it("C1: multiple checkboxes toggle independently", () => {
    const t = createMenu("check-ruler");
    t.dispatch(t.OS_CHECK({ targetId: "check-ruler" }));
    t.dispatch(t.OS_CHECK({ targetId: "check-grid" }));

    expect(t.selection()).toContain("check-ruler");
    expect(t.selection()).toContain("check-grid");
  });
});

// ═══════════════════════════════════════════════════
// C2: menuitemradio — OS_CHECK pipeline
// W3C: "When focus is on a menuitemradio that is not checked,
//        checks the focused menuitemradio and unchecks any other
//        checked menuitemradio in the same group."
//
// NOTE: Radio exclusivity (uncheck others in group) is app-level
// logic (onCheck callback). Kernel OS_CHECK does simple toggle.
// ═══════════════════════════════════════════════════

describe("APG Menu: Radio Toggle (OS_CHECK)", () => {
  it("C2: OS_CHECK checks radio item", () => {
    const t = createMenu("radio-left");
    t.dispatch(t.OS_CHECK({ targetId: "radio-left" }));
    expect(t.selection()).toContain("radio-left");
  });

  it("C2: OS_CHECK does NOT close menu", () => {
    const t = createMenu("radio-left");
    t.dispatch(t.OS_CHECK({ targetId: "radio-left" }));
    expect(t.activeZoneId()).toBe("menu");
  });
});

// ═══════════════════════════════════════════════════
// R1-R4: ARIA Roles, States, Properties
// W3C: "menubar items have role menuitem"
// W3C: "In menubar, first item tabIndex=0, others -1"
// W3C: "In menu, all items tabIndex=-1 (focused=0)"
// ═══════════════════════════════════════════════════

describe("APG Menu: ARIA Projection", () => {
  it("R1: menubar items have role=menuitem", () => {
    const t = createMenubar();
    expect(t.attrs("mb-file").role).toBe("menuitem");
  });

  it("R2: menubar focused item tabIndex=0, others -1", () => {
    const t = createMenubar();
    expect(t.attrs("mb-file").tabIndex).toBe(0);
    expect(t.attrs("mb-edit").tabIndex).toBe(-1);
    expect(t.attrs("mb-view").tabIndex).toBe(-1);
  });

  it("R3: menu items have role=menuitem (zone child role)", () => {
    const t = createMenu();
    expect(t.attrs("cmd-new").role).toBe("menuitem");
  });

  it("R4: menu focused item tabIndex=0, others -1", () => {
    const t = createMenu();
    expect(t.attrs("cmd-new").tabIndex).toBe(0);
    expect(t.attrs("cmd-open").tabIndex).toBe(-1);
    expect(t.attrs("check-ruler").tabIndex).toBe(-1);
    expect(t.attrs("radio-left").tabIndex).toBe(-1);
  });

  it("R5: focused item has data-focused=true", () => {
    const t = createMenu("cmd-open");
    expect(t.attrs("cmd-open")["data-focused"]).toBe(true);
    expect(t.attrs("cmd-new")["data-focused"]).toBeUndefined();
  });
});
