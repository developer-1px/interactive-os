/**
 * defineApp — AppPage factory
 *
 * Creates a Playwright Page-isomorphic headless integration test interface.
 * Uses the production kernel with preview mode for state isolation.
 * No OS duplication — wraps shared headless interaction functions.
 *
 * "Same test code, different runtime."
 */

import { Keybindings } from "@os-core/2-resolve/keybindings";
import {
  computeAttrs,
  readActiveZoneId,
  readFocusedItemId,
  resolveElement,
} from "@os-core/3-inject/compute";
import type { ElementAttrs, ItemAttrs } from "@os-core/3-inject/headless.types";
import type { ZoneOptions } from "@os-core/3-inject/zoneContext";
import { type AppState, initialAppState, os } from "@os-core/engine/kernel";
import { FieldRegistry } from "@os-core/engine/registries/fieldRegistry";
import { TriggerOverlayRegistry } from "@os-core/engine/registries/triggerRegistry";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { ensureZone } from "@os-core/schema/state/utils";
import {
  DEFAULT_CONFIG,
  type DismissConfig,
  type FocusGroupConfig,
  type InputMap,
  type NavigateConfig,
  type SelectConfig,
  type TabConfig,
} from "@os-core/schema/types/focus/config/FocusGroupConfig";
import { produce } from "immer";
import { createElement, type FC } from "react";
import { renderToString } from "react-dom/server";
import { simulateClick, simulateKeyPress } from "./simulate";

// Ensure OS defaults are registered
import "@os-core/2-resolve/osDefaults";

import type { BaseCommand } from "@kernel/core/tokens";
import type { ZoneRole } from "@os-core/engine/registries/roleRegistry";
import { resolveRole } from "@os-core/engine/registries/roleRegistry";
import type { ZoneCallback } from "@os-core/engine/registries/zoneRegistry";
import type {
  AppPageInternal,
  ZoneBindingEntry,
} from "@os-sdk/app/defineApp/types";

import { formatDiagnostics } from "./diagnostics";

export { formatDiagnostics } from "./diagnostics";

import type { ZoneOrderEntry } from "./createOsPage";

// ═══════════════════════════════════════════════════════════════════
// createAppPage — Preview-based, ~50 lines of logic
// ═══════════════════════════════════════════════════════════════════

export function createAppPage<S>(
  appId: string,
  zoneBindingEntries: Map<string, ZoneBindingEntry>,
  Component: FC | null,
  appKeybindings?: readonly {
    key: string;
    command: BaseCommand;
    when?: "editing" | "navigating";
  }[],
): AppPageInternal<S> {
  // Clear global registries for test isolation
  ZoneRegistry.clearAll();

  // Reset preview layer — exit first, then re-enter from base kernel state.
  // Base state includes app slices from defineApp (registered at import time).
  // Without this, cleanup()'s enterPreview(initialAppState) wipes app state.
  if (os.isPreviewing()) os.exitPreview();

  /** Track keybinding unregister so cleanup() works correctly */
  let unregisterKeybindings: (() => void) | null = null;

  /** Track app-level keybinding unregister */
  let unregisterAppKeybindings: (() => void) | null = null;

  // Register app-level keybindings immediately (mirrors production module-load behavior)
  if (appKeybindings && appKeybindings.length > 0) {
    unregisterAppKeybindings = Keybindings.registerAll(
      appKeybindings.map((kb) => ({
        key: kb.key,
        command: kb.command,
        when: kb.when,
      })),
    );
  }

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
        selectedItemId:
          Object.keys(zoneState?.items ?? {}).find(
            (id) => zoneState?.items?.[id]?.["aria-selected"],
          ) ?? null,
        lastFocusedId: zoneState?.lastFocusedId ?? null,
      });
    }
    return entries;
  });

  // Override browser-only effects for headless (no navigator.clipboard)
  os.defineEffect("clipboardWrite", () => {});

  // ── Enter preview sandbox ──
  os.enterPreview({
    ...os.getState(),
    os: { ...initialAppState.os },
  });

  // Auto-register diagnostics on test failure (vitest only)
  try {
    const g = globalThis as Record<string, unknown>;
    if (typeof g.onTestFailed === "function") {
      (g.onTestFailed as (fn: () => void) => void)(() =>
        console.log(formatDiagnostics(os)),
      );
    }
  } catch {
    // Not in vitest or registration failed — silent fallback
  }

  // ── goto ──
  function goto(
    zoneName: string,
    opts?: {
      focusedItemId?: string | null;
      config?: Partial<FocusGroupConfig>;
      initial?: { selection?: string[]; expanded?: string[] };
      items?: string[];
      expandableItems?: Set<string>;
      treeLevels?: Map<string, number>;
    },
  ) {
    // Use zoneName directly — matches FocusGroup's id in React.
    // Preview sandbox is isolated per-app, so prefix is unnecessary.

    // Register zone in ZoneRegistry with app callbacks
    const bindingEntry = zoneBindingEntries.get(zoneName);
    if (bindingEntry) {
      const { bindings } = bindingEntry;
      const overrides = { ...bindings.options, ...opts?.config } as ZoneOptions;
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
        ...(opts?.items
          ? { getItems: () => opts.items! }
          : bindings.getItems
            ? { getItems: bindings.getItems }
            : {}),
        ...(opts?.expandableItems
          ? { getExpandableItems: () => opts.expandableItems! }
          : bindings.getExpandableItems
            ? { getExpandableItems: bindings.getExpandableItems }
            : {}),
        ...(opts?.treeLevels
          ? { getTreeLevels: () => opts.treeLevels! }
          : bindings.getTreeLevels
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
          // Register trigger→overlay relationship for headless ARIA
          if (trigger.overlay) {
            TriggerOverlayRegistry.set(
              trigger.id,
              trigger.overlay.id,
              trigger.overlay.type,
            );
          }
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

    // Resolve zone config for initial state logic
    const zoneEntry = ZoneRegistry.get(zoneName);
    const zoneConfig = zoneEntry?.config;
    const items = zoneEntry?.getItems?.() ?? [];

    // Determine initial selection:
    // (1) explicit initial.selection, (2) followFocus, (3) disallowEmpty fallback
    let initialSelection: string[] | undefined;
    if (opts?.initial?.selection) {
      initialSelection = opts.initial.selection;
    } else if (focusedId && zoneConfig?.select?.followFocus) {
      initialSelection = [focusedId];
    } else if (zoneConfig?.select?.disallowEmpty && items.length > 0) {
      initialSelection = [items[0]];
    }

    os.setState((s: AppState) =>
      produce(s, (draft) => {
        draft.os.focus.activeZoneId = zoneName;
        const z = ensureZone(draft.os, zoneName);
        z.focusedItemId = focusedId;
        if (focusedId) z.lastFocusedId = focusedId;

        // Apply initial selection
        if (initialSelection) {
          const selectMode = zoneConfig?.select?.mode ?? "none";
          const inputmapValues = zoneConfig?.inputmap
            ? Object.values(zoneConfig.inputmap)
            : [];
          const hasCheckCmd = inputmapValues.some((cmds: unknown[]) =>
            cmds.some(
              (c: unknown) => (c as { type: string }).type === "OS_CHECK",
            ),
          );
          for (const id of initialSelection) {
            if (!z.items[id]) z.items[id] = {};
            if (hasCheckCmd) {
              z.items[id] = { ...z.items[id], "aria-checked": true };
            }
            if (selectMode !== "none") {
              z.items[id] = { ...z.items[id], "aria-selected": true };
            }
          }
          z.selectionAnchor = initialSelection[0] ?? null;
        }

        // Apply initial expanded state
        if (opts?.initial?.expanded) {
          for (const id of opts.initial.expanded) {
            if (!z.items[id]) z.items[id] = {};
            z.items[id] = { ...z.items[id], "aria-expanded": true };
          }
        }
      }),
    );
    invalidateCache();
  }

  // ── Projection cache ──
  // When Component is provided, renderToString is cached and invalidated
  // on state-changing operations (click, press, goto, dispatch).
  let _htmlCache: string | null = null;

  function renderHtml(): string {
    if (!Component) {
      throw new Error(
        "query()/html()/locator() projection requires a Component. Use createPage(app, Component).",
      );
    }
    if (_htmlCache === null) {
      _htmlCache = renderToString(createElement(Component));
    }
    return _htmlCache;
  }

  function invalidateCache() {
    _htmlCache = null;
  }

  function assertElementInProjection(elementId: string): void {
    if (!Component) return; // headless only — no projection check
    const html = renderHtml();
    if (!html.includes(`id="${elementId}"`)) {
      throw new Error(
        `locator: element "#${elementId}" not found in rendered Component output.`,
      );
    }
  }

  // ── Return AppPage ──
  return {
    keyboard: {
      press(key: string) {
        simulateKeyPress(os, key);
        invalidateCache();
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
      invalidateCache();
    },

    attrs(itemId: string, zoneId?: string): ItemAttrs {
      return computeAttrs(os, itemId, zoneId);
    },

    goto,

    focusedItemId(zoneId?: string) {
      return readFocusedItemId(os, zoneId);
    },
    selection(zoneId?: string) {
      const zId = zoneId ?? os.getState().os.focus.activeZoneId ?? "";
      const selected = Object.entries(
        os.getState().os.focus.zones[zId]?.items ?? {},
      )
        .filter(([, s]) => s?.["aria-selected"] || s?.["aria-checked"])
        .map(([id]) => id);
      // Sort by zone item list order (not map insertion order)
      const entry = ZoneRegistry.get(zId);
      const itemList = entry?.getItems?.() ?? [];
      if (itemList.length > 0) {
        const orderMap = new Map(itemList.map((id, i) => [id, i]));
        selected.sort(
          (a, b) => (orderMap.get(a) ?? 0) - (orderMap.get(b) ?? 0),
        );
      }
      return selected;
    },
    activeZoneId() {
      return readActiveZoneId(os);
    },

    get state() {
      return os.getState().apps[appId] as S;
    },

    kernel: os,

    dispatch(command: BaseCommand): boolean {
      os.dispatch(command);
      invalidateCache();
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
      if (unregisterAppKeybindings) {
        unregisterAppKeybindings();
        unregisterAppKeybindings = null;
      }
      const zId = readActiveZoneId(os);
      if (zId) ZoneRegistry.unregister(zId);
      os.exitPreview();
      // Re-enter preview with fresh state — test isolation invariant
      os.enterPreview(initialAppState);
    },

    dumpDiagnostics() {
      console.log(formatDiagnostics(os));
    },

    // ── Projection Checkpoint ──────────────────────────────────

    query(search: string): boolean {
      return renderHtml().includes(search);
    },

    html(): string {
      return renderHtml();
    },

    locator(selector: string) {
      // Strip # prefix if present (Playwright uses #id, we use bare id)
      const elementId = selector.startsWith("#") ? selector.slice(1) : selector;
      // When Component is provided, verify element exists in rendered output
      assertElementInProjection(elementId);
      return {
        get attrs() {
          return resolveElement(os, elementId);
        },
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
        toBeChecked() {
          return resolveElement(os, elementId)["aria-checked"] === true;
        },
        toBeDisabled() {
          return resolveElement(os, elementId)["aria-disabled"] === true;
        },
        inputValue() {
          return String(FieldRegistry.getValue(elementId) ?? "");
        },
      };
    },
  };
}

export type { ItemAttrs };

import type { AppHandle } from "@os-sdk/app/defineApp/types";

/**
 * Create a Playwright Page-isomorphic headless integration test interface.
 *
 * Usage:
 *   import { createPage } from "@os-sdk/app/defineApp/page";
 *   const page = createPage(TodoApp, ListView);    // headless + projection
 *   const page = createPage(TodoApp);              // headless only (no UI)
 *
 * When Component is provided, locator() verifies elements exist in the
 * rendered output. Without Component, locator() resolves from OS state only.
 *
 * createPage is an OS capability — it reads app data(appId, zone bindings)
 * from the AppHandle and sets up the headless test environment.
 */
export function createPage<S>(
  app: AppHandle<S>,
  Component?: FC,
): AppPageInternal<S> {
  return createAppPage<S>(
    app.__appId,
    app.__zoneBindings,
    Component ?? null,
    app.__appKeybindings,
  );
}
