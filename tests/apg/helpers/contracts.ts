/**
 * APG Contract Test Factory — Shared Axis Tests (3경계)
 *
 * Each function below tests one "axis" of keyboard behavior.
 * APG pattern files assemble these axes into W3C-compliant test suites.
 *
 * 3경계 원칙:
 *   page: Playwright subset (goto, click, keyboard.press, locator)
 *   os:   @os-core/engine/kernel 싱글턴 직접 import
 *   app:  defineApp 반환값 직접 사용
 *
 * Testing Trophy Tier 1:
 *   Input:  keyboard.press / click (user action simulation)
 *   Assert: computeAttrs(os) → tabIndex, aria-selected, data-focused (ARIA contract)
 */

import { os } from "@os-core/engine/kernel";
import { readActiveZoneId, readFocusedItemId } from "@os-core/3-inject/readState";
import { computeAttrs } from "@os-core/3-inject/compute";
import { readSelection } from "@os-core/3-inject/readState";
import { OS_STACK_POP } from "@os-core/4-command/focus/stack";
import type { Page } from "@os-devtool/testing/types";
import { expect, it } from "vitest";

type Factory = (...args: string[]) => { page: Page; cleanup: () => void };

// ─── Axis: Linear Navigation ───

/** Tests vertical Down/Up navigation via pressKey (orientation=vertical) */
export function assertVerticalNav(factory: Factory) {
  it("Down Arrow: moves focus to next item", () => {
    const { page, cleanup } = factory();
    const first = readFocusedItemId(os)!;
    page.keyboard.press("ArrowDown");
    const next = readFocusedItemId(os)!;
    expect(next).not.toBe(first);
    expect(computeAttrs(os, next).tabIndex).toBe(0);
    expect(computeAttrs(os, first).tabIndex).toBe(-1);
    cleanup();
  });

  it("Up Arrow: moves focus to previous item", () => {
    const { page, cleanup } = factory();
    const first = readFocusedItemId(os)!;
    page.keyboard.press("ArrowDown");
    page.keyboard.press("ArrowUp");
    expect(readFocusedItemId(os)).toBe(first);
    expect(computeAttrs(os, first).tabIndex).toBe(0);
    cleanup();
  });
}

/** Tests horizontal Left/Right navigation via pressKey (orientation=horizontal) */
export function assertHorizontalNav(factory: Factory) {
  it("Right Arrow: moves focus to next item", () => {
    const { page, cleanup } = factory();
    const first = readFocusedItemId(os)!;
    page.keyboard.press("ArrowRight");
    const next = readFocusedItemId(os)!;
    expect(next).not.toBe(first);
    expect(computeAttrs(os, next).tabIndex).toBe(0);
    expect(computeAttrs(os, first).tabIndex).toBe(-1);
    cleanup();
  });

  it("Left Arrow: moves focus to previous item", () => {
    const { page, cleanup } = factory();
    const first = readFocusedItemId(os)!;
    page.keyboard.press("ArrowRight");
    page.keyboard.press("ArrowLeft");
    expect(readFocusedItemId(os)).toBe(first);
    expect(computeAttrs(os, first).tabIndex).toBe(0);
    cleanup();
  });
}

// ─── Axis: Boundary ───

/** Tests that focus does NOT move at edges via pressKey (loop=false) */
export function assertBoundaryClamp(
  factory: Factory,
  opts: { firstId: string; lastId: string; axis: "vertical" | "horizontal" },
) {
  const key =
    opts.axis === "vertical"
      ? { fwd: "ArrowDown", bwd: "ArrowUp" }
      : { fwd: "ArrowRight", bwd: "ArrowLeft" };

  it(`${key.fwd} at last item: focus stays (clamp)`, () => {
    const { page, cleanup } = factory();
    for (let i = 0; i < 20; i++) page.keyboard.press(key.fwd);
    expect(readFocusedItemId(os)).toBe(opts.lastId);
    expect(computeAttrs(os, opts.lastId).tabIndex).toBe(0);
    page.keyboard.press(key.fwd);
    expect(readFocusedItemId(os)).toBe(opts.lastId);
    cleanup();
  });

  it(`${key.bwd} at first item: focus stays (clamp)`, () => {
    const { page, cleanup } = factory();
    for (let i = 0; i < 20; i++) page.keyboard.press(key.bwd);
    expect(readFocusedItemId(os)).toBe(opts.firstId);
    expect(computeAttrs(os, opts.firstId).tabIndex).toBe(0);
    page.keyboard.press(key.bwd);
    expect(readFocusedItemId(os)).toBe(opts.firstId);
    cleanup();
  });
}

/** Tests that focus wraps at edges via pressKey (loop=true) */
export function assertLoop(opts: {
  firstId: string;
  lastId: string;
  axis: "vertical" | "horizontal";
  factoryAtLast: Factory;
  factoryAtFirst: Factory;
}) {
  const key =
    opts.axis === "vertical"
      ? { fwd: "ArrowDown", bwd: "ArrowUp" }
      : { fwd: "ArrowRight", bwd: "ArrowLeft" };

  it(`${key.fwd} at last item: wraps to first`, () => {
    const { page, cleanup } = opts.factoryAtLast();
    expect(readFocusedItemId(os)).toBe(opts.lastId);
    page.keyboard.press(key.fwd);
    expect(readFocusedItemId(os)).toBe(opts.firstId);
    expect(computeAttrs(os, opts.firstId).tabIndex).toBe(0);
    cleanup();
  });

  it(`${key.bwd} at first item: wraps to last`, () => {
    const { page, cleanup } = opts.factoryAtFirst();
    expect(readFocusedItemId(os)).toBe(opts.firstId);
    page.keyboard.press(key.bwd);
    expect(readFocusedItemId(os)).toBe(opts.lastId);
    expect(computeAttrs(os, opts.lastId).tabIndex).toBe(0);
    cleanup();
  });
}

// ─── Axis: Home / End ───

export function assertHomeEnd(
  factory: Factory,
  opts: { firstId: string; lastId: string },
) {
  it("Home: moves to first item", () => {
    const { page, cleanup } = factory();
    page.keyboard.press("Home");
    expect(readFocusedItemId(os)).toBe(opts.firstId);
    expect(computeAttrs(os, opts.firstId).tabIndex).toBe(0);
    cleanup();
  });

  it("End: moves to last item", () => {
    const { page, cleanup } = factory();
    page.keyboard.press("End");
    expect(readFocusedItemId(os)).toBe(opts.lastId);
    expect(computeAttrs(os, opts.lastId).tabIndex).toBe(0);
    cleanup();
  });
}

// ─── Axis: Orthogonal Ignored ───

/** Tests that orthogonal axis keys have no effect via pressKey */
export function assertOrthogonalIgnored(
  factory: Factory,
  axis: "vertical" | "horizontal",
) {
  const [k1, k2] =
    axis === "vertical"
      ? (["ArrowRight", "ArrowLeft"] as const)
      : (["ArrowDown", "ArrowUp"] as const);

  it(`${k1}: no effect`, () => {
    const { page, cleanup } = factory();
    const before = readFocusedItemId(os)!;
    page.keyboard.press(k1);
    expect(readFocusedItemId(os)).toBe(before);
    expect(computeAttrs(os, before).tabIndex).toBe(0);
    cleanup();
  });

  it(`${k2}: no effect`, () => {
    const { page, cleanup } = factory();
    const before = readFocusedItemId(os)!;
    page.keyboard.press(k2);
    expect(readFocusedItemId(os)).toBe(before);
    expect(computeAttrs(os, before).tabIndex).toBe(0);
    cleanup();
  });
}

// ─── Axis: Follow Focus ───

/** Tests that selection (aria-selected) follows focus on navigation */
export function assertFollowFocus(factory: Factory) {
  it("selection follows focus on navigation (aria-selected)", () => {
    const { page, cleanup } = factory();
    const first = readFocusedItemId(os)!;
    page.keyboard.press("ArrowDown");
    const next = readFocusedItemId(os)!;
    expect(computeAttrs(os, next)["aria-selected"]).toBe(true);
    expect(computeAttrs(os, first)["aria-selected"]).toBe(false);
    cleanup();
  });
}

// ─── Axis: No Selection ───

/** Tests that navigation does not create selection (mode=none) */
export function assertNoSelection(factory: Factory) {
  it("navigation does not create selection", () => {
    const { page, cleanup } = factory();
    page.keyboard.press("ArrowDown");
    page.keyboard.press("ArrowDown");
    const zoneId = readActiveZoneId(os) ?? "";
    expect(readSelection(os, zoneId)).toEqual([]);
    cleanup();
  });
}

// ─── Axis: Popup Lifecycle ───

/** Tests Escape closes the popup zone */
export function assertEscapeClose(factory: Factory) {
  it("Escape: closes popup (clears active zone)", () => {
    const { page, cleanup } = factory();
    page.keyboard.press("Escape");
    expect(readActiveZoneId(os)).toBeNull();
    cleanup();
  });
}

/** Tests Escape + stack pop restores focus to invoker */
export function assertFocusRestore(
  factory: Factory,
  opts: { invokerZoneId: string; invokerItemId: string },
) {
  it("Escape + stack pop: restores focus to invoker", () => {
    const { page, cleanup } = factory();
    page.keyboard.press("Escape");
    os.dispatch(OS_STACK_POP());
    expect(readActiveZoneId(os)).toBe(opts.invokerZoneId);
    expect(readFocusedItemId(os, opts.invokerZoneId)).toBe(opts.invokerItemId);
    cleanup();
  });
}

// ─── Axis: Tab Trap ───

/** Tests that Tab wraps within the zone (trap behavior) */
export function assertTabTrap(
  factory: Factory,
  opts: {
    firstId: string;
    lastId: string;
    factoryAtFirst?: Factory;
    factoryAtLast?: Factory;
  },
) {
  it("Tab at last: wraps to first (focus trap)", () => {
    const { page, cleanup } = (opts.factoryAtLast ?? factory)();
    expect(readFocusedItemId(os)).toBe(opts.lastId);
    page.keyboard.press("Tab");
    expect(readFocusedItemId(os)).toBe(opts.firstId);
    expect(computeAttrs(os, opts.firstId).tabIndex).toBe(0);
    cleanup();
  });

  it("Shift+Tab at first: wraps to last (focus trap)", () => {
    const { page, cleanup } = (opts.factoryAtFirst ?? factory)();
    expect(readFocusedItemId(os)).toBe(opts.firstId);
    page.keyboard.press("Shift+Tab");
    expect(readFocusedItemId(os)).toBe(opts.lastId);
    expect(computeAttrs(os, opts.lastId).tabIndex).toBe(0);
    cleanup();
  });
}
