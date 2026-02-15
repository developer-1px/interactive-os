/**
 * OS Multi-Select Commands — Unit Tests (TDD Spec)
 *
 * Tests that OS_DELETE, OS_COPY, OS_CUT dispatch app callbacks
 * for ALL selected items (not just the focused one) when selection exists.
 */

import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { OS_DELETE } from "@os/3-commands/interaction/delete";
import { OS_COPY, OS_CUT } from "@os/3-commands/clipboard/clipboard";
import { kernel } from "@os/kernel";
import { initialZoneState } from "@os/state/initial";
import { GLOBAL } from "@kernel";
import type { Command, ScopeToken } from "@kernel/core/tokens";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

let snapshot: ReturnType<typeof kernel.getState>;

function createMockCommand(name: string) {
    return Object.assign(
        (payload?: Record<string, unknown>) => ({
            type: `mock/${name}`,
            payload,
        }),
        {
            type: `mock/${name}`,
            commandType: `mock/${name}`,
        },
    );
}

const mockDelete = createMockCommand("delete");
const mockCopy = createMockCommand("copy");
const mockCut = createMockCommand("cut");

function setupFocusWithSelection(
    zoneId: string,
    focusedItemId: string,
    selection: string[],
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
                        selectionAnchor: selection[0] ?? null,
                    },
                },
            },
        },
    }));
}

function registerZone(
    id: string,
    callbacks: Partial<{
        onDelete: Command;
        onCopy: Command;
        onCut: Command;
        onPaste: Command;
    }>,
) {
    ZoneRegistry.register(id, {
        config: {} as Record<string, never>,
        element: document.createElement("div"),
        parentId: null,
        ...callbacks,
    });
}

/**
 * Capture dispatched commands via a GLOBAL before-middleware.
 * This captures ALL dispatches, including those triggered by
 * the kernel's internal dispatch() via the dispatch effect.
 */
function captureDispatches() {
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
// OS_DELETE with multi-selection
// ═══════════════════════════════════════════════════════════════════

describe("OS_DELETE with multi-selection", () => {
    it("dispatches onDelete for each selected item when selection exists", () => {
        const captured = captureDispatches();

        setupFocusWithSelection("testZone", "item-3", [
            "item-1",
            "item-2",
            "item-3",
        ]);
        registerZone("testZone", {
            onDelete: mockDelete({ id: "OS.FOCUS" }),
        });

        kernel.dispatch(OS_DELETE());

        const deleteCmds = captured.filter((cmd) => cmd.type === "mock/delete");
        expect(deleteCmds.length).toBe(3);
        expect(deleteCmds.map((c: Record<string, unknown>) => (c.payload as Record<string, unknown>)?.id)).toEqual(
            expect.arrayContaining(["item-1", "item-2", "item-3"]),
        );
    });

    it("falls back to single focusedItemId when no selection", () => {
        setupFocusWithSelection("testZone", "item-1", []);
        registerZone("testZone", {
            onDelete: mockDelete({ id: "OS.FOCUS" }),
        });

        // Should not throw — dispatches single delete for focused item
        kernel.dispatch(OS_DELETE());
    });

    it("clears selection after multi-delete", () => {
        setupFocusWithSelection("testZone", "item-2", ["item-1", "item-2"]);
        registerZone("testZone", {
            onDelete: mockDelete({ id: "OS.FOCUS" }),
        });

        kernel.dispatch(OS_DELETE());

        const zone = kernel.getState().os.focus.zones.testZone;
        expect(zone?.selection).toEqual([]);
    });
});

// ═══════════════════════════════════════════════════════════════════
// OS_COPY with multi-selection
// ═══════════════════════════════════════════════════════════════════

describe("OS_COPY with multi-selection", () => {
    it("dispatches onCopy for each selected item", () => {
        const captured = captureDispatches();

        setupFocusWithSelection("testZone", "item-2", ["item-1", "item-2"]);
        registerZone("testZone", {
            onCopy: mockCopy({ id: "OS.FOCUS" }),
        });

        kernel.dispatch(OS_COPY());

        const copyCmds = captured.filter((cmd) => cmd.type === "mock/copy");
        expect(copyCmds.length).toBe(2);
    });
});

// ═══════════════════════════════════════════════════════════════════
// OS_CUT with multi-selection
// ═══════════════════════════════════════════════════════════════════

describe("OS_CUT with multi-selection", () => {
    it("dispatches onCut for each selected item", () => {
        const captured = captureDispatches();

        setupFocusWithSelection("testZone", "item-2", ["item-1", "item-2"]);
        registerZone("testZone", {
            onCut: mockCut({ id: "OS.FOCUS" }),
        });

        kernel.dispatch(OS_CUT());

        const cutCmds = captured.filter((cmd) => cmd.type === "mock/cut");
        expect(cutCmds.length).toBe(2);
    });

    it("clears selection after multi-cut", () => {
        setupFocusWithSelection("testZone", "item-2", ["item-1", "item-2"]);
        registerZone("testZone", {
            onCut: mockCut({ id: "OS.FOCUS" }),
        });

        kernel.dispatch(OS_CUT());

        const zone = kernel.getState().os.focus.zones.testZone;
        expect(zone?.selection).toEqual([]);
    });
});
