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
import type { ItemAttrs } from "@os-core/3-inject/headless.types";
import type { ZoneOptions } from "@os-core/3-inject/zoneContext";
import { type AppState, initialAppState, os } from "@os-core/engine/kernel";
import { FieldRegistry } from "@os-core/engine/registries/fieldRegistry";
import { ZoneRegistry } from "@os-core/engine/registries/zoneRegistry";
import { ensureZone } from "@os-core/schema/state/utils";
import {
  DEFAULT_CONFIG,
  type FocusGroupConfig,
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
import type {
  AppPageInternal,
  ZoneBindingEntry,
} from "@os-sdk/app/defineApp/types";

import { formatDiagnostics } from "./diagnostics";

export { formatDiagnostics } from "./diagnostics";

/** Zone order entry — describes a zone's position and key items for tab navigation */
interface ZoneOrderEntry {
  zoneId: string;
  firstItemId: string | null;
  lastItemId: string | null;
  entry:
    | import("@os-core/schema/types/focus/config/FocusGroupConfig").NavigateEntry
    | string;
  selectedItemId: string | null;
  lastFocusedId: string | null;
}

/** Extended locator returned by createAppPage — includes internal expect() hooks */
interface LocatorResult {
  readonly attrs: import("@os-core/3-inject/headless.types").ElementAttrs;
  getAttribute(name: string): string | null;
  click(opts?: { modifiers?: ("Meta" | "Shift" | "Control")[] }): void;
  toHaveAttribute(name: string, value: string | boolean): boolean;
  toBeFocused(): boolean;
  toBeChecked(): boolean;
  toBeDisabled(): boolean;
  inputValue(): string;
  _toBeFocused(negated?: boolean): void;
  _toHaveAttribute(name: string, value: string | RegExp, negated?: boolean): void;
}

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
    if (typeof g["onTestFailed"] === "function") {
      (g["onTestFailed"] as (fn: () => void) => void)(() =>
        console.log(formatDiagnostics(os)),
      );
    }
  } catch {
    // Not in vitest or registration failed — silent fallback
  }

  // ── goto (URL only — Playwright isomorphic) ──
  function goto(url: string) {
    if (!url.startsWith("/")) {
      throw new Error(
        `page.goto() accepts URLs only (must start with "/"). Got "${url}". Use page.setupZone() for zone-level setup.`,
      );
    }
    for (const [zoneName, bindingEntry] of zoneBindingEntries) {
      registerZoneFromBinding(zoneName, bindingEntry);
    }

    // Seed initial selection/expand for all registered zones
    for (const [zoneName] of zoneBindingEntries) {
      seedInitialState(zoneName);
    }

    if (Component) renderHtml();
    invalidateCache();
  }

  // ── setupZone (legacy per-zone registration + state seeding) ──
  function setupZone(
    target: string,
    opts?: {
      focusedItemId?: string | null;
      config?: Partial<FocusGroupConfig>;
      role?: ZoneRole;
      initial?: { selection?: string[]; expanded?: string[] };
      items?: string[];
      expandableItems?: Set<string>;
      treeLevels?: Map<string, number>;
    },
  ) {
    const zoneName = target;
    const bindingEntry = zoneBindingEntries.get(zoneName);
    if (bindingEntry) {
      registerZoneFromBinding(
        zoneName,
        bindingEntry,
        opts?.config,
        opts?.items,
        opts?.expandableItems,
        opts?.treeLevels,
      );
    } else if (opts?.role) {
      const config = resolveRole(opts.role, opts.config ?? {});
      ZoneRegistry.register(zoneName, {
        role: opts.role,
        config,
        element: null,
        parentId: null,
        ...(opts.items ? { getItems: () => opts.items! } : {}),
        ...(opts.expandableItems
          ? { getExpandableItems: () => opts.expandableItems! }
          : {}),
        ...(opts.treeLevels ? { getTreeLevels: () => opts.treeLevels! } : {}),
      });
    }

    // Set active zone + focused item (state seeding for legacy tests)
    const focusedId = opts?.focusedItemId ?? null;
    const zoneEntry = ZoneRegistry.get(zoneName);
    const zoneConfig = zoneEntry?.config;
    const items = zoneEntry?.getItems?.() ?? [];

    let initialSelection: string[] | undefined;
    if (opts?.initial?.selection) {
      initialSelection = opts.initial.selection;
    } else if (focusedId && zoneConfig?.select?.followFocus) {
      initialSelection = [focusedId];
    } else if (zoneConfig?.select?.disallowEmpty && items.length > 0) {
      initialSelection = [items[0]!];
    }

    os.setState((s: AppState) =>
      produce(s, (draft) => {
        draft.os.focus.activeZoneId = zoneName;
        const z = ensureZone(draft.os, zoneName);
        z.focusedItemId = focusedId;
        if (focusedId) z.lastFocusedId = focusedId;

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
            if (hasCheckCmd)
              z.items[id] = { ...z.items[id], "aria-checked": true };
            if (selectMode !== "none")
              z.items[id] = { ...z.items[id], "aria-selected": true };
          }
          z.selectionAnchor = initialSelection[0] ?? null;
        }

        if (opts?.initial?.expanded) {
          for (const id of opts.initial.expanded) {
            if (!z.items[id]) z.items[id] = {};
            z.items[id] = { ...z.items[id], "aria-expanded": true };
          }
        }

        if (zoneConfig?.value?.initial) {
          z.valueNow = { ...zoneConfig.value.initial };
        }
      }),
    );
    invalidateCache();
  }

  /** Shared: register a single zone from its binding entry */
  function registerZoneFromBinding(
    zoneName: string,
    bindingEntry: ZoneBindingEntry,
    configOverride?: Partial<FocusGroupConfig>,
    itemsOverride?: string[],
    expandableOverride?: Set<string>,
    treeLevelsOverride?: Map<string, number>,
  ) {
    const { bindings } = bindingEntry;
    const overrides = { ...bindings.options, ...configOverride } as ZoneOptions;
    const config = resolveRole(bindingEntry.role, overrides);
    const entry: import("@os-core/engine/registries/zoneRegistry").ZoneEntry = {
      config,
      element: null,
      parentId: null,
    };
    if (bindingEntry.role) entry.role = bindingEntry.role;
    if (bindings.onAction) entry.onAction = bindings.onAction;
    if (bindings.onCheck) entry.onCheck = bindings.onCheck;
    if (bindings.onDelete) entry.onDelete = bindings.onDelete;
    if (bindings.onCopy) entry.onCopy = bindings.onCopy;
    if (bindings.onCut) entry.onCut = bindings.onCut;
    if (bindings.onPaste) entry.onPaste = bindings.onPaste;
    if (bindings.onMoveUp) entry.onMoveUp = bindings.onMoveUp;
    if (bindings.onMoveDown) entry.onMoveDown = bindings.onMoveDown;
    if (bindings.onUndo) entry.onUndo = bindings.onUndo;
    if (bindings.onRedo) entry.onRedo = bindings.onRedo;
    if (bindings.onSelect) entry.onSelect = bindings.onSelect;
    if (bindings.itemFilter) entry.itemFilter = bindings.itemFilter;
    if (itemsOverride) entry.getItems = () => itemsOverride;
    else if (bindings.getItems) entry.getItems = bindings.getItems;
    if (expandableOverride) entry.getExpandableItems = () => expandableOverride;
    else if (bindings.getExpandableItems) entry.getExpandableItems = bindings.getExpandableItems;
    if (treeLevelsOverride) entry.getTreeLevels = () => treeLevelsOverride;
    else if (bindings.getTreeLevels) entry.getTreeLevels = bindings.getTreeLevels;
    ZoneRegistry.register(zoneName, entry);


    if (bindingEntry.triggers) {
      for (const trigger of bindingEntry.triggers) {
        ZoneRegistry.setItemCallback(zoneName, trigger.id, {
          onActivate: trigger.onActivate,
        });
      }
    }

    // Register zone keybindings
    const keybindings = bindingEntry.keybindings ?? [];
    if (keybindings.length > 0) {
      const unreg = Keybindings.registerAll(
        keybindings.map((kb) => ({
          key: kb.key,
          command: kb.command,
          when: "navigating" as const,
        })),
      );
      const prev = unregisterKeybindings;
      unregisterKeybindings = () => {
        unreg();
        prev?.();
      };
    }

    // Register field
    const field = bindingEntry.field;
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
      const zoneEntry = ZoneRegistry.get(zoneName);
      if (zoneEntry) zoneEntry.fieldId = field.fieldName;
    }
  }

  // ── Seed initial selection/expand for a zone ──
  function seedInitialState(zoneName: string) {
    const zoneEntry = ZoneRegistry.get(zoneName);
    if (!zoneEntry) return;
    const zoneConfig = zoneEntry.config;
    const items = zoneEntry.getItems?.() ?? [];

    // Initial selection: explicit initial > disallowEmpty auto-select
    const selectConfig = zoneConfig?.select;
    if (selectConfig && selectConfig.mode !== "none" && items.length > 0) {
      const explicit = selectConfig.initial;
      const initialIds = explicit
        ? Array.isArray(explicit)
          ? explicit
          : [explicit]
        : selectConfig.disallowEmpty
          ? [items[0]!]
          : [];
      if (initialIds.length > 0) {
        const inputmapValues = zoneConfig?.inputmap
          ? Object.values(zoneConfig.inputmap)
          : [];
        const hasCheckCmd = inputmapValues.some((cmds: unknown[]) =>
          cmds.some(
            (c: unknown) => (c as { type: string }).type === "OS_CHECK",
          ),
        );
        os.setState((s: AppState) =>
          produce(s, (draft) => {
            const z = ensureZone(draft.os, zoneName);
            for (const id of initialIds) {
              if (!z.items[id]) z.items[id] = {};
              if (hasCheckCmd)
                z.items[id] = { ...z.items[id], "aria-checked": true };
              if (selectConfig.mode !== "none")
                z.items[id] = { ...z.items[id], "aria-selected": true };
            }
            z.selectionAnchor = initialIds[0] ?? null;
          }),
        );
      }
    }

    // Initial expand: explicit initial
    const expandConfig = zoneConfig?.expand;
    if (expandConfig && expandConfig.mode !== "none" && expandConfig.initial) {
      os.setState((s: AppState) =>
        produce(s, (draft) => {
          const z = ensureZone(draft.os, zoneName);
          for (const id of expandConfig.initial!) {
            if (!z.items[id]) z.items[id] = {};
            z.items[id] = { ...z.items[id], "aria-expanded": true };
          }
        }),
      );
    }

    // Initial value: explicit initial
    const valueConfig = zoneConfig?.value;
    if (valueConfig && valueConfig.initial) {
      os.setState((s: AppState) =>
        produce(s, (draft) => {
          const z = ensureZone(draft.os, zoneName);
          for (const [itemId, value] of Object.entries(valueConfig.initial!)) {
            if (z.valueNow[itemId] === undefined) {
              z.valueNow[itemId] = value as number;
            }
          }
        }),
      );
    }
  }

  // ── Projection cache ──
  // When Component is provided, renderToString is cached and invalidated
  // on state-changing operations (click, press, goto, setupZone, dispatch).
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
    setupZone,

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

    getDOMElement(_id: string): HTMLElement | null {
      return null; // headless — no real DOM
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
          const resolved = resolveElement(os, elementId);
          // Normalize HTML attribute names to JS property names (e.g. tabindex → tabIndex)
          const key = name === "tabindex" ? "tabIndex" : name;
          const val = resolved[key];
          // Playwright returns string | null. Coerce boolean to string for compatibility.
          if (val === true) return "true";
          if (val === false) return "false";
          if (val === undefined || val === null) return null;
          return String(val);
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

        // ── Playwright expect() hooks ──
        // These hooks allow expect(locator).toBeFocused() from expect.ts
        // to work with this headless locator.
        _toBeFocused(negated?: boolean) {
          const focused = readFocusedItemId(os) === elementId;
          const passed = negated ? !focused : focused;
          if (!passed) {
            const actual = readFocusedItemId(os);
            throw new Error(
              negated
                ? `Expected #${elementId} NOT to be focused but it was`
                : `Expected #${elementId} to be focused but focused is #${actual}`,
            );
          }
        },
        _toHaveAttribute(
          name: string,
          value: string | RegExp,
          negated?: boolean,
        ) {
          const attrKey = name === "tabindex" ? "tabIndex" : name;
          const raw = resolveElement(os, elementId)[attrKey];
          // Coerce to string for Playwright compatibility
          const actual =
            raw === true
              ? "true"
              : raw === false
                ? "false"
                : raw == null
                  ? null
                  : String(raw);
          const expected = typeof value === "string" ? value : undefined;
          const matches = actual === expected;
          const passed = negated ? !matches : matches;
          if (!passed) {
            throw new Error(
              negated
                ? `Expected [${name}] NOT to be "${expected}" but it was`
                : `Expected [${name}] to be "${expected}" but got "${actual}"`,
            );
          }
        },
      } satisfies LocatorResult;
    },
  };
}

export type { ItemAttrs };
export type { AppPage, AppPageInternal } from "@os-sdk/app/defineApp/types";

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
export function createHeadlessPage<S>(
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
