/**
 * Shared helpers for OS command unit tests.
 * Sets up kernel state and ZoneRegistry mocks.
 */

import type { BaseCommand } from "@kernel/core/tokens";
import { os } from "@os/core/engine/kernel";
import type { ZoneCursor } from "@os/core/engine/registries/zoneRegistry";
import { ZoneRegistry } from "@os/core/engine/registries/zoneRegistry";
import { initialZoneState } from "@os/core/schema/state/initial";
import { DEFAULT_CONFIG } from "@os/core/schema/types/focus/config/FocusGroupConfig";
import { beforeEach, vi } from "vitest";

export function setupFocus(zoneId: string, focusedItemId: string) {
  os.setState((prev) => ({
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
    onCheck: (cursor: ZoneCursor) => BaseCommand | BaseCommand[];
    onAction: (cursor: ZoneCursor) => BaseCommand | BaseCommand[];
    onDelete: (cursor: ZoneCursor) => BaseCommand | BaseCommand[];
    onMoveUp: (cursor: ZoneCursor) => BaseCommand | BaseCommand[];
    onMoveDown: (cursor: ZoneCursor) => BaseCommand | BaseCommand[];
    onUndo: BaseCommand;
    onRedo: BaseCommand;
  }>,
) {
  ZoneRegistry.register(id, {
    config: DEFAULT_CONFIG,
    element: document.createElement("div"),
    parentId: null,
    ...callbacks,
  });
}

export function useKernelSnapshot() {
  let snapshot: ReturnType<typeof os.getState>;

  beforeEach(() => {
    snapshot = os.getState();
    return () => {
      os.setState(() => snapshot);
      for (const key of [...ZoneRegistry.keys()]) {
        ZoneRegistry.unregister(key);
      }
      vi.restoreAllMocks();
    };
  });
}
