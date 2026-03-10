/**
 * setupHeadlessEnv — Initialize headless test environment.
 *
 * Clears registries, defines OS contexts for headless operation,
 * enters preview sandbox, and registers keybindings.
 * Returns cleanup function and shared state.
 */

import { Keybindings } from "@os-core/2-resolve/keybindings";
import {
  DEFAULT_CONFIG,
  type FocusGroupConfig,
} from "@os-core/schema/types/focus/config/FocusGroupConfig";
import { initialAppState, os } from "@os-core/engine/kernel";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import type { BaseCommand } from "@kernel/core/tokens";
import { formatDiagnostics } from "../diagnostics";

interface ZoneOrderEntry {
  zoneId: string;
  firstItemId: string | null;
  lastItemId: string | null;
  entry: FocusGroupConfig["navigate"]["entry"] | string;
  selectedItemId: string | null;
  lastFocusedId: string | null;
}

export interface HeadlessEnv {
  cleanup(): void;
  zonesWithBindingGetItems: Set<string>;
  addKeybindings(unreg: () => void): void;
}

export function setupHeadlessEnv(
  appKeybindings?: readonly {
    key: string;
    command: BaseCommand;
    when?: "editing" | "navigating";
  }[],
): HeadlessEnv {
  ZoneRegistry.clearAll();

  if (os.isPreviewing()) os.exitPreview();

  let unregisterKeybindings: (() => void) | null = null;
  let unregisterAppKeybindings: (() => void) | null = null;
  const zonesWithBindingGetItems = new Set<string>();

  if (appKeybindings && appKeybindings.length > 0) {
    unregisterAppKeybindings = Keybindings.registerAll(
      appKeybindings.map((kb) => {
        const entry: import("@os-core/2-resolve/keybindings").KeyBinding = {
          key: kb.key,
          command: kb.command,
        };
        if (kb.when) entry.when = kb.when;
        return entry;
      }),
    );
  }

  // Override DOM contexts for headless (no DOM, no React)
  os.defineContext("dom-items", () => {
    const zoneId = os.getState().os.focus.activeZoneId;
    if (!zoneId) return [];
    const entry = ZoneRegistry.get(zoneId);
    if (entry?.getItems) {
      const items = entry.getItems();
      return entry.itemFilter ? entry.itemFilter(items) : items;
    }
    return [];
  });
  os.defineContext("dom-rects", () => new Map<string, DOMRect>());
  os.defineContext("dom-expandable-items", () => {
    const zoneId = os.getState().os.focus.activeZoneId;
    const entry = zoneId ? ZoneRegistry.get(zoneId) : undefined;
    if (entry?.getExpandableItems) return entry.getExpandableItems();
    return new Set<string>();
  });
  os.defineContext("dom-tree-levels", () => {
    const zoneId = os.getState().os.focus.activeZoneId;
    const entry = zoneId ? ZoneRegistry.get(zoneId) : undefined;
    if (entry?.getTreeLevels) return entry.getTreeLevels();
    return new Map<string, number>();
  });
  os.defineContext("zone-config", () => {
    const zoneId = os.getState().os.focus.activeZoneId;
    const entry = zoneId ? ZoneRegistry.get(zoneId) : undefined;
    return entry?.config ?? DEFAULT_CONFIG;
  });
  os.defineContext("dom-zone-order", () => {
    const state = os.getState();
    const entries: Array<ZoneOrderEntry> = [];

    for (const zoneId of ZoneRegistry.keys()) {
      const zoneEntry = ZoneRegistry.get(zoneId);
      if (!zoneEntry) continue;
      const zoneState = state.os.focus.zones[zoneId];
      const entry = zoneEntry.config?.navigate?.entry ?? "first";

      const items = zoneEntry.getItems?.() ?? [];
      if (items.length === 0 && !zoneState?.lastFocusedId) continue;

      const filtered = zoneEntry.itemFilter
        ? zoneEntry.itemFilter(items)
        : items;
      entries.push({
        zoneId,
        firstItemId: filtered[0] ?? zoneState?.lastFocusedId ?? null,
        lastItemId:
          filtered[filtered.length - 1] ?? zoneState?.lastFocusedId ?? null,
        entry,
        selectedItemId:
          Object.keys(zoneState?.items ?? {}).find(
            (id) => zoneState?.items?.[id]?.["aria-selected"],
          ) ?? null,
        lastFocusedId: zoneState?.lastFocusedId ?? null,
      });
    }
    return entries;
  });

  os.defineEffect("clipboardWrite", () => {});

  // Enter preview sandbox
  os.enterPreview({
    ...os.getState(),
    os: { ...initialAppState.os },
  });

  // Auto-register diagnostics on test failure (vitest only)
  try {
    const key = "onTestFailed";
    const g = globalThis as Record<string, unknown>;
    if (typeof g[key] === "function") {
      (g[key] as (fn: () => void) => void)(() =>
        console.log(formatDiagnostics(os)),
      );
    }
  } catch {
    // Not in vitest or registration failed — silent fallback
  }

  function addKeybindings(unreg: () => void): void {
    const prev = unregisterKeybindings;
    unregisterKeybindings = () => {
      unreg();
      prev?.();
    };
  }

  function cleanup(): void {
    if (unregisterKeybindings) {
      unregisterKeybindings();
      unregisterKeybindings = null;
    }
    if (unregisterAppKeybindings) {
      unregisterAppKeybindings();
      unregisterAppKeybindings = null;
    }
    const zId = os.getState().os.focus.activeZoneId;
    if (zId) ZoneRegistry.unregister(zId);
    os.exitPreview();
    os.enterPreview(initialAppState);
  }

  return { cleanup, zonesWithBindingGetItems, addKeybindings } as HeadlessEnv;
}
