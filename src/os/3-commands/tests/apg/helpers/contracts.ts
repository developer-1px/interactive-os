/**
 * APG Contract Test Factory — Shared Axis Tests (Tier 1: pressKey → attrs)
 *
 * Each function below tests one "axis" of keyboard behavior.
 * APG pattern files assemble these axes into W3C-compliant test suites.
 *
 * Axis = reusable behavioral unit (defined once, shared across patterns)
 * APG file = combination proof (config + axis assembly = W3C spec satisfied)
 *
 * Testing Trophy Tier 1:
 *   Input:  pressKey / click (user action simulation)
 *   Assert: attrs() → tabIndex, aria-selected, data-focused (ARIA contract)
 */

import { expect, it } from "vitest";
import type { createTestOsKernel } from "../../integration/helpers/createTestOsKernel";

type TestKernel = ReturnType<typeof createTestOsKernel>;
type Factory = () => TestKernel;

// ─── Axis: Linear Navigation ───

/** Tests vertical Down/Up navigation via pressKey (orientation=vertical) */
export function assertVerticalNav(factory: Factory) {
    it("Down Arrow: moves focus to next item", () => {
        const t = factory();
        const first = t.focusedItemId()!;
        t.pressKey("ArrowDown");
        const next = t.focusedItemId()!;
        expect(next).not.toBe(first);
        // Tier 1: ARIA contract — focused item gets tabIndex=0
        expect(t.attrs(next).tabIndex).toBe(0);
        expect(t.attrs(first).tabIndex).toBe(-1);
    });

    it("Up Arrow: moves focus to previous item", () => {
        const t = factory();
        const first = t.focusedItemId()!;
        t.pressKey("ArrowDown");
        t.pressKey("ArrowUp");
        expect(t.focusedItemId()).toBe(first);
        expect(t.attrs(first).tabIndex).toBe(0);
    });
}

/** Tests horizontal Left/Right navigation via pressKey (orientation=horizontal) */
export function assertHorizontalNav(factory: Factory) {
    it("Right Arrow: moves focus to next item", () => {
        const t = factory();
        const first = t.focusedItemId()!;
        t.pressKey("ArrowRight");
        const next = t.focusedItemId()!;
        expect(next).not.toBe(first);
        expect(t.attrs(next).tabIndex).toBe(0);
        expect(t.attrs(first).tabIndex).toBe(-1);
    });

    it("Left Arrow: moves focus to previous item", () => {
        const t = factory();
        const first = t.focusedItemId()!;
        t.pressKey("ArrowRight");
        t.pressKey("ArrowLeft");
        expect(t.focusedItemId()).toBe(first);
        expect(t.attrs(first).tabIndex).toBe(0);
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
        const t = factory();
        // Navigate to last
        for (let i = 0; i < 20; i++) t.pressKey(key.fwd);
        expect(t.focusedItemId()).toBe(opts.lastId);
        expect(t.attrs(opts.lastId).tabIndex).toBe(0);
        t.pressKey(key.fwd);
        expect(t.focusedItemId()).toBe(opts.lastId);
    });

    it(`${key.bwd} at first item: focus stays (clamp)`, () => {
        const t = factory();
        // Navigate to first
        for (let i = 0; i < 20; i++) t.pressKey(key.bwd);
        expect(t.focusedItemId()).toBe(opts.firstId);
        expect(t.attrs(opts.firstId).tabIndex).toBe(0);
        t.pressKey(key.bwd);
        expect(t.focusedItemId()).toBe(opts.firstId);
    });
}

/** Tests that focus wraps at edges via pressKey (loop=true) */
export function assertLoop(
    opts: {
        firstId: string;
        lastId: string;
        axis: "vertical" | "horizontal";
        factoryAtLast: Factory;
        factoryAtFirst: Factory;
    },
) {
    const key =
        opts.axis === "vertical"
            ? { fwd: "ArrowDown", bwd: "ArrowUp" }
            : { fwd: "ArrowRight", bwd: "ArrowLeft" };

    it(`${key.fwd} at last item: wraps to first`, () => {
        const t = opts.factoryAtLast();
        expect(t.focusedItemId()).toBe(opts.lastId);
        t.pressKey(key.fwd);
        expect(t.focusedItemId()).toBe(opts.firstId);
        expect(t.attrs(opts.firstId).tabIndex).toBe(0);
    });

    it(`${key.bwd} at first item: wraps to last`, () => {
        const t = opts.factoryAtFirst();
        expect(t.focusedItemId()).toBe(opts.firstId);
        t.pressKey(key.bwd);
        expect(t.focusedItemId()).toBe(opts.lastId);
        expect(t.attrs(opts.lastId).tabIndex).toBe(0);
    });
}

// ─── Axis: Home / End ───

export function assertHomeEnd(
    factory: Factory,
    opts: { firstId: string; lastId: string },
) {
    it("Home: moves to first item", () => {
        const t = factory();
        t.pressKey("Home");
        expect(t.focusedItemId()).toBe(opts.firstId);
        expect(t.attrs(opts.firstId).tabIndex).toBe(0);
    });

    it("End: moves to last item", () => {
        const t = factory();
        t.pressKey("End");
        expect(t.focusedItemId()).toBe(opts.lastId);
        expect(t.attrs(opts.lastId).tabIndex).toBe(0);
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
        const t = factory();
        const before = t.focusedItemId()!;
        t.pressKey(k1);
        expect(t.focusedItemId()).toBe(before);
        expect(t.attrs(before).tabIndex).toBe(0);
    });

    it(`${k2}: no effect`, () => {
        const t = factory();
        const before = t.focusedItemId()!;
        t.pressKey(k2);
        expect(t.focusedItemId()).toBe(before);
        expect(t.attrs(before).tabIndex).toBe(0);
    });
}

// ─── Axis: Follow Focus ───

/** Tests that selection (aria-selected) follows focus on navigation */
export function assertFollowFocus(factory: Factory) {
    it("selection follows focus on navigation (aria-selected)", () => {
        const t = factory();
        const first = t.focusedItemId()!;
        t.pressKey("ArrowDown");
        const next = t.focusedItemId()!;
        // After navigation: new focus gets selected, old loses selection
        expect(t.attrs(next)["aria-selected"]).toBe(true);
        expect(t.attrs(first)["aria-selected"]).toBe(false);
    });
}

// ─── Axis: No Selection ───

/** Tests that navigation does not create selection (mode=none) */
export function assertNoSelection(factory: Factory) {
    it("navigation does not create selection", () => {
        const t = factory();
        t.pressKey("ArrowDown");
        t.pressKey("ArrowDown");
        expect(t.selection()).toEqual([]);
    });
}

// ─── Axis: Popup Lifecycle ───

/** Tests Escape closes the popup zone */
export function assertEscapeClose(factory: Factory) {
    it("Escape: closes popup (clears active zone)", () => {
        const t = factory();
        t.pressKey("Escape");
        expect(t.activeZoneId()).toBeNull();
    });
}

/** Tests Escape + stack pop restores focus to invoker */
export function assertFocusRestore(
    factory: Factory,
    opts: { invokerZoneId: string; invokerItemId: string },
) {
    it("Escape + stack pop: restores focus to invoker", () => {
        const t = factory();
        t.pressKey("Escape");
        t.dispatch(t.OS_STACK_POP());
        expect(t.activeZoneId()).toBe(opts.invokerZoneId);
        expect(t.focusedItemId(opts.invokerZoneId)).toBe(opts.invokerItemId);
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
        const t = (opts.factoryAtLast ?? factory)();
        expect(t.focusedItemId()).toBe(opts.lastId);
        t.pressKey("Tab");
        expect(t.focusedItemId()).toBe(opts.firstId);
        expect(t.attrs(opts.firstId).tabIndex).toBe(0);
    });

    it("Shift+Tab at first: wraps to last (focus trap)", () => {
        const t = (opts.factoryAtFirst ?? factory)();
        expect(t.focusedItemId()).toBe(opts.firstId);
        t.pressKey("Shift+Tab");
        expect(t.focusedItemId()).toBe(opts.lastId);
        expect(t.attrs(opts.lastId).tabIndex).toBe(0);
    });
}
