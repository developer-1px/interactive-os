/**
 * ZoneCursor OS Commands — TDD Spec
 *
 * Tests that OS commands pass ZoneCursor to zone callbacks,
 * and that apps receive full context (focusId + selection + anchor).
 *
 * Red phase: these tests will FAIL until implementation is done.
 */

import { GLOBAL } from "@kernel";
import type { Command, ScopeToken } from "@kernel/core/tokens";
import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { OS_COPY } from "@os/3-commands/clipboard/clipboard";
import { ACTIVATE } from "@os/3-commands/interaction/activate";
import { OS_CHECK } from "@os/3-commands/interaction/check";
import { OS_DELETE } from "@os/3-commands/interaction/delete";

import { kernel } from "@os/kernel";
import { initialZoneState } from "@os/state/initial";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

let snapshot: ReturnType<typeof kernel.getState>;

function setupFocusWithSelection(
    zoneId: string,
    focusedItemId: string,
    selection: string[] = [],
    anchor: string | null = null,
) {
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
                        selection,
                        selectionAnchor: anchor,
                    },
                },
            },
        },
    }));
}

/** Capture dispatched commands via GLOBAL before-middleware */
function _captureDispatches() {
    const captured: Command[] = [];
    kernel.use({
        id: "test:capture-dispatches",
        scope: GLOBAL as ScopeToken,
        before(ctx) {
            captured.push({ ...ctx.command } as Command);
            return ctx;
        },
    });
    return captured;
}

beforeEach(() => {
    snapshot = kernel.getState();
    return () => {
        kernel.setState(() => snapshot);
        for (const key of [...ZoneRegistry.keys()]) {
            ZoneRegistry.unregister(key);
        }
        vi.restoreAllMocks();
    };
});

// ═══════════════════════════════════════════════════════════════════
// FR1: ZoneCursor interface — callbacks receive full cursor
// ═══════════════════════════════════════════════════════════════════

describe("FR1: ZoneCursor — callbacks receive cursor with focusId + selection + anchor", () => {
    it("onDelete receives ZoneCursor with focusId when no selection", () => {
        const receivedCursor = vi.fn(() => ({ type: "mock/delete", payload: {} }));

        ZoneRegistry.register("z1", {
            config: {} as any,
            element: document.createElement("div"),
            parentId: null,
            onDelete: receivedCursor,
        });
        setupFocusWithSelection("z1", "item-1");

        kernel.dispatch(OS_DELETE());

        expect(receivedCursor).toHaveBeenCalledWith({
            focusId: "item-1",
            selection: [],
            anchor: null,
        });
    });

    it("onDelete receives ZoneCursor with selection when items are selected", () => {
        const receivedCursor = vi.fn(() => ({ type: "mock/delete", payload: {} }));

        ZoneRegistry.register("z1", {
            config: {} as any,
            element: document.createElement("div"),
            parentId: null,
            onDelete: receivedCursor,
        });
        setupFocusWithSelection("z1", "item-3", ["item-1", "item-2", "item-3"], "item-1");

        kernel.dispatch(OS_DELETE());

        expect(receivedCursor).toHaveBeenCalledWith({
            focusId: "item-3",
            selection: ["item-1", "item-2", "item-3"],
            anchor: "item-1",
        });
    });

    it("onAction receives ZoneCursor", () => {
        const receivedCursor = vi.fn(() => ({ type: "mock/action", payload: {} }));

        ZoneRegistry.register("z1", {
            config: {} as any,
            element: document.createElement("div"),
            parentId: null,
            onAction: receivedCursor,
        });
        setupFocusWithSelection("z1", "item-1");

        kernel.dispatch(ACTIVATE());

        expect(receivedCursor).toHaveBeenCalledWith({
            focusId: "item-1",
            selection: [],
            anchor: null,
        });
    });

    it("onCheck receives ZoneCursor", () => {
        const receivedCursor = vi.fn(() => ({ type: "mock/check", payload: {} }));

        ZoneRegistry.register("z1", {
            config: {} as any,
            element: document.createElement("div"),
            parentId: null,
            onCheck: receivedCursor,
        });
        setupFocusWithSelection("z1", "item-1");

        kernel.dispatch(OS_CHECK({ targetId: "item-1" }));

        expect(receivedCursor).toHaveBeenCalledWith({
            focusId: "item-1",
            selection: [],
            anchor: null,
        });
    });
});

// ═══════════════════════════════════════════════════════════════════
// FR2: OS commands call callback ONCE (no loop)
// ═══════════════════════════════════════════════════════════════════

describe("FR2: OS commands call callback once, not per-item", () => {
    it("OS_DELETE calls onDelete exactly once even with 3 selected items", () => {
        const onDelete = vi.fn(() => [
            { type: "mock/delete", payload: { id: "item-1" } },
            { type: "mock/delete", payload: { id: "item-2" } },
            { type: "mock/delete", payload: { id: "item-3" } },
        ]);

        ZoneRegistry.register("z1", {
            config: {} as any,
            element: document.createElement("div"),
            parentId: null,
            onDelete,
        });
        setupFocusWithSelection("z1", "item-3", ["item-1", "item-2", "item-3"], "item-1");

        kernel.dispatch(OS_DELETE());

        expect(onDelete).toHaveBeenCalledTimes(1);
    });

    it("OS_COPY calls onCopy exactly once with multi-selection", () => {
        const onCopy = vi.fn(() => ({ type: "mock/copy", payload: {} }));

        ZoneRegistry.register("z1", {
            config: {} as any,
            element: document.createElement("div"),
            parentId: null,
            onCopy,
        });
        setupFocusWithSelection("z1", "item-2", ["item-1", "item-2"]);

        kernel.dispatch(OS_COPY());

        expect(onCopy).toHaveBeenCalledTimes(1);
    });
});

// ═══════════════════════════════════════════════════════════════════
// FR4: Edge case — no focusId → no callback
// ═══════════════════════════════════════════════════════════════════

describe("Edge cases", () => {
    it("does not call callback when no focusedItemId", () => {
        const onDelete = vi.fn(() => ({ type: "mock/delete", payload: {} }));

        ZoneRegistry.register("z1", {
            config: {} as any,
            element: document.createElement("div"),
            parentId: null,
            onDelete,
        });

        // Set active zone but no focusedItemId
        kernel.setState((prev) => ({
            ...prev,
            os: {
                ...prev.os,
                focus: {
                    ...prev.os.focus,
                    activeZoneId: "z1",
                    zones: {
                        ...prev.os.focus.zones,
                        z1: { ...initialZoneState, focusedItemId: null as any },
                    },
                },
            },
        }));

        kernel.dispatch(OS_DELETE());

        expect(onDelete).not.toHaveBeenCalled();
    });
});

// ═══════════════════════════════════════════════════════════════════
// FR7: SELECTION_CLEAR after delete/cut
// ═══════════════════════════════════════════════════════════════════

describe("FR7: SELECTION_CLEAR after delete/cut", () => {
    it("clears selection after OS_DELETE with multi-selection", () => {
        const onDelete = vi.fn(() => ({ type: "mock/delete", payload: {} }));

        ZoneRegistry.register("z1", {
            config: {} as any,
            element: document.createElement("div"),
            parentId: null,
            onDelete,
        });
        setupFocusWithSelection("z1", "item-2", ["item-1", "item-2"]);

        kernel.dispatch(OS_DELETE());

        const zone = kernel.getState().os.focus.zones['z1'];
        expect(zone?.selection).toEqual([]);
    });
});
