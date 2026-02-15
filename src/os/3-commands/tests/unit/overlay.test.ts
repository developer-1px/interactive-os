/**
 * Overlay Commands Unit Tests — OS SPEC §11 (G3)
 *
 * Tests OVERLAY_OPEN / OVERLAY_CLOSE state transitions:
 * - OPEN pushes overlay onto stack
 * - OPEN is idempotent (no duplicate)
 * - CLOSE by id removes specific overlay
 * - CLOSE without id pops top
 * - CLOSE on empty stack is no-op
 * - Multiple overlays maintain LIFO ordering
 */

import { kernel } from "@os/kernel";
import { OVERLAY_OPEN, OVERLAY_CLOSE } from "@os/3-commands/overlay/overlay";
import { initialOSState } from "@os/state/initial";
import { describe, expect, it, beforeEach } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function resetState() {
    kernel.setState((prev) => ({
        ...prev,
        os: JSON.parse(JSON.stringify(initialOSState)),
    }));
}

function getStack() {
    return kernel.getState().os.overlays.stack;
}

// ═══════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════

describe("Overlay Commands", () => {
    beforeEach(() => resetState());

    describe("OVERLAY_OPEN", () => {
        it("pushes overlay onto stack", () => {
            kernel.dispatch(OVERLAY_OPEN({ id: "dlg-1", type: "dialog" }));

            const stack = getStack();
            expect(stack).toHaveLength(1);
            expect(stack[0]).toEqual({ id: "dlg-1", type: "dialog" });
        });

        it("supports different overlay types", () => {
            kernel.dispatch(OVERLAY_OPEN({ id: "m1", type: "menu" }));
            expect(getStack()[0]?.type).toBe("menu");
        });

        it("is idempotent — does not duplicate same id", () => {
            kernel.dispatch(OVERLAY_OPEN({ id: "dlg-1", type: "dialog" }));
            kernel.dispatch(OVERLAY_OPEN({ id: "dlg-1", type: "dialog" }));

            expect(getStack()).toHaveLength(1);
        });

        it("stacks multiple different overlays", () => {
            kernel.dispatch(OVERLAY_OPEN({ id: "dlg-1", type: "dialog" }));
            kernel.dispatch(OVERLAY_OPEN({ id: "menu-1", type: "menu" }));
            kernel.dispatch(OVERLAY_OPEN({ id: "pop-1", type: "popover" }));

            const stack = getStack();
            expect(stack).toHaveLength(3);
            expect(stack.map((e) => e.id)).toEqual(["dlg-1", "menu-1", "pop-1"]);
        });
    });

    describe("OVERLAY_CLOSE", () => {
        it("removes specific overlay by id", () => {
            kernel.dispatch(OVERLAY_OPEN({ id: "dlg-1", type: "dialog" }));
            kernel.dispatch(OVERLAY_OPEN({ id: "dlg-2", type: "dialog" }));

            kernel.dispatch(OVERLAY_CLOSE({ id: "dlg-1" }));

            const stack = getStack();
            expect(stack).toHaveLength(1);
            expect(stack[0]?.id).toBe("dlg-2");
        });

        it("pops top overlay when no id provided", () => {
            kernel.dispatch(OVERLAY_OPEN({ id: "dlg-1", type: "dialog" }));
            kernel.dispatch(OVERLAY_OPEN({ id: "dlg-2", type: "dialog" }));

            kernel.dispatch(OVERLAY_CLOSE({}));

            const stack = getStack();
            expect(stack).toHaveLength(1);
            expect(stack[0]?.id).toBe("dlg-1");
        });

        it("is no-op on empty stack", () => {
            const before = JSON.stringify(kernel.getState().os);
            kernel.dispatch(OVERLAY_CLOSE({}));
            const after = JSON.stringify(kernel.getState().os);
            expect(before).toBe(after);
        });

        it("removes middle overlay from stack", () => {
            kernel.dispatch(OVERLAY_OPEN({ id: "a", type: "dialog" }));
            kernel.dispatch(OVERLAY_OPEN({ id: "b", type: "menu" }));
            kernel.dispatch(OVERLAY_OPEN({ id: "c", type: "popover" }));

            kernel.dispatch(OVERLAY_CLOSE({ id: "b" }));

            const stack = getStack();
            expect(stack).toHaveLength(2);
            expect(stack.map((e) => e.id)).toEqual(["a", "c"]);
        });

        it("LIFO: sequential pop removes in reverse order", () => {
            kernel.dispatch(OVERLAY_OPEN({ id: "a", type: "dialog" }));
            kernel.dispatch(OVERLAY_OPEN({ id: "b", type: "menu" }));
            kernel.dispatch(OVERLAY_OPEN({ id: "c", type: "popover" }));

            kernel.dispatch(OVERLAY_CLOSE({})); // removes c
            expect(getStack().map((e) => e.id)).toEqual(["a", "b"]);

            kernel.dispatch(OVERLAY_CLOSE({})); // removes b
            expect(getStack().map((e) => e.id)).toEqual(["a"]);

            kernel.dispatch(OVERLAY_CLOSE({})); // removes a
            expect(getStack()).toHaveLength(0);
        });
    });
});
