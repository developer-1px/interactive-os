/**
 * APG Contract Test — Shared Axis Tests (Playwright 동형)
 *
 * Each function below tests one "axis" of keyboard behavior.
 * APG pattern files assemble these axes into W3C-compliant test suites.
 *
 * 원칙:
 *   - os import 0줄. 모든 assertion은 page.locator() 경유.
 *   - page.locator(":focus") 로 현재 포커스 요소를 발견.
 *   - 이 코드는 headless / browser / Playwright 3환경에서 동일하게 실행된다.
 *
 * Testing Trophy Tier 1:
 *   Input:  keyboard.press / click (user action)
 *   Assert: locator → toBeFocused, toHaveAttribute (ARIA contract)
 */

import { expect as osExpect } from "@os-testing/expect";
import type { Page } from "@os-testing/types";
import { it } from "vitest";

const expect = osExpect;

type Factory = (...args: string[]) => { page: Page; cleanup: () => void };

// ─── Axis: Linear Navigation ───

/** Tests vertical Down/Up navigation (orientation=vertical) */
export function assertVerticalNav(factory: Factory) {
  it("Down Arrow: moves focus to next item", async () => {
    const { page, cleanup } = factory();
    const firstId = page.locator(":focus").getAttribute("id");
    page.keyboard.press("ArrowDown");
    const nextId = page.locator(":focus").getAttribute("id");
    expect(nextId).not.toBe(firstId);
    await expect(page.locator(":focus")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#" + firstId)).toHaveAttribute("tabindex", "-1");
    cleanup();
  });

  it("Up Arrow: moves focus to previous item", async () => {
    const { page, cleanup } = factory();
    const firstId = page.locator(":focus").getAttribute("id");
    page.keyboard.press("ArrowDown");
    page.keyboard.press("ArrowUp");
    await expect(page.locator(":focus")).toBeFocused();
    expect(page.locator(":focus").getAttribute("id")).toBe(firstId);
    await expect(page.locator(":focus")).toHaveAttribute("tabindex", "0");
    cleanup();
  });
}

/** Tests horizontal Left/Right navigation (orientation=horizontal) */
export function assertHorizontalNav(factory: Factory) {
  it("Right Arrow: moves focus to next item", async () => {
    const { page, cleanup } = factory();
    const firstId = page.locator(":focus").getAttribute("id");
    page.keyboard.press("ArrowRight");
    const nextId = page.locator(":focus").getAttribute("id");
    expect(nextId).not.toBe(firstId);
    await expect(page.locator(":focus")).toHaveAttribute("tabindex", "0");
    await expect(page.locator("#" + firstId)).toHaveAttribute("tabindex", "-1");
    cleanup();
  });

  it("Left Arrow: moves focus to previous item", async () => {
    const { page, cleanup } = factory();
    const firstId = page.locator(":focus").getAttribute("id");
    page.keyboard.press("ArrowRight");
    page.keyboard.press("ArrowLeft");
    expect(page.locator(":focus").getAttribute("id")).toBe(firstId);
    await expect(page.locator(":focus")).toHaveAttribute("tabindex", "0");
    cleanup();
  });
}

// ─── Axis: Boundary ───

/** Tests that focus does NOT move at edges (loop=false) */
export function assertBoundaryClamp(
  factory: Factory,
  opts: { firstId: string; lastId: string; axis: "vertical" | "horizontal" },
) {
  const key =
    opts.axis === "vertical"
      ? { fwd: "ArrowDown", bwd: "ArrowUp" }
      : { fwd: "ArrowRight", bwd: "ArrowLeft" };

  it(`${key.fwd} at last item: focus stays (clamp)`, async () => {
    const { page, cleanup } = factory();
    for (let i = 0; i < 20; i++) page.keyboard.press(key.fwd);
    await expect(page.locator("#" + opts.lastId)).toBeFocused();
    await expect(page.locator("#" + opts.lastId)).toHaveAttribute(
      "tabindex",
      "0",
    );
    page.keyboard.press(key.fwd);
    await expect(page.locator("#" + opts.lastId)).toBeFocused();
    cleanup();
  });

  it(`${key.bwd} at first item: focus stays (clamp)`, async () => {
    const { page, cleanup } = factory();
    for (let i = 0; i < 20; i++) page.keyboard.press(key.bwd);
    await expect(page.locator("#" + opts.firstId)).toBeFocused();
    await expect(page.locator("#" + opts.firstId)).toHaveAttribute(
      "tabindex",
      "0",
    );
    page.keyboard.press(key.bwd);
    await expect(page.locator("#" + opts.firstId)).toBeFocused();
    cleanup();
  });
}

/** Tests that focus wraps at edges (loop=true) */
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

  it(`${key.fwd} at last item: wraps to first`, async () => {
    const { page, cleanup } = opts.factoryAtLast();
    await expect(page.locator("#" + opts.lastId)).toBeFocused();
    page.keyboard.press(key.fwd);
    await expect(page.locator("#" + opts.firstId)).toBeFocused();
    await expect(page.locator("#" + opts.firstId)).toHaveAttribute(
      "tabindex",
      "0",
    );
    cleanup();
  });

  it(`${key.bwd} at first item: wraps to last`, async () => {
    const { page, cleanup } = opts.factoryAtFirst();
    await expect(page.locator("#" + opts.firstId)).toBeFocused();
    page.keyboard.press(key.bwd);
    await expect(page.locator("#" + opts.lastId)).toBeFocused();
    await expect(page.locator("#" + opts.lastId)).toHaveAttribute(
      "tabindex",
      "0",
    );
    cleanup();
  });
}

// ─── Axis: Home / End ───

export function assertHomeEnd(
  factory: Factory,
  opts: { firstId: string; lastId: string },
) {
  it("Home: moves to first item", async () => {
    const { page, cleanup } = factory();
    page.keyboard.press("Home");
    await expect(page.locator("#" + opts.firstId)).toBeFocused();
    await expect(page.locator("#" + opts.firstId)).toHaveAttribute(
      "tabindex",
      "0",
    );
    cleanup();
  });

  it("End: moves to last item", async () => {
    const { page, cleanup } = factory();
    page.keyboard.press("End");
    await expect(page.locator("#" + opts.lastId)).toBeFocused();
    await expect(page.locator("#" + opts.lastId)).toHaveAttribute(
      "tabindex",
      "0",
    );
    cleanup();
  });
}

// ─── Axis: Orthogonal Ignored ───

/** Tests that orthogonal axis keys have no effect */
export function assertOrthogonalIgnored(
  factory: Factory,
  axis: "vertical" | "horizontal",
) {
  const [k1, k2] =
    axis === "vertical"
      ? (["ArrowRight", "ArrowLeft"] as const)
      : (["ArrowDown", "ArrowUp"] as const);

  it(`${k1}: no effect`, async () => {
    const { page, cleanup } = factory();
    const beforeId = page.locator(":focus").getAttribute("id");
    page.keyboard.press(k1);
    expect(page.locator(":focus").getAttribute("id")).toBe(beforeId);
    await expect(page.locator(":focus")).toHaveAttribute("tabindex", "0");
    cleanup();
  });

  it(`${k2}: no effect`, async () => {
    const { page, cleanup } = factory();
    const beforeId = page.locator(":focus").getAttribute("id");
    page.keyboard.press(k2);
    expect(page.locator(":focus").getAttribute("id")).toBe(beforeId);
    await expect(page.locator(":focus")).toHaveAttribute("tabindex", "0");
    cleanup();
  });
}

// ─── Axis: Follow Focus ───

/** Tests that selection (aria-selected) follows focus on navigation */
export function assertFollowFocus(factory: Factory) {
  it("selection follows focus on navigation (aria-selected)", async () => {
    const { page, cleanup } = factory();
    const firstId = page.locator(":focus").getAttribute("id");
    page.keyboard.press("ArrowDown");
    await expect(page.locator(":focus")).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.locator("#" + firstId)).toHaveAttribute(
      "aria-selected",
      "false",
    );
    cleanup();
  });
}

// ─── Axis: No Selection ───

/** Tests that navigation does not create selection (mode=none) */
export function assertNoSelection(factory: Factory, itemIds: string[]) {
  it("navigation does not create selection", async () => {
    const { page, cleanup } = factory();
    page.keyboard.press("ArrowDown");
    page.keyboard.press("ArrowDown");
    for (const id of itemIds) {
      await expect(page.locator("#" + id)).not.toHaveAttribute(
        "aria-selected",
        "true",
      );
    }
    cleanup();
  });
}

// ─── Axis: Popup Lifecycle ───

/** Tests Escape restores focus to invoker */
export function assertFocusRestore(
  factory: Factory,
  opts: { invokerItemId: string },
) {
  it("Escape: restores focus to invoker", async () => {
    const { page, cleanup } = factory();
    page.keyboard.press("Escape");
    await expect(page.locator("#" + opts.invokerItemId)).toBeFocused();
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
  it("Tab at last: wraps to first (focus trap)", async () => {
    const { page, cleanup } = (opts.factoryAtLast ?? factory)();
    await expect(page.locator("#" + opts.lastId)).toBeFocused();
    page.keyboard.press("Tab");
    await expect(page.locator("#" + opts.firstId)).toBeFocused();
    await expect(page.locator("#" + opts.firstId)).toHaveAttribute(
      "tabindex",
      "0",
    );
    cleanup();
  });

  it("Shift+Tab at first: wraps to last (focus trap)", async () => {
    const { page, cleanup } = (opts.factoryAtFirst ?? factory)();
    await expect(page.locator("#" + opts.firstId)).toBeFocused();
    page.keyboard.press("Shift+Tab");
    await expect(page.locator("#" + opts.lastId)).toBeFocused();
    await expect(page.locator("#" + opts.lastId)).toHaveAttribute(
      "tabindex",
      "0",
    );
    cleanup();
  });
}
