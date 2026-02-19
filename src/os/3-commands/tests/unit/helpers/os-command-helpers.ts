/**
 * Shared helpers for OS command unit tests.
 * Sets up kernel state and ZoneRegistry mocks.
 */

import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import type { ZoneCursor } from "@os/2-contexts/zoneRegistry";
import { kernel } from "@os/kernel";
import { initialZoneState } from "@os/state/initial";
import { beforeEach, vi } from "vitest";

export function setupFocus(zoneId: string, focusedItemId: string) {
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

export function registerZone(
    id: string,
    callbacks: Partial<{
        onCheck: (cursor: ZoneCursor) => any;
        onAction: (cursor: ZoneCursor) => any;
        onDelete: (cursor: ZoneCursor) => any;
        onMoveUp: (cursor: ZoneCursor) => any;
        onMoveDown: (cursor: ZoneCursor) => any;
        onUndo: any;
        onRedo: any;
    }>,
) {
    ZoneRegistry.register(id, {
        config: {} as any,
        element: document.createElement("div"),
        parentId: null,
        ...callbacks,
    });
}

export function useKernelSnapshot() {
    let snapshot: ReturnType<typeof kernel.getState>;

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
}
