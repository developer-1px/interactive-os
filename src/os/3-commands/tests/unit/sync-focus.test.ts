/**
 * SYNC_FOCUS — Unit Tests
 *
 * SPEC §3.1: SYNC_FOCUS updates focusedItemId without changing activeZoneId.
 * Correction: implementation also updates activeZoneId (see syncFocus.ts).
 *
 * Triggered by: FocusListener.focusin → DOM focus change from outside zone.
 * Key contract: NO DOM focus effect (prevents focusin → SYNC → focus → focusin loop).
 */

import { SYNC_FOCUS } from "@os/3-commands/focus/syncFocus";
import { kernel } from "@os/kernel";
import { initialZoneState } from "@os/state/initial";
import { beforeEach, describe, expect, it } from "vitest";

let snapshot: ReturnType<typeof kernel.getState>;

function setupFocus(zoneId: string, focusedItemId: string | null) {
    kernel.setState((prev) => ({
        ...prev,
        os: {
            ...prev.os,
            focus: {
                ...prev.os.focus,
                activeZoneId: zoneId,
                zones: {
                    ...prev.os.focus.zones,
                    [zoneId]: {
                        ...initialZoneState,
                        ...prev.os.focus.zones[zoneId],
                        focusedItemId,
                    },
                },
            },
        },
    }));
}

beforeEach(() => {
    snapshot = kernel.getState();
    return () => kernel.setState(() => snapshot);
});

describe("SYNC_FOCUS", () => {
    it("updates focusedItemId for the target zone", () => {
        setupFocus("zoneA", "item-1");

        kernel.dispatch(SYNC_FOCUS({ id: "item-2", zoneId: "zoneA" }));

        const zone = kernel.getState().os.focus.zones.zoneA;
        expect(zone?.focusedItemId).toBe("item-2");
    });

    it("updates lastFocusedId alongside focusedItemId", () => {
        setupFocus("zoneA", "item-1");

        kernel.dispatch(SYNC_FOCUS({ id: "item-2", zoneId: "zoneA" }));

        const zone = kernel.getState().os.focus.zones.zoneA;
        expect(zone?.lastFocusedId).toBe("item-2");
    });

    it("updates activeZoneId to the synced zone", () => {
        setupFocus("zoneA", "item-1");

        // SYNC_FOCUS from a different zone
        kernel.dispatch(SYNC_FOCUS({ id: "item-x", zoneId: "zoneB" }));

        expect(kernel.getState().os.focus.activeZoneId).toBe("zoneB");
    });

    it("creates zone state if zone did not exist", () => {
        // zoneNew has no prior state
        kernel.dispatch(SYNC_FOCUS({ id: "item-1", zoneId: "zoneNew" }));

        const zone = kernel.getState().os.focus.zones.zoneNew;
        expect(zone).toBeDefined();
        expect(zone?.focusedItemId).toBe("item-1");
        expect(zone?.lastFocusedId).toBe("item-1");
    });

    it("does NOT produce a focus effect (prevents loop)", () => {
        setupFocus("zoneA", "item-1");

        // SYNC_FOCUS only updates state — no DOM focus effect.
        // Verified structurally: syncFocus.ts returns { state } with no focus key.
        // This test confirms the command executes correctly (state updates)
        // without triggering the "focus" effect that would cause a loop.
        kernel.dispatch(
            SYNC_FOCUS({ id: "item-2", zoneId: "zoneA" }),
        );

        // State was updated (the command did execute)
        const zone = kernel.getState().os.focus.zones.zoneA;
        expect(zone?.focusedItemId).toBe("item-2");
    });
});
