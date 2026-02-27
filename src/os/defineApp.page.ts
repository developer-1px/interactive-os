/**
 * defineApp — AppPage factory
 *
 * Creates a Playwright Page-isomorphic headless integration test interface.
 * Uses the production kernel with preview mode for state isolation.
 * No OS duplication — wraps shared headless interaction functions.
 *
 * "Same test code, different runtime."
 */

import { ZoneRegistry } from "@os/2-contexts/zoneRegistry";
import { type AppState, initialAppState, os } from "@os/kernel";
import { Keybindings } from "@os/keymaps/keybindings";
import {
  DEFAULT_CONFIG,
  type FocusGroupConfig,
} from "@os/schemas/focus/config/FocusGroupConfig";
import { ensureZone } from "@os/state/utils";
import { produce } from "immer";
import { createElement, type FC } from "react";
import { renderToString } from "react-dom/server";

import {
  computeAttrs,
  type ItemAttrs,
  readActiveZoneId,
  readFocusedItemId,
  readSelection,
  resolveElement,
  simulateClick,
  simulateKeyPress,
} from "./headless";

// Ensure OS defaults are registered
import "@os/keymaps/osDefaults";

import type { BaseCommand } from "@kernel/core/tokens";
import { FieldRegistry } from "./6-components/field/FieldRegistry";
import type {
  AppPage,
  FieldBindings,
  KeybindingEntry,
  ZoneBindings,
} from "./defineApp.types";
import type { ZoneRole } from "./registries/roleRegistry";
import { resolveRole } from "./registries/roleRegistry";

// ═══════════════════════════════════════════════════════════════════
// Zone Binding Entry — collected by defineApp.ts at zone.bind() time
// ═══════════════════════════════════════════════════════════════════

export interface ZoneBindingEntry {
  role: ZoneRole;
  bindings: ZoneBindings;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic keybinding entries
  keybindings?: KeybindingEntry<any>[];
  field?: FieldBindings;
  triggers?: import("./defineApp.types").TriggerBinding[];
}

// ═══════════════════════════════════════════════════════════════════
// createAppPage — Preview-based, ~50 lines of logic
// ═══════════════════════════════════════════════════════════════════

export function createAppPage<S>(
  appId: string,
  zoneBindingEntries: Map<string, ZoneBindingEntry>,
  Component?: FC,
): AppPage<S> {
  /** Track keybinding unregister so cleanup() works correctly */
  let unregisterKeybindings: (() => void) | null = null;

  // Override DOM contexts for headless (no DOM, no React)
  os.defineContext("dom-items", () => {
    const zoneId = os.getState().os.focus.activeZoneId;
    const entry = zoneId ? ZoneRegistry.get(zoneId) : undefined;

    // Headless: getItems() is the single path (state-derived).
    // Zones must register getItems via bind({ getItems }).
    if (entry?.getItems) {
      const items = entry.getItems();
      return entry.itemFilter ? entry.itemFilter(items) : items;
    }
    return [];
  });
  os.defineContext("dom-rects", () => new Map<string, DOMRect>());
  os.defineContext("dom-expandable-items", () => new Set<string>());
  os.defineContext("dom-tree-levels", () => new Map<string, number>());
  os.defineContext("zone-config", () => {
    const zoneId = os.getState().os.focus.activeZoneId;
    const entry = zoneId ? ZoneRegistry.get(zoneId) : undefined;
    return entry?.config ?? DEFAULT_CONFIG;
  });
  os.defineContext("dom-zone-order", () => {
    const state = os.getState();
    const entries: Array<import("./2-contexts").ZoneOrderEntry> = [];
    for (const zoneId of ZoneRegistry.keys()) {
      const zoneEntry = ZoneRegistry.get(zoneId);
      if (!zoneEntry) continue;
      const zoneState = state.os.focus.zones[zoneId];
      const entry = zoneEntry.config?.navigate?.entry ?? "first";
      // Items from getItems accessor (single path)
      const items = zoneEntry.getItems?.() ?? [];
      const filtered = zoneEntry.itemFilter
        ? zoneEntry.itemFilter(items)
        : items;
      entries.push({
        zoneId,
        firstItemId: filtered[0] ?? zoneState?.lastFocusedId ?? null,
        lastItemId:
          filtered[filtered.length - 1] ?? zoneState?.lastFocusedId ?? null,
        entry,
        selectedItemId: zoneState?.selection?.[0] ?? null,
        lastFocusedId: zoneState?.lastFocusedId ?? null,
      });
    }
    return entries;
  });

  // Override browser-only effects for headless (no navigator.clipboard)
  os.defineEffect("clipboardWrite", () => { });

  // ── Enter preview sandbox ──
  os.enterPreview({
    ...os.getState(),
    os: { ...initialAppState.os },
  });

  // ── goto ──
  function goto(
    zoneName: string,
    opts?: {
      focusedItemId?: string | null;
      config?: Partial<FocusGroupConfig>;
    },
  ) {
    // Use zoneName directly — matches FocusGroup's id in React.
    // Preview sandbox is isolated per-app, so prefix is unnecessary.

    // Register zone in ZoneRegistry with app callbacks
    const bindingEntry = zoneBindingEntries.get(zoneName);
    if (bindingEntry) {
      const { bindings } = bindingEntry;
      const overrides = { ...bindings.options, ...opts?.config };
      const config = resolveRole(bindingEntry.role, overrides);
      ZoneRegistry.register(zoneName, {
        role: bindingEntry.role,
        config,
        element: null,
        parentId: null,
        ...(bindings.onAction ? { onAction: bindings.onAction } : {}),
        ...(bindings.onCheck ? { onCheck: bindings.onCheck } : {}),
        ...(bindings.onDelete ? { onDelete: bindings.onDelete } : {}),
        ...(bindings.onCopy ? { onCopy: bindings.onCopy } : {}),
        ...(bindings.onCut ? { onCut: bindings.onCut } : {}),
        ...(bindings.onPaste ? { onPaste: bindings.onPaste } : {}),
        ...(bindings.onMoveUp ? { onMoveUp: bindings.onMoveUp } : {}),
        ...(bindings.onMoveDown ? { onMoveDown: bindings.onMoveDown } : {}),
        ...(bindings.onUndo ? { onUndo: bindings.onUndo } : {}),
        ...(bindings.onRedo ? { onRedo: bindings.onRedo } : {}),
        ...(bindings.onSelect ? { onSelect: bindings.onSelect } : {}),
        ...(bindings.itemFilter ? { itemFilter: bindings.itemFilter } : {}),
        ...(bindings.getItems ? { getItems: bindings.getItems } : {}),
        ...(bindings.getExpandableItems
          ? { getExpandableItems: bindings.getExpandableItems }
          : {}),
        ...(bindings.getTreeLevels
          ? { getTreeLevels: bindings.getTreeLevels }
          : {}),
      });

      // Push model: auto-register item-level callbacks from triggers
      // (replaces FocusItem useLayoutEffect pull model for headless)
      if (bindingEntry.triggers) {
        for (const trigger of bindingEntry.triggers) {
          ZoneRegistry.setItemCallback(zoneName, trigger.id, {
            onActivate: trigger.onActivate,
          });
        }
      }
    }

    // Register zone keybindings in the global Keybindings registry
    // (mirrors what FocusGroup.tsx does at mount time in the browser)
    if (unregisterKeybindings) unregisterKeybindings();
    const keybindings = bindingEntry?.keybindings ?? [];
    if (keybindings.length > 0) {
      unregisterKeybindings = Keybindings.registerAll(
        keybindings.map((kb) => ({
          key: kb.key,
          command: kb.command,
          when: "navigating" as const,
        })),
      );
    }

    // Register field in FieldRegistry (mirrors what Field.tsx does at mount time)
    const field = bindingEntry?.field;
    if (field?.fieldName) {
      FieldRegistry.register(field.fieldName, {
        name: field.fieldName,
        ...(field.onCommit !== undefined ? { onCommit: field.onCommit } : {}),
        ...(field.trigger !== undefined ? { trigger: field.trigger } : {}),
        ...(field.schema !== undefined ? { schema: field.schema } : {}),
        ...(field.resetOnSubmit !== undefined
          ? { resetOnSubmit: field.resetOnSubmit }
          : {}),
        mode: "immediate",
        fieldType: "inline",
      });
      // Store fieldId on ZoneEntry for headless field detection
      const zoneEntry = ZoneRegistry.get(zoneName);
      if (zoneEntry) {
        zoneEntry.fieldId = field.fieldName;
      }
    }

    // Set active zone + focused item via setState on preview layer
    const focusedId = opts?.focusedItemId ?? null;
    os.setState((s: AppState) =>
      produce(s, (draft) => {
        draft.os.focus.activeZoneId = zoneName;
        const z = ensureZone(draft.os, zoneName);
        z.focusedItemId = focusedId;
        if (focusedId) z.lastFocusedId = focusedId;
      }),
    );
  }

  // ── Return AppPage ──
  return {
    keyboard: {
      press(key: string) {
        simulateKeyPress(os, key);
      },
      type(text: string) {
        const activeZone = readActiveZoneId(os);
        if (!activeZone) return;
        const zoneEntry = ZoneRegistry.get(activeZone);
        if (zoneEntry?.fieldId) {
          FieldRegistry.updateValue(zoneEntry.fieldId, text);
        }
      },
    },

    click(itemId: string, opts?) {
      simulateClick(os, itemId, opts);
    },

    attrs(itemId: string, zoneId?: string): ItemAttrs {
      return computeAttrs(os, itemId, zoneId);
    },

    goto,

    focusedItemId(zoneId?: string) {
      return readFocusedItemId(os, zoneId);
    },
    selection(zoneId?: string) {
      return readSelection(os, zoneId);
    },
    activeZoneId() {
      return readActiveZoneId(os);
    },

    get state() {
      return os.getState().apps[appId] as S;
    },

    dispatch(command: BaseCommand): boolean {
      os.dispatch(command);
      return true;
    },

    reset() {
      // Clear and re-enter preview with fresh state
      os.exitPreview();
      os.enterPreview({
        ...os.getState(),
        os: { ...initialAppState.os },
      });
    },

    cleanup() {
      if (unregisterKeybindings) {
        unregisterKeybindings();
        unregisterKeybindings = null;
      }
      const zId = readActiveZoneId(os);
      if (zId) ZoneRegistry.unregister(zId);
      os.exitPreview();
    },

    // ── Projection Checkpoint ──────────────────────────────────

    query(search: string): boolean {
      if (!Component) {
        throw new Error(
          "query() requires a Component. Use createPage(MyComponent) to enable projection checkpoint.",
        );
      }
      const html = renderToString(createElement(Component));
      return html.includes(search);
    },

    html(): string {
      if (!Component) {
        throw new Error(
          "html() requires a Component. Use createPage(MyComponent) to enable projection checkpoint.",
        );
      }
      return renderToString(createElement(Component));
    },

    locator(elementId: string) {
      return {
        get attrs() { return resolveElement(os, elementId); },
        getAttribute(name: string) {
          return resolveElement(os, elementId)[name];
        },
        click(opts?: { modifiers?: ("Meta" | "Shift" | "Control")[] }) {
          const mods = opts?.modifiers ?? [];
          simulateClick(os, elementId, {
            meta: mods.includes("Meta"),
            shift: mods.includes("Shift"),
            ctrl: mods.includes("Control"),
          });
        },
        toHaveAttribute(name: string, value: string | boolean) {
          return resolveElement(os, elementId)[name] === value;
        },
        toBeFocused() {
          return readFocusedItemId(os) === elementId;
        },
      };
    },
  };
}

export type { ItemAttrs };

import type { AppHandle } from "./defineApp.types";

/**
 * Create a Playwright Page-isomorphic headless integration test interface.
 *
 * Usage:
 *   import { createPage } from "@os/defineApp.page";
 *   const page = createPage(TodoApp);              // headless
 *   const page = createPage(TodoApp, ListView);    // headless + projection
 *
 * createPage is an OS capability — it reads app data (appId, zone bindings)
 * from the AppHandle and sets up the headless test environment.
 */
export function createPage<S>(app: AppHandle<S>, Component?: FC): AppPage<S> {
  return createAppPage<S>(app.__appId, app.__zoneBindings, Component);
}
