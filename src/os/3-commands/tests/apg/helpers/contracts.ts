/**
 * APG Contract Test Factory — Shared Axis Tests
 *
 * Each function below tests one "axis" of keyboard behavior.
 * APG pattern files assemble these axes into W3C-compliant test suites.
 *
 * Axis = reusable behavioral unit (defined once, shared across patterns)
 * APG file = combination proof (config + axis assembly = W3C spec satisfied)
 */

import { expect, it } from "vitest";
import type { createTestKernel } from "../../integration/helpers/createTestKernel";

type TestKernel = ReturnType<typeof createTestKernel>;
type Factory = () => TestKernel;

// ─── Axis: Linear Navigation ───

/** Tests vertical Down/Up navigation (orientation=vertical) */
export function assertVerticalNav(factory: Factory) {
    it("Down Arrow: moves focus to next item", () => {
        const t = factory();
        const first = t.focusedItemId()!;
        t.dispatch(t.NAVIGATE({ direction: "down" }));
        expect(t.focusedItemId()).not.toBe(first);
    });

    it("Up Arrow: moves focus to previous item", () => {
        const t = factory();
        // Move down first, then up should return
        const first = t.focusedItemId()!;
        t.dispatch(t.NAVIGATE({ direction: "down" }));
        t.dispatch(t.NAVIGATE({ direction: "up" }));
        expect(t.focusedItemId()).toBe(first);
    });
}

/** Tests horizontal Left/Right navigation (orientation=horizontal) */
export function assertHorizontalNav(factory: Factory) {
    it("Right Arrow: moves focus to next item", () => {
        const t = factory();
        const first = t.focusedItemId()!;
        t.dispatch(t.NAVIGATE({ direction: "right" }));
        expect(t.focusedItemId()).not.toBe(first);
    });

    it("Left Arrow: moves focus to previous item", () => {
        const t = factory();
        const first = t.focusedItemId()!;
        t.dispatch(t.NAVIGATE({ direction: "right" }));
        t.dispatch(t.NAVIGATE({ direction: "left" }));
        expect(t.focusedItemId()).toBe(first);
    });
}

// ─── Axis: Boundary ───

/** Tests that focus does NOT move at edges (loop=false) */
export function assertBoundaryClamp(
    factory: Factory,
    opts: { firstId: string; lastId: string; axis: "vertical" | "horizontal" },
) {
    const [fwd, bwd] =
        opts.axis === "vertical"
            ? (["down", "up"] as const)
            : (["right", "left"] as const);

    it(`${fwd} at last item: focus stays`, () => {
        const t = factory();
        // Navigate to last
        for (let i = 0; i < 20; i++) t.dispatch(t.NAVIGATE({ direction: fwd }));
        expect(t.focusedItemId()).toBe(opts.lastId);
        t.dispatch(t.NAVIGATE({ direction: fwd }));
        expect(t.focusedItemId()).toBe(opts.lastId);
    });

    it(`${bwd} at first item: focus stays`, () => {
        const t = factory();
        // Navigate to first
        for (let i = 0; i < 20; i++) t.dispatch(t.NAVIGATE({ direction: bwd }));
        expect(t.focusedItemId()).toBe(opts.firstId);
        t.dispatch(t.NAVIGATE({ direction: bwd }));
        expect(t.focusedItemId()).toBe(opts.firstId);
    });
}

/** Tests that focus wraps at edges (loop=true) */
export function assertLoop(
    opts: {
        firstId: string;
        lastId: string;
        axis: "vertical" | "horizontal";
        factoryAtLast: Factory;
        factoryAtFirst: Factory;
    },
) {
    const [fwd, bwd] =
        opts.axis === "vertical"
            ? (["down", "up"] as const)
            : (["right", "left"] as const);

    it(`${fwd} at last item: wraps to first`, () => {
        const t = opts.factoryAtLast();
        expect(t.focusedItemId()).toBe(opts.lastId);
        t.dispatch(t.NAVIGATE({ direction: fwd }));
        expect(t.focusedItemId()).toBe(opts.firstId);
    });

    it(`${bwd} at first item: wraps to last`, () => {
        const t = opts.factoryAtFirst();
        expect(t.focusedItemId()).toBe(opts.firstId);
        t.dispatch(t.NAVIGATE({ direction: bwd }));
        expect(t.focusedItemId()).toBe(opts.lastId);
    });
}

// ─── Axis: Home / End ───

export function assertHomeEnd(
    factory: Factory,
    opts: { firstId: string; lastId: string },
) {
    it("Home: moves to first item", () => {
        const t = factory();
        t.dispatch(t.NAVIGATE({ direction: "home" }));
        expect(t.focusedItemId()).toBe(opts.firstId);
    });

    it("End: moves to last item", () => {
        const t = factory();
        t.dispatch(t.NAVIGATE({ direction: "end" }));
        expect(t.focusedItemId()).toBe(opts.lastId);
    });
}

// ─── Axis: Orthogonal Ignored ───

/** Tests that orthogonal axis keys have no effect */
export function assertOrthogonalIgnored(
    factory: Factory,
    axis: "vertical" | "horizontal",
) {
    const [d1, d2] =
        axis === "vertical"
            ? (["right", "left"] as const)
            : (["down", "up"] as const);

    it(`${d1} Arrow: no effect`, () => {
        const t = factory();
        const before = t.focusedItemId();
        t.dispatch(t.NAVIGATE({ direction: d1 }));
        expect(t.focusedItemId()).toBe(before);
    });

    it(`${d2} Arrow: no effect`, () => {
        const t = factory();
        const before = t.focusedItemId();
        t.dispatch(t.NAVIGATE({ direction: d2 }));
        expect(t.focusedItemId()).toBe(before);
    });
}

// ─── Axis: Follow Focus ───

/** Tests that selection follows focus on navigation */
export function assertFollowFocus(factory: Factory) {
    it("selection follows focus on navigation", () => {
        const t = factory();
        t.dispatch(t.NAVIGATE({ direction: "down" }));
        const focused = t.focusedItemId()!;
        expect(t.selection()).toEqual([focused]);
    });
}

// ─── Axis: No Selection ───

/** Tests that navigation does not create selection (mode=none) */
export function assertNoSelection(factory: Factory) {
    it("navigation does not create selection", () => {
        const t = factory();
        t.dispatch(t.NAVIGATE({ direction: "down" }));
        t.dispatch(t.NAVIGATE({ direction: "down" }));
        expect(t.selection()).toEqual([]);
    });
}

// ─── Axis: Popup Lifecycle ───

/** Tests Escape closes the popup zone */
export function assertEscapeClose(factory: Factory) {
    it("Escape: closes popup (clears active zone)", () => {
        const t = factory();
        t.dispatch(t.ESCAPE());
        expect(t.activeZoneId()).toBeNull();
    });
}

/** Tests ESCAPE + STACK_POP restores focus to invoker */
export function assertFocusRestore(
    factory: Factory,
    opts: { invokerZoneId: string; invokerItemId: string },
) {
    it("Escape + STACK_POP: restores focus to invoker", () => {
        const t = factory();
        t.dispatch(t.ESCAPE());
        t.dispatch(t.STACK_POP());
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
        t.dispatch(t.TAB({ direction: "forward" }));
        expect(t.focusedItemId()).toBe(opts.firstId);
    });

    it("Shift+Tab at first: wraps to last (focus trap)", () => {
        const t = (opts.factoryAtFirst ?? factory)();
        expect(t.focusedItemId()).toBe(opts.firstId);
        t.dispatch(t.TAB({ direction: "backward" }));
        expect(t.focusedItemId()).toBe(opts.lastId);
    });
}
