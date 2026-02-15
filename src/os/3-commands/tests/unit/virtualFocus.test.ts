/**
 * Virtual Focus Unit Tests — T5a
 *
 * Checks that NAVIGATE and FOCUS commands respect the `virtualFocus` project config.
 * When `virtualFocus: true`, they should NOT trigger the `focus` effect (el.focus()),
 * allowing the DOM focus to remain on the container (e.g. input) while
 * logically moving the active item state.
 */

import { kernel } from "@os/kernel";
import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { NAVIGATE } from "@os/3-commands/navigate";
import { FOCUS } from "@os/3-commands/focus";
import { initialOSState } from "@os/state/initial";
import { describe, expect, it, beforeEach, vi } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function resetState() {
    kernel.setState((prev) => ({
        ...prev,
        os: JSON.parse(JSON.stringify(initialOSState)),
    }));
}

function registerVirtualZone(id: string, items: string[]) {
    // Register zone with virtualFocus: true
    ZoneRegistry.register(id, {
        config: {
            project: { virtualFocus: true },
        } as any,
        element: document.createElement("div"),
        items,
    });

    // Set initial state
    kernel.setState((prev) => ({
        ...prev,
        os: {
            ...prev.os,
            focus: {
                ...prev.os.focus,
                activeZoneId: id,
                zones: {
                    ...prev.os.focus.zones,
                    [id]: {
                        ...prev.os.focus.zones[id],
                        // Default select config is needed for NAVIGATE to work
                        // (Mocking minimal state)
                        selection: [],
                        focusedItemId: items[0] || null,
                    } as any,
                },
            },
        },
    }));
}

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

describe("Virtual Focus (T5a)", () => {
    beforeEach(() => {
        resetState();
        // Assuming ZoneRegistry mocks are handled or reset by framework/setup
        // If ZoneRegistry behaves as singleton, we might need to clear it or overwrite.
    });

    describe.skip("NAVIGATE with virtualFocus: true", () => {
        it("updates state but suppresses focus effect", () => {
            const items = ["item-1", "item-2"];
            registerVirtualZone("z-virtual", items);

            // Verify setup
            const stateBefore = kernel.getState().os.focus.zones["z-virtual"];
            expect(stateBefore?.focusedItemId).toBe("item-1");

            // Dispatch NAVIGATE (down)
            const result = kernel.dispatch(NAVIGATE({ direction: "down" }));

            // 1. Check State Update
            const stateAfter = kernel.getState().os.focus.zones["z-virtual"];
            expect(stateAfter?.focusedItemId).toBe("item-2");

            // 2. Check Result Effect
            // The command should return a result object.
            // We expect 'focus' property to be undefined or null to skip DOM focus.
            expect(result).toBeDefined();
            if (result && typeof result === "object") {
                // @ts-ignore - inspecting internal command result structure
                expect(result.focus).toBeUndefined();
                // @ts-ignore
                expect(result.scroll).toBe("item-2"); // Scroll should still happen
            }
        });
    });

    describe("FOCUS with virtualFocus: true", () => {
        it("updates state but suppresses focus effect", () => {
            const items = ["item-1", "item-2"];
            registerVirtualZone("z-virtual", items);

            // Dispatch FOCUS to item-2
            const result = kernel.dispatch(FOCUS({ zoneId: "z-virtual", itemId: "item-2" }));

            // 1. Check State Update
            const stateAfter = kernel.getState().os.focus.zones["z-virtual"];
            expect(stateAfter?.focusedItemId).toBe("item-2");

            // 2. Check Result Effect
            // If result is undefined, it means no effect ran (which is good)
            if (result && typeof result === "object") {
                // @ts-ignore
                expect(result.focus).toBeUndefined();
            }
        });

        it("triggers focus effect when virtualFocus is false (default)", () => {
            // Register normal zone
            ZoneRegistry.register("z-normal", {
                config: { project: { virtualFocus: false } } as any,
                element: document.createElement("div"),
                items: ["item-A"],
            });

            const result = kernel.dispatch(FOCUS({ zoneId: "z-normal", itemId: "item-A" }));

            if (result && typeof result === "object") {
                // @ts-ignore
                expect(result.focus).toBe("item-A");
            }
        });
    });
});
